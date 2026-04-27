// AutomationForge — AutomationSpec JSON Schema + AJV Runtime Validator

import Ajv from 'ajv';
import { AutomationSpec } from '../engine/types';

/**
 * JSON Schema for AutomationSpec — used by both OpenAI structured output
 * and AJV runtime validation. Covers nested fields, enums, and required keys.
 */
export const AUTOMATION_SPEC_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    intent: { type: 'string', minLength: 1 },
    assumptions: { type: 'array', items: { type: 'string' } },
    devices: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1 },
          type: {
            type: 'string',
            enum: [
              'motion_sensor', 'presence_sensor', 'relay', 'temp_sensor', 'temperature_sensor',
              'light', 'switch', 'smart_plug', 'dimmer', 'door_sensor',
              'leak_sensor', 'smoke_detector', 'button', 'zigbee_coordinator',
              'power_monitor', 'controller', 'sensor',
            ],
          },
          location: { type: 'string' },
          shellyModel: { type: 'string' },
          haEntityId: { type: 'string' },
        },
        required: ['name', 'type'],
      },
    },
    triggers: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: {
            type: 'string',
            enum: ['time', 'state', 'numeric_state', 'mqtt', 'webhook', 'power_threshold', 'input'],
          },
          device: { type: 'string' },
          event: { type: 'string' },
          at: { type: 'string' },
          value: {},
          operator: { type: 'string', enum: ['<', '>', '<=', '>=', '==', '!='] },
        },
        required: ['type'],
      },
    },
    conditions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: {
            type: 'string',
            enum: ['time', 'state', 'numeric_state', 'template'],
          },
          device: { type: 'string' },
          value: {},
          operator: { type: 'string', enum: ['<', '>', '<=', '>=', '==', '!='] },
        },
        required: ['type'],
      },
    },
    actions: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: {
            type: 'string',
            enum: ['turn_on', 'turn_off', 'delay', 'notify', 'mqtt_publish', 'http_request', 'toggle'],
          },
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
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1 },
          capabilityTag: { type: 'string', minLength: 1 },
          quantity: { type: 'number', minimum: 1 },
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
  required: [
    'intent', 'assumptions', 'devices', 'triggers', 'conditions',
    'actions', 'safetyNotes', 'partsList', 'renderTargets',
  ],
};

// ── Compiled AJV validator ────────────────────────────────────────────────────
const ajv = new Ajv({ allErrors: true, strict: false });
const _validate = ajv.compile(AUTOMATION_SPEC_SCHEMA);

/**
 * Deep runtime validation using AJV.
 * Returns all errors — not just first — for retry feedback.
 */
export function validateSpec(spec: unknown): { ok: boolean; errors: string[] } {
  const valid = _validate(spec);
  if (valid) return { ok: true, errors: [] };

  const errors = (_validate.errors || []).map((e) => {
    const path = e.instancePath || '/';
    return `${path}: ${e.message}${e.params ? ` (${JSON.stringify(e.params)})` : ''}`;
  });

  return { ok: false, errors };
}

/**
 * Coerce a raw LLM response into a clean AutomationSpec shape,
 * filling missing optional fields with safe defaults.
 */
export function coerceSpec(raw: Record<string, unknown>, platforms: string[]): AutomationSpec {
  const asRecord = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;

  const toStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : [];

  const devices: AutomationSpec['devices'] = Array.isArray(raw.devices)
    ? raw.devices
        .map((item) => {
          const r = asRecord(item);
          if (!r) return null;
          return {
            name: String(r.name || ''),
            type: String(r.type || ''),
            ...(r.location !== undefined ? { location: String(r.location) } : {}),
            ...(r.shellyModel !== undefined ? { shellyModel: String(r.shellyModel) } : {}),
            ...(r.haEntityId !== undefined ? { haEntityId: String(r.haEntityId) } : {}),
          };
        })
        .filter((d): d is AutomationSpec['devices'][number] => Boolean(d && d.name && d.type))
    : [];

  const triggers: AutomationSpec['triggers'] = Array.isArray(raw.triggers)
    ? raw.triggers
        .map((item) => {
          const r = asRecord(item);
          if (!r) return null;
          return {
            type: String(r.type || ''),
            ...(r.device !== undefined ? { device: String(r.device) } : {}),
            ...(r.event !== undefined ? { event: String(r.event) } : {}),
            ...(r.at !== undefined ? { at: String(r.at) } : {}),
            ...(r.value !== undefined ? { value: r.value } : {}),
            ...(r.operator !== undefined ? { operator: String(r.operator) as AutomationSpec['triggers'][number]['operator'] } : {}),
          };
        })
        .filter((t): t is AutomationSpec['triggers'][number] => Boolean(t && t.type))
    : [];

  const conditions: AutomationSpec['conditions'] = Array.isArray(raw.conditions)
    ? raw.conditions
        .map((item) => {
          const r = asRecord(item);
          if (!r) return null;
          return {
            type: String(r.type || ''),
            ...(r.device !== undefined ? { device: String(r.device) } : {}),
            ...(r.value !== undefined ? { value: r.value } : {}),
            ...(r.operator !== undefined ? { operator: String(r.operator) as AutomationSpec['conditions'][number]['operator'] } : {}),
          };
        })
        .filter((c): c is AutomationSpec['conditions'][number] => Boolean(c && c.type))
    : [];

  const actions: AutomationSpec['actions'] = Array.isArray(raw.actions)
    ? raw.actions
        .map((item) => {
          const r = asRecord(item);
          if (!r) return null;
          const durationNum = typeof r.duration === 'number' ? r.duration : Number(r.duration);
          return {
            type: String(r.type || ''),
            ...(r.target !== undefined ? { target: String(r.target) } : {}),
            ...(r.value !== undefined ? { value: r.value } : {}),
            ...(Number.isFinite(durationNum) ? { duration: durationNum } : {}),
            ...(r.message !== undefined ? { message: String(r.message) } : {}),
          };
        })
        .filter((a): a is AutomationSpec['actions'][number] => Boolean(a && a.type))
    : [];

  let partsList: AutomationSpec['partsList'] = Array.isArray(raw.partsList)
    ? raw.partsList
        .map((item) => {
          const r = asRecord(item);
          if (!r) return null;
          const quantityNum = typeof r.quantity === 'number' ? r.quantity : Number(r.quantity);
          return {
            name: String(r.name || ''),
            capabilityTag: String(r.capabilityTag || ''),
            quantity: Number.isFinite(quantityNum) ? Math.max(1, quantityNum) : 1,
            required: Boolean(r.required),
            ...(r.notes !== undefined ? { notes: String(r.notes) } : {}),
          };
        })
        .filter((p): p is AutomationSpec['partsList'][number] => Boolean(p && p.name && p.capabilityTag))
    : [];

  // If LLM returned empty partsList, auto-populate from devices array
  if (partsList.length === 0 && devices.length > 0) {
    const DEVICE_TYPE_LABELS: Record<string, string> = {
      motion_sensor: 'Motion Sensor',
      presence_sensor: 'Presence Sensor',
      relay: 'Relay / Switch',
      light: 'Smart Light / Dimmer',
      switch: 'Smart Switch',
      smart_plug: 'Smart Plug',
      dimmer: 'Dimmer',
      door_sensor: 'Door / Window Sensor',
      leak_sensor: 'Water Leak Sensor',
      smoke_detector: 'Smoke Detector',
      temperature_sensor: 'Temperature Sensor',
      temp_sensor: 'Temperature Sensor',
      button: 'Push Button',
      zigbee_coordinator: 'Zigbee Coordinator',
      power_monitor: 'Power Monitor',
      controller: 'Controller (ESP32 / RPi)',
      sensor: 'Sensor',
    };
    const seenTags = new Set<string>();
    partsList = devices
      .filter((d) => {
        // Normalize temp_sensor → temperature_sensor for consistent tag matching
        const tag = d.type === 'temp_sensor' ? 'temperature_sensor' : d.type;
        if (seenTags.has(tag)) return false;
        seenTags.add(tag);
        return true;
      })
      .map((d) => {
        const tag = d.type === 'temp_sensor' ? 'temperature_sensor' : d.type;
        return {
          name: DEVICE_TYPE_LABELS[d.type] || d.name || d.type,
          capabilityTag: tag,
          quantity: 1,
          required: true,
        };
      });
  }

  const allowedRenderTargets = new Set(['shelly', 'ha', 'nodered', 'esphome']);
  const renderTargets = (Array.isArray(raw.renderTargets) ? raw.renderTargets : platforms)
    .filter((p): p is string => typeof p === 'string')
    .filter((p) => allowedRenderTargets.has(p));

  return {
    intent: String(raw.intent || 'Automation'),
    assumptions: toStringArray(raw.assumptions),
    devices,
    triggers,
    conditions,
    actions,
    safetyNotes: toStringArray(raw.safetyNotes),
    partsList,
    renderTargets: (renderTargets.length ? renderTargets : platforms) as AutomationSpec['renderTargets'],
  };
}
