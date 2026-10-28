
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

BASE = Path(__file__).resolve().parent
BATCHES = BASE / "outputs" / "scenario_batches"

summaries = list(BATCHES.rglob("scenario_summary.csv"))
if not summaries:
    raise FileNotFoundError("Senaryo ozeti bulunamadi.")

batch = max(summaries, key=lambda p: p.stat().st_mtime).parent
out = batch / "validation"
out.mkdir(exist_ok=True)

road_types = ["normal", "pothole", "speed_bump"]

fig, axes = plt.subplots(3, 3, figsize=(15, 11))

for row, road_type in enumerate(road_types):
    file = batch / f"{road_type}_50kmh_v1.csv"
    if not file.exists():
        raise FileNotFoundError(file)

    df = pd.read_csv(file)

    required = [
        "time_s",
        "road_displacement_m",
        "vertical_accel_ms2",
        "suspension_travel_m"
    ]

    if not set(required).issubset(df.columns):
        raise ValueError(f"Eksik sutun: {file.name}")

    data = df[required].apply(pd.to_numeric, errors="coerce")

    if not np.isfinite(data.to_numpy()).all():
        raise ValueError(f"Gecersiz sayisal deger: {file.name}")

    t = data["time_s"]
    road = data["road_displacement_m"] * 100
    accel = data["vertical_accel_ms2"]
    suspension = data["suspension_travel_m"] * 100

    axes[row, 0].plot(t, road)
    axes[row, 1].plot(t, accel)
    axes[row, 2].plot(t, suspension)

    axes[row, 0].set_ylabel(
        f"{road_type}\nRoad (cm)"
    )
    axes[row, 1].set_ylabel("Acceleration (m/s2)")
    axes[row, 2].set_ylabel("Suspension (cm)")

    print(f"\n{road_type.upper()}")
    print(f"Road min/max (cm): {road.min():.3f} / {road.max():.3f}")
    print(f"Peak acceleration: {accel.abs().max():.3f} m/s2")
    print(f"Peak suspension travel: {suspension.abs().max():.3f} cm")

for col, title in enumerate([
    "Road Profile",
    "Body Acceleration",
    "Suspension Travel"
]):
    axes[0, col].set_title(title)

for ax in axes.flat:
    ax.set_xlabel("Time (s)")
    ax.grid(True)

for col in range(3):
    ylim = max(
        max(abs(axes[row, col].get_ylim()[0]),
            abs(axes[row, col].get_ylim()[1]))
        for row in range(3)
    )
    for row in range(3):
        axes[row, col].set_ylim(-ylim, ylim)

fig.suptitle("RoadGuardian - Physical Simulation Validation")
fig.tight_layout()

path = out / "physical_validation.png"
fig.savefig(path, dpi=160)
plt.show()

print(f"\nGrafik kaydedildi: {path}")
