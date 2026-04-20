// AutomationForge — AutomationSpec canonical type definitions

export type Platform = 'shelly' | 'ha' | 'nodered' | 'esphome';

export interface Device {
  name: string;
  type: string; // motion_sensor | relay | temp_sensor | light | switch | ...
  location?: string;
  shellyModel?: string;
  haEntityId?: string;
}

export interface Trigger {
  type: string; // time | state | numeric_state | mqtt | webhook
  device?: string;
  event?: string;
  at?: string;
  value?: string | number;
  operator?: string;
}

export interface Condition {
  type: string; // time | state | numeric_state | template
  device?: string;
  value?: string | number;
  operator?: string;
}

export interface Action {
  type: string; // turn_on | turn_off | delay | notify | mqtt_publish | http_request
  target?: string;
  value?: string | number;
  duration?: number;
  message?: string;
}

export interface Part {
  name: string;
  capabilityTag: string;
  quantity: number;
  required: boolean;
  notes?: string;
}

export interface AutomationSpec {
  id?: string;
  intent: string;
  assumptions: string[];
  devices: Device[];
  triggers: Trigger[];
  conditions: Condition[];
  actions: Action[];
  safetyNotes: string[];
  partsList: Part[];
  renderTargets: Platform[];
}

export interface WizardInput {
  goal: string;
  deviceTypes: string[];
  constraints: string[];
  platforms: Platform[];
}

export interface RenderedOutputs {
  shelly: string;
  ha: string;
  nodered: string;
  esphome: string;
  explanation: string;
}

export interface FixResult {
  platform: Platform | 'unknown';
  original: string;
  fixed: string;
  changes: string[];
  errors: string[];
  valid: boolean;
}
