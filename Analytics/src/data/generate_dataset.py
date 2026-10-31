"""
Synthetic dataset generator modelled on a typical Indian engineering college.

HOW IT WORKS (so you can explain it in your viva):
1. Every student gets two hidden "latent" traits: ABILITY (academic aptitude)
   and EFFORT (discipline/hard work). They are mildly correlated (0.3).
2. All visible columns (attendance, quiz, midterm, ...) are noisy functions of
   those two traits. This creates realistic correlations between columns.
3. FINAL_CGPA is computed from marks, previous CGPA, attendance shortage,
   backlogs and study hours, plus random noise (nobody is perfectly predictable).
4. A small fraction of rows get deliberately inconsistent values (anomalies)
   and a small fraction of cells are set to NaN (real data is never clean).
"""
import numpy as np
import pandas as pd

from src.config import (
    ACADEMIC_YEAR, ANOMALY_FRACTION, ANOMALY_LABEL_COL, COLUMN_ORDER,
    DEPARTMENTS, MISSING_RATE, RANDOM_STATE, RAW_CSV, SECTIONS,
    STUDENTS_PER_SECTION, STUDENTS_PER_YEAR, YEARS,
)
from src.utils import get_logger

log = get_logger(__name__)

# Small department-level shift (grading strictness / paper difficulty).
DEPT_OFFSET = {"CSE": 0.15, "IT": 0.10, "ECE": 0.00,
               "EEE": -0.05, "MECH": -0.15, "CIVIL": -0.10}


def _clip(x, lo, hi):
    return np.clip(x, lo, hi)


def _make_block(rng: np.random.Generator, dept: str, year: int) -> pd.DataFrame:
    """Generate the 300 students of one department and one year of study."""
    n = STUDENTS_PER_YEAR
    off = DEPT_OFFSET[dept]

    # Hidden traits
    ability = rng.normal(0, 1, n)
    effort = 0.3 * ability + np.sqrt(1 - 0.3 ** 2) * rng.normal(0, 1, n)

    # Each year has two semesters: year 1 -> sem 1/2, year 2 -> sem 3/4 ...
    sem = np.where(rng.random(n) < 0.5, 2 * year - 1, 2 * year)
    first_sem = sem == 1

    # Background
    # Year 1: 12th board %, other years: previous university-year %
    prev_year_pct = _clip(
        66 + 10 * (0.8 * ability + 0.2 * effort) + rng.normal(0, 4, n)
        + (4 if year == 1 else 0) + 8 * off, 45, 98)

    prev_cgpa = _clip(6.9 + 1.0 * (0.75 * ability + 0.25 * effort)
                      + rng.normal(0, 0.4, n) + off, 3.5, 9.9)
    # For sem 1 there is no previous semester -> use entry-level proxy
    prev_cgpa = np.where(first_sem, _clip(prev_year_pct / 10 * 0.95, 4.0, 9.8), prev_cgpa)

    # Weaker previous CGPA => more backlogs (Poisson count), none in sem 1
    backlogs = np.minimum(rng.poisson(np.clip(6.2 - prev_cgpa, 0, None) * 1.1), 8)
    backlogs = np.where(first_sem, 0, backlogs)

    # ---- Behaviour ----
    study = _clip(2.6 + 0.9 * effort + 0.25 * ability + rng.normal(0, 0.7, n), 0.3, 8.0)
    total = rng.integers(85, 121, n)                       # classes held in the semester
    att_raw = _clip(80 + 8 * effort + 2 * ability + rng.normal(0, 6, n), 35, 100)
    attended = np.minimum(np.rint(att_raw / 100 * total).astype(int), total)
    att_pct = np.round(attended / total * 100, 2)          # always consistent with counts

    # ---- Assessment components (0-100 scale) ----
    def comp(mean, a_w, e_w, scale, noise):
        signal = a_w * ability + e_w * effort
        return _clip(mean + scale * signal + rng.normal(0, noise, n) + 8 * off, 0, 100)

    mid = comp(62, 0.7, 0.3, 15, 7)
    quiz = comp(66, 0.6, 0.4, 12, 8)
    assign = comp(74, 0.4, 0.6, 10, 7)
    lab = comp(76, 0.5, 0.5, 9, 6)
    project = comp(78, 0.5, 0.5, 8, 7)
    submission = _clip(86 + 9 * effort + 2 * ability + rng.normal(0, 8, n), 20, 100)
    internal = _clip(0.35 * mid + 0.20 * quiz + 0.20 * assign + 0.15 * lab
                     + 0.10 * att_pct + rng.normal(0, 3, n), 0, 100)

    # ---- Target: FINAL_CGPA ----
    blend = 0.28 * internal + 0.28 * mid + 0.12 * lab + 0.10 * project + 0.10 * assign + 0.12 * quiz
    cgpa = (0.35 * prev_cgpa + 0.65 * blend / 10
            - 0.035 * np.maximum(0, 75 - att_pct)      # shortage below 75% hurts
            - 0.10 * backlogs                           # each backlog hurts
            + 0.06 * np.clip(study - 3, -3, 3)          # study-hours bonus/penalty
            + 0.25 + rng.normal(0, 0.25, n))            # +0.25 = baseline, noise = luck
    cgpa = _clip(cgpa, 2.5, 10.0)

    # ---- IDs and sections ----
    seq = np.arange(1, n + 1)
    join_yy = (2025 - (year - 1)) % 100                 # admission year, e.g. 25, 24, 23, 22
    sections = np.array(SECTIONS)[(seq - 1) // STUDENTS_PER_SECTION]

    df = pd.DataFrame({
        "STUDENT_ID": [f"{join_yy}{dept}{s:03d}" for s in seq],
        "SEM": sem,
        "SECTION": sections,
        "ACADEMIC_YEAR": ACADEMIC_YEAR,
        "PREV_SEM_CGPA": np.round(prev_cgpa, 2),
        "PREV_SEM_BACKLOGS": backlogs.astype(int),
        "ATTENDANCE_PERCENTAGE": att_pct,
        "TOTAL_CLASSES": total,
        "ATTENDED_CLASSES": attended,
        "INTERNAL_ASSESSMENT_MARKS": np.round(internal, 1),
        "MIDTERM_MARKS": np.round(mid, 1),
        "QUIZ_AVERAGE": np.round(quiz, 1),
        "ASSIGNMENT_AVERAGE": np.round(assign, 1),
        "ASSIGNMENT_SUBMISSION_RATE": np.round(submission, 1),
        "LAB_AVERAGE": np.round(lab, 1),
        "PROJECT_MARKS": np.round(project, 1),
        "STUDY_HOURS_PER_DAY": np.round(study, 1),
        "PREVIOUS_YEAR_PERCENTAGE": np.round(prev_year_pct, 1),
        "FINAL_CGPA": np.round(cgpa, 2),
        "ADDED_FIELDS_SYNTHETIC": "YES",
        "DEPARTMENT": dept,
        "YEAR_OF_STUDY": year,
    })
    return _inject_anomalies(rng, df)


def _inject_anomalies(rng: np.random.Generator, df: pd.DataFrame) -> pd.DataFrame:
    """
    Corrupt ~2.5% of rows in three realistic ways (used to test anomaly detection):
      (a) attendance-record fraud: very low attendance but excellent marks/CGPA
      (b) CGPA-marks mismatch: very low internal marks but very high CGPA
      (c) assignment contradiction: 100% submission, near-zero assignment score,
          yet top quiz marks
    """
    df[ANOMALY_LABEL_COL] = 0
    k = int(round(ANOMALY_FRACTION * len(df)))
    idx = rng.choice(len(df), size=k, replace=False)
    group_a, group_b, group_c = np.array_split(idx, 3)

    for i in group_a:
        total = int(df.at[i, "TOTAL_CLASSES"])
        attended = int(round(total * rng.uniform(0.25, 0.50)))
        df.at[i, "ATTENDED_CLASSES"] = attended
        df.at[i, "ATTENDANCE_PERCENTAGE"] = round(attended / total * 100, 2)
        df.at[i, "FINAL_CGPA"] = round(rng.uniform(8.4, 9.7), 2)
        df.at[i, "MIDTERM_MARKS"] = round(rng.uniform(80, 95), 1)
        df.at[i, "INTERNAL_ASSESSMENT_MARKS"] = round(rng.uniform(80, 95), 1)

    for i in group_b:
        for col in ["INTERNAL_ASSESSMENT_MARKS", "MIDTERM_MARKS", "QUIZ_AVERAGE",
                    "ASSIGNMENT_AVERAGE", "LAB_AVERAGE"]:
            df.at[i, col] = round(rng.uniform(20, 40), 1)
        df.at[i, "FINAL_CGPA"] = round(rng.uniform(8.5, 9.6), 2)

    for i in group_c:
        df.at[i, "ASSIGNMENT_SUBMISSION_RATE"] = 100.0
        df.at[i, "ASSIGNMENT_AVERAGE"] = round(rng.uniform(5, 25), 1)
        df.at[i, "QUIZ_AVERAGE"] = round(rng.uniform(85, 100), 1)

    df.loc[idx, ANOMALY_LABEL_COL] = 1
    return df


def generate_dataset(seed: int = RANDOM_STATE) -> pd.DataFrame:
    """Build the full dataset: 6 departments x 4 years x 300 students = 7200 rows."""
    rng = np.random.default_rng(seed)
    blocks = [_make_block(rng, d, y) for d in DEPARTMENTS for y in YEARS]
    df = pd.concat(blocks, ignore_index=True)

    # Real data has missing values (absent exams, unfilled forms, self-reported hours)
    for col in ["QUIZ_AVERAGE", "ASSIGNMENT_AVERAGE", "LAB_AVERAGE", "STUDY_HOURS_PER_DAY"]:
        df.loc[rng.random(len(df)) < MISSING_RATE, col] = np.nan

    return df[COLUMN_ORDER]


def main() -> None:
    df = generate_dataset()
    df.to_csv(RAW_CSV, index=False)
    log.info("Saved %d rows x %d columns to %s", *df.shape, RAW_CSV)
    log.info("Mean FINAL_CGPA by department:\n%s",
             df.groupby("DEPARTMENT")["FINAL_CGPA"].agg(["mean", "std"]).round(2))
    log.info("Mean FINAL_CGPA by year:\n%s",
             df.groupby("YEAR_OF_STUDY")["FINAL_CGPA"].agg(["mean", "std"]).round(2))


if __name__ == "__main__":
    main()