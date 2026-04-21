import { NextRequest, NextResponse } from 'next/server';
import { buildSpecFromWizard } from '@/lib/engine/spec-builder';
import { renderShelly } from '@/lib/engine/renderer-shelly';
import { renderHA } from '@/lib/engine/renderer-ha';
import { renderNodeRed } from '@/lib/engine/renderer-nodered';
import { renderESPHome } from '@/lib/engine/renderer-esphome';
import { WizardInput } from '@/lib/engine/types';
import { generateAutomationSpec } from '@/lib/ai/spec-generator';
import { validateSpec } from '@/lib/ai/schema';
import { validateOutput } from '@/lib/engine/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as WizardInput;

    if (!body.goal || typeof body.goal !== 'string') {
      return NextResponse.json({ error: 'goal is required' }, { status: 400 });
    }

    const input: WizardInput = {
      goal: body.goal.trim().slice(0, 300),
      deviceTypes: (body.deviceTypes || []).slice(0, 10),
      constraints: (body.constraints || []).slice(0, 10),
      platforms: body.platforms || ['shelly', 'ha', 'nodered', 'esphome'],
    };

    // ── Try LLM-first, fallback to heuristics ──────────────────────────────
    let spec;
    let source: 'llm' | 'heuristic' = 'heuristic';

    try {
      spec = await generateAutomationSpec({
        goal: input.goal,
        deviceTypes: input.deviceTypes,
        constraints: input.constraints,
        selectedPlatforms: input.platforms,
      });
      source = 'llm';
      console.log('[/api/build] LLM spec generated successfully');
    } catch (llmErr: unknown) {
      const msg = llmErr instanceof Error ? llmErr.message : String(llmErr);
      console.log(`[/api/build] LLM failed (${msg}), using heuristic fallback`);
      spec = buildSpecFromWizard(input);
    }

    // ── Validate final spec ────────────────────────────────────────────────
    const specValidation = validateSpec(spec);
    if (!specValidation.ok) {
      console.log('[/api/build] Spec validation failed, falling back to heuristic');
      spec = buildSpecFromWizard(input);
    }

    // ── Render outputs ─────────────────────────────────────────────────────
    const outputs = {
      shelly: renderShelly(spec),
      ha: renderHA(spec),
      nodered: renderNodeRed(spec),
      esphome: renderESPHome(spec),
    };

    // ── Validate each output ───────────────────────────────────────────────
    const validation = {
      shelly: validateOutput('shelly', outputs.shelly),
      ha: validateOutput('ha', outputs.ha),
      nodered: validateOutput('nodered', outputs.nodered),
      esphome: validateOutput('esphome', outputs.esphome),
    };

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
      source,
    });
  } catch (err: unknown) {
    console.error('[/api/build]', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
