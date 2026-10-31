"""Loading, validation, feature engineering and the sklearn preprocessing pipeline."""
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.config import (
    COLUMN_ORDER, RAW_CSV, RISK_BINS, RISK_LABELS_ASC, TARGET,
)


def load_dataset(path=RAW_CSV) -> pd.DataFrame: # -> pd.DataFrame indicates that the function is expected to return a pandas table.
    """Read the CSV and validate that all expected columns exist."""
    df = pd.read_csv(path) # Python opens the CSV file and loads its contents into a DataFrame.
    missing = set(COLUMN_ORDER) - set(df.columns) # This checks whether any expected columns are absent.
    if missing:
        raise ValueError(f"Dataset is missing columns: {sorted(missing)}")
    return df


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame: # Feature engineering means creating additional useful columns from existing data.
    """
    Create new columns from existing ones. These use ONLY the row's own values
    (no dataset-level statistics), so they cannot leak information from the test set.
    """
    df = df.copy() # df.copy() makes a copy of the table so the original DataFrame isn't directly modified

    mark_cols = ["INTERNAL_ASSESSMENT_MARKS", "MIDTERM_MARKS", "QUIZ_AVERAGE",
                 "ASSIGNMENT_AVERAGE", "LAB_AVERAGE", "PROJECT_MARKS"]
    
    # Average of all assessments (NaNs are skipped automatically)
    df["MARKS_MEAN"] = df[mark_cols].mean(axis=1, skipna=True)
    # axis=1 It means calculate across the columns in each row.
    # skipna=True If one assessment is missing, skip that missing value when calculating the average.


    # Indian universities typically require 75% attendance; this is the shortfall
    df["ATTENDANCE_SHORTAGE"] = (75 - df["ATTENDANCE_PERCENTAGE"]).clip(lower=0)
    # .clip(lower=0) It prevents negative shortages. A student with 95% attendance has no shortage, so the value becomes zero.

    # Overall engagement: attendance (50%) + submissions (30%) + study hours (20%)
    study_scaled = (df["STUDY_HOURS_PER_DAY"] / 8).clip(0, 1) * 100
    # This converts study hours into a 0–100 scale, assuming eight hours is the maximum useful value for this formula.

    df["ENGAGEMENT_SCORE"] = (0.5 * df["ATTENDANCE_PERCENTAGE"]
                              + 0.3 * df["ASSIGNMENT_SUBMISSION_RATE"]
                              + 0.2 * study_scaled)
    return df


def add_risk_label(df: pd.DataFrame) -> pd.DataFrame:
    """Create RISK_LEVEL (High/Medium/Low) from FINAL_CGPA."""
    df = df.copy()
    # pd.cut() to turn numerical CGPA values into categories.
    # right=False, the left boundary is included and the right boundary is excluded.
    df["RISK_LEVEL"] = pd.cut(df[TARGET], bins=RISK_BINS,
                              labels=RISK_LABELS_ASC, right=False).astype(str)
    return df

# num_cols contains columns with numerical values.
# cat_cols contains columns with categories or labels.
def build_preprocessor(num_cols, cat_cols) -> ColumnTransformer:
    """
    Numeric: fill missing values with the median, then standardise (mean 0, std 1).
    Categorical: one-hot encode (unseen categories at prediction time are ignored).
    Putting this inside a Pipeline means it is fitted ONLY on training folds,
    which prevents data leakage during cross-validation.
    """

    # First: median imputation
    # SimpleImputer fills missing values using a statistic such as the median.
    # Suppose marks are: [60, 70, missing, 80, 90]
    # The median is 75, so the missing value is filled with 75.

    # Second: standardization
    # StandardScaler() transforms numerical values using: z = (x - mu) / sigma 

    # Here, x is a value, mu is the training-data mean, and sigma is its standard deviation.

    # a pipeline as a sequence of workers. The first worker fixes missing values; the second worker scales the numbers.
    numeric = Pipeline([("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler())])

    # Suppose the departments are CSE, IT and ECE. The encoder turns them into numerical columns.
    # Department	CSE	IT	ECE
    # CSE	         1	0	0
    # IT	         0	1	0
    # ECE	         0	0	1

    # Now the model can process the department information numerically.

    # ("num", numeric, list(num_cols)) — send the numerical columns through the numeric pipeline.

    # ("cat", OneHotEncoder(...), list(cat_cols)) — send the categorical columns through the one-hot encoder.

    # ColumnTransformer combines the results into one prepared dataset.
    return ColumnTransformer([
        ("num", numeric, list(num_cols)),
        ("cat", OneHotEncoder(handle_unknown="ignore"), list(cat_cols)),
    ])