from datetime import datetime, timezone
from uuid import uuid4


VALID_ROAD_TYPES = {"normal", "pothole", "speed_bump"}


def create_event_id():
    return f"rg_{uuid4().hex[:12]}"


def create_prediction_event(
    source,
    road_type,
    confidence,
    event_id,
    metadata=None
):
    """Create a common prediction event for RoadGuardian."""

    if source not in {"sensor", "camera"}:
        raise ValueError(f"Invalid source: {source}")

    if road_type not in VALID_ROAD_TYPES:
        raise ValueError(f"Invalid road type: {road_type}")

    if not 0 <= float(confidence) <= 1:
        raise ValueError("Confidence must be between 0 and 1")

    if not event_id:
        raise ValueError("event_id is required")

    return {
        "event_id": event_id,
        "source": source,
        "road_type": road_type,
        "confidence": float(confidence),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata or {}
    }