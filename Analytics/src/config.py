from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1] # __file__ refers to the path of the current Python file, config.py. .resolve() converts it to an absolute path and resolves path components where possible.

RAW_DIR = ROOT_DIR / "data" / "raw"
PROCESSED_DIR = ROOT_DIR / "data" / "processed"
MODELS_DIR = ROOT_DIR / "models"
REPORTS_DIR = ROOT_DIR / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"
RAW_CSV = RAW_DIR / "student_performance_dataset.csv"

for _d in (RAW_DIR, PROCESSED_DIR, MODELS_DIR, REPORTS_DIR, FIGURES_DIR):
    _d.mkdir(parents=True, exist_ok=True)

RANDOM_STATE = 42     # same seed => same dataset and same results every run
# A fixed random seed makes randomized operations repeatable when those operations use the seed consistently. It may control synthetic data generation, data splitting, or randomized models.
N_SPLITS = 5          # cross-validation folds
# Five-fold cross-validation divides the training data into five parts. The model trains on four parts and validates on the remaining part, repeating until each part has been used for validation.
TEST_SIZE = 0.20      # hold-out test fraction
# Reserves 20% of the dataset for final evaluation, leaving 80% for training and model selection. With 7,200 rows, that would be 5,760 training rows and 1,440 test rows, assuming no rows are removed before splitting.

DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"]
YEARS = [1, 2, 3, 4]
STUDENTS_PER_YEAR = 300          # per department  -> 1200 per department
SECTIONS = ["A", "B", "C", "E", "F"]
STUDENTS_PER_SECTION = 60        # 300 / 5 sections
ACADEMIC_YEAR = "2025-26"
ANOMALY_FRACTION = 0.025         # ~2.5% injected bad / suspicious records
# the generator is intended to inject anomalies into approximately 2.5% of records.
MISSING_RATE = 0.015             # ~1.5% missing values in some columns
# the generator is intended to introduce about 1.5% missingness in selected columns.

ID_COL = "STUDENT_ID"
TARGET = "FINAL_CGPA"
ANOMALY_LABEL_COL = "IS_INJECTED_ANOMALY"
# records whether the generator deliberately marked a row as anomalous.

COLUMN_ORDER = [
    "STUDENT_ID", "SEM", "SECTION", "ACADEMIC_YEAR", "PREV_SEM_CGPA",
    "PREV_SEM_BACKLOGS", "ATTENDANCE_PERCENTAGE", "TOTAL_CLASSES",
    "ATTENDED_CLASSES", "INTERNAL_ASSESSMENT_MARKS", "MIDTERM_MARKS",
    "QUIZ_AVERAGE", "ASSIGNMENT_AVERAGE", "ASSIGNMENT_SUBMISSION_RATE",
    "LAB_AVERAGE", "PROJECT_MARKS", "STUDY_HOURS_PER_DAY",
    "PREVIOUS_YEAR_PERCENTAGE", "FINAL_CGPA", "ADDED_FIELDS_SYNTHETIC",
    "DEPARTMENT", "YEAR_OF_STUDY", "IS_INJECTED_ANOMALY",
]

BASE_NUM_FEATURES = [
    "SEM", "PREV_SEM_CGPA", "PREV_SEM_BACKLOGS", "ATTENDANCE_PERCENTAGE",
    "INTERNAL_ASSESSMENT_MARKS", "MIDTERM_MARKS", "QUIZ_AVERAGE",
    "ASSIGNMENT_AVERAGE", "ASSIGNMENT_SUBMISSION_RATE", "LAB_AVERAGE",
    "PROJECT_MARKS", "STUDY_HOURS_PER_DAY", "PREVIOUS_YEAR_PERCENTAGE",
]
ENGINEERED_FEATURES = ["MARKS_MEAN", "ATTENDANCE_SHORTAGE", "ENGAGEMENT_SCORE"]
NUM_FEATURES = BASE_NUM_FEATURES + ENGINEERED_FEATURES
CAT_FEATURES = ["DEPARTMENT"]
MODEL_FEATURES = NUM_FEATURES + CAT_FEATURES

# FINAL_CGPA < 5.5 -> High risk, 5.5-7.0 -> Medium, >= 7.0 -> Low
RISK_BINS = [0.0, 5.5, 7.0, 10.01]
RISK_LABELS_ASC = ["High", "Medium", "Low"]   # matches the bins above
RISK_ORDER = ["Low", "Medium", "High"]        # nicer order for reports