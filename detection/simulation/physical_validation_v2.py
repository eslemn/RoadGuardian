"""RoadGuardian: model-consistency and preliminary physical-limit checks.
Run from anywhere: python detection/simulation/physical_validation_v2.py
Requires: numpy, pandas, matplotlib, openpyxl
"""
from pathlib import Path
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent
BATCHES = ROOT / 'outputs' / 'scenario_batches'
summaries = list(BATCHES.rglob('scenario_summary.csv'))
if not summaries:
    raise FileNotFoundError(f'No scenario_summary.csv under {BATCHES}')
batch = max(summaries, key=lambda p: p.stat().st_mtime).parent
out = batch / 'validation_v2'
out.mkdir(exist_ok=True)

# Defaults used in our initial illustrative Quarter-Car simulation.
# Replace these from batch metadata or the actual generator if different.
params = dict(ms=250.0, mu=40.0, ks=16000.0, cs=1200.0, g=9.81)
print('Check parameters against generate_scenarios.py:', params)
# Sign convention assumptions: suspension_travel = zs - zu;
# suspension_velocity = vs - vu; positive z is upward;
# wheel_accel = d2zu/dt2, body_accel = d2zs/dt2, both gravity removed.
# Then Fspring_on_wheel = ks*travel + cs*rel_velocity
# Froad_dynamic_up = mu*wheel_accel - Fspring_on_wheel
# N_linear = (ms+mu)*g + Froad_dynamic_up
# Negative N_linear means linear model requires an impossible tensile tire force.
limit_m = .08  # illustrative ONLY; not an OEM stop limit
body_tol_ms2 = .1
records = []
required = ['time_s','vertical_accel_ms2','suspension_travel_m',
            'suspension_velocity_mps','vertical_wheel_accel_ms2','road_displacement_m']
files = sorted(p for p in batch.glob('*.csv') if p.name != 'scenario_summary.csv')
if not files:
    raise RuntimeError('No individual scenarios found')
for path in files:
    label = next((s for s in ('normal','pothole','speed_bump') if path.stem.startswith(s+'_')), None)
    if label is None:
        continue
    df = pd.read_csv(path)
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f'{path.name}: missing {missing}')
    d = df[required].apply(pd.to_numeric, errors='coerce')
    a = d.to_numpy(dtype=float)
    t = d['time_s'].to_numpy()
    if not np.isfinite(a).all() or len(t) < 3 or not np.all(np.diff(t)>0):
        records.append({'scenario':path.stem,'road_type':label,'data_ok':False,'reason':'Invalid numeric/time data'})
        continue
    tr = d['suspension_travel_m'].to_numpy()
    vel = d['suspension_velocity_mps'].to_numpy()
    aw = d['vertical_wheel_accel_ms2'].to_numpy()
    ab = d['vertical_accel_ms2'].to_numpy()
    road = d['road_displacement_m'].to_numpy()
    spring_force = params['ks']*tr + params['cs']*vel
    implied_body_acc = -spring_force/params['ms']
    body_error = float(np.max(np.abs(implied_body_acc-ab)))
    # Recovered road normal force from quarter-car wheel force balance
    n_linear = (params['ms']+params['mu'])*params['g'] + params['mu']*aw - spring_force
    min_n = float(n_linear.min())
    max_travel = float(np.max(np.abs(tr)))
    # Response envelope early after the event vs later: diagnostic only.
    active = np.flatnonzero(np.abs(road)>1e-7)
    if len(active):
        event_end = float(t[active[-1]])
        early = ab[(t >= event_end) & (t < event_end + 0.35)]
        late = ab[(t >= max(event_end + 0.7, t[-1] - 0.45)) & (t <= t[-1])]
        early_rms = float(np.sqrt(np.mean(early**2))) if len(early) else np.nan
        late_rms = float(np.sqrt(np.mean(late**2))) if len(late) else np.nan
        damping_check = 'decreasing' if np.isfinite(early_rms) and np.isfinite(late_rms) and late_rms < early_rms else 'review'
    else:
        event_end, early_rms, late_rms, damping_check = np.nan, np.nan, np.nan, 'not_applicable'
    records.append({
        'scenario': path.stem, 'road_type':label,'data_ok':True,
        'peak_abs_body_accel_ms2':float(np.max(np.abs(ab))),
        'body_equation_max_error_ms2':body_error,
        'body_equation_ok':body_error < body_tol_ms2,
        'min_estimated_normal_force_N':min_n,
        'linear_contact_warning':min_n<=0,
        'peak_abs_suspension_travel_cm':max_travel*100,
        'illustrative_travel_warning':max_travel>limit_m,
        'early_response_rms_ms2':early_rms,
        'late_response_rms_ms2':late_rms,
        'damping_diagnostic':damping_check,
    })
    if path.stem in ('normal_50kmh_v1','pothole_50kmh_v1','speed_bump_50kmh_v1'):
        fig, axes = plt.subplots(3,1,figsize=(9,8),sharex=True)
        axes[0].plot(t,road*100)
        axes[0].set_ylabel('Road (cm)')
        axes[1].plot(t,n_linear)
        axes[1].axhline(0,color='black',ls='--',lw=1)
        axes[1].set_ylabel('Estimated normal force (N)')
        axes[2].plot(t,tr*100)
        axes[2].axhline(limit_m*100,ls='--',color='gray',lw=1)
        axes[2].axhline(-limit_m*100,ls='--',color='gray',lw=1)
        axes[2].set_ylabel('Travel (cm)')
        axes[2].set_xlabel('Time (s)')
        for ax in axes: ax.grid(True)
        fig.suptitle(path.stem+' | Preliminary physical limits')
        fig.tight_layout()
        fig.savefig(out / f'{path.stem}_limits.png',dpi=150)
        plt.close(fig)

res = pd.DataFrame(records)
res.to_csv(out/'physical_checks.csv',index=False)
with pd.ExcelWriter(out/'RoadGuardian_Physical_Validation_v2.xlsx', engine='openpyxl') as writer:
    res.to_excel(writer,sheet_name='Physical Checks',index=False)
    pd.DataFrame([params | {'travel_control_limit_m':limit_m,'note':'Illustrative model parameters; verify with generator/OEM'}]).to_excel(writer,sheet_name='Assumptions',index=False)
print('\nBatch:',batch)
print('Scenarios:',len(res))
print('Data errors:',int((~res['data_ok']).sum()))
for name in ('body_equation_ok','linear_contact_warning','illustrative_travel_warning'):
    if name in res:
        print(f'{name}:',res[name].value_counts(dropna=False).to_dict())
print('Damping:',res['damping_diagnostic'].value_counts(dropna=False).to_dict())
print('Outputs:',out)
print('NOTICE: preliminary checks are not real-world vehicle validation.')
