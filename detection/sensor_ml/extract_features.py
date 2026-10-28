"""RoadGuardian Sensor Intelligence v1: scenario-level feature extraction.

Run from project root:
    python detection/sensor_ml/extract_features.py

Reads the latest outputs/contact_batches/<batch> and saves features.csv in
outputs/sensor_ml/<batch>. Uses simulated *sensor signals* only, not the
simulator's ground-truth road displacement or contact state.
"""
from pathlib import Path
import numpy as np
import pandas as pd

SIMULATION_DIR = Path(__file__).resolve().parents[1] / "simulation"
BATCH_ROOT = SIMULATION_DIR / "outputs" / "contact_batches"
FEATURE_ROOT = SIMULATION_DIR / "outputs" / "sensor_ml"


def signal_features(values, prefix):
    x = np.asarray(values, dtype=float)
    if len(x) < 3 or not np.isfinite(x).all():
        raise ValueError(f"Invalid signal: {prefix}")
    dx = np.diff(x)
    return {
        f"{prefix}_min": float(np.min(x)),
        f"{prefix}_max": float(np.max(x)),
        f"{prefix}_peak_abs": float(np.max(np.abs(x))),
        f"{prefix}_rms": float(np.sqrt(np.mean(x ** 2))),
        f"{prefix}_std": float(np.std(x)),
        f"{prefix}_mean_abs_diff": float(np.mean(np.abs(dx))),
    }


def main():
    batches = [p for p in BATCH_ROOT.iterdir() if p.is_dir() and (p / "scenario_summary.csv").exists()] if BATCH_ROOT.exists() else []
    if not batches:
        raise FileNotFoundError(f"No contact-model scenario batch found: {BATCH_ROOT}")
    batch = max(batches, key=lambda p: p.stat().st_mtime)
    summary = pd.read_csv(batch / "scenario_summary.csv")
    required_summary = {"scenario_id", "road_type", "speed_kmh"}
    if not required_summary.issubset(summary.columns):
        raise ValueError(f"Missing summary columns: {required_summary - set(summary.columns)}")

    signal_columns = {
        "body_acc": "vertical_accel_ms2",
        "wheel_acc": "vertical_wheel_accel_ms2",
        "suspension_travel": "suspension_travel_m",
        "suspension_velocity": "suspension_velocity_mps",
    }
    results = []
    for scenario in summary.itertuples(index=False):
        path = batch / f"{scenario.scenario_id}.csv"
        df = pd.read_csv(path)
        needed = {"time_s", "vehicle_speed_mps", *signal_columns.values()}
        if not needed.issubset(df.columns):
            raise ValueError(f"{path.name}: missing {needed - set(df.columns)}")
        data = df[list(needed)].apply(pd.to_numeric, errors="coerce")
        if not np.isfinite(data.to_numpy()).all():
            raise ValueError(f"{path.name}: non-finite signal value")
        t = data["time_s"].to_numpy()
        if len(t) < 3 or not np.all(np.diff(t) > 0):
            raise ValueError(f"{path.name}: invalid time series")
        record = {
            "scenario_id": str(scenario.scenario_id),
            "road_type": str(scenario.road_type),
            "speed_kmh": float(scenario.speed_kmh),
            "speed_mps": float(np.mean(data["vehicle_speed_mps"])),
        }
        for prefix, column in signal_columns.items():
            record.update(signal_features(data[column], prefix))
        results.append(record)

    features = pd.DataFrame(results)
    if len(features) != len(summary):
        raise RuntimeError("Scenario count mismatch")
    output = FEATURE_ROOT / batch.name
    output.mkdir(parents=True, exist_ok=True)
    path = output / "features.csv"
    features.to_csv(path, index=False)
    print("\nROADGUARDIAN FEATURE EXTRACTION")
    print("--------------------------------")
    print("Contact batch:", batch.name)
    print("Scenarios:", len(features))
    print("Numeric ML features:", len(features.select_dtypes(include="number").columns) - 1)  # excluding speed_kmh metadata
    print("Road labels:", features["road_type"].value_counts().to_dict())
    print("Output:", path)
    print("NOTICE: 27 synthetic scenarios are insufficient for real-world performance claims.")


if __name__ == "__main__":
    main()
