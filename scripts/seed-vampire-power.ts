import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });

  // 1) Create the AutomationPage
  const page = await db.automationPage.create({
    data: {
      slug: 'vampire-power-shutoff',
      title: 'Vampire Power Shutoff',
      summary: 'Automatically cut power to devices drawing standby "vampire" power. When power consumption drops below a threshold for a set period, the smart plug turns off — saving $50–100/year per device.',
      category: 'Energy',
      primaryIntent: 'Cut power to devices drawing standby vampire power to save energy',
      seoTitle: 'Vampire Power Shutoff — Shelly, Home Assistant, Node-RED, ESPHome',
      seoDescription: 'Automatically detect and cut standby power draw with a smart plug. Get copy-paste code for Shelly, Home Assistant, Node-RED, and ESPHome — plus a complete parts list.',
      status: 'published',
    },
  });

  console.log(`✅ Created AutomationPage: id=${page.id}, slug=${page.slug}`);

  // 2) Create the AutomationSpec
  const specJson = JSON.stringify({
    intent: 'Cut power to devices drawing standby vampire power to save energy',
    assumptions: [
      'Smart plug supports power/wattage monitoring (e.g., Shelly Plug S, Sonoff S31)',
      'Device is plugged into the monitored smart plug',
      'Threshold of 3W covers most standby states (TVs, monitors, game consoles)',
    ],
    devices: [
      {
        name: 'Smart Plug',
        type: 'smart_plug',
        haEntityId: 'switch.vampire_plug',
        shellyModel: 'Shelly Plug S',
        location: 'Home Office',
      },
    ],
    triggers: [
      {
        type: 'power_below',
        device: 'Smart Plug',
        threshold: 3,
        forMinutes: 5,
      },
    ],
    conditions: [],
    actions: [
      {
        type: 'turn_off',
        target: 'Smart Plug',
      },
      {
        type: 'notify',
        target: 'User',
        message: 'Vampire power detected — plug turned off to save energy',
      },
    ],
    safetyNotes: [
      'Do NOT use on devices that need constant power (routers, security cameras, NAS, refrigerators).',
      'Some devices (e.g., game consoles) may lose unsaved data if power is cut during standby.',
      'Test the wattage threshold with your specific device before relying on automation.',
    ],
    partsList: [
      {
        name: 'Smart Plug with Power Monitoring',
        capabilityTag: 'smart_plug',
        quantity: 1,
        required: true,
        notes: 'Must support power/wattage reporting (Shelly Plug S, Sonoff S31, etc.)',
      },
      {
        name: 'Power Monitor (optional if plug has built-in)',
        capabilityTag: 'power_monitor',
        quantity: 1,
        required: false,
        notes: 'Shelly 1PM or similar if using a relay without built-in power monitoring',
      },
    ],
    renderTargets: ['shelly', 'ha', 'nodered', 'esphome'],
  });

  const spec = await db.automationSpec.create({
    data: {
      pageId: page.id,
      specJson,
      version: 1,
    },
  });

  console.log(`✅ Created AutomationSpec: id=${spec.id}`);

  // 3) Create RenderedOutput for each platform

  // ── Shelly (Gen2 JavaScript) ──
  const shellyCode = `// Vampire Power Shutoff — Shelly Gen2 Script
// Monitors power draw and cuts the plug when device enters standby

let POWER_THRESHOLD = 3;     // Watts — below this = standby
let DELAY_SECONDS = 300;     // 5 minutes of low power before cutoff
let CHECK_INTERVAL = 30;     // Check every 30 seconds

let lowPowerStart = null;

function checkPower() {
  Shelly.call("Switch.GetStatus", { id: 0 }, function (res) {
    if (!res || !res.output) {
      // Plug is already off, nothing to do
      lowPowerStart = null;
      return;
    }

    let watts = res.apower || 0;
    print("Current power: " + watts + "W");

    if (watts < POWER_THRESHOLD) {
      if (lowPowerStart === null) {
        lowPowerStart = Date.now();
        print("Low power detected, starting timer...");
      } else {
        let elapsed = (Date.now() - lowPowerStart) / 1000;
        print("Low power for " + elapsed + "s / " + DELAY_SECONDS + "s");

        if (elapsed >= DELAY_SECONDS) {
          print("Vampire power detected! Cutting power.");
          Shelly.call("Switch.Set", { id: 0, on: false });
          lowPowerStart = null;
        }
      }
    } else {
      // Device is active, reset timer
      if (lowPowerStart !== null) {
        print("Device active again, resetting timer.");
      }
      lowPowerStart = null;
    }
  });
}

// Run the check on interval
Timer.set(CHECK_INTERVAL * 1000, true, checkPower);

// Also allow manual button press to restore power
Shelly.addEventHandler(function (ev) {
  if (ev.component === "input:0" && ev.info.event === "btn_down") {
    Shelly.call("Switch.Set", { id: 0, on: true });
    lowPowerStart = null;
    print("Manual override — plug restored.");
  }
});

print("Vampire Power Shutoff running. Threshold: " + POWER_THRESHOLD + "W, Delay: " + DELAY_SECONDS + "s");`;

  // ── Home Assistant YAML ──
  const haCode = `# Vampire Power Shutoff — Home Assistant Automation
# Cuts power when device drops to standby mode

automation:
  - alias: "Vampire Power Shutoff"
    description: "Turn off smart plug when device draws less than 3W for 5 minutes"
    trigger:
      - platform: numeric_state
        entity_id: sensor.vampire_plug_power  # Your plug's power sensor
        below: 3
        for:
          minutes: 5
    condition:
      - condition: state
        entity_id: switch.vampire_plug  # Your smart plug switch
        state: "on"
    action:
      - service: switch.turn_off
        target:
          entity_id: switch.vampire_plug
      - service: notify.notify
        data:
          title: "Vampire Power Shutoff"
          message: "{{ trigger.entity_id }} was below 3W for 5 minutes. Plug turned off."
    mode: single

  - alias: "Vampire Plug - Manual Restore"
    description: "Allow turning the plug back on manually or via dashboard"
    trigger:
      - platform: event
        event_type: call_service
        event_data:
          domain: switch
          service: turn_on
    condition:
      - condition: template
        value_template: "{{ 'vampire_plug' in trigger.event.data.service_data.entity_id | default('') }}"
    action:
      - service: logbook.log
        data:
          name: "Vampire Plug"
          message: "Manually restored — standby timer reset"
    mode: single`;

  // ── Node-RED JSON ──
  const noderedCode = JSON.stringify([
    {
      id: "vampire_power_flow",
      type: "tab",
      label: "Vampire Power Shutoff",
      disabled: false,
      info: "Monitors power draw and cuts plug when device enters standby",
    },
    {
      id: "power_sensor",
      type: "server-state-changed",
      z: "vampire_power_flow",
      name: "Power Sensor",
      server: "",
      version: 4,
      entityidfilter: "sensor.vampire_plug_power",
      entityidfiltertype: "exact",
      x: 150,
      y: 120,
      wires: [["check_threshold"]],
    },
    {
      id: "check_threshold",
      type: "switch",
      z: "vampire_power_flow",
      name: "Below 3W?",
      property: "payload",
      propertyType: "msg",
      rules: [{ t: "lt", v: "3", vt: "num" }],
      x: 340,
      y: 120,
      wires: [["delay_5min"]],
    },
    {
      id: "delay_5min",
      type: "trigger",
      z: "vampire_power_flow",
      name: "Wait 5 min",
      op1: "",
      op2: "cutoff",
      op1type: "nul",
      op2type: "str",
      duration: "5",
      extend: false,
      overrideDelay: false,
      units: "min",
      reset: "",
      bytopic: "all",
      topic: "topic",
      outputs: 1,
      x: 520,
      y: 120,
      wires: [["turn_off_plug"]],
    },
    {
      id: "turn_off_plug",
      type: "api-call-service",
      z: "vampire_power_flow",
      name: "Turn Off Plug",
      server: "",
      version: 5,
      service: "turn_off",
      domain: "switch",
      target: '{"entity_id":["switch.vampire_plug"]}',
      x: 710,
      y: 120,
      wires: [["notify_user"]],
    },
    {
      id: "notify_user",
      type: "api-call-service",
      z: "vampire_power_flow",
      name: "Notify",
      server: "",
      version: 5,
      service: "notify",
      domain: "notify",
      data: '{"title":"Vampire Power","message":"Standby detected — plug turned off"}',
      x: 890,
      y: 120,
      wires: [[]],
    },
  ], null, 2);

  // ── ESPHome YAML ──
  const esphomeCode = `# Vampire Power Shutoff — ESPHome Config
# Uses a power-monitoring plug (e.g., Sonoff S31) to detect standby power

esphome:
  name: vampire-plug
  platform: ESP8266
  board: esp01_1m

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

api:
  encryption:
    key: !secret api_key

ota:
  password: !secret ota_password

logger:

# UART for power monitoring chip (e.g., CSE7766 in Sonoff S31)
uart:
  rx_pin: RX
  baud_rate: 4800

sensor:
  - platform: cse7766
    current:
      name: "Vampire Plug Current"
    voltage:
      name: "Vampire Plug Voltage"
    power:
      name: "Vampire Plug Power"
      id: plug_power
      on_value_range:
        - below: 3.0
          then:
            - delay: 300s  # 5 minutes
            - if:
                condition:
                  sensor.in_range:
                    id: plug_power
                    below: 3.0
                then:
                  - switch.turn_off: relay
                  - logger.log: "Vampire power detected — relay turned off"

switch:
  - platform: gpio
    name: "Vampire Plug"
    id: relay
    pin: GPIO12
    restore_mode: ALWAYS_ON

  # Physical button to restore power
  - platform: restart
    name: "Restart Vampire Plug"

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: true
    name: "Vampire Plug Button"
    on_press:
      then:
        - switch.turn_on: relay
        - logger.log: "Manual override — plug restored"

status_led:
  pin:
    number: GPIO13
    inverted: true`;

  // Create all 4 outputs
  const outputs = [
    { platform: 'shelly', codeText: shellyCode },
    { platform: 'ha', codeText: haCode },
    { platform: 'nodered', codeText: noderedCode },
    { platform: 'esphome', codeText: esphomeCode },
  ];

  for (const output of outputs) {
    await db.renderedOutput.create({
      data: {
        specId: spec.id,
        platform: output.platform,
        codeText: output.codeText,
      },
    });
    console.log(`  ✅ Created ${output.platform} output`);
  }

  console.log(`\n🎉 Build sheet ready at: /build-sheets/vampire-power-shutoff`);

  await db.$disconnect();
  await pool.end();
}

main();
