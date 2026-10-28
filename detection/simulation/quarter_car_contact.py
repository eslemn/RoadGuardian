"""RoadGuardian | Quarter-car v2: unilateral tire contact.

Run from project root:
    python detection/simulation/quarter_car_contact.py

Keep generate_scenarios.py in the same directory. All results are synthetic.
Coordinates are dynamic displacements about static equilibrium; up is positive.
This simple model ignores road slope impact law, collision restitution and tire damping.
"""
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import numpy as np
from scipy.integrate import solve_ivp

import generate_scenarios as base

G = 9.81
M_S = base.SPRUNG_MASS_KG
M_U = base.UNSPRUNG_MASS_KG
K_S = base.SPRING_N_M
C_S = base.DAMPER_NS_M
K_T = base.TIRE_N_M
STATIC_LOAD_N = (M_S + M_U) * G


def simulate_contact(road_type, speed_kmh, amplitude_m, road_length_m):
    speed_mps = speed_kmh / 3.6
    passage = road_length_m / speed_mps

    def road(t):
        if base.START_S <= t <= base.START_S + passage:
            phase = (t - base.START_S) / passage
            sign = -1 if road_type == 'pothole' else 1
            return sign * amplitude_m * np.sin(np.pi * phase) ** 2
        return 0.0

    def acceleration(t, state):
        zs, vs, zu, vu = state
        suspension_force = K_S * (zs - zu) + C_S * (vs - vu)
        # Static tire compression is accounted for through STATIC_LOAD_N.
        normal_force = max(0.0, STATIC_LOAD_N + K_T * (road(t) - zu))
        body_acc = -suspension_force / M_S
        wheel_acc = (suspension_force + normal_force - STATIC_LOAD_N) / M_U
        return body_acc, wheel_acc

    def dynamics(t, y):
        a_body, a_wheel = acceleration(t, y)
        return [y[1], a_body, y[3], a_wheel]

    time = np.linspace(0.0, base.DURATION_S, int(base.DURATION_S * base.SAMPLE_HZ) + 1)
    solution = solve_ivp(
        dynamics, (0, base.DURATION_S), [0.0] * 4,
        t_eval=time, method='RK45', max_step=0.0005,
        rtol=1e-8, atol=1e-10,
    )
    if not solution.success:
        raise RuntimeError(solution.message)

    zs, vs, zu, vu = solution.y
    road_values = np.array([road(t) for t in time])
    suspension_force = K_S * (zs - zu) + C_S * (vs - vu)
    normal_linear = STATIC_LOAD_N + K_T * (road_values - zu)
    normal_force = np.maximum(0.0, normal_linear)
    body_acc = -suspension_force / M_S
    wheel_acc = (suspension_force + normal_force - STATIC_LOAD_N) / M_U
    contact_lost = normal_linear <= 0.0
    # Sample-based estimate (resolution: 1/SAMPLE_HZ seconds).
    contact_loss_seconds = float(np.count_nonzero(contact_lost) / base.SAMPLE_HZ)

    rows = []
    for i, t in enumerate(time):
        row = {field: '' for field in base.FIELDS}
        row.update({
            'time_s': round(float(t), 5),
            'source': 'quarter_car_unilateral_simulation',
            'is_simulated': True,
            'coordinate_frame': 'vehicle_vertical_dynamic_gravity_removed',
            'vehicle_speed_mps': float(speed_mps),
            'vertical_accel_ms2': float(body_acc[i]),
            'suspension_travel_m': float(zs[i] - zu[i]),
            'suspension_velocity_mps': float(vs[i] - vu[i]),
            'vertical_wheel_accel_ms2': float(wheel_acc[i]),
            'road_displacement_m': float(road_values[i]),
        })
        rows.append(row)

    metrics = {
        'peak_abs_body_accel_ms2': float(np.max(np.abs(body_acc))),
        'rms_body_accel_ms2': float(np.sqrt(np.mean(body_acc ** 2))),
        'peak_abs_suspension_travel_m': float(np.max(np.abs(zs - zu))),
        'min_normal_force_N': float(np.min(normal_force)),
        'max_normal_force_N': float(np.max(normal_force)),
        'contact_loss_samples': int(np.count_nonzero(contact_lost)),
        'estimated_contact_loss_s': contact_loss_seconds,
        'contact_loss_detected': bool(np.any(contact_lost)),
    }
    return rows, metrics


def main():
    output_root = Path(__file__).resolve().parent / 'outputs' / 'contact_batches'
    batch_id = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S_%fZ') + '_' + uuid4().hex[:6]
    batch_dir = output_root / batch_id
    batch_dir.mkdir(parents=True)
    summary = []
    for road_type, variants in base.SCENARIOS.items():
        for speed in base.SPEEDS_KMH:
            for idx, (amplitude, length) in enumerate(variants, start=1):
                name = f'{road_type}_{int(speed)}kmh_v{idx}'
                rows, metrics = simulate_contact(road_type, speed, amplitude, length)
                with (batch_dir / f'{name}.csv').open('w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=base.FIELDS)
                    writer.writeheader()
                    writer.writerows(rows)
                summary.append({
                    'scenario_id': name,
                    'road_type': road_type,
                    'speed_kmh': speed,
                    'road_amplitude_m': amplitude,
                    'road_length_m': length,
                    'num_samples': len(rows),
                    **metrics,
                })
    with (batch_dir / 'scenario_summary.csv').open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=summary[0].keys())
        writer.writeheader()
        writer.writerows(summary)
    metadata = {
        'model': 'unilateral_contact_quarter_car_v2',
        'model_version': '2.0-prototype',
        'assumptions': [
            'Coordinates represent dynamic displacement about static equilibrium.',
            'Positive vertical axis points upward.',
            'Normal force is nonnegative; at lift-off the wheel follows a modified ODE.',
            'No restitution model, sensor noise, nonlinear suspension or OEM calibration.',
            'Contact loss duration is estimated from discrete samples.',
            'Simulated labels are NOT real-world ground truth.',
        ],
        'parameters': {'ms_kg': M_S, 'mu_kg': M_U, 'ks_n_m': K_S,
                       'cs_ns_m': C_S, 'kt_n_m': K_T, 'g_ms2': G,
                       'static_load_N': STATIC_LOAD_N},
        'scenarios': len(summary),
    }
    (batch_dir / 'batch_metadata.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    problems = [row for row in summary if row['contact_loss_detected']]
    print('\nROADGUARDIAN QUARTER-CAR CONTACT v2')
    print('----------------------------------')
    print('Created scenarios:', len(summary))
    print('Scenarios with estimated loss of contact:', len(problems))
    print('Max estimated loss (s):', round(max(row['estimated_contact_loss_s'] for row in summary), 4))
    print('Output:', batch_dir)
    print('Note: prototype, not validated OEM physics.')


if __name__ == '__main__':
    main()
