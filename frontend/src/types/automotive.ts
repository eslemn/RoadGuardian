export type NavTab = 'map' | 'cockpit' | 'adas' | 'music' | 'climate' | 'vehicle' | 'phone' | 'settings';

export type Gear = 'P' | 'R' | 'N' | 'D';
export type DriveMode = 'EKO' | 'KONFOR' | 'SPOR' | 'LUDICROUS';

export interface LocationPoint {
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type?: 'charger' | 'fuel' | 'cafe' | 'parking' | 'work' | 'home';
  details?: string;
  rating?: number;
  distanceKm?: number;
  availableStalls?: string;
}

export interface NavigationState {
  isNavigating: boolean;
  destination: LocationPoint | null;
  etaMinutes: number;
  distanceRemainingKm: number;
  nextTurnMeters: number;
  nextTurnInstruction: string;
  nextTurnAction: 'right' | 'left' | 'straight' | 'exit' | 'u-turn';
  speedLimitKmH: number;
}

export interface VehicleTelemetry {
  speed: number;
  gear: Gear;
  batteryPercent: number;
  rangeKm: number;
  powerKw: number;
  driveMode: DriveMode;
  odometerKm: number;
  tirePressuresBar: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
  doors: {
    driver: boolean;
    passenger: boolean;
    frunk: boolean;
    trunk: boolean;
    chargePort: boolean;
  };
  lights: 'auto' | 'off' | 'low' | 'high';
  sentryMode: boolean;
  locked: boolean;
  autopilotActive: boolean;
}

export interface ClimateState {
  driverTemp: number;
  passengerTemp: number;
  acOn: boolean;
  autoFan: boolean;
  fanSpeed: number; // 1-5
  recirculate: boolean;
  frontDefrost: boolean;
  rearDefrost: boolean;
  driverSeatHeater: number; // 0-3
  passengerSeatHeater: number; // 0-3
  steeringWheelHeater: boolean;
  airFlowDirection: 'windshield' | 'face' | 'feet' | 'face-feet';
}

export interface MediaTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
  coverUrl: string;
}
