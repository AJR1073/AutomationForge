import { AutomationSpec, WizardInput, Device, Trigger, Condition, Action, Part, Platform } from './types';

const DEVICE_TYPE_MAP: Record<string, Partial<Device>> = {
  motion_sensor:      { type: 'motion_sensor', haEntityId: 'binary_sensor.motion' },
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

function inferTriggers(goal: string, deviceTypes: string[]): Trigger[] {
  const triggers: Trigger[] = [];
  const g = goal.toLowerCase();

  if (deviceTypes.includes('motion_sensor') || g.includes('motion')) {
    triggers.push({ type: 'state', device: 'Motion Sensor', event: 'on' });
  }
  if (deviceTypes.includes('door_sensor') || g.includes('door') || g.includes('open')) {
    triggers.push({ type: 'state', device: 'Door Sensor', event: 'on' });
  }
  if (deviceTypes.includes('button') || g.includes('button') || g.includes('press')) {
    triggers.push({ type: 'input', device: 'Button', event: 'single_push' });
  }
  if (g.includes('schedul') || g.includes('timer') || g.includes('time') || g.includes('morning') || g.includes('night')) {
    triggers.push({ type: 'time', at: g.includes('morning') ? '07:00' : g.includes('night') ? '22:00' : '08:00' });
  }
  if (deviceTypes.includes('temperature_sensor') || g.includes('temp') || g.includes('heat') || g.includes('cool')) {
    triggers.push({ type: 'numeric_state', device: 'Temperature Sensor', value: 25, operator: '>=' });
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

  if (deviceTypes.includes('light') || g.includes('light') || g.includes('lamp') || g.includes('illuminate')) {
    if (g.includes('off') || g.includes('turn off') || g.includes('dim')) {
      actions.push({ type: 'turn_off', target: 'Light' });
    } else {
      actions.push({ type: 'turn_on', target: 'Light' });
    }
  }
  if (deviceTypes.includes('relay') || g.includes('relay') || g.includes('switch')) {
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
  if (g.includes('garage') || g.includes('door')) {
    notes.push('Garage door automation: always include a physical safety check. Do not activate if obstruction sensors are not working.');
  }
  return notes;
}

export function buildSpecFromWizard(input: WizardInput): AutomationSpec {
  const { goal, deviceTypes, constraints, platforms } = input;

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
    intent: goal,
    assumptions: [
      'Devices are powered and connected to the same local network',
      'Home Assistant or Shelly Gen2 firmware is up to date',
      constraints.length > 0 ? `Constraints: ${constraints.join(', ')}` : 'No special constraints specified',
    ].filter(Boolean),
    devices,
    triggers: inferTriggers(goal, deviceTypes),
    conditions: inferConditions(constraints),
    actions: inferActions(goal, deviceTypes),
    safetyNotes: inferSafetyNotes(deviceTypes, goal),
    partsList,
    renderTargets: platforms as Platform[],
  };
}
