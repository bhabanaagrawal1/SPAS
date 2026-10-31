import json
import logging
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # no GUI needed; figures are saved to disk
# Agg is a non-interactive rendering backend. It lets Matplotlib generate an image file without opening a GUI window.
import matplotlib.pyplot as plt

from src.config import FIGURES_DIR

def get_logger(name: str) -> logging.Logger:
    """Return a logger that prints timestamped messages (better than print())."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s", "%H:%M:%S"))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger


def save_json(obj, path) -> None:
    """Save a dict as pretty JSON (numpy numbers are converted to float)."""
    Path(path).write_text(json.dumps(obj, indent=2, default=float))

def save_figure(fig, filename: str) -> None:
    """Save a matplotlib figure into reports/figures and close it."""
    fig.savefig(FIGURES_DIR / filename, dpi=150, bbox_inches="tight")
    plt.close(fig)