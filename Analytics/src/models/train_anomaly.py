"""
MODEL 4 - ANOMALY DETECTION
Finds suspicious records, e.g. attendance 35% but CGPA 9.2 (data-entry error,
attendance fraud, or grade tampering).

Trained WITHOUT labels (like in real colleges). Because our data is synthetic we
know which rows were corrupted, so we can measure how good each algorithm is.
We also add transparent business rules - real systems combine ML with rules.
"""
import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.neighbors import LocalOutlierFactor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import RobustScaler
from sklearn.svm import OneClassSVM

from src.config import (ANOMALY_FRACTION, ANOMALY_LABEL_COL, BASE_NUM_FEATURES, MODELS_DIR,
                        PROCESSED_DIR, RANDOM_STATE, REPORTS_DIR, TARGET)
from src.data.preprocessing import add_engineered_features, load_dataset
from src.utils import get_logger, save_figure, save_json

log = get_logger(__name__)

GAP_FEATURES = ["CGPA_MARKS_GAP", "SUBMISSION_QUALITY_GAP", "ATTENDANCE_MARKS_GAP"]
ANOMALY_FEATURES = [f for f in BASE_NUM_FEATURES if f != "SEM"] + [TARGET, "MARKS_MEAN"] + GAP_FEATURES


def add_gap_features(df: pd.DataFrame) -> pd.DataFrame:
    """'Consistency' features: in a healthy record these gaps stay small."""
    df = df.copy()
    df["CGPA_MARKS_GAP"] = df[TARGET] * 10 - df["MARKS_MEAN"]          # CGPA vs marks
    df["SUBMISSION_QUALITY_GAP"] = df["ASSIGNMENT_SUBMISSION_RATE"] - df["ASSIGNMENT_AVERAGE"]
    df["ATTENDANCE_MARKS_GAP"] = df["ATTENDANCE_PERCENTAGE"] - df["MARKS_MEAN"]
    return df


def rule_flags(df: pd.DataFrame) -> pd.Series:
    """Human-readable business rules; returns the reasons triggered per row."""
    rules = {
        "LOW_ATTENDANCE_BUT_HIGH_CGPA": (df["ATTENDANCE_PERCENTAGE"] < 50) & (df[TARGET] >= 8.5),
        "CGPA_INCONSISTENT_WITH_MARKS": df["CGPA_MARKS_GAP"].abs() > 35,
        "FULL_SUBMISSION_BUT_ZERO_SCORE": (df["ASSIGNMENT_SUBMISSION_RATE"] >= 95)
                                          & (df["ASSIGNMENT_AVERAGE"] < 30),
        "ATTENDED_MORE_THAN_HELD": df["ATTENDED_CLASSES"] > df["TOTAL_CLASSES"],
    }
    reasons = pd.Series("", index=df.index)
    for name, mask in rules.items():
        reasons = reasons.where(~mask, reasons + name + ";")
    return reasons


def build_models() -> dict:
    c = ANOMALY_FRACTION   # expected share of anomalies (a domain assumption)
    return {
        "IsolationForest": IsolationForest(n_estimators=300, contamination=c,
                                           random_state=RANDOM_STATE),
        # novelty=True lets the fitted model score new students later
        "LocalOutlierFactor": LocalOutlierFactor(n_neighbors=35, novelty=True, contamination=c),
        "OneClassSVM": OneClassSVM(kernel="rbf", gamma="scale", nu=c),
    }


def main() -> None:
    df = add_gap_features(add_engineered_features(load_dataset()))
    prep = Pipeline([("imputer", SimpleImputer(strategy="median")),
                     ("scaler", RobustScaler())])      # robust to the outliers we hunt
    X = prep.fit_transform(df[ANOMALY_FEATURES])
    y_true = df[ANOMALY_LABEL_COL].to_numpy()
    k = int(round(ANOMALY_FRACTION * len(df)))         # how many rows we will flag

    rows, scores_by_model, fitted = [], {}, {}
    for name, model in build_models().items():
        model.fit(X)
        score = -model.score_samples(X)                # higher = more anomalous
        top = np.argsort(score)[-k:]                   # the k most suspicious rows
        rows.append({"model": name,
                     "roc_auc": roc_auc_score(y_true, score),
                     "average_precision": average_precision_score(y_true, score),
                     f"precision_at_{k}": y_true[top].mean(),
                     f"recall_at_{k}": y_true[top].sum() / y_true.sum()})
        scores_by_model[name], fitted[name] = score, model
    table = pd.DataFrame(rows).sort_values("average_precision", ascending=False)
    table.to_csv(REPORTS_DIR / "anomaly_model_comparison.csv", index=False)
    log.info("Leaderboard:\n%s", table.round(3).to_string(index=False))

    best = table.iloc[0]["model"]
    score = scores_by_model[best]
    threshold = float(np.quantile(score, 1 - ANOMALY_FRACTION))
    log.info("Best: %s | flag threshold = %.4f", best, threshold)

    df["ANOMALY_SCORE"] = score
    df["ML_FLAG"] = score >= threshold
    df["RULE_REASONS"] = rule_flags(df)
    out = df[df["ML_FLAG"] | (df["RULE_REASONS"] != "")]
    out = out[["STUDENT_ID", "DEPARTMENT", "SEM", "ATTENDANCE_PERCENTAGE", "MARKS_MEAN",
               TARGET, "ANOMALY_SCORE", "RULE_REASONS", ANOMALY_LABEL_COL]]
    out.sort_values("ANOMALY_SCORE", ascending=False).to_csv(
        PROCESSED_DIR / "flagged_anomalies.csv", index=False)
    log.info("Flagged %d records for manual review", len(out))

    fig, ax = plt.subplots(figsize=(7, 4))
    ax.hist(score, bins=60); ax.axvline(threshold, color="r", ls="--", label="flag threshold")
    ax.set(title=f"Anomaly scores ({best})", xlabel="score (higher = more suspicious)")
    ax.legend()
    save_figure(fig, "anomaly_score_distribution.png")

    joblib.dump({"preprocessor": prep, "model": fitted[best], "threshold": threshold,
                 "features": ANOMALY_FEATURES}, MODELS_DIR / "anomaly_model.joblib")
    save_json({"best_model": best, **table.iloc[0].drop("model").to_dict()},
              REPORTS_DIR / "anomaly_metrics.json")


if __name__ == "__main__":
    main()