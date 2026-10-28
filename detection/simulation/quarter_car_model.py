
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.integrate import solve_ivp
from pathlib import Path

# Aracın örnek fiziksel parametreleri
ms = 250.0       # Govde kutlesi (kg)
mu = 40.0        # Tekerlek kutlesi (kg)
ks = 16000.0     # Suspansiyon yay sertligi (N/m)
cs = 1200.0      # Amortisor sonum katsayisi (Ns/m)
kt = 190000.0    # Lastik sertligi (N/m)

# Yol senaryosu
speed_kmh = 50.0
pothole_depth = 0.05   # 5 cm
pothole_length = 0.80  # 80 cm

speed_ms = speed_kmh / 3.6

def road_profile(t):
    # Arac 1. saniyede cukura giriyor
    start_time = 1.0
    duration = pothole_length / speed_ms

    if start_time <= t <= start_time + duration:
        phase = (t - start_time) / duration
        return -pothole_depth * np.sin(np.pi * phase) ** 2

    return 0.0

def quarter_car(t, y):
    zs, vs, zu, vu = y

    road = road_profile(t)

    # Govde ivmesi
    acc_body = (
        -ks * (zs - zu)
        -cs * (vs - vu)
    ) / ms

    # Tekerlek ivmesi
    acc_wheel = (
        ks * (zs - zu)
        + cs * (vs - vu)
        - kt * (zu - road)
    ) / mu

    return [vs, acc_body, vu, acc_wheel]

time = np.linspace(0, 3, 1501)

solution = solve_ivp(
    quarter_car,
    (0, 3),
    [0, 0, 0, 0],
    t_eval=time,
    max_step=0.001,
    rtol=1e-7,
    atol=1e-9
)

if not solution.success:
    raise RuntimeError(solution.message)

zs, vs, zu, vu = solution.y

# Govde ivmesini hesapla
acceleration = (
    -ks * (zs - zu)
    -cs * (vs - vu)
) / ms

road_values = np.array([road_profile(t) for t in time])

# Sonuclari kaydet
results = pd.DataFrame({
    "time_s": time,
    "road_displacement_m": road_values,
    "body_displacement_m": zs,
    "body_acceleration_ms2": acceleration,
    "speed_kmh": speed_kmh
})

output_dir = Path("detection/simulation/outputs")
output_dir.mkdir(parents=True, exist_ok=True)

results.to_csv(output_dir / "simulation_data.csv", index=False)

# Grafik
plt.figure(figsize=(10, 6))

plt.subplot(2, 1, 1)
plt.plot(time, road_values * 100, label="Yol profili")
plt.ylabel("Yol yuksekligi (cm)")
plt.legend()
plt.grid(True)

plt.subplot(2, 1, 2)
plt.plot(time, acceleration, label="Govde ivmesi")
plt.xlabel("Zaman (s)")
plt.ylabel("Ivme (m/s2)")
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.savefig(output_dir / "simulation_result.png", dpi=150)
plt.show()

print("Simulasyon tamamlandi.")
print(f"Maksimum mutlak ivme: {np.max(np.abs(acceleration)):.3f} m/s2")
print("CSV ve grafik outputs klasorune kaydedildi.")
