
"""
MODEL 3 - STUDENT CLUSTERING
Multi-algorithm evaluation with deployment-aware model selection.

FINAL_CGPA is excluded from every clustering and selection calculation.
It is used only to describe clusters after selection.
"""

import joblib
import numpy as np
import pandas as pd

from sklearn.cluster import (
    AgglomerativeClustering,
    DBSCAN,
    KMeans,
)
from sklearn.mixture import GaussianMixture
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    adjusted_rand_score,
    calinski_harabasz_score,
    davies_bouldin_score,
    silhouette_score,
)

from src.config import (
    MODELS_DIR,
    PROCESSED_DIR,
    RANDOM_STATE,
    REPORTS_DIR,
    TARGET,
)
from src.data.preprocessing import add_engineered_features, load_dataset
from src.utils import get_logger, save_json

log = get_logger(__name__)

CLUSTER_FEATURES = [
    "PREV_SEM_CGPA",
    "PREV_SEM_BACKLOGS",
    "ATTENDANCE_PERCENTAGE",
    "INTERNAL_ASSESSMENT_MARKS",
    "MIDTERM_MARKS",
    "QUIZ_AVERAGE",
    "ASSIGNMENT_AVERAGE",
    "ASSIGNMENT_SUBMISSION_RATE",
    "LAB_AVERAGE",
    "PROJECT_MARKS",
    "STUDY_HOURS_PER_DAY",
]

# Configure these according to the college's use case.
MIN_CLUSTERS = 2
MAX_CLUSTERS = 8
MIN_CLUSTER_FRACTION = 0.02  # Flag clusters smaller than 2%.
STABILITY_SEEDS = [42, 123, 2026]


def evaluate_labels(X, labels):
    """Calculate clustering metrics when the result is valid."""
    labels = np.asarray(labels)
    unique = np.unique(labels)

    # DBSCAN uses -1 for noise. Exclude noise when calculating
    # the number of actual clusters.
    actual_clusters = unique[unique != -1]
    n_clusters = len(actual_clusters)
    noise_fraction = float(np.mean(labels == -1))

    result = {
        "n_clusters": n_clusters,
        "noise_fraction": noise_fraction,
        "silhouette": np.nan,
        "davies_bouldin": np.nan,
        "calinski_harabasz": np.nan,
        "min_cluster_fraction": np.nan,
    }

    if n_clusters < 2:
        return result

    # For density clustering, score non-noise observations only.
    keep = labels != -1
    X_eval = X[keep]
    y_eval = labels[keep]

    if len(np.unique(y_eval)) < 2 or len(y_eval) <= n_clusters:
        return result

    counts = pd.Series(y_eval).value_counts(normalize=True)

    result.update({
        "silhouette": float(
            silhouette_score(
                X_eval,
                y_eval,
                sample_size=min(2000, len(y_eval)),
                random_state=RANDOM_STATE,
            )
        ),
        "davies_bouldin": float(
            davies_bouldin_score(X_eval, y_eval)
        ),
        "calinski_harabasz": float(
            calinski_harabasz_score(X_eval, y_eval)
        ),
        "min_cluster_fraction": float(counts.min()),
    })

    return result


def main():
    df = add_engineered_features(load_dataset()).copy()

    required = CLUSTER_FEATURES + ["STUDENT_ID", TARGET]
    missing = [c for c in required if c not in df.columns]

    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Keep only records with at least one available feature.
    # The imputer handles missing values within the remaining rows.
    usable = df[CLUSTER_FEATURES].notna().any(axis=1)
    df = df.loc[usable].copy()

    if len(df) < 10:
        raise ValueError("Too few usable student records.")

    X_raw = df[CLUSTER_FEATURES]

    prep = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    X = prep.fit_transform(X_raw)

    # --------------------------------------------------
    # 1. Compare K-Means, GMM, Agglomerative and DBSCAN
    # --------------------------------------------------
    results = []
    fitted_candidates = {}

    max_k = min(MAX_CLUSTERS, len(df) - 1)

    # K-Means: deployable using predict().
    for k in range(MIN_CLUSTERS, max_k + 1):
        for seed in STABILITY_SEEDS:
            model = KMeans(
                n_clusters=k,
                n_init=20,
                random_state=seed,
            )
            labels = model.fit_predict(X)
            metrics = evaluate_labels(X, labels)

            key = ("KMeans", k, seed)
            fitted_candidates[key] = (model, labels)

            results.append({
                "algorithm": "KMeans",
                "k": k,
                "seed": seed,
                "deployable": True,
                **metrics,
            })

    # Gaussian Mixture: deployable using predict().
    for k in range(MIN_CLUSTERS, max_k + 1):
        for seed in STABILITY_SEEDS:
            model = GaussianMixture(
                n_components=k,
                covariance_type="full",
                reg_covar=1e-5,
                n_init=3,
                random_state=seed,
            )
            labels = model.fit_predict(X)
            metrics = evaluate_labels(X, labels)

            key = ("GMM", k, seed)
            fitted_candidates[key] = (model, labels)

            results.append({
                "algorithm": "GMM",
                "k": k,
                "seed": seed,
                "deployable": True,
                **metrics,
            })

    # Agglomerative: useful for comparison, but no native predict().
    for k in range(MIN_CLUSTERS, max_k + 1):
        model = AgglomerativeClustering(
            n_clusters=k,
            linkage="ward",
        )
        labels = model.fit_predict(X)
        metrics = evaluate_labels(X, labels)

        results.append({
            "algorithm": "Agglomerative",
            "k": k,
            "seed": None,
            "deployable": False,
            **metrics,
        })

    # DBSCAN: density-based clustering and noise detection.
    # eps values are starting candidates, not universal defaults.
    for eps in [0.5, 0.8, 1.0, 1.2, 1.5]:
        for min_samples in [5, 10]:
            model = DBSCAN(
                eps=eps,
                min_samples=min_samples,
            )
            labels = model.fit_predict(X)
            metrics = evaluate_labels(X, labels)

            results.append({
                "algorithm": "DBSCAN",
                "k": metrics["n_clusters"],
                "seed": None,
                "eps": eps,
                "min_samples": min_samples,
                "deployable": False,
                **metrics,
            })

    comparison = pd.DataFrame(results)

    # --------------------------------------------------
    # 2. Measure stability across random initializations
    # --------------------------------------------------
    # Adjusted Rand Index (ARI) compares two partitions.
    # 1 means identical assignments; near 0 means agreement
    # close to chance. It is invariant to cluster label numbers.
    stability = {}

    for algorithm in ["KMeans", "GMM"]:
        for k in range(MIN_CLUSTERS, max_k + 1):
            labels_list = [
                fitted_candidates[(algorithm, k, seed)][1]
                for seed in STABILITY_SEEDS
            ]

            pair_scores = []
            for i in range(len(labels_list)):
                for j in range(i + 1, len(labels_list)):
                    pair_scores.append(
                        adjusted_rand_score(
                            labels_list[i],
                            labels_list[j],
                        )
                    )

            stability[(algorithm, k)] = float(np.mean(pair_scores))

    comparison["stability_ari"] = comparison.apply(
        lambda row: stability.get(
            (row["algorithm"], row["k"]), np.nan
        ),
        axis=1,
    )

    comparison.to_csv(
        REPORTS_DIR / "clustering_algorithm_comparison.csv",
        index=False,
    )

    # --------------------------------------------------
    # 3. Select a deployable candidate
    # --------------------------------------------------
    deployable = comparison[
        comparison["deployable"]
        & comparison["silhouette"].notna()
        & comparison["davies_bouldin"].notna()
        & comparison["min_cluster_fraction"].ge(MIN_CLUSTER_FRACTION)
        & comparison["stability_ari"].ge(0.80)
    ].copy()

    if deployable.empty:
        raise RuntimeError(
            "No candidate passed the configured quality checks. "
            "Inspect clustering_algorithm_comparison.csv, reconsider "
            "the features/thresholds, and do not silently deploy a model."
        )

    # First rank by silhouette; use DB score and stability as
    # secondary criteria. These thresholds are initial policies
    # and should be validated for the real dataset.
    deployable = deployable.sort_values(
        by=["silhouette", "davies_bouldin", "stability_ari"],
        ascending=[False, True, False],
    )

    winner = deployable.iloc[0]
    best_algorithm = winner["algorithm"]
    best_k = int(winner["k"])

    # Retrain the winner with the fixed production seed.
    if best_algorithm == "KMeans":
        best_model = KMeans(
            n_clusters=best_k,
            n_init=20,
            random_state=RANDOM_STATE,
        )
    else:
        best_model = GaussianMixture(
            n_components=best_k,
            covariance_type="full",
            reg_covar=1e-5,
            n_init=3,
            random_state=RANDOM_STATE,
        )

    labels = best_model.fit_predict(X)
    df["CLUSTER"] = labels

    log.info(
        "Selected model: %s | k=%d | silhouette=%.3f | "
        "DB=%.3f | stability ARI=%.3f",
        best_algorithm,
        best_k,
        winner["silhouette"],
        winner["davies_bouldin"],
        winner["stability_ari"],
    )

    # --------------------------------------------------
    # 4. Profile clusters using original feature units
    # --------------------------------------------------
    profile = df.groupby("CLUSTER")[CLUSTER_FEATURES].mean().round(2)
    profile["students"] = df.groupby("CLUSTER").size()

    # Evaluate actual CGPA only AFTER the clustering is fixed.
    profile["mean_final_cgpa"] = (
        df.groupby("CLUSTER")[TARGET].mean().round(2)
    )

    profile.to_csv(REPORTS_DIR / "cluster_profiles.csv")

    # Use neutral names until a domain expert validates profiles.
    names = {
        int(cluster_id): f"Student Segment {i + 1}"
        for i, cluster_id in enumerate(sorted(df["CLUSTER"].unique()))
    }
    df["CLUSTER_NAME"] = df["CLUSTER"].map(names)

    df[[
        "STUDENT_ID",
        "DEPARTMENT",
        "SEM",
        "CLUSTER",
        "CLUSTER_NAME",
    ]].to_csv(
        PROCESSED_DIR / "student_clusters.csv",
        index=False,
    )

    # --------------------------------------------------
    # 5. Save the selected model and inference contract
    # --------------------------------------------------
    joblib.dump(
        {
            "preprocessor": prep,
            "model": best_model,
            "features": CLUSTER_FEATURES,
            "cluster_names": names,
            "algorithm": best_algorithm,
            "n_clusters": best_k,
            "random_state": RANDOM_STATE,
            "version": 1,
        },
        MODELS_DIR / "clustering_model.joblib",
    )

    save_json(
        {
            "algorithm": best_algorithm,
            "k": best_k,
            "silhouette": float(winner["silhouette"]),
            "davies_bouldin": float(winner["davies_bouldin"]),
            "stability_ari": float(winner["stability_ari"]),
            "minimum_cluster_fraction": float(
                winner["min_cluster_fraction"]
            ),
            "cluster_sizes": {
                str(int(k)): int(v)
                for k, v in df["CLUSTER"].value_counts().items()
            },
        },
        REPORTS_DIR / "clustering_summary.json",
    )

    log.info("Clustering evaluation and model saving completed.")


if __name__ == "__main__":
    main()