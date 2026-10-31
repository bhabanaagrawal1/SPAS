"""
MODEL 5 - RECOMMENDATION SYSTEM (hybrid: content-based + peer benchmarking)

Real recommenders (Netflix-style) need logs of "who used what resource and
whether it helped". A new college project has no such data, so we build a
KNOWLEDGE-BASED / CONTENT-BASED recommender, which is what many ed-tech products
start with:
  1. Measure each student's weaknesses (percentile vs all peers).
  2. Describe each intervention by the weaknesses it fixes.
  3. Rank interventions by how well they match the student's weaknesses.
  4. Add a peer benchmark: "students like you who did better studied X more".

Honest limitation (mention in your report): without outcome logs we cannot prove
the recommendations improve results. Future work = A/B test after deployment.
"""
from collections import Counter

import joblib
import numpy as np
import pandas as pd

from src.config import MODELS_DIR, PROCESSED_DIR, TARGET
from src.data.preprocessing import add_engineered_features, load_dataset
from src.utils import get_logger

log = get_logger(__name__)

# Features where a HIGHER value is better
HIGHER_IS_BETTER = [
    "ATTENDANCE_PERCENTAGE", "INTERNAL_ASSESSMENT_MARKS", "MIDTERM_MARKS", "QUIZ_AVERAGE",
    "ASSIGNMENT_AVERAGE", "ASSIGNMENT_SUBMISSION_RATE", "LAB_AVERAGE", "PROJECT_MARKS",
    "STUDY_HOURS_PER_DAY", "PREV_SEM_CGPA",
]

# Catalog: each resource -> {weakness feature: how strongly it helps (0-1)}
CATALOG = [
    {"id": "R01", "title": "Attendance recovery plan with faculty mentor", "category": "Mentoring",
     "targets": {"ATTENDANCE_PERCENTAGE": 1.0}},
    {"id": "R02", "title": "Weekly quiz practice (department question bank / NPTEL)",
     "category": "Practice", "targets": {"QUIZ_AVERAGE": 1.0, "MIDTERM_MARKS": 0.5}},
    {"id": "R03", "title": "Assignment tracker + peer accountability partner", "category": "Habits",
     "targets": {"ASSIGNMENT_SUBMISSION_RATE": 1.0, "ASSIGNMENT_AVERAGE": 0.6}},
    {"id": "R04", "title": "Remedial lab sessions with lab instructor", "category": "Remedial",
     "targets": {"LAB_AVERAGE": 1.0}},
    {"id": "R05", "title": "Structured daily timetable (2-3 focused study hours, Pomodoro)",
     "category": "Habits", "targets": {"STUDY_HOURS_PER_DAY": 1.0}},
    {"id": "R06", "title": "Bridge course on fundamentals of previous semesters",
     "category": "Remedial", "targets": {"PREV_SEM_CGPA": 1.0, "MIDTERM_MARKS": 0.6,
                                         "PREV_SEM_BACKLOGS": 0.6}},
    {"id": "R07", "title": "Backlog clearing plan + supplementary exam coaching",
     "category": "Remedial", "targets": {"PREV_SEM_BACKLOGS": 1.0}},
    {"id": "R08", "title": "Mini-project / hackathon / open-source contribution",
     "category": "Skill building", "targets": {"PROJECT_MARKS": 1.0}},
    {"id": "R09", "title": "Peer-tutoring group led by top performers of the same section",
     "category": "Peer learning", "targets": {"MIDTERM_MARKS": 0.7, "QUIZ_AVERAGE": 0.6,
                                              "INTERNAL_ASSESSMENT_MARKS": 0.8}},
]
ENRICHMENT = {"id": "R10", "title": "Advanced track: research paper, internship or certification",
              "category": "Enrichment", "targets": {}}


class StudentRecommender:
    """fit() learns population statistics; recommend() ranks resources for one student."""

    def fit(self, df: pd.DataFrame) -> "StudentRecommender":
        self.ref_df_ = df.reset_index(drop=True)
        # Sorted values per feature -> fast percentile lookup
        self.ref_ = {c: np.sort(df[c].dropna().to_numpy()) for c in HIGHER_IS_BETTER}
        return self

    def deficits(self, row: pd.Series) -> dict:
        """Weakness score per feature: 0 = strong, 1 = very weak."""
        d = {}
        for col in HIGHER_IS_BETTER:
            value = row[col]
            if pd.isna(value):
                continue
            percentile = np.searchsorted(self.ref_[col], value, side="right") / len(self.ref_[col])
            d[col] = 1.0 - percentile
        d["PREV_SEM_BACKLOGS"] = min(1.0, float(row["PREV_SEM_BACKLOGS"]) / 3)
        # Hard business rules override percentiles
        if row["ATTENDANCE_PERCENTAGE"] < 75:
            d["ATTENDANCE_PERCENTAGE"] = max(d.get("ATTENDANCE_PERCENTAGE", 0), 0.95)
        if row["PREV_SEM_CGPA"] < 6:
            d["PREV_SEM_CGPA"] = max(d.get("PREV_SEM_CGPA", 0), 0.90)
        return d

    @staticmethod
    def _describe(col, row, deficit) -> str:
        if col == "PREV_SEM_BACKLOGS":
            return f"{int(row[col])} backlog(s) in previous semester"
        return f"{col}={row[col]:.1f} (weaker than ~{deficit * 100:.0f}% of peers)"

    def recommend(self, row: pd.Series, top_k: int = 3, min_score: float = 0.35) -> list:
        d = self.deficits(row)
        scored = []
        for item in CATALOG:
            weights = {f: w for f, w in item["targets"].items() if f in d}
            if not weights:
                continue
            # weighted average weakness over the features this resource targets
            score = sum(w * d[f] for f, w in weights.items()) / sum(weights.values())
            top_f = sorted(weights, key=lambda f: d[f], reverse=True)[:2]
            scored.append({**item, "score": round(score, 3),
                           "why": "; ".join(self._describe(f, row, d[f]) for f in top_f)})
        scored = sorted(scored, key=lambda r: r["score"], reverse=True)
        picks = [r for r in scored if r["score"] >= min_score][:top_k]
        if not picks:   # no real weakness -> suggest growth opportunities
            picks = [{**ENRICHMENT, "score": 0.0, "why": "No major weakness found"}]
        return picks

    def peer_gap(self, row: pd.Series, k: int = 25,
                 cols=("ATTENDANCE_PERCENTAGE", "STUDY_HOURS_PER_DAY",
                       "ASSIGNMENT_SUBMISSION_RATE")) -> dict:
        """
        Find k students of the same department/semester with a similar starting point,
        keep their top 25% by FINAL_CGPA, and show how they differ from this student.
        Positive number = top peers are higher than the student on that habit.
        """
        pool = self.ref_df_[(self.ref_df_["DEPARTMENT"] == row["DEPARTMENT"])
                            & (self.ref_df_["SEM"] == row["SEM"])
                            & (self.ref_df_["STUDENT_ID"] != row["STUDENT_ID"])]
        dist = ((pool["PREV_SEM_CGPA"] - row["PREV_SEM_CGPA"]).abs()
                + (pool["PREVIOUS_YEAR_PERCENTAGE"] - row["PREVIOUS_YEAR_PERCENTAGE"]).abs() / 10)
        peers = pool.loc[dist.nsmallest(k).index]
        top = peers[peers[TARGET] >= peers[TARGET].quantile(0.75)]
        gap = top[list(cols)].mean() - row[list(cols)].astype(float)
        return gap.round(1).to_dict()


def main() -> None:
    df = add_engineered_features(load_dataset())
    rec = StudentRecommender().fit(df)
    joblib.dump(rec, MODELS_DIR / "recommender.joblib")

    # Recommendations for every student -> CSV (top 3 each)
    rows, first_choice = [], Counter()
    for r in df.to_dict("records"):
        row = pd.Series(r)
        picks = rec.recommend(row)
        first_choice[picks[0]["id"]] += 1
        for rank, p in enumerate(picks, 1):
            rows.append({"STUDENT_ID": row["STUDENT_ID"], "RANK": rank, "RESOURCE_ID": p["id"],
                         "RESOURCE": p["title"], "SCORE": p["score"], "WHY": p["why"]})
    pd.DataFrame(rows).to_csv(PROCESSED_DIR / "recommendations.csv", index=False)

    # Sanity checks (NOT proof of effectiveness - see module docstring)
    catalog_ids = {c["id"] for c in CATALOG} | {ENRICHMENT["id"]}
    log.info("Catalog coverage (resources used as #1 pick): %d / %d",
             len(first_choice), len(catalog_ids))
    log.info("Distribution of #1 picks: %s", dict(first_choice))

    # Demo on 3 weak students and 1 strong student
    demo = pd.concat([df.nsmallest(3, TARGET), df.nlargest(1, TARGET)])
    for _, row in demo.iterrows():
        print(f"\nStudent {row['STUDENT_ID']} | {row['DEPARTMENT']} | Sem {row['SEM']} "
              f"| CGPA {row[TARGET]}")
        for p in rec.recommend(row):
            print(f"  -> [{p['id']}] {p['title']}  (match {p['score']})  because {p['why']}")
        print("  Gap vs top similar peers:", rec.peer_gap(row))


if __name__ == "__main__":
    main()