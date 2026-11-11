
"""
Shared model-selection utilities used by the performance and risk models.

Responsibilities:
1. Build preprocessing + estimator pipelines.
2. Compare candidate models using cross-validation.
3. Tune model hyperparameters using RandomizedSearchCV.
"""

import numpy as np
import pandas as pd

from sklearn.model_selection import RandomizedSearchCV, cross_validate
from sklearn.pipeline import Pipeline

from src.config import CAT_FEATURES, NUM_FEATURES, RANDOM_STATE
from src.data.preprocessing import build_preprocessor
from src.utils import get_logger


log = get_logger(__name__)


# ============================================================================
# 1. PIPELINE CREATION
# ============================================================================

def make_pipeline(estimator) -> Pipeline:
    """
    Create a machine learning pipeline containing:

    1. Data preprocessing
    2. Machine learning estimator

    This allows preprocessing and model training to happen together.

    An estimator is the ML algorithm we want to train,
    such as RandomForest, ExtraTrees or Ridge.
    """

    return Pipeline([
        (
            "prep",
            build_preprocessor(NUM_FEATURES, CAT_FEATURES)
        ),
        (
            "model",
            estimator
        )
    ])


# ============================================================================
# 2. MODEL COMPARISON
# ============================================================================

def compare_candidates(
    candidates: dict,
    X,
    y,
    cv,
    scoring: dict,
    rank_metric: str
) -> pd.DataFrame:
    """
    Cross-validate every candidate model and return a leaderboard.

    Parameters
    ----------
    candidates:
        Dictionary containing the models to compare.

    X:
        Input features, such as marks, attendance and department.

    y:
        Target values.
        For performance prediction, this is FINAL_CGPA.

    cv:
        Cross-validation strategy or number of folds.

    scoring:
        Evaluation metrics to calculate.

    rank_metric:
        Metric used to rank models in the final leaderboard.

    Returns
    -------
    pd.DataFrame:
        Model leaderboard sorted by the selected metric.

    All scorers are treated as "higher is better".
    Scikit-learn negates error metrics such as MAE and RMSE,
    allowing all metrics to follow the same ranking direction.
    """

    # Each model's results will be stored in this list.
    rows = []

    # Evaluate every candidate model.
    for name, estimator in candidates.items():

        log.info("Cross-validating %s ...", name)

        # Build preprocessing + model pipeline.
        pipeline = make_pipeline(estimator)

        # Cross-validation:
        # The model is trained and evaluated across multiple folds.
        #
        # n_jobs=1:
        # Uses sequential execution instead of launching multiple
        # parallel worker processes. This helps avoid Joblib
        # multiprocessing cleanup issues on Windows.
        result = cross_validate(
            pipeline,
            X,
            y,
            cv=cv,
            scoring=scoring,
            n_jobs=1
        )

        # Store the model name.
        row = {
            "model": name
        }

        # Calculate mean and standard deviation for every metric.
        for metric in scoring:

            row[f"{metric}_mean"] = (
                result[f"test_{metric}"].mean()
            )

            row[f"{metric}_std"] = (
                result[f"test_{metric}"].std()
            )

        # Add this model's results to the leaderboard.
        rows.append(row)

    # Convert the list of dictionaries into a DataFrame.
    #
    # Sort by the selected metric in descending order.
    # reset_index(drop=True) creates a fresh index.
    leaderboard = (
        pd.DataFrame(rows)
        .sort_values(
            f"{rank_metric}_mean",
            ascending=False
        )
        .reset_index(drop=True)
    )

    return leaderboard


# ============================================================================
# 3. HYPERPARAMETER SEARCH SPACES
# ============================================================================

# Hyperparameter search spaces.
#
# Keys start with "model__" because the estimator is stored
# inside the pipeline step named "model".
#
# Example:
# model__n_estimators
#
# This tells sklearn to tune the n_estimators parameter
# of the estimator inside our pipeline.

PARAM_DISTS = {

    # ------------------------------------------------------------------------
    # Ridge Regression
    # ------------------------------------------------------------------------
    #
    # Ridge is a regression algorithm suitable for predicting
    # numerical targets such as FINAL_CGPA.
    #
    # alpha controls regularization:
    # Smaller alpha = weaker regularization.
    # Larger alpha = stronger regularization.

    "Ridge": {
        "model__alpha": np.logspace(-2, 2, 20)
    },


    # ------------------------------------------------------------------------
    # Logistic Regression
    # ------------------------------------------------------------------------
    #
    # Logistic Regression is a classification algorithm.
    # It can predict categories such as Low, Medium and High risk.
    #
    # C controls regularization:
    # Smaller C = stronger regularization.
    # Larger C = weaker regularization.

    "LogisticRegression": {
        "model__C": np.logspace(-2, 2, 20)
    },


    # ------------------------------------------------------------------------
    # Random Forest
    # ------------------------------------------------------------------------
    #
    # Random Forest combines multiple decision trees.
    #
    # n_estimators:
    # Number of trees in the ensemble.
    #
    # max_depth:
    # Maximum depth of each tree.
    #
    # min_samples_leaf:
    # Minimum number of samples allowed in a leaf node.
    #
    # max_features:
    # Number or proportion of features considered
    # when searching for the best split.

    "RandomForest": {

        "model__n_estimators": [200, 300, 500],

        "model__max_depth": [
            None,
            8,
            12,
            16
        ],

        "model__min_samples_leaf": [
            1,
            2,
            3,
            5
        ],

        "model__max_features": [
            "sqrt",
            0.5,
            1.0
        ],
    },


    # ------------------------------------------------------------------------
    # Extra Trees
    # ------------------------------------------------------------------------
    #
    # Extra Trees is another tree-based ensemble algorithm.
    # It introduces additional randomness when selecting splits.
    #
    # Its hyperparameters control tree count, depth,
    # leaf size and feature selection.

    "ExtraTrees": {

        "model__n_estimators": [200, 300, 500],

        "model__max_depth": [
            None,
            8,
            12,
            16
        ],

        "model__min_samples_leaf": [
            1,
            2,
            3,
            5
        ],

        "model__max_features": [
            "sqrt",
            0.5,
            1.0
        ],
    },


    # ------------------------------------------------------------------------
    # Histogram-Based Gradient Boosting
    # ------------------------------------------------------------------------
    #
    # This algorithm builds trees sequentially.
    # Later trees try to correct errors made by earlier trees.
    #
    # learning_rate:
    # Controls how much each boosting iteration contributes.
    #
    # max_depth:
    # Limits the depth of individual trees.
    #
    # max_iter:
    # Number of boosting iterations.
    #
    # l2_regularization:
    # Penalizes overly large leaf values to help control overfitting.
    #
    # min_samples_leaf:
    # Minimum number of samples required in a leaf.

    "HistGradientBoosting": {

        "model__learning_rate": [
            0.03,
            0.05,
            0.1
        ],

        "model__max_depth": [
            3,
            5,
            None
        ],

        "model__max_iter": [
            200,
            400
        ],

        "model__l2_regularization": [
            0.0,
            0.1,
            1.0
        ],

        "model__min_samples_leaf": [
            10,
            20,
            40
        ],
    },
}


# ============================================================================
# 4. HYPERPARAMETER TUNING
# ============================================================================

def tune_pipeline(
    name,
    pipeline,
    X,
    y,
    cv,
    scoring,
    n_iter=12
):
    """
    Perform randomized hyperparameter search for a model.

    Parameters
    ----------
    name:
        Name of the model whose parameters need tuning.

    pipeline:
        Preprocessing + estimator pipeline.

    X:
        Training features.

    y:
        Training target.

    cv:
        Cross-validation strategy.

    scoring:
        Evaluation metric or dictionary of evaluation metrics.

    n_iter:
        Number of randomly sampled hyperparameter combinations.

    Returns
    -------
    RandomizedSearchCV:
        Fitted search object containing the best model.

    None:
        Returned when no hyperparameter search space exists
        for the supplied model name.
    """

    # Get the search space for the requested model.
    dist = PARAM_DISTS.get(name)

    # If no search space exists, skip hyperparameter tuning.
    if dist is None:

        log.info(
            "No hyperparameter search space defined for %s.",
            name
        )

        return None

    log.info(
        "Starting hyperparameter tuning for %s ...",
        name
    )

    # RandomizedSearchCV tests randomly selected combinations
    # of hyperparameters using cross-validation.
    #
    # refit=True:
    # After finding the best combination, sklearn trains
    # the best estimator again using the complete training data.
    #
    # n_jobs=1:
    # Uses sequential execution to avoid Windows
    # multiprocessing issues with Joblib.

    search = RandomizedSearchCV(
        estimator=pipeline,
        param_distributions=dist,
        n_iter=n_iter,
        cv=cv,
        scoring=scoring,
        n_jobs=1,
        random_state=RANDOM_STATE,
        refit=True
    )

    # Start the hyperparameter search.
    search.fit(X, y)

    # Display the best hyperparameter combination.
    log.info(
        "Best params for %s: %s",
        name,
        search.best_params_
    )

    # Return the fitted search object.
    return search
