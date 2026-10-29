"""
demo/services/simulation_service.py
=====================================
Simulation file path resolution, CSV loading,
feature extraction file access, and physical metric calculations.

This module is the single source of truth for all simulation data paths.
No path construction or metric calculation logic lives elsewhere in the demo.
"""

from pathlib import Path

import pandas as pd
import streamlit as st


# ------------------------------------------------------------------ #
# Constants                                                           #
# ------------------------------------------------------------------ #

BATCH_ID = "20261025T191347_968589Z_adad93"

# Resolved relative to the project root (two levels above this file).
_PROJECT_ROOT = Path(__file__).resolve().parents[2]

CONTACT_BATCH_DIR: Path = (
    _PROJECT_ROOT
    / "detection"
    / "simulation"
    / "outputs"
    / "contact_batches"
    / BATCH_ID
)

FEATURES_CSV: Path = (
    _PROJECT_ROOT
    / "detection"
    / "simulation"
    / "outputs"
    / "sensor_ml"
    / BATCH_ID
    / "features.csv"
)

CAMERA_IMAGE: Path = (
    _PROJECT_ROOT
    / "detection"
    / "camera_ml"
    / "test_images"
    / "pothole.webp"
)


# ------------------------------------------------------------------ #
# Path helpers                                                        #
# ------------------------------------------------------------------ #

def get_sensor_csv(scenario_id: str) -> Path:
    """Return the absolute path to the time-series CSV for a scenario."""
    return CONTACT_BATCH_DIR / f"{scenario_id}.csv"


def build_scenario_id(road_type: str, speed: int, variant: int) -> str:
    """
    Construct the canonical scenario identifier string.

    Example
    -------
    build_scenario_id("pothole", 30, 1) -> "pothole_30kmh_v1"
    """
    return f"{road_type}_{speed}kmh_v{variant}"


def get_required_files(scenario_id: str) -> list:
    """Return the list of Path objects that must exist for a scenario."""
    return [
        get_sensor_csv(scenario_id),
        FEATURES_CSV,
        CAMERA_IMAGE,
    ]


# ------------------------------------------------------------------ #
# Data loading (cached)                                               #
# ------------------------------------------------------------------ #

@st.cache_data
def load_sensor_signals(file_path: str) -> pd.DataFrame:
    """Load a simulation time-series CSV. Result is cached by Streamlit."""
    return pd.read_csv(file_path)


@st.cache_data
def load_features(file_path: str) -> pd.DataFrame:
    """Load the extracted features CSV. Result is cached by Streamlit."""
    return pd.read_csv(file_path)


def get_feature_row(scenario_id: str) -> dict:
    """
    Return the feature dict for ``scenario_id`` from the features CSV.

    Raises
    ------
    ValueError  if the scenario is not found in features.csv.
    """
    features = load_features(str(FEATURES_CSV))
    rows = features[features["scenario_id"] == scenario_id]

    if rows.empty:
        raise ValueError(
            f"Scenario '{scenario_id}' was not found in features.csv."
        )

    return rows.iloc[0].to_dict()


# ------------------------------------------------------------------ #
# Physical metric calculations                                        #
# ------------------------------------------------------------------ #

def calculate_physical_metrics(signals: pd.DataFrame) -> dict:
    """
    Derive the four physical response metrics from a signals DataFrame.

    Parameters
    ----------
    signals : DataFrame with columns
        vertical_accel_ms2, vertical_wheel_accel_ms2, suspension_travel_m

    Returns
    -------
    dict with keys:
        peak_body_acc, peak_wheel_acc,
        max_suspension_travel_cm, rms_body_acc
    """
    peak_body_acc = signals["vertical_accel_ms2"].abs().max()
    peak_wheel_acc = signals["vertical_wheel_accel_ms2"].abs().max()
    max_suspension_travel_cm = signals["suspension_travel_m"].abs().max() * 100
    rms_body_acc = (signals["vertical_accel_ms2"] ** 2).mean() ** 0.5

    return {
        "peak_body_acc": peak_body_acc,
        "peak_wheel_acc": peak_wheel_acc,
        "max_suspension_travel_cm": max_suspension_travel_cm,
        "rms_body_acc": rms_body_acc,
    }
