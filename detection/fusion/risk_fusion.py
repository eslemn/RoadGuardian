import csv
from datetime import datetime, timezone
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = PROJECT_ROOT / "reports"
REPORT_FILE = REPORT_DIR / "fusion_predictions.csv"


def fuse_predictions(sensor_event, camera_event):
    """
    RoadGuardian Risk Fusion Engine v1.

    Combines two model predictions using explainable rules.

    IMPORTANT:
    Two-source agreement is not equivalent to
    real-world road hazard verification.
    """

    # 1. Check event identity
    if sensor_event["event_id"] != camera_event["event_id"]:
        raise ValueError(
            "Sensor and camera events have different event IDs."
        )

    if sensor_event["source"] != "sensor":
        raise ValueError("First event must come from sensor.")

    if camera_event["source"] != "camera":
        raise ValueError("Second event must come from camera.")

    event_id = sensor_event["event_id"]

    sensor_type = sensor_event["road_type"]
    camera_type = camera_event["road_type"]

    # 2. Decision-level fusion
    if sensor_type == "pothole" and camera_type == "pothole":

        fusion_status = "two_source_agreement"
        road_type = "pothole"
        warning = True
        message = "Pothole risk supported by both models"

    elif sensor_type == "pothole" and camera_type == "normal":

        fusion_status = "sensor_only"
        road_type = "pothole"
        warning = True
        message = "Potential pothole detected by sensor"

    elif sensor_type == "normal" and camera_type == "pothole":

        fusion_status = "camera_only"
        road_type = "pothole"
        warning = True
        message = "Potential pothole detected by camera"

    elif sensor_type == "normal" and camera_type == "normal":

        fusion_status = "no_risk"
        road_type = "normal"
        warning = False
        message = "No road risk detected"

    elif sensor_type == "speed_bump" and camera_type == "pothole":

        fusion_status = "conflict"
        road_type = "unknown"
        warning = True
        message = "Conflicting road hazard predictions"

    elif sensor_type == "speed_bump" and camera_type == "normal":

        fusion_status = "sensor_only"
        road_type = "speed_bump"
        warning = True
        message = "Potential speed bump detected by sensor"

    else:
        raise ValueError(
            f"Unsupported combination: {sensor_type}, {camera_type}"
        )

    # 3. Common result
    return {
        "event_id": event_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "fusion_status": fusion_status,
        "road_type": road_type,
        "warning": warning,
        "warning_message": message,
        "sensor_prediction": sensor_type,
        "camera_prediction": camera_type,
        "sensor_score": sensor_event["confidence"],
        "camera_score": camera_event["confidence"],
        "validation_level": "demo_agreement_only"
    }


def save_fusion_result(result):
    """Append a fusion result to the experiment history."""

    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    file_exists = REPORT_FILE.exists()

    with REPORT_FILE.open(
        "a",
        newline="",
        encoding="utf-8"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=list(result.keys())
        )

        if not file_exists or REPORT_FILE.stat().st_size == 0:
            writer.writeheader()

        writer.writerow(result)

    return REPORT_FILE