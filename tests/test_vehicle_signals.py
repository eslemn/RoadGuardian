import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from detection.simulation.quarter_car_oem import simulate


def test_simulated_fields():
    rows, metrics = simulate()
    assert len(rows) == 1501
    assert rows[0]["is_simulated"] is True
    assert rows[0]["yaw_rate_rads"] is None
    assert rows[0]["wheel_speed_fl_mps"] is None
    assert all(row["vertical_accel_ms2"] is not None for row in rows)
    assert metrics["max_abs_body_accel_ms2"] > 0
