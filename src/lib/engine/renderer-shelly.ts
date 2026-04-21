import { AutomationSpec } from './types';

/**
 * Renders an AutomationSpec as Shelly Gen2 JavaScript
 * Compatible with Shelly Script component (Gen2+ devices)
 */
export function renderShelly(spec: AutomationSpec): string {
  const { intent, devices, triggers, conditions, actions, safetyNotes } = spec;

  const deviceComment = devices
    .map((d) => `//   - ${d.name} (${d.type})${d.shellyModel ? ` [${d.shellyModel}]` : ''}`)
    .join('\n');

  const safetyComment = safetyNotes.length
    ? `\n// ⚠️  Safety Notes:\n${safetyNotes.map((n) => `//   ${n}`).join('\n')}\n`
    : '';

  // Detect if this is a power-monitoring scenario
  const isPowerMonitor = triggers.some(
    (t) => t.type === 'power_threshold' || t.type === 'numeric_state'
  ) && (
    spec.intent.toLowerCase().includes('power') ||
    spec.intent.toLowerCase().includes('watt') ||
    spec.intent.toLowerCase().includes('charg') ||
    spec.intent.toLowerCase().includes('energy') ||
    spec.intent.toLowerCase().includes('appliance') ||
    triggers.some((t) => String(t.device || '').toLowerCase().includes('power'))
  );

  // Collect required inputs that user must configure
  const requiredInputs: string[] = [];
  const hasNotify = actions.some((a) => a.type === 'notify' || a.type === 'http_request');
  if (hasNotify) requiredInputs.push('YOUR_WEBHOOK_URL — POST endpoint for notifications (e.g. Home Assistant webhook, Pushover, ntfy.sh)');

  const hasTimeTrigger = triggers.some((t) => t.type === 'time');
  if (hasTimeTrigger) requiredInputs.push('Schedule times — adjust schedule hours to your needs');

  if (isPowerMonitor) {
    requiredInputs.push('POWER_THRESHOLD — watt threshold for your appliance (default: from spec)');
    requiredInputs.push('HOLD_SECONDS — how long power must stay below threshold (default: 120)');
  }

  const requiredInputsBlock = requiredInputs.length
    ? `\n// ── Required Inputs (you must configure these) ──────────────────────────────\n${requiredInputs.map((r) => `//   ✏️  ${r}`).join('\n')}\n`
    : '';

  // Build the script based on scenario
  if (isPowerMonitor) {
    return renderPowerMonitor(spec, deviceComment, safetyComment, requiredInputsBlock);
  }

  return renderStandard(spec, deviceComment, safetyComment, requiredInputsBlock);
}

/**
 * Render a power-monitoring script (e.g. "alert when charging complete")
 */
function renderPowerMonitor(
  spec: AutomationSpec,
  deviceComment: string,
  safetyComment: string,
  requiredInputsBlock: string,
): string {
  const { intent, triggers, actions } = spec;

  // Extract threshold from spec
  const thresholdTrigger = triggers.find((t) => t.type === 'power_threshold' || t.type === 'numeric_state');
  const threshold = thresholdTrigger?.value ?? 50;
  const operator = thresholdTrigger?.operator ?? '<';

  // Extract hold duration from delay actions or default to 120s
  const delayAction = actions.find((a) => a.type === 'delay');
  const holdSeconds = delayAction?.duration ? Math.floor(delayAction.duration / 1000) : 120;

  // Build notification action
  const notifyAction = actions.find((a) => a.type === 'notify');
  const notifyMessage = notifyAction?.message || `Alert: ${intent}`;

  // Build on/off actions
  const switchActions = actions
    .filter((a) => a.type === 'turn_on' || a.type === 'turn_off')
    .map((a) => {
      const on = a.type === 'turn_on';
      return `    Shelly.call("Switch.Set", { id: 0, on: ${on} }, null, null); // ${a.target || 'relay'}`;
    })
    .join('\n');

  return `// AutomationForge — Generated Shelly Gen2 Script
// Automation: ${intent}
//
// Required devices:
${deviceComment}
//${safetyComment}${requiredInputsBlock}
// Deploy via: Shelly Web UI → Scripts → Add Script → paste & Save → Enable

"use strict";

// ── Configuration ─────────────────────────────────────────────────────────────
var POWER_THRESHOLD = ${threshold};    // Watts — trigger when power ${operator} this value
var HOLD_SECONDS    = ${holdSeconds};        // How long power must stay below threshold
var CHECK_INTERVAL  = 5000;           // Poll every 5 seconds (ms)
var SWITCH_ID       = 0;              // Shelly switch component ID

// ── State ─────────────────────────────────────────────────────────────────────
var belowCount = 0;
var alreadyFired = false;

function checkPower() {
  Shelly.call("Switch.GetStatus", { id: SWITCH_ID }, function (res, err) {
    if (err !== 0 || !res) {
      print("Error reading switch status: " + JSON.stringify(err));
      return;
    }

    var watts = res.apower;
    if (typeof watts !== "number") {
      print("No apower reading available — is power metering enabled?");
      return;
    }

    print("Power: " + watts + "W (threshold: ${operator}" + POWER_THRESHOLD + "W)");

    if (watts ${operator} POWER_THRESHOLD) {
      belowCount++;
      var elapsed = belowCount * (CHECK_INTERVAL / 1000);
      print("Below threshold for " + elapsed + "s / " + HOLD_SECONDS + "s");

      if (elapsed >= HOLD_SECONDS && !alreadyFired) {
        alreadyFired = true;
        print("⚡ Threshold condition met — firing automation: ${intent}");
        onThresholdMet();
      }
    } else {
      // Power back above threshold — reset
      if (belowCount > 0) {
        print("Power back above threshold — resetting counter");
      }
      belowCount = 0;
      alreadyFired = false;
    }
  });
}

function onThresholdMet() {
${switchActions ? switchActions + '\n' : ''}  // Send notification
  var payload = JSON.stringify({
    text: "${notifyMessage}",
    watts: POWER_THRESHOLD,
    event: "threshold_met"
  });

  Shelly.call("HTTP.Request", {
    method: "POST",
    url: "YOUR_WEBHOOK_URL",
    body: payload,
    content_type: "application/json"
  }, function (res, err) {
    if (err !== 0) {
      print("Webhook failed: " + JSON.stringify(err));
    } else {
      print("Notification sent successfully");
    }
  });
}

// ── Initialize ────────────────────────────────────────────────────────────────
print("AutomationForge script starting: ${intent}");
print("Monitoring switch:" + SWITCH_ID + " for power ${operator} " + POWER_THRESHOLD + "W for " + HOLD_SECONDS + "s");

Timer.set(CHECK_INTERVAL, true, checkPower, null);
print("Power monitoring active — checking every " + (CHECK_INTERVAL / 1000) + "s");
`;
}

/**
 * Render a standard event-driven script
 */
function renderStandard(
  spec: AutomationSpec,
  deviceComment: string,
  safetyComment: string,
  requiredInputsBlock: string,
): string {
  const { intent, triggers, conditions, actions } = spec;

  // Build condition checks — real executable code
  const conditionChecks = conditions.map((c) => {
    if (c.type === 'numeric_state' && c.device) {
      const op = c.operator || '>=';
      const val = c.value ?? 25;
      return `  // Check: ${c.device} ${op} ${val}
  // NOTE: Shelly scripts cannot read external sensors directly.
  // Use Shelly.call("Switch.GetStatus", {id:0}, cb) for built-in readings.`;
    }
    if (c.type === 'time') {
      const timeVal = String(c.value || '08:00:00');
      const hour = parseInt(timeVal.split(':')[0]) || 8;
      return `  // Check: only during certain hours
  var now = new Date();
  var hour = now.getHours();
  if (hour < ${hour} || hour >= ${hour + 12 > 23 ? 23 : hour + 12}) {
    return false;
  }`;
    }
    if (c.type === 'state') {
      return `  // Check: ${c.device || 'device'} state === "${c.value}"
  // Use Shelly.getComponentStatus("switch:0") to check current state`;
    }
    return `  // Condition: ${c.type} — implement as needed`;
  });

  const conditionBlock = conditionChecks.length > 0
    ? conditionChecks.join('\n') + '\n  return true;'
    : '  // No extra conditions\n  return true;';

  // Build trigger setup
  const triggerSetup = triggers
    .map((t, i) => {
      if (t.type === 'state' || t.type === 'input') {
        const component = t.device || 'input:0';
        const event = t.event || 'toggle';
        // Normalize component to Shelly format
        const shellyComponent = component.includes(':') ? component : `input:0`;
        return `
  // Trigger ${i + 1}: ${t.device || t.type} ${event}
  Shelly.addEventHandler(function (event) {
    if (event.component === "${shellyComponent}" && event.info && event.info.event === "${event}") {
      print("Event: " + event.component + " → " + event.info.event);
      handleAutomation();
    }
  });`;
      }
      if (t.type === 'time') {
        const at = t.at || '08:00';
        const parts = at.split(':');
        const hour = parseInt(parts[0]) || 8;
        const minute = parseInt(parts[1]) || 0;
        return `
  // Trigger ${i + 1}: Time-based (${at})
  // Create a schedule via RPC — run this once:
  // POST http://<shelly-ip>/rpc/Script.Create
  Shelly.call("Schedule.Create", {
    enable: true,
    timespec: "${minute} ${hour} * * *",
    calls: [{ method: "Script.Eval", params: { id: Shelly.getCurrentScriptId(), code: "handleAutomation()" } }]
  }, function(res, err) {
    if (err !== 0) print("Schedule already exists or failed: " + JSON.stringify(err));
    else print("Schedule created for ${at}");
  });`;
      }
      return `
  // Trigger ${i + 1}: ${t.type}
  Shelly.addEventHandler(function (event) {
    print("Event received: " + JSON.stringify(event));
    handleAutomation();
  });`;
    })
    .join('\n');

  // Build action code
  const actionLines = actions
    .map((a) => {
      if (a.type === 'turn_on') {
        return `  Shelly.call("Switch.Set", { id: 0, on: true }, null, null);  // ${a.target || 'relay'}`;
      }
      if (a.type === 'turn_off') {
        return `  Shelly.call("Switch.Set", { id: 0, on: false }, null, null); // ${a.target || 'relay'}`;
      }
      if (a.type === 'delay') {
        const ms = a.duration || 5000;
        return `  // Delay ${ms}ms before next action
  Timer.set(${ms}, false, function () {
    print("Delay complete — continuing automation");
    // Add post-delay actions here
  }, null);`;
      }
      if (a.type === 'notify') {
        const msg = a.message || `Automation triggered: ${intent}`;
        return `  // Send notification
  Shelly.call("HTTP.Request", {
    method: "POST",
    url: "YOUR_WEBHOOK_URL",
    body: JSON.stringify({ text: "${msg}" }),
    content_type: "application/json"
  }, function (res, err) {
    if (err !== 0) print("Webhook error: " + JSON.stringify(err));
    else print("Notification sent");
  });`;
      }
      if (a.type === 'http_request') {
        return `  // HTTP request
  Shelly.call("HTTP.Request", {
    method: "POST",
    url: "YOUR_WEBHOOK_URL",
    body: JSON.stringify({ event: "${intent}" }),
    content_type: "application/json"
  }, null, null);`;
      }
      return `  // Action: ${a.type} — ${a.target || ''}`;
    })
    .join('\n');

  return `// AutomationForge — Generated Shelly Gen2 Script
// Automation: ${intent}
//
// Required devices:
${deviceComment}
//${safetyComment}${requiredInputsBlock}
// Deploy via: Shelly Web UI → Scripts → Add Script → paste & Save → Enable
// Or via RPC: POST http://<shelly-ip>/rpc/Script.Create

"use strict";

function checkConditions() {
${conditionBlock}
}

function handleAutomation() {
  if (!checkConditions()) {
    print("Conditions not met, skipping.");
    return;
  }
  print("Automation triggered: ${intent}");
${actionLines || '  // TODO: add your actions here'}
}

// ── Initialize ────────────────────────────────────────────────────────────────
print("AutomationForge script starting: ${intent}");
${triggerSetup}
print("Script ready.");
`;
}
