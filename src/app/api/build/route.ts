import { NextRequest, NextResponse } from 'next/server';
import { buildSpecFromWizard } from '@/lib/engine/spec-builder';
import { renderShelly } from '@/lib/engine/renderer-shelly';
import { renderHA } from '@/lib/engine/renderer-ha';
import { renderNodeRed } from '@/lib/engine/renderer-nodered';
import { renderESPHome } from '@/lib/engine/renderer-esphome';
import { WizardInput } from '@/lib/engine/types';
import { generateAutomationSpec } from '@/lib/ai/spec-generator';
import { validateOutput } from '@/lib/engine/validators';

const PLATFORMS = ['shelly', 'ha', 'nodered', 'esphome'] as const;
type Platform = typeof PLATFORMS[number];

function cleanStringArray(value: unknown, limit: number, itemLimit = 80): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, itemLimit))
    .filter(Boolean)
    .slice(0, limit);
}

function cleanPlatforms(value: unknown): Platform[] {
  if (!Array.isArray(value)) return [...PLATFORMS];
  const selected = value.filter((item): item is Platform =>
    typeof item === 'string' && PLATFORMS.includes(item as Platform),
  );
  return selected.length ? [...new Set(selected)] : [...PLATFORMS];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as WizardInput;

    if (!body.goal || typeof body.goal !== 'string') {
      return NextResponse.json({ error: 'goal is required' }, { status: 400 });
    }

    const input: WizardInput = {
      goal: body.goal.trim().slice(0, 300),
      deviceTypes: cleanStringArray(body.deviceTypes, 10),
      constraints: cleanStringArray(body.constraints, 10, 120),
      platforms: cleanPlatforms(body.platforms),
    };

    // ── LLM-first spec generation ──────────────────────────────────────────
    // Fallback to heuristics ONLY if:
    //   (a) OPENAI_API_KEY is missing
    //   (b) LLM output fails AJV validation after 2 retries
    //   (c) LLM request errors or times out
    // The heuristic spec is never merged or patched with LLM output.
    let spec;
    let specSource: 'llm' | 'fallback' = 'llm';
    let modelUsed: string | null = null;
    let warning: string | null = null;

    try {
      const result = await generateAutomationSpec({
        goal: input.goal,
        deviceTypes: input.deviceTypes,
        constraints: input.constraints,
        selectedPlatforms: input.platforms,
      });
      spec = result.spec;
      modelUsed = result.modelUsed;
      console.log(`[/api/build] LLM spec generated via ${modelUsed}`);
    } catch (llmErr: unknown) {
      const msg = llmErr instanceof Error ? llmErr.message : String(llmErr);
      const isMissingKey = msg.includes('OPENAI_API_KEY not configured');
      console.log(`[/api/build] LLM failed (${isMissingKey ? 'no key' : msg.slice(0, 100)}), using heuristic fallback`);
      spec = buildSpecFromWizard(input);
      specSource = 'fallback';
      warning = isMissingKey
        ? 'OPENAI_API_KEY not configured — using heuristic spec builder (less accurate).'
        : `LLM generation failed: ${msg.slice(0, 120)}. Fell back to heuristic builder.`;
    }

    // ── Render outputs ─────────────────────────────────────────────────────
    const allOutputs = {
      shelly: renderShelly(spec),
      ha: renderHA(spec),
      nodered: renderNodeRed(spec),
      esphome: renderESPHome(spec),
    };
    const outputs = Object.fromEntries(
      input.platforms.map((platform) => [platform, allOutputs[platform]]),
    );

    // ── Validate each output ───────────────────────────────────────────────
    const validation = Object.fromEntries(
      input.platforms.map((platform) => [platform, validateOutput(platform, allOutputs[platform])]),
    );

    const explanation = `
## How This Automation Works

**Goal:** ${spec.intent}

**What it does:**
${spec.actions.map((a) => `- ${a.type.replace(/_/g, ' ')} → ${a.target || a.message || ''}`).join('\n')}

**What triggers it:**
${spec.triggers.map((t) => `- ${t.type} trigger${t.device ? ` on ${t.device}` : ''}${t.at ? ` at ${t.at}` : ''}`).join('\n')}

${spec.conditions.length > 0 ? `**Conditions:**\n${spec.conditions.map((c) => `- ${c.type} condition`).join('\n')}\n` : ''}

**Assumptions:**
${spec.assumptions.map((a) => `- ${a}`).join('\n')}

${spec.safetyNotes.length > 0 ? `**⚠️ Safety Notes:**\n${spec.safetyNotes.map((n) => `- ${n}`).join('\n')}` : ''}
    `.trim();

    return NextResponse.json({
      spec,
      outputs,
      explanation,
      validation,
      specSource,
      modelUsed,
      ...(warning ? { warning } : {}),
    });
  } catch (err: unknown) {
    console.error('[/api/build]', err);
    return NextResponse.json({ error: 'Failed to generate automation' }, { status: 500 });
  }
}
