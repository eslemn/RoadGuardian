"""Quarter-car simulation exporting a vehicle-style normalized sensor CSV.
Run from repository root: python detection/simulation/quarter_car_oem.py
No measured OEM data is synthesized beyond the physical model outputs.
"""
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import numpy as np
from scipy.integrate import solve_ivp

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from shared.vehicle_signals import VehicleSignal  # noqa: E402

# Baseline assumptions; these are NOT parameters from a specific real vehicle.
MS_KG = 250.0
MU_KG = 40.0
KS_N_M = 16000.0
CS_NS_M = 1200.0
KT_N_M = 190000.0
SPEED_KMH = 50.0
POTHOLE_DEPTH_M = 0.05
POTHOLE_LENGTH_M = 0.80
DURATION_S = 3.0
SAMPLING_HZ = 500


def simulate(speed_kmh=SPEED_KMH, depth_m=POTHOLE_DEPTH_M,
             length_m=POTHOLE_LENGTH_M, damping_ns_m=CS_NS_M):
    if speed_kmh <= 0 or depth_m < 0 or length_m <= 0 or damping_ns_m <= 0:
        raise ValueError("Speed, length and damping must be positive; depth >= 0")
    v_mps = speed_kmh / 3.6
    start_s = 1.0
    pass_s = length_m / v_mps
    if start_s + pass_s >= DURATION_S:
        raise ValueError("Simulation duration too short for pothole passage")

    def road(t):
        if start_s <= t <= start_s + pass_s:
            phase = (t - start_s) / pass_s
            return -depth_m * np.sin(np.pi * phase)**2
        return 0.0

    def ode(t, y):
        zs, vs, zu, vu = y
        body_acc = (-KS_N_M * (zs-zu) - damping_ns_m * (vs-vu)) / MS_KG
        wheel_acc = (KS_N_M * (zs-zu) + damping_ns_m * (vs-vu)
                     - KT_N_M * (zu-road(t))) / MU_KG
        return [vs, body_acc, vu, wheel_acc]

    t = np.linspace(0, DURATION_S, int(DURATION_S * SAMPLING_HZ) + 1)
    sol = solve_ivp(ode, (0, DURATION_S), [0., 0., 0., 0.],
                    t_eval=t, max_step=0.001, rtol=1e-8, atol=1e-10)
    if not sol.success:
        raise RuntimeError(sol.message)
    zs, vs, zu, vu = sol.y
    az_body = (-KS_N_M*(zs-zu) - damping_ns_m*(vs-vu)) / MS_KG
    az_wheel = (KS_N_M*(zs-zu) + damping_ns_m*(vs-vu)
                - KT_N_M*np.array([road(q) for q in t])) / MU_KG
    # Static sag is excluded: z values are displacements about equilibrium.
    # Relative spring travel = sprung minus unsprung position. This is modeled,
    # not a measurement from a suspension-travel sensor.
    rows = [VehicleSignal(
        time_s=round(float(q), 6), source="quarter_car_simulation", is_simulated=True,
        coordinate_frame="vehicle_vertical_dynamic_gravity_removed",
        vehicle_speed_mps=float(v_mps), vertical_accel_ms2=float(a),
        suspension_travel_m=float(zs_i-zu_i),
        suspension_velocity_mps=float(vs_i-vu_i),
        vertical_wheel_accel_ms2=float(aw), road_displacement_m=float(road(q)),
    ).to_dict() for q, a, zs_i, zu_i, vs_i, vu_i, aw in
       zip(t, az_body, zs, zu, vs, vu, az_wheel)]
    return rows, {"max_abs_body_accel_ms2": float(np.max(np.abs(az_body))),
                  "rms_body_accel_ms2": float(np.sqrt(np.mean(az_body**2)))}


def main():
    rows, metrics = simulate()
    out = Path(__file__).resolve().parent / "outputs"
    out.mkdir(parents=True, exist_ok=True)
    exp_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S_%fZ") + "_" + uuid4().hex[:6]
    run_dir = out / exp_id
    run_dir.mkdir()
    with (run_dir / "vehicle_signals.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    meta = {
        "experiment_id": exp_id,
        "data_source": "numerical_simulation",
        "real_vehicle_measurement": False,
        "model": "linear_2_dof_quarter_car",
        "model_limits": ["no lateral/longitudinal motion", "no tire lift-off model", "no sensor mounting model", "no road friction model"],
        "units": "SI; m/s, m/s^2, rad/s, m, degrees, Celsius",
        "model_parameters": {
            "sprung_mass_kg": MS_KG, "unsprung_mass_kg": MU_KG,
            "spring_stiffness_N_m": KS_N_M, "damping_Ns_m": CS_NS_M,
            "tire_stiffness_N_m": KT_N_M, "speed_kmh": SPEED_KMH,
            "pothole_depth_m": POTHOLE_DEPTH_M, "pothole_length_m": POTHOLE_LENGTH_M,
            "sample_rate_hz": SAMPLING_HZ,
        },
        "metrics": metrics,
    }
    (run_dir / "metadata.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    summary_path = out / "experiment_summary.csv"
    record = {"experiment_id": exp_id, "speed_kmh": SPEED_KMH,
              "depth_m": POTHOLE_DEPTH_M, **metrics}
    exists = summary_path.exists() and summary_path.stat().st_size > 0
    with summary_path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(record))
        if not exists:
            writer.writeheader()
        writer.writerow(record)
    print(f"Created {run_dir}")
    print(f"Max |az|: {metrics['max_abs_body_accel_ms2']:.3f} m/s^2")


if __name__ == "__main__":
    main()
