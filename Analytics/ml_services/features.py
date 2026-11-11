import numpy as np
import pandas as pd

from src.config import CAT_FEATURES, NUM_FEATURES
from src.data.preprocessing import add_engineered_features

# LEFT = field sent by Node (from Prisma). RIGHT = your dataset column (taken from your training code).
FIELD_MAP = {
    "studentId": "STUDENT_ID",
    "department": "DEPARTMENT",
    "semester": "SEM",
    "previousSemesterCgpa": "PREV_SEM_CGPA",
    "previousSemesterBacklogs": "PREV_SEM_BACKLOGS",
    "attendancePercentage": "ATTENDANCE_PERCENTAGE",
    "totalClasses": "TOTAL_CLASSES",
    "attendedClasses": "ATTENDED_CLASSES",
    "internalAssessmentMarks": "INTERNAL_ASSESSMENT_MARKS",
    "midtermMarks": "MIDTERM_MARKS",
    "quizAverage": "QUIZ_AVERAGE",
    "assignmentAverage": "ASSIGNMENT_AVERAGE",
    "assignmentSubmissionRate": "ASSIGNMENT_SUBMISSION_RATE",
    "labAverage": "LAB_AVERAGE",
    "projectMarks": "PROJECT_MARKS",
    "studyHoursPerDay": "STUDY_HOURS_PER_DAY",
    "previousYearPercentage": "PREVIOUS_YEAR_PERCENTAGE",
}


def to_engineered(records: list[dict], ref: pd.DataFrame):
    """records -> engineered frame the models expect.
    Features the DB doesn't have are filled with the TRAINING median / most-common value
    and reported in `missing`."""
    df = pd.DataFrame([{FIELD_MAP.get(k, k): v for k, v in r.items() if k != "ref"} for r in records])
    df = add_engineered_features(df)

    missing = []
    for c in NUM_FEATURES:
        if c not in df.columns:
            missing.append(c)
            df[c] = np.nan
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(ref[c].median())
    for c in CAT_FEATURES:
        if c not in df.columns:
            missing.append(c)
            df[c] = np.nan
        df[c] = df[c].fillna(ref[c].mode().iloc[0])
    return df, missing