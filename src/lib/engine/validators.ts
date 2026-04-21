// AutomationForge — Output Quality Gate Validators
// Real parsing for YAML/JSON + placeholder detection

import { parse as parseYaml } from 'yaml';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  placeholders: string[];
}

/**
 * Validate YAML text (HA or ESPHome output).
 */
export function validateYaml(text: string): ValidationResult {
  const errors: string[] = [];
  const placeholders = detectPlaceholders(text);

  try {
    const doc = parseYaml(text);
    if (doc === null || doc === undefined) {
      errors.push('YAML parsed to empty document');
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`YAML parse error: ${msg}`);
  }

  return { ok: errors.length === 0, errors, placeholders };
}

/**
 * Validate JSON text (Node-RED output).
 */
export function validateJson(text: string): ValidationResult {
  const errors: string[] = [];
  const placeholders = detectPlaceholders(text);

  try {
    JSON.parse(text);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`JSON parse error: ${msg}`);
  }

  return { ok: errors.length === 0, errors, placeholders };
}

/**
 * Validate Node-RED flow structure.
 */
export function validateNodeRedFlow(text: string): ValidationResult {
  const base = validateJson(text);
  if (!base.ok) return base;

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      base.errors.push('Node-RED flow must be a JSON array');
      base.ok = false;
      return base;
    }

    parsed.forEach((node: Record<string, unknown>, i: number) => {
      if (!node.id) base.errors.push(`Node ${i} missing "id"`);
      if (!node.type) base.errors.push(`Node ${i} missing "type"`);
    });

    if (base.errors.length > 0) base.ok = false;
  } catch {
    // Already handled by validateJson
  }

  return base;
}

/**
 * Validate Shelly JS — basic structural checks.
 */
export function validateShellyJs(text: string): ValidationResult {
  const errors: string[] = [];
  const placeholders = detectPlaceholders(text);

  // Check balanced braces
  let braces = 0;
  for (const ch of text) {
    if (ch === '{') braces++;
    if (ch === '}') braces--;
  }
  if (braces !== 0) errors.push(`Unbalanced curly braces (off by ${Math.abs(braces)})`);

  // Check balanced parens
  let parens = 0;
  for (const ch of text) {
    if (ch === '(') parens++;
    if (ch === ')') parens--;
  }
  if (parens !== 0) errors.push(`Unbalanced parentheses (off by ${Math.abs(parens)})`);

  return { ok: errors.length === 0, errors, placeholders };
}

/**
 * Detect placeholder patterns in generated code.
 * These indicate values the user must fill in.
 */
export function detectPlaceholders(text: string): string[] {
  const found: string[] = [];
  const patterns: [RegExp, string][] = [
    [/YOUR_\w+/g, 'YOUR_* placeholder'],
    [/REPLACE_ME\w*/gi, 'REPLACE_ME marker'],
    [/TODO[:\s]/gi, 'TODO marker'],
    [/<[A-Z_-]+>/g, '<PLACEHOLDER> marker'],
    [/http:\/\/example\.com/gi, 'Example URL placeholder'],
    [/YOUR_ENTITY_ID/gi, 'Entity ID placeholder'],
    [/YOUR_DEVICE_ID/gi, 'Device ID placeholder'],
    [/YOUR_WEBHOOK/gi, 'Webhook URL placeholder'],
    [/your-device/gi, 'Device name placeholder'],
    [/my-device/gi, 'Device name placeholder'],
    [/xxx\.xxx/gi, 'IP address placeholder'],
  ];

  for (const [regex, label] of patterns) {
    const matches = text.match(regex);
    if (matches) {
      // Deduplicate
      const unique = [...new Set(matches)];
      unique.forEach((m) => found.push(`${label}: ${m}`));
    }
  }

  return found;
}

/**
 * Validate output for a specific platform.
 */
export function validateOutput(platform: string, text: string): ValidationResult {
  switch (platform) {
    case 'shelly':
      return validateShellyJs(text);
    case 'ha':
    case 'esphome':
      return validateYaml(text);
    case 'nodered':
      return validateNodeRedFlow(text);
    default:
      return { ok: true, errors: [], placeholders: detectPlaceholders(text) };
  }
}
