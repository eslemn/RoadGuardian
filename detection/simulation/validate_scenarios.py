
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

BASE = Path(__file__).resolve().parent
BATCHES = BASE / "outputs" / "scenario_batches"

# En son olusturulan 27 senaryoluk klasoru bul.
summaries = list(BATCHES.rglob("scenario_summary.csv"))

if not summaries:
    raise FileNotFoundError("scenario_summary.csv bulunamadi.")

latest = max(summaries, key=lambda p: p.stat().st_mtime)
batch_dir = latest.parent

report_dir = batch_dir / "validation"
report_dir.mkdir(exist_ok=True)

print("Analiz edilen klasor:", batch_dir)

rows = []
signals = {}

labels = ("normal", "pothole", "speed_bump")

for file in sorted(batch_dir.glob("*.csv")):

    label = next(
        (x for x in labels if file.stem.startswith(x + "_")),
        None
    )

    if label is None:
        continue

    df = pd.read_csv(file)

    time = pd.to_numeric(df["time_s"], errors="coerce")

    accel_col = (
        "vertical_accel_ms2"
        if "vertical_accel_ms2" in df.columns
        else "body_acceleration_ms2"
    )

    accel = pd.to_numeric(df[accel_col], errors="coerce")

    if "vehicle_speed_mps" in df.columns:
        speed_kmh = pd.to_numeric(
            df["vehicle_speed_mps"], errors="coerce"
        ).mean() * 3.6
    else:
        speed_kmh = pd.to_numeric(
            df["speed_kmh"], errors="coerce"
        ).mean()

    peak = float(accel.abs().max())
    rms = float(np.sqrt(np.mean(accel ** 2)))

    valid = bool(
        time.notna().all()
        and time.is_monotonic_increasing
        and time.is_unique
        and np.isfinite(accel).all()
        and np.isfinite(speed_kmh)
    )

    rows.append({
        "scenario": file.stem,
        "road_type": label,
        "speed_kmh": round(float(speed_kmh), 2),
        "peak_accel_ms2": round(peak, 4),
        "rms_accel_ms2": round(rms, 4),
        "data_valid": valid,
        "review_high_accel": peak > 30
    })

    signals[file.stem] = {
        "time": time,
        "accel": accel,
        "speed": float(speed_kmh),
        "label": label
    }

results = pd.DataFrame(rows)

if len(results) != 27:
    print(f"UYARI: 27 yerine {len(results)} senaryo bulundu.")

# 1. Tum senaryolarin kontrol tablosu
results.to_csv(
    report_dir / "validation_results.csv",
    index=False
)

# 2. Excel raporu
with pd.ExcelWriter(
    report_dir / "RoadGuardian_Validation.xlsx",
    engine="openpyxl"
) as writer:

    results.to_excel(
        writer,
        sheet_name="All Scenarios",
        index=False
    )

    comparison = results.pivot_table(
        index="speed_kmh",
        columns="road_type",
        values="peak_accel_ms2",
        aggfunc="mean"
    )

    comparison.to_excel(
        writer,
        sheet_name="Speed Comparison"
    )

# 3. Yol turlerine gore ivme karsilastirmasi
fig, ax = plt.subplots(figsize=(10, 5))

for label in labels:
    subset = results[results["road_type"] == label]

    if not subset.empty:
        grouped = subset.groupby("speed_kmh")[
            "peak_accel_ms2"
        ].mean()

        ax.plot(
            grouped.index,
            grouped.values,
            marker="o",
            label=label
        )

ax.set_title("RoadGuardian - Speed vs Peak Acceleration")
ax.set_xlabel("Vehicle Speed (km/h)")
ax.set_ylabel("Peak Absolute Acceleration (m/s2)")
ax.legend()
ax.grid(True)

fig.tight_layout()
fig.savefig(
    report_dir / "speed_comparison.png",
    dpi=160
)
plt.close(fig)

# 4. 50 km/h icin ornek sinyalleri goster
fig, axes = plt.subplots(3, 1, figsize=(11, 9))

for ax, label in zip(axes, labels):

    candidates = [
        (name, s) for name, s in signals.items()
        if s["label"] == label
    ]

    if not candidates:
        continue

    name, s = min(
        candidates,
        key=lambda item: abs(item[1]["speed"] - 50)
    )

    ax.plot(s["time"], s["accel"])
    ax.set_title(name)
    ax.set_ylabel("Vertical Accel (m/s2)")
    ax.grid(True)

axes[-1].set_xlabel("Time (s)")

fig.tight_layout()
fig.savefig(
    report_dir / "road_type_comparison.png",
    dpi=160
)
plt.close(fig)

print("\nROADGUARDIAN VALIDATION")
print("----------------------------")
print("Senaryo sayisi:", len(results))
print("Gecersiz veri:", (~results["data_valid"]).sum())
print("Yuksek ivme incelemesi:",
      results["review_high_accel"].sum())

print("\nYol tipleri:")
print(results["road_type"].value_counts())

print("\nRapor klasoru:", report_dir)
print("Validation completed.")
