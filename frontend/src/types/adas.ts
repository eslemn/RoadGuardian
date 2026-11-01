export interface ADASDetection {
  box: [number, number, number, number]; // [x1, y1, x2, y2]
  conf: number;                          // 0.0 - 1.0
  in_zone: boolean;                      // true if in alert danger zone
  estimated_dist_m: number;              // Estimated distance in meters
}

export interface ADASTelemetry {
  status: 'CLEAR' | 'WARNING' | 'DANGER';
  status_text: string;
  danger: boolean;
  warning: boolean;
  pothole_count: number;
  detections: ADASDetection[];
  latency_ms: number;
  fps: number;
  frame_no: number;
  total_frames: number;
  timestamp: number;
  source: 'video' | 'camera';
}

export interface ADASConfig {
  conf: number;
  use_roi: boolean;
  is_paused: boolean;
  source: 'video' | 'camera';
}
