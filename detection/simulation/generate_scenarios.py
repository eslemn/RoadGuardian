
"""RoadGuardian - Synthetic Quarter-Car Scenario Generator.

Generates 27 labeled synthetic driving scenarios.

Run:
    python detection/simulation/generate_scenarios.py

IMPORTANT:
Simulation labels are NOT real-world ground-truth observations.
"""

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import numpy as np
from scipy.integrate import solve_ivp


# ==========================================
# 1. VEHICLE PARAMETERS
# ==========================================

# Illustrative parameters, not calibrated to an OEM vehicle.

SPRUNG_MASS_KG = 250.0
UNSPRUNG_MASS_KG = 40.0

SPRING_N_M = 16000.0
DAMPER_NS_M = 1200.0
TIRE_N_M = 190000.0

SAMPLE_HZ = 200
DURATION_S = 3.0
START_S = 1.0


# ==========================================
# 2. ROAD SCENARIOS
# ==========================================

# 3 road types x 3 speeds x 3 variants = 27 scenarios

SCENARIOS = {
    "normal": [
        (0.001, 1.2),
        (0.002, 1.2),
        (0.003, 1.2),
    ],
    "pothole": [
        (0.03, 0.8),
        (0.05, 0.8),
        (0.08, 1.2),
    ],
    "speed_bump": [
        (0.03, 1.2),
        (0.05, 1.5),
        (0.07, 2.0),
    ],
}

SPEEDS_KMH = (30.0, 50.0, 70.0)


# ==========================================
# 3. OEM-COMPATIBLE DATA FIELDS
# ==========================================

FIELDS = (
    "time_s",
    "source",
    "is_simulated",
    "coordinate_frame",
    "vehicle_speed_mps",
    "vertical_accel_ms2",
    "longitudinal_accel_ms2",
    "lateral_accel_ms2",
    "yaw_rate_rads",
    "wheel_speed_fl_mps",
    "wheel_speed_fr_mps",
    "wheel_speed_rl_mps",
    "wheel_speed_rr_mps",
    "suspension_travel_m",
    "suspension_velocity_mps",
    "vertical_wheel_accel_ms2",
    "road_displacement_m",
    "gps_latitude",
    "gps_longitude",
    "outside_temp_c",
)


# ==========================================
# 4. NUMERICAL SIMULATION
# ==========================================

def simulate(
    road_type,
    speed_kmh,
    amplitude_m,
    road_length_m,
):

    if (
        road_type not in SCENARIOS
        or speed_kmh <= 0
        or road_length_m <= 0
        or amplitude_m < 0
    ):
        raise ValueError("Invalid road scenario")

    speed_mps = speed_kmh / 3.6

    passage = road_length_m / speed_mps

    # --------------------------------------
    # Road profile
    # --------------------------------------

    def road(t):

        if START_S <= t <= START_S + passage:

            phase = (t - START_S) / passage

            sign = (
                -1
                if road_type == "pothole"
                else 1
            )

            return (
                sign
                * amplitude_m
                * np.sin(np.pi * phase) ** 2
            )

        return 0.0

    # --------------------------------------
    # Quarter-Car dynamics
    # --------------------------------------

    def acceleration(t, state):

        zs, vs, zu, vu = state

        road_height = road(t)

        # Sprung mass acceleration
        a_body = (
            -SPRING_N_M * (zs - zu)
            -DAMPER_NS_M * (vs - vu)
        ) / SPRUNG_MASS_KG

        # Unsprung mass acceleration
        a_wheel = (
            SPRING_N_M * (zs - zu)
            +DAMPER_NS_M * (vs - vu)
            -TIRE_N_M * (zu - road_height)
        ) / UNSPRUNG_MASS_KG

        return a_body, a_wheel

    def dynamics(t, state):

        a_body, a_wheel = acceleration(
            t,
            state,
        )

        return [
            state[1],
            a_body,
            state[3],
            a_wheel,
        ]

    # --------------------------------------
    # Numerical integration
    # --------------------------------------

    time = np.linspace(
        0,
        DURATION_S,
        int(DURATION_S * SAMPLE_HZ) + 1,
    )

    result = solve_ivp(
        dynamics,
        (0.0, DURATION_S),
        [0.0, 0.0, 0.0, 0.0],
        t_eval=time,
        max_step=0.001,
        rtol=1e-7,
        atol=1e-9,
    )

    if not result.success:
        raise RuntimeError(result.message)

    zs, vs, zu, vu = result.y

    # --------------------------------------
    # Recalculate sensor signals
    # --------------------------------------

    road_values = np.array([
        road(t) for t in time
    ])

    body_acc = (
        -SPRING_N_M * (zs - zu)
        -DAMPER_NS_M * (vs - vu)
    ) / SPRUNG_MASS_KG

    # FIXED: wheel displacement zu is included.
    wheel_acc = (
        SPRING_N_M * (zs - zu)
        +DAMPER_NS_M * (vs - vu)
        -TIRE_N_M * (zu - road_values)
    ) / UNSPRUNG_MASS_KG

    suspension_travel = zs - zu
    suspension_velocity = vs - vu

    # --------------------------------------
    # Numerical consistency check
    # --------------------------------------

    expected_wheel_acc = np.array([
        acceleration(t, result.y[:, i])[1]
        for i, t in enumerate(time)
    ])

    if not np.allclose(
        wheel_acc,
        expected_wheel_acc,
        atol=1e-8,
        rtol=1e-8,
    ):
        raise RuntimeError(
            "Wheel acceleration consistency check failed."
        )

    # --------------------------------------
    # Create output records
    # --------------------------------------

    rows = []

    for i, t in enumerate(time):

        row = {
            field: ""
            for field in FIELDS
        }

        row.update({
            "time_s": round(float(t), 5),

            "source": "quarter_car_simulation",

            "is_simulated": True,

            "coordinate_frame":
                "vehicle_vertical_dynamic_gravity_removed",

            "vehicle_speed_mps": float(speed_mps),

            "vertical_accel_ms2":
                float(body_acc[i]),

            "suspension_travel_m":
                float(suspension_travel[i]),

            "suspension_velocity_mps":
                float(suspension_velocity[i]),

            "vertical_wheel_accel_ms2":
                float(wheel_acc[i]),

            "road_displacement_m":
                float(road_values[i]),
        })

        rows.append(row)

    # --------------------------------------
    # Scenario metrics
    # --------------------------------------

    metrics = {
        "peak_abs_body_accel_ms2":
            float(np.max(np.abs(body_acc))),

        "rms_body_accel_ms2":
            float(np.sqrt(np.mean(body_acc ** 2))),

        "peak_abs_wheel_accel_ms2":
            float(np.max(np.abs(wheel_acc))),

        "peak_abs_suspension_travel_m":
            float(np.max(np.abs(suspension_travel))),
    }

    return rows, metrics


# ==========================================
# 5. BATCH DATA GENERATION
# ==========================================

def main():

    output_root = (
        Path(__file__).resolve().parent
        / "outputs"
        / "scenario_batches"
    )

    batch_id = (
        datetime.now(timezone.utc)
        .strftime("%Y%m%dT%H%M%S_%fZ")
        + "_"
        + uuid4().hex[:6]
    )

    batch_path = output_root / batch_id

    batch_path.mkdir(
        parents=True,
        exist_ok=False,
    )

    summary = []

    for road_type, variants in SCENARIOS.items():

        for speed in SPEEDS_KMH:

            for idx, (
                amplitude,
                length,
            ) in enumerate(variants, start=1):

                scenario_id = (
                    f"{road_type}_"
                    f"{int(speed)}kmh_v{idx}"
                )

                rows, metrics = simulate(
                    road_type,
                    speed,
                    amplitude,
                    length,
                )

                csv_path = (
                    batch_path / f"{scenario_id}.csv"
                )

                with csv_path.open(
                    "w",
                    newline="",
                    encoding="utf-8",
                ) as f:

                    writer = csv.DictWriter(
                        f,
                        fieldnames=FIELDS,
                    )

                    writer.writeheader()
                    writer.writerows(rows)

                summary.append({
                    "scenario_id": scenario_id,
                    "road_type": road_type,
                    "speed_kmh": speed,
                    "road_amplitude_m": amplitude,
                    "road_length_m": length,
                    "sample_hz": SAMPLE_HZ,
                    "num_samples": len(rows),
                    **metrics,
                })

    # --------------------------------------
    # Summary CSV
    # --------------------------------------

    summary_path = (
        batch_path / "scenario_summary.csv"
    )

    with summary_path.open(
        "w",
        newline="",
        encoding="utf-8",
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=summary[0].keys(),
        )

        writer.writeheader()
        writer.writerows(summary)

    # --------------------------------------
    # Metadata
    # --------------------------------------

    metadata = {
        "batch_id": batch_id,

        "data_source": "numerical_simulation",

        "is_simulated": True,

        "model": "linear_2_dof_quarter_car",

        "model_version": "1.1-wheel-acc-fix",

        "parameters": {
            "sprung_mass_kg": SPRUNG_MASS_KG,
            "unsprung_mass_kg": UNSPRUNG_MASS_KG,
            "suspension_stiffness_n_m": SPRING_N_M,
            "damper_coefficient_ns_m": DAMPER_NS_M,
            "tire_stiffness_n_m": TIRE_N_M,
        },

        "simulation_settings": {
            "sample_hz": SAMPLE_HZ,
            "duration_s": DURATION_S,
            "event_start_s": START_S,
        },

        "limitations": [
            "Not calibrated to an OEM vehicle",
            "Normal road is a smooth low-amplitude ripple",
            "No tire lift-off or nonlinear tire contact",
            "No nonlinear damping",
            "No sensor noise or mounting effects",
            "No validation on actual road measurements",
            "Labels are simulation labels, not field ground truth",
        ],

        "scenarios": len(summary),
    }

    metadata_path = (
        batch_path / "batch_metadata.json"
    )

    metadata_path.write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8",
    )

    print("\nROADGUARDIAN SCENARIO GENERATOR")
    print("--------------------------------")
    print(f"Model version: {metadata['model_version']}")
    print(f"Created scenarios: {len(summary)}")
    print(f"Output folder: {batch_path}")
    print("Generation completed successfully.")


if __name__ == "__main__":
    main()
