import csv
from datetime import datetime, timezone
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORTS_DIR = PROJECT_ROOT / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

CSV_FILE = REPORTS_DIR / "sensor_predictions.csv"

FIELDNAMES = [
    "timestamp",
    "scenario_id",
    "actual_road_type",
    "predicted_road_type",
    "model_score",
    "normal_score",
    "pothole_score",
    "speed_bump_score",
    "correct",
    "dataset_type",
    "model_version",
]


def log_prediction(
    scenario_id,
    actual_road_type,
    prediction_result,
    model_version="sensor_rf_v1"
):
    """Save an inference result without claiming independent validation."""

    scores = prediction_result["scores"]
    predicted = prediction_result["road_type"]

    row = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "scenario_id": scenario_id,
        "actual_road_type": actual_road_type,
        "predicted_road_type": predicted,
        "model_score": prediction_result["confidence"],
        "normal_score": scores.get("normal", 0.0),
        "pothole_score": scores.get("pothole", 0.0),
        "speed_bump_score": scores.get("speed_bump", 0.0),
        "correct": (
            actual_road_type == predicted
            if actual_road_type is not None
            else ""
        ),
        "dataset_type": "synthetic_training_demo",
        "model_version": model_version,
    }

    file_exists = CSV_FILE.exists()

    with open(CSV_FILE, "a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDNAMES)

        if not file_exists or CSV_FILE.stat().st_size == 0:
            writer.writeheader()

        writer.writerow(row)

    return CSV_FILE