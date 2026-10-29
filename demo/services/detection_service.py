"""
demo/services/detection_service.py
====================================
ML model loading, inference execution, event creation,
Risk Fusion Engine calls, and CSV logging.

This module wraps the existing prediction classes and fusion engine
without modifying their behaviour or parameters.
"""

import sys
from pathlib import Path

import streamlit as st

# Ensure the project root is importable when this module is loaded
# via ``python -m streamlit run demo/app.py`` from the project root.
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from detection.sensor_ml.predict import RoadGuardianSensorPredictor
from detection.camera_ml.predict import RoadGuardianCameraPredictor
from detection.fusion.risk_fusion import fuse_predictions, save_fusion_result
from shared.event_schema import create_event_id, create_prediction_event


# ------------------------------------------------------------------ #
# Model loading (cached)                                              #
# ------------------------------------------------------------------ #

@st.cache_resource
def load_models():
    """
    Instantiate and cache the sensor and camera predictors.

    Uses st.cache_resource so that model weights are loaded only once
    per Streamlit server process — matching the original app.py behaviour.

    Returns
    -------
    (RoadGuardianSensorPredictor, RoadGuardianCameraPredictor)
    """
    sensor_model = RoadGuardianSensorPredictor()
    camera_model = RoadGuardianCameraPredictor()
    return sensor_model, camera_model


# ------------------------------------------------------------------ #
# Inference                                                           #
# ------------------------------------------------------------------ #

def run_detection(
    feature_row: dict,
    camera_image_path: Path,
    scenario_id: str,
    speed: int,
):
    """
    Execute the full detection pipeline for one scenario.

    Steps
    -----
    1. Run the sensor Random Forest model.
    2. Run the camera MobileNetV2 model.
    3. Create shared prediction events.
    4. Call the existing Risk Fusion Engine.
    5. Append the result to the CSV experiment log.

    Parameters
    ----------
    feature_row       : dict  row from features.csv for the current scenario
    camera_image_path : Path  path to the road image
    scenario_id       : str   e.g. "pothole_30kmh_v1"
    speed             : int   vehicle speed in km/h

    Returns
    -------
    dict with keys:
        sensor, camera, fusion, saved_path
    """
    sensor_predictor, camera_predictor = load_models()

    # --- Sensor model -------------------------------------------
    sensor_result = sensor_predictor.predict(feature_row)

    # --- Camera model -------------------------------------------
    camera_result = camera_predictor.predict(camera_image_path)

    # --- Shared events ------------------------------------------
    event_id = create_event_id()

    sensor_event = create_prediction_event(
        source="sensor",
        road_type=sensor_result["road_type"],
        confidence=sensor_result["confidence"],
        event_id=event_id,
        metadata={
            "scenario_id": scenario_id,
            "vehicle_speed_kmh": speed,
            "data_source": "synthetic_training_demo",
        },
    )

    camera_event = create_prediction_event(
        source="camera",
        road_type=camera_result["road_type"],
        confidence=camera_result["confidence"],
        event_id=event_id,
        metadata={
            "image_path": str(camera_image_path),
            "model": "MobileNetV2",
            "data_source": "independent_camera_image",
        },
    )

    # --- Risk Fusion Engine ------------------------------------
    fusion_result = fuse_predictions(sensor_event, camera_event)

    # Annotate as a paired integration demo (matches original app.py).
    fusion_result["validation_level"] = "paired_demo_inputs"

    # --- CSV logging -------------------------------------------
    saved_path = save_fusion_result(fusion_result)

    return {
        "sensor": sensor_result,
        "camera": camera_result,
        "fusion": fusion_result,
        "saved_path": str(saved_path),
    }
