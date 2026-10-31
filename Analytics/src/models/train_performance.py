"""
MODEL 1 - PERFORMANCE PREDICTION (regression)
Goal: predict FINAL_CGPA from marks, attendance, behaviour, etc.
Several algorithms are compared with cross-validation, the best is tuned,
evaluated once on a untouched hold-out set, and saved.
"""

"""
The overall process is:
Step 1: Load the dataset
Read and prepare the student records.

Step 2: Split the data
Keep some students aside for final testing.

Step 3: Compare algorithms
Find which algorithms perform well.

Step 4: Tune the best model
Search for better settings.

Step 5: Evaluate and inspect
Measure prediction errors and study important features.

Step 6: Save the model
Reuse the trained model later without training it again.
"""


import joblib # Saves and loads your trained model.
import matplotlib.pyplot as plt # Creates graphs and charts.
import numpy as np # Performs numerical calculations.
import pandas as pd # Reads and manages tabular data, like CSV files.

# Now the ML algorithms: You don't know in advance which one will work best for your dataset. Comparing them helps you choose based on evidence rather than guessing.
from xgboost import XGBRegressor 
from sklearn.dummy import DummyRegressor # makes a simple baseline prediction, usually the average CGPA.
from sklearn.ensemble import (ExtraTreesRegressor, HistGradientBoostingRegressor,RandomForestRegressor) # RandomForest: combines many decision trees to make predictions. ExtraTreesRegressor: uses a collection of more randomized decision trees. HistGradientBoostingRegressor: builds trees in stages to improve previous predictions.
from sklearn.inspection import permutation_importance
from sklearn.linear_model import Ridge


from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score #r2_score = (y_pred - mean_y)^2 / (y_act - mean_y)^2
from sklearn.model_selection import KFold, train_test_split

from src.config import (CAT_FEATURES, MODELS_DIR, N_SPLITS, NUM_FEATURES, RANDOM_STATE,REPORTS_DIR, TARGET, TEST_SIZE)
# load_dataset() loads and validates the dataset.
# add_engineered_features() creates additional useful columns.
# make_pipeline() prepares the preprocessing and ML model together.
# compare_candidates() compares candidate models.
# tune_pipeline() searches for better model settings.
# save_json() saves results in a JSON file.
# save_figure() saves a graph.
# get_logger() helps display progress and messages.
from src.data.preprocessing import add_engineered_features, load_dataset
from src.models.common import compare_candidates, make_pipeline, tune_pipeline
from src.utils import get_logger, save_figure, save_json

log = get_logger(__name__)


def get_candidates() -> dict: # -> dict means the function is expected to return a dictionary.
    candidates = {
        "Baseline(mean)": DummyRegressor(strategy="mean"),   # a model must beat this. If your sophisticated model cannot predict better than the average, something may be wrong with your approach or data.
        "Ridge": Ridge(alpha=1.0),
        "RandomForest": RandomForestRegressor(n_estimators=300, min_samples_leaf=3,random_state=RANDOM_STATE),
        # n_estimators=300: build 300 trees.
        # min_samples_leaf=3: each final leaf of a tree must contain at least 3 training samples.
        # random_state=RANDOM_STATE: makes the algorithm's randomness reproducible when the other conditions remain the same.
        "ExtraTrees": ExtraTreesRegressor(n_estimators=300, min_samples_leaf=3,random_state=RANDOM_STATE),
        "HistGradientBoosting": HistGradientBoostingRegressor(learning_rate=0.05, max_iter=300, random_state=RANDOM_STATE),
        # learning_rate=0.05: controls how much each new stage contributes.
        # max_iter=300: allows up to 300 boosting iterations.
    }

    try:  # XGBoost is optional
        candidates["XGBoost"] = XGBRegressor(n_estimators=400, learning_rate=0.05,max_depth=4, subsample=0.8,colsample_bytree=0.8,random_state=RANDOM_STATE, n_jobs=1)
        # n_estimators=400: allows 400 boosting trees.
        # learning_rate=0.05: controls each tree's contribution.
        # max_depth=4: limits the depth of each tree.
        # subsample=0.8: uses a random 80% sample of training rows for each boosting round.
        # colsample_bytree=0.8: uses a random 80% sample of features for each tree.
        # n_jobs=1: uses one CPU job for this model.
    except ImportError:
        log.info("xgboost not installed - skipping it.")
    return candidates


def main() -> None: # -> None means the function is not intended to return a result to the caller. Instead, it performs tasks such as training models, saving reports and saving the final model.
    df = add_engineered_features(load_dataset())
    X, y = df[NUM_FEATURES + CAT_FEATURES], df[TARGET]

    # Hold-out test set: touched ONLY once at the very end. Stratified by department.
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=df["DEPARTMENT"]) # stratify=df["DEPARTMENT"]: tries to preserve each department's proportion in both sets

    cv = KFold(N_SPLITS, shuffle=True, random_state=RANDOM_STATE) # Each fold gets a turn as the validation portion. The model trains on the other four folds and is evaluated on the remaining fold. This happens five times, and the results are combined.
    # A model may perform well on one particular split simply by luck. Cross-validation gives you a more reliable comparison across several splits.
    # N_SPLITS controls the number of folds.
    # shuffle=True shuffles the training records before dividing them.
    # random_state=RANDOM_STATE makes the shuffling reproducible.
    # One detail: KFold does not stratify by department. Your initial hold-out split is stratified, but each cross-validation fold is not guaranteed to have the exact same department proportions. That may matter if departments have very different sample sizes.

    scoring = {"rmse": "neg_root_mean_squared_error",
               "mae": "neg_mean_absolute_error", "r2": "r2"}
    # R^2 tells us how well our model's predictions explain the differences in students' actual CGPAs.
    # R^2 = 1 - (SSE/SST) where SSE (sum of squared errors) SST (total sum of squares)
    # For CGPA prediction model, MAE(MAE — Mean Absolute Error) and RMSE(RMSE — Root Mean Squared Error) should generally be as low as possible, while R² should generally be as high as possible.
    # Why does your code use names starting with neg_?
    # Scikit-learn uses a common rule when comparing models: A higher scoring value should always mean a better model.
    # This works naturally for metrics such as R^2, where higher is generally better.
    # But MAE and RMSE work in the opposite direction: lower is better.
    # The neg_ prefix means the returned score is the negative of the actual error.The negative sign changes the ordering of the errors so that the smaller error gets the higher score.


    # 1) Compare algorithms using cross-validation on the training data only
    table = compare_candidates(get_candidates(), X_tr, y_tr, cv, scoring, "rmse") # "rmse"	Tells the custom function to use RMSE as the main metric for ranking models, assuming that is how the function is implemented.


    table.to_csv(REPORTS_DIR / "performance_model_comparison.csv", index=False) # Best overall: ExtraTrees — it has the lowest mean RMSE (0.2884), lowest mean MAE (0.2179), and highest mean R² (0.9413).
    log.info("Leaderboard:\n%s", table.round(4).to_string())

    # 2) Pick the best real model (not the baseline) and tune it
    best_name = table[table["model"] != "Baseline(mean)"].iloc[0]["model"] # .iloc[0]["model"] Selects the first row and retrieves its model name. This assumes the table is sorted by RMSE in ascending order. You should verify that compare_candidates() sorts it correctly.
    log.info("Best model: %s", best_name)


    estimator = get_candidates()[best_name] # Retrieves the actual algorithm object corresponding to that name.
    search = tune_pipeline(best_name, make_pipeline(estimator), X_tr, y_tr, cv,scoring="neg_root_mean_squared_error")
    # Choosing the best algorithm is only part of the job. Each algorithm has settings that affect how it learns. These settings are called hyperparameters. 
    # For example, a Random Forest has settings such as the number of trees and the minimum number of samples in each leaf.

    final = search.best_estimator_ if search else make_pipeline(estimator).fit(X_tr, y_tr)
    # 3) One-time evaluation on the hold-out set
    pred = final.predict(X_te) # This is the moment the trained model makes predictions for the held-out students.

    metrics = {
        "best_model": best_name,
        "rmse": float(np.sqrt(mean_squared_error(y_te, pred))),
        "mae": float(mean_absolute_error(y_te, pred)),
        "r2": float(r2_score(y_te, pred)),
    }
    log.info("Hold-out metrics: %s", metrics)
    save_json(metrics, REPORTS_DIR / "performance_metrics.json")

    # 4) Plots: predicted vs actual, and permutation feature importance
    # An R^2 score of 0.946 means that ExtraTrees explains 94.6% of the variation in the actual CGPAs, relative to the baseline that predicts the average CGPA
    fig, ax = plt.subplots(figsize=(5, 5))
    ax.scatter(y_te, pred, s=8, alpha=0.4)
    ax.plot([2, 10], [2, 10], "r--") # for the red dashed line
    ax.set(xlabel="Actual CGPA", ylabel="Predicted CGPA",
           title=f"{best_name}: R2={metrics['r2']:.3f}")
    save_figure(fig, "performance_pred_vs_actual.png")
    # Blue dots — Actual vs. predicted CGPA
    # Each dot represents one student.
    # - X-axis: the student's actual CGPA (y_te).
    # - Y-axis: the model's predicted CGPA (pred).
    # Red dashed line — Perfect predictions (represents actual CGPA = predicted CGPA.)


    # Permutation importance: how much does the error rise if a column is shuffled?
    imp = permutation_importance(final, X_te, y_te, n_repeats=10, random_state=RANDOM_STATE,scoring="neg_root_mean_squared_error")

    imp_df = (pd.Series(imp.importances_mean, index=X_te.columns).sort_values().tail(15))
    
    fig, ax = plt.subplots(figsize=(7, 5))
    imp_df.plot.barh(ax=ax)
    ax.set_title("Top features (permutation importance)")
    save_figure(fig, "performance_feature_importance.png")

    joblib.dump(final, MODELS_DIR / "performance_model.joblib")
    log.info("Saved model to models/performance_model.joblib")


if __name__ == "__main__":
    main()