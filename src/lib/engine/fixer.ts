import { FixResult, Platform } from './types';

const YAML_KEYS_HA = ['automation:', 'trigger:', 'condition:', 'action:', 'alias:', 'description:', 'platform:'];
const YAML_KEYS_ESPHOME = ['esphome:', 'esp32:', 'esp8266:', 'sensor:', 'binary_sensor:', 'switch:', 'api:', 'ota:', 'wifi:'];

/**
 * Detect the platform of a pasted code/config string
 */
function detectPlatform(code: string): Platform | 'unknown' {
  const trimmed = code.trim();

  // Try JSON first → Node-RED
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed) && parsed.some((n) => n.type && n.id && n.wires)) {
      return 'nodered';
    }
  } catch {
    // not JSON
  }

  // YAML heuristics
  if (YAML_KEYS_ESPHOME.some((k) => trimmed.includes(k))) return 'esphome';
  if (YAML_KEYS_HA.some((k) => trimmed.includes(k))) return 'ha';

  // Shelly JS heuristics
  if (
    trimmed.includes('Shelly.') ||
    trimmed.includes('Shelly.call') ||
    trimmed.includes('Shelly.addEventHandler') ||
    trimmed.includes('"use strict"') ||
    trimmed.includes('Timer.set(')
  ) {
    return 'shelly';
  }

  // Fallback: if it has JS-like syntax
  if (trimmed.includes('function ') || trimmed.includes('var ') || trimmed.includes('const ')) {
    return 'shelly';
  }

  return 'unknown';
}

/**
 * Validate and collect errors in HA YAML (simple heuristic checks)
 */
function validateHA(code: string): string[] {
  const errors: string[] = [];
  if (!code.includes('automation:') && !code.includes('trigger:')) {
    errors.push('Missing required "automation:" or "trigger:" block');
  }
  if (code.includes('\t')) {
    errors.push('YAML uses tabs for indentation — replace with spaces');
  }
  // Check balanced quotes
  const singleQuotes = (code.match(/'/g) || []).length;
  if (singleQuotes % 2 !== 0) errors.push('Unbalanced single quotes detected');

  return errors;
}

/**
 * Validate and collect errors in ESPHome YAML
 */
function validateESPHome(code: string): string[] {
  const errors: string[] = [];
  if (!code.includes('esphome:')) {
    errors.push('Missing required "esphome:" block');
  }
  if (code.includes('\t')) {
    errors.push('YAML uses tabs — replace with 2-space indentation');
  }
  return errors;
}

/**
 * Validate Node-RED JSON
 */
function validateNodeRed(code: string): { errors: string[]; parsed: unknown } {
  try {
    const parsed = JSON.parse(code);
    const errors: string[] = [];
    if (!Array.isArray(parsed)) errors.push('Node-RED flow must be a JSON array of nodes');
    else {
      parsed.forEach((node, i) => {
        if (!node.id) errors.push(`Node ${i} is missing an "id" field`);
        if (!node.type) errors.push(`Node ${i} is missing a "type" field`);
      });
    }
    return { errors, parsed };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { errors: [`Invalid JSON: ${msg}`], parsed: null };
  }
}

/**
 * Validate Shelly JS
 */
function validateShelly(code: string): string[] {
  const errors: string[] = [];
  // Check for balanced braces
  let braces = 0;
  for (const ch of code) {
    if (ch === '{') braces++;
    if (ch === '}') braces--;
  }
  if (braces !== 0) errors.push(`Unbalanced curly braces (off by ${Math.abs(braces)})`);

  let parens = 0;
  for (const ch of code) {
    if (ch === '(') parens++;
    if (ch === ')') parens--;
  }
  if (parens !== 0) errors.push(`Unbalanced parentheses (off by ${Math.abs(parens)})`);

  return errors;
}

/**
 * Apply common fixes to HA YAML
 */
function fixHA(code: string): { fixed: string; changes: string[] } {
  const changes: string[] = [];
  let fixed = code;

  // Fix tabs → spaces
  if (fixed.includes('\t')) {
    fixed = fixed.replace(/\t/g, '  ');
    changes.push('Replaced tab indentation with 2 spaces');
  }

  // Add missing automation wrapper if bare trigger/action blocks
  if (!fixed.trimStart().startsWith('automation:') && fixed.includes('trigger:')) {
    fixed = `automation:\n  - alias: "My Automation"\n    ${fixed.split('\n').join('\n    ')}`;
    changes.push('Wrapped bare trigger/action in automation block');
  }

  // Fix common entity ID patterns (spaces → underscores)
  const entityPattern = /entity_id:\s+([a-z_]+\.[A-Za-z ]+)/g;
  fixed = fixed.replace(entityPattern, (match, entity) => {
    const fixed2 = entity.replace(/ /g, '_').toLowerCase();
    if (fixed2 !== entity) changes.push(`Fixed entity_id "${entity}" → "${fixed2}"`);
    return `entity_id: ${fixed2}`;
  });

  return { fixed, changes };
}

/**
 * Apply common fixes to ESPHome YAML
 */
function fixESPHome(code: string): { fixed: string; changes: string[] } {
  const changes: string[] = [];
  let fixed = code;

  if (fixed.includes('\t')) {
    fixed = fixed.replace(/\t/g, '  ');
    changes.push('Replaced tab indentation with 2 spaces');
  }

  // Add missing esphome block header if missing
  if (!fixed.includes('esphome:') && fixed.includes('sensor:')) {
    fixed = `esphome:\n  name: my-device\n  friendly_name: My Device\n\nesp32:\n  board: esp32dev\n\n` + fixed;
    changes.push('Added missing esphome: and esp32: header blocks');
  }

  return { fixed, changes };
}

/**
 * Apply common fixes to Node-RED JSON
 */
function fixNodeRed(code: string): { fixed: string; changes: string[] } {
  const changes: string[] = [];
  try {
    const parsed = JSON.parse(code);
    // Ensure wires arrays exist
    if (Array.isArray(parsed)) {
      parsed.forEach((node) => {
        if (!node.wires) {
          node.wires = [[]];
          changes.push(`Added missing "wires" to node "${node.id || node.name}"`);
        }
        if (!node.z) {
          node.z = 'default';
          changes.push(`Added missing "z" (tab reference) to node "${node.id}"`);
        }
      });
    }
    return { fixed: JSON.stringify(parsed, null, 2), changes };
  } catch {
    return { fixed: code, changes: ['Could not parse JSON to fix — please check syntax'] };
  }
}

/**
 * Apply common fixes to Shelly JS
 */
function fixShelly(code: string): { fixed: string; changes: string[] } {
  const changes: string[] = [];
  let fixed = code;

  // Fix missing semicolons after closing braces on function calls
  fixed = fixed.replace(/\)\s*\n(\s*[a-zA-Z])/g, ');\n$1');

  // Remove Windows line endings
  if (fixed.includes('\r')) {
    fixed = fixed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    changes.push('Normalized Windows line endings to Unix');
  }

  // Warn about Shelly v1 API usage
  if (fixed.includes('SHELLY.') || fixed.includes('shellybtn')) {
    changes.push('Warning: detected possible Shelly Gen1 API usage. Shelly.call() is Gen2 only.');
  }

  return { fixed, changes };
}

/**
 * Main: detect platform, validate, and fix
 */
export function detectAndFix(code: string): FixResult {
  const platform = detectPlatform(code);
  const allChanges: string[] = [];
  const allErrors: string[] = [];
  let fixed = code;

  if (platform === 'ha') {
    const errs = validateHA(code);
    allErrors.push(...errs);
    const { fixed: f, changes } = fixHA(code);
    fixed = f;
    allChanges.push(...changes);
  } else if (platform === 'esphome') {
    const errs = validateESPHome(code);
    allErrors.push(...errs);
    const { fixed: f, changes } = fixESPHome(code);
    fixed = f;
    allChanges.push(...changes);
  } else if (platform === 'nodered') {
    const { errors } = validateNodeRed(code);
    allErrors.push(...errors);
    const { fixed: f, changes } = fixNodeRed(code);
    fixed = f;
    allChanges.push(...changes);
  } else if (platform === 'shelly') {
    const errs = validateShelly(code);
    allErrors.push(...errs);
    const { fixed: f, changes } = fixShelly(code);
    fixed = f;
    allChanges.push(...changes);
  } else {
    allErrors.push('Could not detect platform. Paste Shelly JS, HA YAML, Node-RED JSON, or ESPHome YAML.');
  }

  return {
    platform,
    original: code,
    fixed,
    changes: allChanges,
    errors: allErrors,
    valid: allErrors.length === 0 && platform !== 'unknown',
  };
}
