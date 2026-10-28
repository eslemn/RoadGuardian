"""RoadGuardian normalized vehicle signal contract (SI units)."""
from dataclasses import dataclass, asdict
from typing import Optional

@dataclass
class VehicleSignal:
    time_s: float
    source: str
    is_simulated: bool
    coordinate_frame: str
    vehicle_speed_mps: float
    vertical_accel_ms2: Optional[float] = None
    longitudinal_accel_ms2: Optional[float] = None
    lateral_accel_ms2: Optional[float] = None
    yaw_rate_rads: Optional[float] = None
    wheel_speed_fl_mps: Optional[float] = None
    wheel_speed_fr_mps: Optional[float] = None
    wheel_speed_rl_mps: Optional[float] = None
    wheel_speed_rr_mps: Optional[float] = None
    suspension_travel_m: Optional[float] = None
    suspension_velocity_mps: Optional[float] = None
    vertical_wheel_accel_ms2: Optional[float] = None
    road_displacement_m: Optional[float] = None
    gps_latitude_deg: Optional[float] = None
    gps_longitude_deg: Optional[float] = None
    outside_temp_c: Optional[float] = None

    def to_dict(self):
        return asdict(self)
