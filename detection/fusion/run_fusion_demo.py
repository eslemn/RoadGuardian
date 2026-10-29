import argparse
import json
from pathlib import Path

import pandas as pd

from detection.sensor_ml.predict import RoadGuardianSensorPredictor
from detection.camera_ml.predict import RoadGuardianCameraPredictor
from detection.fusion.risk_fusion import (
    fuse_predictions,
    save_fusion_result,
)
from shared.event_schema import (
    create_event_id,
    create_prediction_event,
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_ROOT = (
    PROJECT_ROOT / "detection" / "simulation"
    / "outputs" / "sensor_ml"
)


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--scenario",
        default="pothole_30kmh_v1",
        help="Sensor simulation scenario ID",
    )

    parser.add_argument(
        "--image",
        required=True,
        help="Path to road image",
    )

    args = parser.parse_args()

    # 1. Sensor prediction
    sensor_predictor = RoadGuardianSensorPredictor()

    model_files = list(
        MODEL_ROOT.rglob(
            "all_available_signals_synthetic_model.joblib"
        )
    )

    if not model_files:
        raise FileNotFoundError("Sensor model not found")

    model_file = max(
        model_files,
        key=lambda p: p.stat().st_mtime,
    )

    features_file = model_file.parent.parent / "features.csv"

    df = pd.read_csv(features_file)

    sample_rows = df[
        df["scenario_id"] == args.scenario
    ]

    if sample_rows.empty:
        raise ValueError(
            f"Scenario not found: {args.scenario}"
        )

    sample = sample_rows.iloc[0]

    sensor_result = sensor_predictor.predict(
        sample.to_dict()
    )

    # 2. Camera prediction
    camera_predictor = RoadGuardianCameraPredictor()

    image_path = Path(args.image)

    if not image_path.is_absolute():
        image_path = PROJECT_ROOT / image_path

    camera_result = camera_predictor.predict(image_path)

    # 3. Common event
    event_id = create_event_id()

    sensor_event = create_prediction_event(
        source="sensor",
        road_type=sensor_result["road_type"],
        confidence=sensor_result["confidence"],
        event_id=event_id,
        metadata={
            "scenario_id": args.scenario,
            "data_source": "synthetic_training_demo",
        },
    )

    camera_event = create_prediction_event(
        source="camera",
        road_type=camera_result["road_type"],
        confidence=camera_result["confidence"],
        event_id=event_id,
        metadata={
            "image_path": str(image_path),
            "model": "MobileNetV2",
        },
    )

    # 4. Risk fusion
    fusion_result = fuse_predictions(
        sensor_event,
        camera_event,
    )

    # 5. Save results
    saved_path = save_fusion_result(fusion_result)

    # 6. Display results
    print("\nROADGUARDIAN INTEGRATED FUSION DEMO")
    print("=" * 45)

    print("\nSENSOR MODEL")
    print("Scenario:", args.scenario)
    print("Prediction:", sensor_result["road_type"])
    print("Score:", sensor_result["confidence"])

    print("\nCAMERA MODEL")
    print("Image:", image_path)
    print("Prediction:", camera_result["road_type"])
    print("Score:", camera_result["confidence"])

    print("\nFUSION RESULT")
    print(json.dumps(fusion_result, indent=2))

    print("\nSaved to:", saved_path)

    print(
        "\nNOTE: Sensor and camera inputs are "
        "paired for an integration demo; "
        "they are not synchronized real-world measurements."
    )


if __name__ == "__main__":
    main()