import { NextRequest, NextResponse } from 'next/server';
import { buildSpecFromWizard } from '@/lib/engine/spec-builder';
import { renderShelly } from '@/lib/engine/renderer-shelly';
import { renderHA } from '@/lib/engine/renderer-ha';
import { renderNodeRed } from '@/lib/engine/renderer-nodered';
import { renderESPHome } from '@/lib/engine/renderer-esphome';
import { WizardInput } from '@/lib/engine/types';

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

    const spec = buildSpecFromWizard(input);

    const outputs = {
      shelly: renderShelly(spec),
      ha: renderHA(spec),
      nodered: renderNodeRed(spec),
      esphome: renderESPHome(spec),
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
    });
  } catch (err: unknown) {
    console.error('[/api/build]', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
