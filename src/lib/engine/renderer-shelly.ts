import { AutomationSpec } from './types';

/**
 * Renders an AutomationSpec as Shelly Gen2 JavaScript
 * Compatible with Shelly Script component (Gen2 devices)
 */
export function renderShelly(spec: AutomationSpec): string {
  const { intent, devices, triggers, conditions, actions, safetyNotes } = spec;

  const deviceComment = devices
    .map((d) => `//   - ${d.name} (${d.type})${d.shellyModel ? ` [${d.shellyModel}]` : ''}`)
    .join('\n');

  const safetyComment = safetyNotes.length
    ? `\n// ⚠️  Safety Notes:\n${safetyNotes.map((n) => `//   ${n}`).join('\n')}\n`
    : '';

  const triggerSetup = triggers
    .map((t, i) => {
      if (t.type === 'state' || t.type === 'input') {
        return `
  // Trigger ${i + 1}: ${t.event || t.type}
  Shelly.addEventHandler(function (event) {
    if (event.component === "${t.device || 'input:0'}" && event.info.event === "${t.event || 'toggle'}") {
      handleAutomation();
    }
  });`;
      }
      if (t.type === 'time') {
        return `
  // Trigger ${i + 1}: Time-based (${t.at || '00:00'})
  // Note: Use Shelly.call("Schedule.Create", {...}) to add a schedule via RPC
  scheduleCheck();`;
      }
      return `
  // Trigger ${i + 1}: ${t.type}
  Shelly.addEventHandler(function (event) {
    // TODO: filter for ${t.device || 'your device'}
    handleAutomation();
  });`;
    })
    .join('\n');

  const actionCode = actions
    .map((a) => {
      if (a.type === 'turn_on') {
        return `  Shelly.call("Switch.Set", { id: 0, on: true }, null, null);  // ${a.target || 'relay'}`;
      }
      if (a.type === 'turn_off') {
        return `  Shelly.call("Switch.Set", { id: 0, on: false }, null, null); // ${a.target || 'relay'}`;
      }
      if (a.type === 'delay') {
        return `  // Delay ${a.duration || 1000}ms — use Timer.set() for non-blocking delay
  Timer.set(${a.duration || 1000}, false, function () {
    // post-delay actions here
  }, null);`;
      }
      if (a.type === 'notify') {
        return `  // Notification: "${a.message || 'Automation triggered'}"
  // Shelly.call("HTTP.Request", { method: "POST", url: "YOUR_WEBHOOK", body: JSON.stringify({msg: "${a.message}"}) });`;
      }
      return `  // Action: ${a.type} — ${a.target || ''}`;
    })
    .join('\n');

  const conditionCode = conditions.length
    ? conditions
        .map((c) => {
          let check = 'true';
          if (c.type === 'numeric_state') {
            check = `reading ${c.operator || '>='} ${c.value}`;
          } else if (c.type === 'state') {
            check = `state === "${c.value}"`;
          }
          return `  // Condition: ${c.type} — ${check}`;
        })
        .join('\n') + '\n'
    : '';

  return `// AutomationForge — Generated Shelly Gen2 Script
// Automation: ${intent}
//
// Required devices:
${deviceComment}
//${safetyComment}
// Deploy via: Shelly Web UI → Scripts → Add Script → paste & Save → Enable
// Or via RPC: POST http://<shelly-ip>/rpc/Script.Create

"use strict";

var automationActive = false;

function checkConditions() {
${conditionCode || '  // No extra conditions — always proceed\n  return true;'}
  return true;
}

function handleAutomation() {
  if (!checkConditions()) {
    print("Conditions not met, skipping.");
    return;
  }
  print("Automation triggered: ${intent}");
${actionCode || '  // TODO: add your actions here'}
}

function scheduleCheck() {
  // Called if time-based triggers are used
  Timer.set(60000, true, function () {
    var now = Shelly.getComponentStatus("sys", null);
    // Check time conditions here
    handleAutomation();
  }, null);
}

// ── Initialize ────────────────────────────────────────────────────────────────
print("AutomationForge script starting: ${intent}");
${triggerSetup}
print("Script ready.");
`;
}
