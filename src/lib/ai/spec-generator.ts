// AutomationForge — LLM-based AutomationSpec generator
// Uses OpenAI API via fetch (no SDK dependency)

import { AutomationSpec, Platform } from '../engine/types';
import { AUTOMATION_SPEC_SCHEMA, validateSpec, coerceSpec } from './schema';

interface SpecGeneratorInput {
  goal: string;
  deviceTypes?: string[];
  constraints?: string[];
  selectedPlatforms: Platform[];
  userCode?: string; // For /fix flow — existing code to analyze
}

const SYSTEM_PROMPT = `You are an expert home automation engineer. Given a user's automation goal, generate a precise AutomationSpec JSON object.

Rules:
1. Return ONLY valid JSON matching the schema. No markdown, no explanation.
2. For Shelly triggers: prefer "state", "numeric_state", or "power_threshold" types.
3. For power monitoring: use trigger type "power_threshold" with value as watts and operator as "<" or ">".
4. Actions must use exact types: turn_on, turn_off, delay, notify, mqtt_publish, http_request.
5. Include realistic devices with proper haEntityId (e.g. "sensor.washing_machine_power") and shellyModel.
6. partsList must include all physical hardware needed. Use capabilityTags: relay, switch, smart_plug, motion_sensor, temperature_sensor, door_sensor, leak_sensor, dimmer, controller, zigbee_coordinator.
7. safetyNotes: include any electrical safety or operational warnings.
8. Be specific — don't use vague device names like "Sensor". Use "Washing Machine Power Monitor" etc.
9. For notifications, use action type "notify" with a descriptive message.
10. renderTargets must match the selectedPlatforms provided.`;

const MAX_RETRIES = 2;

/**
 * Generate an AutomationSpec using OpenAI's API.
 * Retries up to MAX_RETRIES times on schema validation failure.
 * Throws on exhausted retries, missing key, or network error — caller handles fallback.
 */
export async function generateAutomationSpec(input: SpecGeneratorInput): Promise<AutomationSpec> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await attemptGeneration(input, apiKey, model, attempt);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Only retry on schema validation failures — not on network/auth errors
      const isValidationError = lastError.message.startsWith('Schema validation failed');
      if (!isValidationError || attempt === MAX_RETRIES) {
        throw lastError;
      }
      console.log(`[spec-generator] Attempt ${attempt} failed validation, retrying...`);
    }
  }

  throw lastError;
}

async function attemptGeneration(
  input: SpecGeneratorInput,
  apiKey: string,
  model: string,
  attempt: number,
): Promise<AutomationSpec> {

  const userMessage = [
    attempt > 1 ? `[Retry attempt ${attempt}] Be conservative and strictly follow the JSON schema. Automation goal: ${input.goal}` : `Automation goal: ${input.goal}`,
    input.deviceTypes?.length ? `Available devices: ${input.deviceTypes.join(', ')}` : '',
    input.constraints?.length ? `Constraints: ${input.constraints.join(', ')}` : '',
    `Target platforms: ${input.selectedPlatforms.join(', ')}`,
    input.userCode ? `Existing code to improve:\n${input.userCode.slice(0, 2000)}` : '',
  ].filter(Boolean).join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'AutomationSpec',
            strict: true,
            schema: AUTOMATION_SPEC_SCHEMA,
          },
        },
        temperature: 0.3,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`OpenAI API error ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse the JSON response
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('OpenAI returned invalid JSON');
    }

    // Coerce into proper AutomationSpec shape
    const spec = coerceSpec(parsed, input.selectedPlatforms);

    // Validate
    const validation = validateSpec(spec);
    if (!validation.ok) {
      throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
    }

    return spec;
  } finally {
    clearTimeout(timeout);
  }
}
