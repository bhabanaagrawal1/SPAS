"""Quick sanity tests. Run with:  python -m pytest"""
from src.config import COLUMN_ORDER, DEPARTMENTS, STUDENTS_PER_YEAR
from src.data.generate_dataset import generate_dataset


def test_dataset_shape_and_structure():
    df = generate_dataset()
    assert list(df.columns) == COLUMN_ORDER
    assert len(df) == len(DEPARTMENTS) * 4 * STUDENTS_PER_YEAR      # 7200
    assert df["STUDENT_ID"].is_unique
    # 1200 students per department, 300 per year of study
    assert (df.groupby("DEPARTMENT").size() == 1200).all()
    assert (df.groupby(["DEPARTMENT", "YEAR_OF_STUDY"]).size() == 300).all()


def test_values_are_realistic():
    df = generate_dataset()
    assert df["FINAL_CGPA"].between(0, 10).all()
    assert df["ATTENDANCE_PERCENTAGE"].between(0, 100).all()
    assert (df["ATTENDED_CLASSES"] <= df["TOTAL_CLASSES"]).all()
    assert df["FINAL_CGPA"].notna().all()           # target must never be missing