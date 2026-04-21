// AutomationForge — AutomationSpec JSON Schema + Runtime Validator

import { AutomationSpec } from '../engine/types';

/**
 * JSON Schema for OpenAI structured output.
 * Matches the canonical AutomationSpec shape used by all renderers.
 */
export const AUTOMATION_SPEC_SCHEMA = {
  type: 'object' as const,
  properties: {
    intent: { type: 'string', description: 'A clear, one-line description of what this automation does' },
    assumptions: { type: 'array', items: { type: 'string' }, description: 'Assumptions about the environment (network, firmware, etc.)' },
    devices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', description: 'Device type: motion_sensor, relay, temp_sensor, light, switch, smart_plug, dimmer, door_sensor, leak_sensor, smoke_detector, button, zigbee_coordinator' },
          location: { type: 'string' },
          shellyModel: { type: 'string' },
          haEntityId: { type: 'string' },
        },
        required: ['name', 'type'],
      },
    },
    triggers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Trigger type: time, state, numeric_state, mqtt, webhook, power_threshold' },
          device: { type: 'string' },
          event: { type: 'string' },
          at: { type: 'string' },
          value: {},
          operator: { type: 'string' },
        },
        required: ['type'],
      },
    },
    conditions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Condition type: time, state, numeric_state, template' },
          device: { type: 'string' },
          value: {},
          operator: { type: 'string' },
        },
        required: ['type'],
      },
    },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Action type: turn_on, turn_off, delay, notify, mqtt_publish, http_request' },
          target: { type: 'string' },
          value: {},
          duration: { type: 'number' },
          message: { type: 'string' },
        },
        required: ['type'],
      },
    },
    safetyNotes: { type: 'array', items: { type: 'string' } },
    partsList: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          capabilityTag: { type: 'string' },
          quantity: { type: 'number' },
          required: { type: 'boolean' },
          notes: { type: 'string' },
        },
        required: ['name', 'capabilityTag', 'quantity', 'required'],
      },
    },
    renderTargets: {
      type: 'array',
      items: { type: 'string', enum: ['shelly', 'ha', 'nodered', 'esphome'] },
    },
  },
  required: ['intent', 'assumptions', 'devices', 'triggers', 'conditions', 'actions', 'safetyNotes', 'partsList', 'renderTargets'],
};

/**
 * Runtime validation of an AutomationSpec object.
 * Checks required fields, types, and minimum structure.
 */
export function validateSpec(spec: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!spec || typeof spec !== 'object') {
    return { ok: false, errors: ['Spec is not an object'] };
  }

  const s = spec as Record<string, unknown>;

  // Required string fields
  if (typeof s.intent !== 'string' || !s.intent) errors.push('Missing or empty "intent"');

  // Required array fields
  for (const field of ['assumptions', 'devices', 'triggers', 'actions', 'safetyNotes', 'partsList', 'renderTargets']) {
    if (!Array.isArray(s[field])) errors.push(`"${field}" must be an array`);
  }

  // conditions is optional but must be array if present
  if (s.conditions !== undefined && !Array.isArray(s.conditions)) {
    errors.push('"conditions" must be an array');
  }

  // Validate triggers have type
  if (Array.isArray(s.triggers)) {
    (s.triggers as Array<Record<string, unknown>>).forEach((t, i) => {
      if (!t.type) errors.push(`Trigger ${i} missing "type"`);
    });
  }

  // Validate actions have type
  if (Array.isArray(s.actions)) {
    (s.actions as Array<Record<string, unknown>>).forEach((a, i) => {
      if (!a.type) errors.push(`Action ${i} missing "type"`);
    });
  }

  // Must have at least one trigger and one action
  if (Array.isArray(s.triggers) && s.triggers.length === 0) errors.push('Spec must have at least one trigger');
  if (Array.isArray(s.actions) && s.actions.length === 0) errors.push('Spec must have at least one action');

  return { ok: errors.length === 0, errors };
}

/**
 * Coerce a raw LLM response into a clean AutomationSpec,
 * filling missing optional fields with defaults.
 */
export function coerceSpec(raw: Record<string, unknown>, platforms: string[]): AutomationSpec {
  return {
    intent: String(raw.intent || 'Automation'),
    assumptions: Array.isArray(raw.assumptions) ? raw.assumptions.map(String) : [],
    devices: Array.isArray(raw.devices) ? raw.devices as AutomationSpec['devices'] : [],
    triggers: Array.isArray(raw.triggers) ? raw.triggers as AutomationSpec['triggers'] : [],
    conditions: Array.isArray(raw.conditions) ? raw.conditions as AutomationSpec['conditions'] : [],
    actions: Array.isArray(raw.actions) ? raw.actions as AutomationSpec['actions'] : [],
    safetyNotes: Array.isArray(raw.safetyNotes) ? raw.safetyNotes.map(String) : [],
    partsList: Array.isArray(raw.partsList) ? raw.partsList as AutomationSpec['partsList'] : [],
    renderTargets: (Array.isArray(raw.renderTargets) ? raw.renderTargets : platforms) as AutomationSpec['renderTargets'],
  };
}
