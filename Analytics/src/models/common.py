"""Shared model-selection utilities used by the performance and risk models."""
import numpy as np
import pandas as pd
from sklearn.model_selection import RandomizedSearchCV, cross_validate
from sklearn.pipeline import Pipeline

from src.config import CAT_FEATURES, NUM_FEATURES, RANDOM_STATE
from src.data.preprocessing import build_preprocessor
from src.utils import get_logger

log = get_logger(__name__)


def make_pipeline(estimator) -> Pipeline:
    """preprocessing + model in one object => one .fit(), one .predict()."""
    return Pipeline([("prep", build_preprocessor(NUM_FEATURES, CAT_FEATURES)),
                     ("model", estimator)]) # An estimator is the ML algorithm you want to train.


# candidates	A dictionary containing the models to compare.
# X	Input features, such as marks, attendance and department.
# y	The target values you want the model to predict. For performance prediction, this is FINAL_CGPA.
# cv	The cross-validation strategy or number of folds.
# scoring	The evaluation metrics to calculate.
# rank_metric	The metric used to rank the models in the final table.
def compare_candidates(candidates: dict, X, y, cv, scoring: dict, rank_metric: str) -> pd.DataFrame:
    """
    Cross-validate every candidate model and return a leaderboard.
    All scorers are "higher is better" (sklearn negates error metrics),
    so we simply sort the rank metric in descending order.
    """
    # Each model's results will be stored as a dictionary inside this list.
    rows = []

    for name, estimator in candidates.items():
        # This records which model is currently being evaluated.
        log.info("Cross-validating %s ...", name)
        # Instead of evaluating a model using just one train-validation split, cross-validation repeats the process across multiple folds.
        result = cross_validate(make_pipeline(estimator), X, y, cv=cv,
                                scoring=scoring, n_jobs=-1) # asks scikit-learn to use all available CPU cores for parallelizable work.
        row = {"model": name} # {"model": "Ridge"}



#         The loop calculates the average score across folds and the variation in those scores.
# - Mean: the average performance across folds.
# - Standard deviation: how much the scores vary between folds. A smaller value generally suggests more consistent results.
# if the MAE values across folds were -0.10, -0.12, -0.11, -0.09, and -0.13, the mean negative MAE would be -0.11
# Scikit-learn uses negative values for error metrics such as MAE so that, for every scorer, a higher score is better. So -0.09 is better than -0.11, because its actual MAE is smaller.
# For R^2, a higher score is generally better, although negative R^2 means the model performs worse than the constant-mean baseline on that evaluation set.
        for metric in scoring:
            row[f"{metric}_mean"] = result[f"test_{metric}"].mean()
            row[f"{metric}_std"] = result[f"test_{metric}"].std()
        rows.append(row)

    # pd.DataFrame(rows) turns the list of dictionaries into a table
    # sort_values(...) sorts the table by the chosen metric's mean score, highest first.
    # reset_index(drop=True) gives the sorted rows a fresh index starting from zero.
    return (pd.DataFrame(rows)
            .sort_values(f"{rank_metric}_mean", ascending=False)
            .reset_index(drop=True))


# Hyper-parameter search spaces. Keys start with "model__" because the estimator
# lives in the pipeline step called "model".
PARAM_DISTS = {
    "Ridge": {"model__alpha": np.logspace(-2, 2, 20)}, # Ridge is a regression algorithm suitable for predicting a numerical target such as CGPA. This generates 20 numbers spaced logarithmically between (10^-2) and (10^2), i.e. between 0.01 and 100. A very small alpha means weaker regularization.
    "LogisticRegression": {"model__C": np.logspace(-2, 2, 20)}, # Logistic Regression is a classification algorithm. It can predict a category, such as High, Medium or Low risk. Smaller C means stronger regularization. Larger C means weaker regularization.

#     Hyperparameter	Meaning
# n_estimators	Number of trees in the ensemble.
# max_depth	Maximum depth of each tree; None allows growth until other stopping conditions apply.
# min_samples_leaf	Minimum number of training samples allowed in a leaf node.
# max_features	Number or proportion of features considered when splitting a tree

# Increasing the number of trees can improve stability, but it also increases training and prediction cost. A deeper tree can learn more complex patterns, but may overfit. The search tries different combinations to find settings that perform well under cross-validation.
    "RandomForest": {
        "model__n_estimators": [200, 300, 500],
        "model__max_depth": [None, 8, 12, 16],
        "model__min_samples_leaf": [1, 2, 3, 5],
        "model__max_features": ["sqrt", 0.5, 1.0],
    },
    "ExtraTrees": {
        "model__n_estimators": [200, 300, 500],
        "model__max_depth": [None, 8, 12, 16],
        "model__min_samples_leaf": [1, 2, 3, 5],
        "model__max_features": ["sqrt", 0.5, 1.0],
    },

#     This is another tree-based ensemble algorithm. It builds trees sequentially, with later trees improving on errors made by earlier ones.
# - learning_rate: controls how much each boosting iteration contributes.
# - max_depth: limits the depth of each tree.
# - max_iter: number of boosting iterations.
# - l2_regularization: penalizes overly large leaf values to help control overfitting.
# - min_samples_leaf: minimum number of samples required in a leaf.
    "HistGradientBoosting": {
        "model__learning_rate": [0.03, 0.05, 0.1],
        "model__max_depth": [3, 5, None],
        "model__max_iter": [200, 400],
        "model__l2_regularization": [0.0, 0.1, 1.0],
        "model__min_samples_leaf": [10, 20, 40],
    },
}

# This function searches for a good combination of hyperparameters for one model.
def tune_pipeline(name, pipeline, X, y, cv, scoring, n_iter=12):
    """Randomised hyper-parameter search; returns the fitted search or None if no grid."""

    dist = PARAM_DISTS.get(name)

    if dist is None:
        return None
    # For instance, with a Random Forest, the search samples combinations of tree counts, depths and other settings. It evaluates the combinations using cross-validation and chooses the best according to the scoring configuration
    search = RandomizedSearchCV(pipeline, dist, n_iter=n_iter, cv=cv, scoring=scoring,
                                n_jobs=-1, random_state=RANDOM_STATE, refit=True)
    search.fit(X, y)
    log.info("Best params for %s: %s", name, search.best_params_)
    return search