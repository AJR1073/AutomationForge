import { AutomationSpec, WizardInput, Device, Trigger, Condition, Action, Part, Platform } from './types';

const DEVICE_TYPE_MAP: Record<string, Partial<Device>> = {
  motion_sensor:      { type: 'motion_sensor', haEntityId: 'binary_sensor.motion' },
  presence_sensor:    { type: 'sensor', haEntityId: 'person.your_phone' },
  temperature_sensor: { type: 'temperature_sensor', haEntityId: 'sensor.temperature' },
  relay:              { type: 'relay', haEntityId: 'switch.relay', shellyModel: 'Shelly 1/1PM' },
  light:              { type: 'light', haEntityId: 'light.main' },
  door_sensor:        { type: 'door_sensor', haEntityId: 'binary_sensor.door' },
  smart_plug:         { type: 'smart_plug', haEntityId: 'switch.plug', shellyModel: 'Shelly Plug S' },
  zigbee_coordinator: { type: 'zigbee_coordinator' },
  dimmer:             { type: 'dimmer', haEntityId: 'light.dimmer', shellyModel: 'Shelly Dimmer 2' },
  button:             { type: 'button', haEntityId: 'binary_sensor.button' },
  smoke_detector:     { type: 'smoke_detector', haEntityId: 'binary_sensor.smoke' },
  leak_sensor:        { type: 'leak_sensor', haEntityId: 'binary_sensor.leak' },
};

const DEVICE_PARTS: Record<string, Part> = {
  motion_sensor:      { name: 'PIR Motion Sensor', capabilityTag: 'motion_sensor', quantity: 1, required: true },
  presence_sensor:    { name: 'Phone Presence / Geofence in Home Assistant', capabilityTag: 'controller', quantity: 1, required: true, notes: 'Use the Home Assistant mobile app person/device tracker as the arrival trigger' },
  temperature_sensor: { name: 'Temperature/Humidity Sensor', capabilityTag: 'temperature_sensor', quantity: 1, required: true },
  relay:              { name: 'Shelly 1 Relay Module', capabilityTag: 'relay', quantity: 1, required: true },
  light:              { name: 'Smart Bulb / Light Strip', capabilityTag: 'light', quantity: 1, required: true },
  door_sensor:        { name: 'Magnetic Door/Window Sensor', capabilityTag: 'door_sensor', quantity: 1, required: true },
  smart_plug:         { name: 'Smart Plug (Shelly Plug S)', capabilityTag: 'smart_plug', quantity: 1, required: true },
  zigbee_coordinator: { name: 'Zigbee USB Coordinator (Sonoff Zbdongle-P)', capabilityTag: 'zigbee_coordinator', quantity: 1, required: false, notes: 'Required if using Zigbee devices' },
  dimmer:             { name: 'Shelly Dimmer 2', capabilityTag: 'dimmer', quantity: 1, required: true },
  button:             { name: 'Wireless Push Button', capabilityTag: 'button', quantity: 1, required: true },
  smoke_detector:     { name: 'Smoke Detector (with dry contact)', capabilityTag: 'smoke_detector', quantity: 1, required: true },
  leak_sensor:        { name: 'Water Leak Sensor', capabilityTag: 'leak_sensor', quantity: 1, required: true },
};

function isGarageGoal(goal: string) {
  return goal.includes('garage') || goal.includes('grauge') || goal.includes('garag');
}

function extractTemperatureThreshold(goal: string): { operator: '>' | '>=' | '<' | '<='; value: number } {
  const g = goal.toLowerCase();

  const match = g.match(/(-?\d+(?:\.\d+)?)\s*(?:°\s*[cf]|degrees?\s*[cf]?|c|f)?/);
  const parsedValue = match ? Number(match[1]) : NaN;
  const value = Number.isFinite(parsedValue) ? parsedValue : 25;

  const lessThanIntent = /\b(below|under|less than|cooler than|drop below)\b/.test(g);
  const strictlyIntent = /\b(exceeds|over|greater than|more than|above)\b/.test(g);

  if (lessThanIntent) {
    return { operator: strictlyIntent ? '<' : '<=', value };
  }
  return { operator: strictlyIntent ? '>' : '>=', value };
}

function inferTriggers(goal: string, deviceTypes: string[]): Trigger[] {
  const triggers: Trigger[] = [];
  const g = goal.toLowerCase();

  if (deviceTypes.includes('presence_sensor') || /\b(come home|arrive|arrival|near home|get home|return home|driveway)\b/.test(g)) {
    triggers.push({ type: 'state', device: 'Presence Sensor', event: 'home' });
  }
  if (deviceTypes.includes('motion_sensor') || g.includes('motion')) {
    triggers.push({ type: 'state', device: 'Motion Sensor', event: 'on' });
  }
  if ((deviceTypes.includes('door_sensor') || g.includes('door') || g.includes('open')) && !isGarageGoal(g)) {
    triggers.push({ type: 'state', device: 'Door Sensor', event: 'on' });
  }
  if (deviceTypes.includes('button') || g.includes('button') || g.includes('press')) {
    triggers.push({ type: 'input', device: 'Button', event: 'single_push' });
  }
  if (g.includes('schedul') || g.includes('timer') || g.includes('time') || g.includes('morning') || g.includes('night')) {
    triggers.push({ type: 'time', at: g.includes('morning') ? '07:00' : g.includes('night') ? '22:00' : '08:00' });
  }
  if (deviceTypes.includes('temperature_sensor') || g.includes('temp') || g.includes('heat') || g.includes('cool')) {
    const threshold = extractTemperatureThreshold(g);
    triggers.push({
      type: 'numeric_state',
      device: 'Temperature Sensor',
      value: threshold.value,
      operator: threshold.operator,
    });
  }
  if (deviceTypes.includes('leak_sensor') || g.includes('leak') || g.includes('water')) {
    triggers.push({ type: 'state', device: 'Leak Sensor', event: 'on' });
  }
  if (deviceTypes.includes('smoke_detector') || g.includes('smoke') || g.includes('fire')) {
    triggers.push({ type: 'state', device: 'Smoke Detector', event: 'on' });
  }

  if (triggers.length === 0) {
    triggers.push({ type: 'state', device: 'Sensor', event: 'on' });
  }

  return triggers;
}

function inferConditions(constraints: string[]): Condition[] {
  const conditions: Condition[] = [];
  for (const c of constraints) {
    const lc = c.toLowerCase();
    if (lc.includes('only during day') || lc.includes('daytime')) {
      conditions.push({ type: 'time', value: '08:00:00' });
    }
    if (lc.includes('only at night') || lc.includes('nighttime')) {
      conditions.push({ type: 'time', value: '20:00:00' });
    }
    if (lc.includes('temp above') || lc.includes('temperature above')) {
      const match = c.match(/(\d+)/);
      conditions.push({ type: 'numeric_state', device: 'Temperature Sensor', operator: '>=', value: match ? parseInt(match[1]) : 25 });
    }
    if (lc.includes('someone home') || lc.includes('occupied')) {
      conditions.push({ type: 'state', device: 'Presence', value: 'home' });
    }
  }
  return conditions;
}

function inferActions(goal: string, deviceTypes: string[]): Action[] {
  const actions: Action[] = [];
  const g = goal.toLowerCase();

  if (isGarageGoal(g) || g.includes('gate')) {
    actions.push({ type: g.includes('close') ? 'turn_off' : 'turn_on', target: g.includes('gate') ? 'Gate' : 'Garage Door' });
  }
  if (deviceTypes.includes('light') || g.includes('light') || g.includes('lamp') || g.includes('illuminate')) {
    if (g.includes('off') || g.includes('turn off') || g.includes('dim')) {
      actions.push({ type: 'turn_off', target: 'Light' });
    } else {
      actions.push({ type: 'turn_on', target: 'Light' });
    }
  }
  if ((deviceTypes.includes('relay') || g.includes('relay') || g.includes('switch')) && !actions.some((a) => a.target === 'Garage Door' || a.target === 'Gate')) {
    actions.push({ type: 'turn_on', target: 'Relay' });
  }
  if (deviceTypes.includes('smart_plug') || g.includes('plug') || g.includes('appliance') || g.includes('device')) {
    actions.push({ type: 'turn_on', target: 'Smart Plug' });
  }
  if (g.includes('notify') || g.includes('alert') || g.includes('notif')) {
    actions.push({ type: 'notify', message: `Alert: ${goal.slice(0, 60)}` });
  }
  if (g.includes('delay') || g.includes('wait') || g.includes('after')) {
    actions.push({ type: 'delay', duration: 5000 });
    actions.push({ type: 'turn_off', target: 'Light' });
  }

  if (actions.length === 0) {
    actions.push({ type: 'turn_on', target: 'Device' });
    actions.push({ type: 'notify', message: `Automation triggered: ${goal.slice(0, 40)}` });
  }

  return actions;
}

function inferSafetyNotes(deviceTypes: string[], goal: string): string[] {
  const notes: string[] = [];
  const g = goal.toLowerCase();

  if (deviceTypes.includes('relay') || g.includes('mains') || g.includes('wiring')) {
    notes.push('Mains voltage wiring — switch off breaker before installation. If in doubt, hire a licensed electrician.');
  }
  if (deviceTypes.includes('smoke_detector')) {
    notes.push('Test smoke detector integration monthly. Do not disable physical smoke alarms.');
  }
  if (deviceTypes.includes('leak_sensor')) {
    notes.push('Place leak sensor at the lowest point near pipes/appliances. Check battery quarterly.');
  }
  if (g.includes('pool') || g.includes('water')) {
    notes.push('Pool/water automations: use IP67 rated hardware. Keep electronics away from splash zones.');
  }
  if (isGarageGoal(g) || g.includes('door')) {
    notes.push('Garage door automation: always include a physical safety check. Do not activate if obstruction sensors are not working.');
  }
  if (/\b(come home|arrive|arrival|near home|get home|return home)\b/.test(g)) {
    notes.push('Presence automations can false-trigger. Add safeguards such as only opening when the door is closed and someone is expected.');
  }
  return notes;
}

export function buildSpecFromWizard(input: WizardInput): AutomationSpec {
  const { goal, deviceTypes, constraints, platforms } = input;
  const normalizedGoal = goal.replace(/\bgrauge\b/gi, 'garage');

  const devices: Device[] = deviceTypes.map((dt, i) => ({
    name: dt.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    ...DEVICE_TYPE_MAP[dt],
    type: DEVICE_TYPE_MAP[dt]?.type || dt,
    location: i === 0 ? 'Main Area' : undefined,
  }));

  const partsList: Part[] = deviceTypes
    .map((dt) => DEVICE_PARTS[dt])
    .filter(Boolean);

  partsList.push({
    name: 'ESP32 or Shelly System',
    capabilityTag: 'controller',
    quantity: 1,
    required: true,
    notes: 'The automation brain — Shelly Gen2 for standalone, or ESP32 for ESPHome',
  });

  return {
    intent: normalizedGoal,
    assumptions: [
      'Devices are powered and connected to the same local network',
      'Home Assistant or Shelly Gen2 firmware is up to date',
      constraints.length > 0 ? `Constraints: ${constraints.join(', ')}` : 'No special constraints specified',
    ].filter(Boolean),
    devices,
    triggers: inferTriggers(normalizedGoal, deviceTypes),
    conditions: inferConditions(constraints),
    actions: inferActions(normalizedGoal, deviceTypes),
    safetyNotes: inferSafetyNotes(deviceTypes, normalizedGoal),
    partsList,
    renderTargets: platforms as Platform[],
  };
}
