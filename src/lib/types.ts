export interface Entity {
  id: string;
  name: string;
  type: string;
  threat_score: number;
  confidence: number;
  convergence_score: number;
  last_observed: string;
  location?: { lat: number; lon: number };
  sources: IntSource[];
}

export interface IntSource {
  discipline: 'OSINT' | 'SIGINT' | 'IMINT' | 'HUMINT' | 'MASINT' | 'FININT' | 'GEOINT';
  detail: string;
  timestamp: string;
  confidence: number;
}

export interface Alert {
  id: string;
  type: 'convergence' | 'detection' | 'tasking' | 'platform_status';
  timestamp: string;
  entity_id?: string;
  priority: 0 | 1 | 2 | 3 | 4;
  message: string;
  source_int: string;
}

export interface Platform {
  id: string;
  name: string;
  domain: 'aerial' | 'maritime' | 'ground' | 'space' | 'cyber';
  sensors: string[];
  status: 'active' | 'tasked' | 'idle' | 'offline';
  location?: { lat: number; lon: number };
  current_mission?: string;
}

export interface SystemStats {
  collectors: number;
  signals: number;
  platforms: number;
  isr_tasks: number;
  uptime: number;
}

export interface ISRRequirement {
  id: string;
  target_entity_id: string;
  priority: number;
  required_sensors: string[];
  time_constraint: string;
  status: 'pending' | 'assigned' | 'collecting' | 'complete' | 'failed';
  assigned_platform?: string;
}

export interface DetectionEvent {
  id: string;
  timestamp: string;
  location: { lat: number; lon: number; alt?: number };
  object_class: string;
  confidence: number;
  source_platform: string;
  sensor_type: string;
  matched_entity_id?: string;
}

export interface CollectionTask {
  task_id: string;
  priority: number;
  target_location: { lat: number; lon: number };
  target_entity_id: string;
  required_sensor: string;
  time_window: { earliest: string; latest: string };
  success_criteria: string;
}

export interface PlatformObservation {
  observation_id: string;
  timestamp: string;
  source_platform: string;
  source_sensor: string;
  location: { lat: number; lon: number; alt?: number };
  observation_type: 'DETECTION' | 'TRACK' | 'SIGNAL' | 'NEGATIVE';
  entity_class: string;
  confidence: number;
  raw_data_ref: string;
  metadata: Record<string, unknown>;
}
