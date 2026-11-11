import json
import logging
import os
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

os.environ.setdefault("MPLBACKEND", "Agg")                 # no GUI needed on a server
ROOT = Path(__file__).resolve().parents[1]                  # = Analytics/
sys.path.insert(0, str(ROOT))

import joblib
import numpy as np
import pandas as pd
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict

from src.config import (CAT_FEATURES, MODELS_DIR, NUM_FEATURES, REPORTS_DIR,
                        RISK_ORDER, TARGET)
from src.data.preprocessing import add_engineered_features, load_dataset
from src.models.recommender import StudentRecommender
from src.models.train_anomaly import add_gap_features, rule_flags
from ml_services.features import to_engineered

log = logging.getLogger("ml_service")
API_KEY = os.getenv("ML_API_KEY", "")
S: dict = {}

FRIENDLY = {
    "LOW_ATTENDANCE_BUT_HIGH_CGPA": "Very low attendance but a high CGPA",
    "CGPA_INCONSISTENT_WITH_MARKS": "CGPA does not match the marks scored",
    "FULL_SUBMISSION_BUT_ZERO_SCORE": "Assignments submitted but scored near zero",
    "ATTENDED_MORE_THAN_HELD": "Attended classes exceed total classes held",
}
LADDERS = {
    2: ["High Performers", "Needs Improvement"],
    3: ["High Performers", "Consistent Learners", "Needs Improvement"],
    4: ["High Performers", "Consistent Learners", "Needs Improvement", "At Risk"],
}


# ---------------------------------------------------------------- loading
def _try(name, fn):
    try:
        S[name] = fn()
    except Exception as e:
        S[name] = None
        S["errors"][name] = f"{type(e).__name__}: {e}"
        log.exception("Could not load %s", name)


def _read(name):
    p = Path(REPORTS_DIR) / name
    return json.loads(p.read_text()) if p.exists() else {}


def build_cluster_map(bundle, ref):
    feats = bundle["features"]
    d = ref.copy()
    for c in feats:
        if c not in d.columns:
            d[c] = np.nan
    d["_c"] = bundle["model"].predict(bundle["preprocessor"].transform(d[feats]))
    order = d.groupby("_c")[TARGET].mean().sort_values(ascending=False)
    ladder = LADDERS.get(len(order))
    # Names come from ranking clusters by mean FINAL_CGPA (profiling AFTER clustering)
    names = {int(c): (ladder[i] if ladder else f"Segment {i + 1}") for i, c in enumerate(order.index)}
    groups = [{"name": names[int(c)], "students": int((d["_c"] == c).sum()),
               "meanCgpa": round(float(order[c]), 2)} for c in order.index]
    s = d.dropna(subset=["ATTENDANCE_PERCENTAGE", "MARKS_MEAN"])
    s = s.sample(min(250, len(s)), random_state=42)
    points = [{"attendance": round(float(a), 1), "marks": round(float(m), 1), "group": names[int(c)]}
              for a, m, c in zip(s["ATTENDANCE_PERCENTAGE"], s["MARKS_MEAN"], s["_c"])]
    return {"names": names, "groups": groups, "points": points}


def load_all():
    S.clear()
    S["errors"] = {}
    S["ref"] = add_engineered_features(load_dataset())      # training data: medians + peer benchmark
    m = Path(MODELS_DIR)
    _try("performance", lambda: joblib.load(m / "performance_model.joblib"))
    _try("risk", lambda: joblib.load(m / "risk_model.joblib"))
    _try("cluster", lambda: joblib.load(m / "clustering_model.joblib"))
    _try("anomaly", lambda: joblib.load(m / "anomaly_model.joblib"))
    # rebuilt from data instead of unpickled -> no pickle/module-path problems
    _try("recommender", lambda: StudentRecommender().fit(S["ref"]))
    if S.get("cluster"):
        _try("cluster_map", lambda: build_cluster_map(S["cluster"], S["ref"]))
    p = m / "performance_model.joblib"
    stamp = time.strftime("%Y%m%d-%H%M", time.localtime(p.stat().st_mtime)) if p.exists() else "na"
    S["version"] = f"models-{stamp}"


@asynccontextmanager
async def lifespan(_app):
    load_all()
    yield


app = FastAPI(title="Student ML Service", lifespan=lifespan)


def auth(x_api_key: Optional[str] = Header(default=None)):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(401, "Invalid API key")


class Record(BaseModel):
    model_config = ConfigDict(extra="allow")
    ref: Optional[str] = None


class AnalyzeRequest(BaseModel):
    records: list[Record]


# ---------------------------------------------------------------- helpers
def _need(name):
    if S.get(name) is None:
        raise RuntimeError(f"model not loaded ({S['errors'].get(name, 'file missing - train it first')})")
    return S[name]


def _num(v):
    try:
        v = float(v)
        return None if np.isnan(v) or np.isinf(v) else v
    except Exception:
        return None


def _prio(score):
    return "High" if score >= 0.7 else "Medium" if score >= 0.5 else "Low"


def build_metrics():
    perf = _read("performance_metrics.json")
    risk = _read("risk_metrics.json").get("report", {})
    clu = _read("clustering_summary.json")
    ano = _read("anomaly_metrics.json")
    fmt = lambda v: "--" if v is None else f"{float(v):.2f}"
    p = next((v for k, v in ano.items() if k.startswith("precision_at_")), None)
    r = next((v for k, v in ano.items() if k.startswith("recall_at_")), None)
    f1 = 2 * p * r / (p + r) if p and r and (p + r) > 0 else None
    return [
        {"label": "RMSE", "value": fmt(perf.get("rmse"))},
        {"label": "R² Score", "value": fmt(perf.get("r2"))},
        {"label": "Macro-F1", "value": fmt(risk.get("macro avg", {}).get("f1-score"))},
        {"label": "High-risk Recall", "value": fmt(risk.get(RISK_ORDER[-1], {}).get("recall"))},
        {"label": "Silhouette", "value": fmt(clu.get("silhouette"))},
        {"label": "Anomaly F1", "value": fmt(f1)},
    ]


# ---------------------------------------------------------------- endpoints
@app.get("/health")
def health():
    return {"status": "ok", "modelVersion": S["version"],
            "loaded": {k: S.get(k) is not None for k in
                       ["performance", "risk", "cluster", "anomaly", "recommender"]},
            "errors": S["errors"]}


@app.post("/reload", dependencies=[Depends(auth)])
def reload_models():
    load_all()
    return health()


@app.get("/meta", dependencies=[Depends(auth)])
def meta():
    return {"metrics": build_metrics(), "clusterMap": S.get("cluster_map")}


@app.post("/analyze", dependencies=[Depends(auth)])
def analyze(req: AnalyzeRequest):
    if not req.records:
        raise HTTPException(422, "records is empty")
    records = [r.model_dump() for r in req.records]
    try:
        df, missing = to_engineered(records, S["ref"])
    except Exception as e:
        raise HTTPException(422, f"Could not build features: {type(e).__name__}: {e}")

    n = len(df)
    results = [{"ref": r.get("ref")} for r in records]
    errors, warnings = {}, []
    known = set(S["ref"]["DEPARTMENT"].unique())
    for dep in set(df["DEPARTMENT"]):
        if dep not in known:
            warnings.append(f"Department '{dep}' was not in the training data: {sorted(known)}")
    X = df[NUM_FEATURES + CAT_FEATURES]
    cgpa = None

    # 1) PERFORMANCE
    try:
        cgpa = np.clip(_need("performance").predict(X), 0, 10)
        for i in range(n):
            results[i]["performance"] = {"predictedCgpa": round(float(cgpa[i]), 2)}
    except Exception as e:
        errors["performance"] = str(e)

    # 2) RISK
    try:
        pipe = _need("risk")
        proba, level = pipe.predict_proba(X), pipe.predict(X)
        classes = [str(c) for c in pipe.classes_]
        for i in range(n):
            probs = {c: round(float(proba[i][j]), 4) for j, c in enumerate(classes)}
            score = round(100 * (probs.get("High", 0) + 0.5 * probs.get("Medium", 0)))
            results[i]["risk"] = {"level": str(level[i]), "probabilities": probs, "score": score}
    except Exception as e:
        errors["risk"] = str(e)

    # 3) CLUSTER
    try:
        b = _need("cluster")
        dc = df.copy()
        for c in b["features"]:
            if c not in dc.columns:
                dc[c] = np.nan
        cid = b["model"].predict(b["preprocessor"].transform(dc[b["features"]]))
        names = (S.get("cluster_map") or {}).get("names", {})
        for i in range(n):
            k = int(cid[i])
            results[i]["cluster"] = {"id": k, "name": names.get(k, b["cluster_names"].get(k, f"Segment {k}"))}
    except Exception as e:
        errors["cluster"] = str(e)

    # 4) ANOMALY  (the model was trained WITH FINAL_CGPA; for a live student we use the predicted CGPA)
    try:
        b = _need("anomaly")
        if cgpa is None:
            raise RuntimeError("needs the performance model (uses predicted CGPA)")
        d = df.copy()
        d[TARGET] = cgpa
        d = add_gap_features(d)
        for c in b["features"]:
            if c not in d.columns:
                d[c] = np.nan
        score = -b["model"].score_samples(b["preprocessor"].transform(d[b["features"]]))
        reasons = rule_flags(d)
        for i in range(n):
            rs = [FRIENDLY.get(x, x) for x in reasons.iloc[i].split(";") if x]
            results[i]["anomaly"] = {"score": round(float(score[i]), 4),
                                     "isAnomaly": bool(score[i] >= b["threshold"] or rs),
                                     "reasons": rs}
    except Exception as e:
        errors["anomaly"] = str(e)

    # 5) RECOMMENDER
    try:
        rec = _need("recommender")
        for i in range(n):
            row = pd.Series(df.iloc[i].to_dict())
            picks = rec.recommend(row)
            results[i]["recommendations"] = [
                {"id": p["id"], "title": p["title"], "category": p["category"],
                 "score": p["score"], "priority": _prio(p["score"]), "why": p["why"]} for p in picks]
            results[i]["peerGap"] = {k: _num(v) for k, v in rec.peer_gap(row).items()}
    except Exception as e:
        errors["recommender"] = str(e)

    return {"modelVersion": S["version"],
            "errorMargin": _num(_read("performance_metrics.json").get("rmse")),
            "missingFeatures": missing, "warnings": warnings, "errors": errors,
            "results": results}