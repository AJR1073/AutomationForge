import { AutomationSpec } from './types';

/**
 * Renders an AutomationSpec as Shelly Gen2 JavaScript.
 */
export function renderShelly(spec: AutomationSpec): string {
  const { intent, devices, triggers, actions, safetyNotes } = spec;

  const deviceComment = devices
    .map((d) => `//   - ${d.name} (${d.type})${d.shellyModel ? ` [${d.shellyModel}]` : ''}`)
    .join('\n');

  const safetyComment = safetyNotes.length
    ? `\n// ⚠️  Safety Notes:\n${safetyNotes.map((n) => `//   ${n}`).join('\n')}\n`
    : '';

  // Detect power-monitoring scenario
  const isPowerMonitor = triggers.some(
    (t) => t.type === 'power_threshold' || t.type === 'numeric_state',
  ) && (
    intent.toLowerCase().match(/power|watt|charg|energy|appliance|consumption/) ||
    triggers.some((t) => String(t.device || '').toLowerCase().includes('power'))
  );

  // Collect required inputs
  const requiredInputs: string[] = [];
  if (actions.some((a) => a.type === 'notify' || a.type === 'http_request')) {
    requiredInputs.push('YOUR_WEBHOOK_URL — POST endpoint for notifications (e.g. Home Assistant webhook, Pushover, ntfy.sh)');
  }
  if (triggers.some((t) => t.type === 'time')) {
    requiredInputs.push('Schedule times — adjust hours/minutes to your needs');
  }
  if (isPowerMonitor) {
    requiredInputs.push('POWER_THRESHOLD — watts threshold for your appliance');
    requiredInputs.push('HOLD_SECONDS — seconds power must stay below threshold');
    requiredInputs.push('COMPONENT_TYPE — "switch" (default) or your Shelly component type');
    requiredInputs.push('COMPONENT_ID — 0 (default) or your Shelly component index');
  }

  const requiredInputsBlock = requiredInputs.length
    ? `\n// ── Required Inputs (you must configure these) ──────────────────────────────\n${requiredInputs.map((r) => `//   ✏️  ${r}`).join('\n')}\n`
    : '';

  if (isPowerMonitor) {
    return renderPowerMonitor(spec, deviceComment, safetyComment, requiredInputsBlock);
  }
  return renderStandard(spec, deviceComment, safetyComment, requiredInputsBlock);
}

// ── Power Monitoring Script ───────────────────────────────────────────────────

function renderPowerMonitor(
  spec: AutomationSpec,
  deviceComment: string,
  safetyComment: string,
  requiredInputsBlock: string,
): string {
  const { intent, triggers, actions } = spec;

  const thresholdTrigger = triggers.find(
    (t) => t.type === 'power_threshold' || t.type === 'numeric_state',
  );
  const threshold = thresholdTrigger?.value ?? 50;
  const operator = thresholdTrigger?.operator ?? '<';

  const delayAction = actions.find((a) => a.type === 'delay');
  const holdSeconds = delayAction?.duration ? Math.floor(delayAction.duration / 1000) : 120;

  const notifyAction = actions.find((a) => a.type === 'notify');
  const notifyMessage = notifyAction?.message || `Alert: ${intent}`;

  // Switch actions
  const switchActions = actions
    .filter((a) => a.type === 'turn_on' || a.type === 'turn_off')
    .map((a) => `    Shelly.call("Switch.Set", { id: COMPONENT_ID, on: ${a.type === 'turn_on'} }, null, null);`)
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
var HOLD_SECONDS    = ${holdSeconds};        // How long power must stay ${operator === '<' ? 'below' : 'above'} threshold
var CHECK_INTERVAL  = 5000;           // Poll every 5 seconds (ms)
var COMPONENT_TYPE  = "switch";       // Shelly component type
var COMPONENT_ID    = 0;              // Shelly component index
var METRIC          = "apower";       // Metric to monitor

// ── State ─────────────────────────────────────────────────────────────────────
var belowCount = 0;
var hasFired = false;                 // One-shot: fires once per threshold event

// ── Power Check ───────────────────────────────────────────────────────────────
function getPowerReading() {
  // Defensive: try component:id format, fallback to "component" + id param
  var statusId = COMPONENT_TYPE + ":" + JSON.stringify(COMPONENT_ID);
  Shelly.call(
    COMPONENT_TYPE + ".GetStatus",
    { id: COMPONENT_ID },
    function (res, err) {
      if (err !== 0 || !res) {
        // Fallback: try getComponentStatus
        var status = Shelly.getComponentStatus(statusId);
        if (status && typeof status[METRIC] === "number") {
          evaluatePower(status[METRIC]);
        } else {
          print("Error: cannot read " + METRIC + " from " + statusId);
        }
        return;
      }
      if (typeof res[METRIC] !== "number") {
        print("Warning: " + METRIC + " not available on " + statusId + " — is power metering enabled?");
        return;
      }
      evaluatePower(res[METRIC]);
    }
  );
}

function evaluatePower(watts) {
  print("Power: " + watts + "W (threshold: ${operator}" + POWER_THRESHOLD + "W, held: " + belowCount + "/" + Math.ceil(HOLD_SECONDS / (CHECK_INTERVAL / 1000)) + ")");

  var thresholdMet = ${operator === '<' ? 'watts < POWER_THRESHOLD' : 'watts > POWER_THRESHOLD'};

  if (thresholdMet) {
    belowCount++;
    var elapsed = belowCount * (CHECK_INTERVAL / 1000);

    if (elapsed >= HOLD_SECONDS && !hasFired) {
      hasFired = true;
      print("⚡ Threshold condition met — firing: ${intent}");
      onThresholdMet(watts);
    }
  } else {
    // Power recovered — reset one-shot state
    if (hasFired || belowCount > 0) {
      print("Power recovered above threshold — resetting trigger state");
      belowCount = 0;
      hasFired = false;
    }
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────
function onThresholdMet(currentWatts) {
${switchActions ? switchActions + '\n' : ''}
  // Send notification via webhook
  var payload = JSON.stringify({
    event: "threshold_met",
    device: COMPONENT_TYPE + ":" + JSON.stringify(COMPONENT_ID),
    metric: METRIC,
    value: currentWatts,
    threshold: POWER_THRESHOLD,
    message: "${notifyMessage}",
    ts: Date.now()
  });

  Shelly.call("HTTP.Request", {
    method: "POST",
    url: "YOUR_WEBHOOK_URL",
    headers: { "Content-Type": "application/json" },
    body: payload
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
print("Monitoring " + COMPONENT_TYPE + ":" + COMPONENT_ID + "." + METRIC);
print("Trigger: ${operator}" + POWER_THRESHOLD + "W for " + HOLD_SECONDS + "s");

Timer.set(CHECK_INTERVAL, true, getPowerReading, null);
print("Polling active — interval " + (CHECK_INTERVAL / 1000) + "s");
`;
}

// ── Standard Event-Driven Script ──────────────────────────────────────────────

function renderStandard(
  spec: AutomationSpec,
  deviceComment: string,
  safetyComment: string,
  requiredInputsBlock: string,
): string {
  const { intent, triggers, conditions, actions } = spec;

  // Build executable condition checks
  const conditionChecks = conditions.map((c, i) => {
    if (c.type === 'time') {
      const timeVal = String(c.value || '20:00:00');
      const hour = parseInt(timeVal.split(':')[0]) || 20;
      const op = c.operator || '>=';
      return `  // Condition ${i + 1}: time ${op} ${timeVal}
  var now = new Date();
  var hr = now.getHours();
  if (!(hr ${op} ${hour})) { return false; }`;
    }
    if (c.type === 'numeric_state' && c.device) {
      const op = c.operator || '>=';
      const val = c.value ?? 25;
      return `  // Condition ${i + 1}: ${c.device} ${op} ${val}
  // Use Shelly.call("Switch.GetStatus", {id:0}, cb) for built-in readings
  // External sensors require HA or MQTT bridge`;
    }
    if (c.type === 'state') {
      return `  // Condition ${i + 1}: ${c.device || 'device'} === "${c.value}"
  var st = Shelly.getComponentStatus("switch:0");
  if (st && st.output !== ${c.value === 'on' ? 'true' : 'false'}) { return false; }`;
    }
    return `  // Condition ${i + 1}: ${c.type}`;
  });

  // Only return true if no conditions blocked
  const conditionBlock = conditionChecks.length > 0
    ? conditionChecks.join('\n') + '\n  return true; // all conditions passed'
    : '  return true; // no conditions';

  // Build triggers
  const triggerSetup = triggers.map((t, i) => {
    if (t.type === 'state' || t.type === 'input') {
      const component = t.device?.includes(':') ? t.device : 'input:0';
      const event = t.event || 'toggle';
      return `
  // Trigger ${i + 1}: ${t.device || t.type} → ${event}
  Shelly.addEventHandler(function (ev) {
    if (ev.component === "${component}" && ev.info && ev.info.event === "${event}") {
      print("Event: " + ev.component + " → " + ev.info.event);
      handleAutomation();
    }
  });`;
    }
    if (t.type === 'time') {
      const at = t.at || '08:00';
      const [h, m] = at.split(':').map(Number);
      return `
  // Trigger ${i + 1}: Schedule at ${at}
  Shelly.call("Schedule.Create", {
    enable: true,
    timespec: "${m || 0} ${h || 8} * * *",
    calls: [{ method: "Script.Eval", params: { id: Shelly.getCurrentScriptId(), code: "handleAutomation()" } }]
  }, function(r, e) {
    if (e !== 0) print("Schedule may already exist");
    else print("Schedule created for ${at}");
  });`;
    }
    return `
  // Trigger ${i + 1}: ${t.type}
  Shelly.addEventHandler(function (ev) { handleAutomation(); });`;
  }).join('\n');

  // Build actions. Actions after a delay belong inside that timer callback.
  const renderActionLines = (start = 0, indent = '  '): string => {
    const lines: string[] = [];
    for (let actionIndex = start; actionIndex < actions.length; actionIndex++) {
      const a = actions[actionIndex];
      if (a.type === 'turn_on') {
        lines.push(`${indent}Shelly.call("Switch.Set", { id: 0, on: true }, null, null);  // ${a.target || 'relay'}`);
        continue;
      }
      if (a.type === 'turn_off') {
        lines.push(`${indent}Shelly.call("Switch.Set", { id: 0, on: false }, null, null); // ${a.target || 'relay'}`);
        continue;
      }
      if (a.type === 'delay') {
        const ms = a.duration || 5000;
        const delayedActions = renderActionLines(actionIndex + 1, `${indent}  `);
        lines.push(`${indent}Timer.set(${ms}, false, function () {
${indent}  print("Delay ${ms}ms complete");
${delayedActions || `${indent}  // Add post-delay actions here`}
${indent}}, null);`);
        break;
      }
      if (a.type === 'notify') {
        const msg = a.message || intent;
        lines.push(`${indent}Shelly.call("HTTP.Request", {
${indent}  method: "POST",
${indent}  url: "YOUR_WEBHOOK_URL",
${indent}  headers: { "Content-Type": "application/json" },
${indent}  body: JSON.stringify({ event: "automation", message: ${JSON.stringify(msg)}, ts: Date.now() })
${indent}}, function (r, e) { if (e !== 0) print("Webhook error"); });`);
        continue;
      }
      lines.push(`${indent}// Action: ${a.type} → ${a.target || ''}`);
    }
    return lines.join('\n');
  };
  const actionLines = renderActionLines(0);

  return `// AutomationForge — Generated Shelly Gen2 Script
// Automation: ${intent}
//
// Required devices:
${deviceComment}
//${safetyComment}${requiredInputsBlock}
// Deploy via: Shelly Web UI → Scripts → Add Script → paste & Save → Enable

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
${actionLines || '  // Add actions here'}
}

// ── Initialize ────────────────────────────────────────────────────────────────
print("AutomationForge script starting: ${intent}");
${triggerSetup}
print("Script ready.");
`;
}
