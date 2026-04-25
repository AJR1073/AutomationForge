// AutomationForge — LLM-based AutomationSpec generator
// Uses OpenAI API via fetch (no SDK). Mock mode is opt-in for test runs only.

import { AutomationSpec, Platform } from '../engine/types';
import { validateSpec, coerceSpec } from './schema';

export interface SpecGeneratorInput {
  goal: string;
  deviceTypes?: string[];
  constraints?: string[];
  selectedPlatforms: Platform[];
  userCode?: string;
}

export interface SpecGeneratorResult {
  spec: AutomationSpec;
  modelUsed: string;
}

const SYSTEM_PROMPT = `You are an expert home automation engineer. Given a user's automation goal, generate a precise AutomationSpec JSON object.

Rules:
1. Return ONLY valid JSON matching the schema. No markdown, no explanation, no code fences.
2. For Shelly triggers: prefer "state", "numeric_state", or "power_threshold" types.
3. For power monitoring: use trigger type "power_threshold" with value as watts and operator as "<" or ">".
4. Actions must use exact types: turn_on, turn_off, delay, notify, mqtt_publish, http_request.
5. Include realistic devices with proper haEntityId (e.g. "sensor.washing_machine_power") and shellyModel.
6. partsList must include all physical hardware needed. Use capabilityTags: relay, switch, smart_plug, motion_sensor, presence_sensor, temperature_sensor, door_sensor, leak_sensor, dimmer, controller, zigbee_coordinator.
7. safetyNotes: include any electrical safety or operational warnings.
8. Be specific — don't use vague device names like "Sensor". Use "Washing Machine Power Monitor" etc.
9. For notifications, use action type "notify" with a descriptive message.
10. renderTargets must match the selectedPlatforms provided.
11. conditions array must always be present (can be empty []).
12. Every trigger must have a "type" field. Every action must have a "type" field.
13. If you are unsure, make conservative assumptions and list them in "assumptions".`;

const MAX_RETRIES = 2;

/**
 * Generate an AutomationSpec using OpenAI's API.
 * - Retries up to MAX_RETRIES on validation failure, feeding errors back to the model.
 * - Skips external calls only when MOCK_LLM=1 and ALLOW_MOCK_LLM=1 (test harness mode).
 * - Throws on exhausted retries, missing key, or network error.
 */
export async function generateAutomationSpec(input: SpecGeneratorInput): Promise<SpecGeneratorResult> {
  // ── MOCK mode for deterministic tests ────────────────────────────────
  const mockEnabled = process.env.MOCK_LLM === '1' && process.env.ALLOW_MOCK_LLM === '1';
  if (mockEnabled) {
    throw new Error('MOCK_LLM enabled — using heuristic spec builder');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  let lastError: Error = new Error('Unknown error');
  let lastValidationErrors: string[] = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const spec = await attemptGeneration(input, apiKey, model, attempt, lastValidationErrors);
      return { spec, modelUsed: model };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Extract validation errors for feedback on next attempt
      if (lastError.message.startsWith('Schema validation failed:')) {
        lastValidationErrors = lastError.message
          .replace('Schema validation failed: ', '')
          .split('; ');
      }

      // Only retry on validation failures — not network/auth
      const isValidationError = lastError.message.startsWith('Schema validation failed');
      if (!isValidationError || attempt === MAX_RETRIES) {
        throw lastError;
      }
      console.log(`[spec-generator] Attempt ${attempt}/${MAX_RETRIES} failed validation, retrying with error feedback...`);
    }
  }

  throw lastError;
}

async function attemptGeneration(
  input: SpecGeneratorInput,
  apiKey: string,
  model: string,
  attempt: number,
  priorErrors: string[],
): Promise<AutomationSpec> {
  const userParts = [
    `Automation goal: ${input.goal}`,
    input.deviceTypes?.length ? `Available devices: ${input.deviceTypes.join(', ')}` : '',
    input.constraints?.length ? `Constraints: ${input.constraints.join(', ')}` : '',
    `Target platforms: ${input.selectedPlatforms.join(', ')}`,
    input.userCode ? `Existing code to improve:\n${input.userCode.slice(0, 2000)}` : '',
  ].filter(Boolean);

  // On retry: include prior validation errors so model can self-correct
  if (attempt > 1 && priorErrors.length > 0) {
    userParts.push(
      `\n[RETRY — Your previous response had validation errors. Fix these:]`,
      ...priorErrors.map((e) => `- ${e}`),
      `Return corrected JSON only.`,
    );
  }

  const userMessage = userParts.join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // allow slower models enough time to respond

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
        response_format: { type: 'json_object' },
        max_completion_tokens: 2500,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`OpenAI API error ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    const contentRaw = message?.content;
    const content = Array.isArray(contentRaw)
      ? contentRaw
          .map((part) => {
            if (typeof part === 'string') return part;
            if (part && typeof part === 'object' && 'text' in part) return String((part as { text: unknown }).text || '');
            return '';
          })
          .join('')
      : typeof contentRaw === 'string'
        ? contentRaw
        : '';

    if (!content.trim()) {
      const refusal = message?.refusal ? String(message.refusal) : '';
      throw new Error(refusal ? `Empty response from OpenAI (${refusal})` : 'Empty response from OpenAI');
    }

    // Parse JSON
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('OpenAI returned invalid JSON');
    }

    // Coerce into proper shape (fills missing optional fields)
    const spec = coerceSpec(parsed, input.selectedPlatforms);

    // Deep validation with AJV
    const validation = validateSpec(spec);
    if (!validation.ok) {
      throw new Error(`Schema validation failed: ${validation.errors.join('; ')}`);
    }

    return spec;
  } finally {
    clearTimeout(timeout);
  }
}
