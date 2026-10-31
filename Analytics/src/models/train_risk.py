"""
MODEL 2 - STUDENT RISK PREDICTION (classification: Low / Medium / High)
Risk label comes from FINAL_CGPA thresholds. FINAL_CGPA itself is NOT a feature,
otherwise the model would just re-read the answer (target leakage).
"""
import joblib
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import (ExtraTreesClassifier, HistGradientBoostingClassifier,
                              RandomForestClassifier)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import ConfusionMatrixDisplay, classification_report
from sklearn.model_selection import StratifiedKFold, train_test_split

from src.config import (CAT_FEATURES, MODELS_DIR, N_SPLITS, NUM_FEATURES, RANDOM_STATE,
                        REPORTS_DIR, RISK_ORDER, TEST_SIZE)
from src.data.preprocessing import add_engineered_features, add_risk_label, load_dataset
from src.models.common import compare_candidates, make_pipeline, tune_pipeline
from src.utils import get_logger, save_figure, save_json

log = get_logger(__name__)
MODEL_PATH = MODELS_DIR / "risk_model.joblib"


def get_candidates() -> dict:
    # class_weight="balanced" gives more importance to the rare High-risk class
    return {
        "Baseline": DummyClassifier(strategy="most_frequent"),
        "LogisticRegression": LogisticRegression(max_iter=3000, class_weight="balanced"),
        "RandomForest": RandomForestClassifier(n_estimators=300, min_samples_leaf=2,
                                               class_weight="balanced_subsample",
                                               random_state=RANDOM_STATE),
        "ExtraTrees": ExtraTreesClassifier(n_estimators=300, min_samples_leaf=2,
                                           class_weight="balanced",
                                           random_state=RANDOM_STATE),
        "HistGradientBoosting": HistGradientBoostingClassifier(
            learning_rate=0.05, max_iter=300, class_weight="balanced",
            random_state=RANDOM_STATE),
    }


def predict_risk(df: pd.DataFrame) -> pd.DataFrame:
    """Use the saved model: returns RISK_LEVEL and class probabilities per student."""
    pipe = joblib.load(MODEL_PATH)
    data = add_engineered_features(df)
    X = data[NUM_FEATURES + CAT_FEATURES]
    out = pd.DataFrame(pipe.predict_proba(X),
                       columns=[f"P_{c.upper()}" for c in pipe.classes_], index=df.index)
    out.insert(0, "RISK_LEVEL", pipe.predict(X))
    return out


def main() -> None:
    df = add_risk_label(add_engineered_features(load_dataset()))
    log.info("Class distribution:\n%s", df["RISK_LEVEL"].value_counts(normalize=True).round(3))
    X, y = df[NUM_FEATURES + CAT_FEATURES], df["RISK_LEVEL"]

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y)

    # Stratified folds keep the same class proportions in every fold
    cv = StratifiedKFold(N_SPLITS, shuffle=True, random_state=RANDOM_STATE)
    scoring = {"f1_macro": "f1_macro", "balanced_accuracy": "balanced_accuracy",
               "accuracy": "accuracy"}

    # Macro-F1 treats all three classes equally, so the rare High class matters
    table = compare_candidates(get_candidates(), X_tr, y_tr, cv, scoring, "f1_macro")
    table.to_csv(REPORTS_DIR / "risk_model_comparison.csv", index=False)
    log.info("Leaderboard:\n%s", table.round(4).to_string())

    best_name = table[table["model"] != "Baseline"].iloc[0]["model"]
    log.info("Best model: %s", best_name)
    estimator = get_candidates()[best_name]
    search = tune_pipeline(best_name, make_pipeline(estimator), X_tr, y_tr, cv, "f1_macro")
    final = search.best_estimator_ if search else make_pipeline(estimator).fit(X_tr, y_tr)

    pred = final.predict(X_te)
    report = classification_report(y_te, pred, labels=RISK_ORDER, output_dict=True,
                                   zero_division=0)
    log.info("Hold-out report:\n%s",
             classification_report(y_te, pred, labels=RISK_ORDER, zero_division=0))
    save_json({"best_model": best_name, "report": report}, REPORTS_DIR / "risk_metrics.json")

    fig, ax = plt.subplots(figsize=(5, 4))
    ConfusionMatrixDisplay.from_predictions(y_te, pred, labels=RISK_ORDER, ax=ax, cmap="Blues")
    ax.set_title(f"Risk model: {best_name}")
    save_figure(fig, "risk_confusion_matrix.png")

    joblib.dump(final, MODEL_PATH)
    log.info("Saved model to %s", MODEL_PATH)


if __name__ == "__main__":
    main()