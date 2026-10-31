"""
Run the whole project:   python run_pipeline.py
Run selected steps:      python run_pipeline.py --steps data performance
"""
import argparse

from src.data import generate_dataset
from src.models import (recommender, train_anomaly, train_clustering,
                        train_performance, train_risk)
from src.utils import get_logger

log = get_logger("pipeline")

STEPS = {
    "data": generate_dataset.main,
    "performance": train_performance.main,
    "risk": train_risk.main,
    "clustering": train_clustering.main,
    "anomaly": train_anomaly.main,
    "recommender": recommender.main,
}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Student analytics pipeline")
    parser.add_argument("--steps", nargs="*", default=list(STEPS), choices=list(STEPS))
    for step in parser.parse_args().steps:
        log.info("=" * 20 + f" STEP: {step} " + "=" * 20)
        STEPS[step]()
    log.info("Done. Check models/, reports/ and data/processed/.")