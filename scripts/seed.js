#!/usr/bin/env node
// AutomationForge — Database Seed Script
'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'dev.db'));

db.pragma('journal_mode = WAL');

const now = new Date().toISOString();

// ── Seed Data ──────────────────────────────────────────────────────────────────

const BUILD_SHEETS = [
  { slug: 'motion-activated-lights', title: 'Motion-Activated Lights', category: 'Lighting', intent: 'Turn lights on when motion is detected, off after 5 minutes' },
  { slug: 'sunset-lights-on', title: 'Lights On at Sunset', category: 'Lighting', intent: 'Automatically turn on porch lights at sunset and off at sunrise' },
  { slug: 'christmas-lights-schedule', title: 'Christmas Lights Schedule', category: 'Lighting', intent: 'Turn on Christmas lights at dusk and off at midnight on a timer' },
  { slug: 'motion-staircase-night-light', title: 'Staircase Night Light', category: 'Lighting', intent: 'Dim LED strip on staircase when motion detected at night' },
  { slug: 'smart-dimmer-bedtime', title: 'Bedtime Dimming Routine', category: 'Lighting', intent: 'Gradually dim bedroom lights to off at bedtime to aid sleep' },
  { slug: 'door-open-alert', title: 'Door Open Alert', category: 'Security', intent: 'Send notification when front door is left open for more than 2 minutes' },
  { slug: 'motion-security-camera-trigger', title: 'Motion to Camera Record', category: 'Security', intent: 'Trigger camera recording when outdoor motion sensor is activated' },
  { slug: 'garage-door-left-open', title: 'Garage Door Left Open Alert', category: 'Security', intent: 'Alert if garage door is left open for more than 10 minutes' },
  { slug: 'smoke-detector-alert', title: 'Smoke Detector Smart Alert', category: 'Security', intent: 'Send alerts and turn on all lights when smoke detector triggers' },
  { slug: 'window-sensor-alarm', title: 'Window Break-In Alert', category: 'Security', intent: 'Alert when window sensor trips while security mode is armed' },
  { slug: 'thermostat-schedule', title: 'Thermostat Schedule', category: 'Climate', intent: 'Set thermostat to away temperature when nobody is home' },
  { slug: 'fan-auto-on-temperature', title: 'Fan on When Hot', category: 'Climate', intent: 'Automatically turn on ceiling fan when temperature exceeds 26 degrees' },
  { slug: 'hvac-filter-reminder', title: 'HVAC Filter Reminder', category: 'Climate', intent: 'Send monthly reminder to check and replace HVAC filter' },
  { slug: 'window-open-hvac-off', title: 'Window Open Stop HVAC', category: 'Climate', intent: 'Turn off HVAC system when a window is opened to save energy' },
  { slug: 'smart-radiator-control', title: 'Smart Radiator Control', category: 'Climate', intent: 'Control electric radiator based on room temperature and schedule' },
  { slug: 'energy-monitor-appliance', title: 'Appliance Energy Monitor', category: 'Energy', intent: 'Monitor washing machine power usage and notify when cycle is done' },
  { slug: 'solar-excess-heater', title: 'Solar Excess Water Heater', category: 'Energy', intent: 'Turn on water heater when solar production exceeds household needs' },
  { slug: 'standby-device-off', title: 'Standby Device Power Off', category: 'Energy', intent: 'Cut power to entertainment system standby devices overnight' },
  { slug: 'peak-tariff-alerts', title: 'Peak Tariff Energy Alert', category: 'Energy', intent: 'Notify when high-tariff electricity period starts and suggest actions' },
  { slug: 'ev-charger-off-peak', title: 'EV Charger Off-Peak', category: 'Energy', intent: 'Start EV charger only during off-peak electricity hours' },
  { slug: 'water-leak-shutoff', title: 'Water Leak Auto Shutoff', category: 'Water', intent: 'Close main water valve when a leak sensor detects water' },
  { slug: 'garden-irrigation-schedule', title: 'Smart Garden Irrigation', category: 'Garden', intent: 'Water garden automatically at dawn, skip if rain sensor detects rain' },
  { slug: 'pool-pump-schedule', title: 'Pool Pump Schedule', category: 'Garden', intent: 'Run pool pump 4 hours per day during off-peak electricity hours' },
  { slug: 'rain-sensor-irrigation-skip', title: 'Rain Skip for Irrigation', category: 'Garden', intent: 'Automatically skip irrigation if rain sensor detects rainfall' },
  { slug: 'good-morning-routine', title: 'Good Morning Routine', category: 'Convenience', intent: 'At alarm time: turn on lights gradually, start coffee maker, adjust thermostat' },
  { slug: 'leave-home-automation', title: 'Leave Home Automation', category: 'Convenience', intent: 'When leaving home: turn off all lights, lock doors, set security mode' },
  { slug: 'doorbell-smart-alert', title: 'Doorbell Smart Alert', category: 'Convenience', intent: 'When doorbell rings: flash lights inside and send phone notification' },
  { slug: 'pet-feeder-schedule', title: 'Automatic Pet Feeder', category: 'Convenience', intent: 'Trigger automatic pet feeder at scheduled meal times via relay' },
  { slug: 'tv-presence-detection', title: 'Room Presence TV Control', category: 'Convenience', intent: 'Turn on TV ambient light when someone enters living room in evening' },
  { slug: 'car-charging-alert', title: 'Car Charging Complete Alert', category: 'Convenience', intent: 'Notify when EV charging stops drawing power above threshold' },
];

const SCRIPTS = [
  { platform: 'shelly', title: 'Shelly 1 Single-Button Toggle', description: 'Toggle relay on/off with a single push button using Shelly Gen2 Script component.', tags: JSON.stringify(['relay','button','toggle','shelly-gen2']), code: ['"use strict";','','Shelly.addEventHandler(function(event) {','  if (event.component === "input:0" && event.info.event === "single_push") {','    var current = Shelly.getComponentStatus("switch", 0);','    Shelly.call("Switch.Set", { id: 0, on: !current.output }, null, null);','    print("Toggled relay:", !current.output);','  }','});','','print("Single-button toggle script ready.");'].join('\n') },
  { platform: 'shelly', title: 'Shelly Motion Light with Timeout', description: 'Turn on a light when motion is detected, auto-off after 5 minutes of inactivity.', tags: JSON.stringify(['motion','light','timeout','auto-off']), code: ['"use strict";','','var OFF_DELAY_MS = 5 * 60 * 1000;','var offTimer = null;','','Shelly.addEventHandler(function(event) {','  if (event.component === "input:0" && event.info.state === true) {','    if (offTimer !== null) { Timer.clear(offTimer); offTimer = null; }','    Shelly.call("Switch.Set", { id: 0, on: true }, null, null);','    print("Motion detected - light ON");','    offTimer = Timer.set(OFF_DELAY_MS, false, function() {','      Shelly.call("Switch.Set", { id: 0, on: false }, null, null);','      print("No motion - light OFF");','      offTimer = null;','    }, null);','  }','});'].join('\n') },
  { platform: 'ha', title: 'HA Motion Light (Night Only)', description: 'Turn on a light when motion is detected, but only between sunset and sunrise.', tags: JSON.stringify(['motion','light','night','sunset']), code: ['automation:','  - id: motion_light_night','    alias: "Motion Light Night Only"','    trigger:','      - platform: state','        entity_id: binary_sensor.hallway_motion','        to: "on"','    condition:','      - condition: sun','        after: sunset','        before: sunrise','    action:','      - service: light.turn_on','        target:','          entity_id: light.hallway','      - delay:','          minutes: 5','      - service: light.turn_off','        target:','          entity_id: light.hallway'].join('\n') },
  { platform: 'ha', title: 'HA Door Security Alert', description: 'Send a mobile notification when a door is opened while in away mode.', tags: JSON.stringify(['door','security','notification','away']), code: ['automation:','  - id: door_security_alert','    alias: "Door Open Alert (Away Mode)"','    trigger:','      - platform: state','        entity_id: binary_sensor.front_door','        to: "on"','    condition:','      - condition: state','        entity_id: alarm_control_panel.home','        state: armed_away','    action:','      - service: notify.mobile_app_your_phone','        data:','          title: "Security Alert"','          message: "Front door opened while away!"'].join('\n') },
  { platform: 'nodered', title: 'Node-RED MQTT Relay Toggle', description: 'Subscribe to an MQTT topic and toggle a Shelly relay via HTTP.', tags: JSON.stringify(['mqtt','relay','shelly','toggle']), code: JSON.stringify([{"id":"af00000001","type":"tab","name":"MQTT Relay Toggle"},{"id":"af00000002","type":"mqtt in","name":"MQTT Subscribe","topic":"home/relay/command","x":100,"y":100,"z":"af00000001","wires":[["af00000003"]]},{"id":"af00000003","type":"http request","name":"Shelly API","method":"GET","url":"http://YOUR_SHELLY_IP/rpc/Switch.Toggle","x":320,"y":100,"z":"af00000001","wires":[[]]}], null, 2) },
  { platform: 'nodered', title: 'Node-RED Morning Routine', description: 'Trigger a morning routine at 7am on weekdays via cron schedule.', tags: JSON.stringify(['schedule','morning','routine','cron']), code: JSON.stringify([{"id":"af00000010","type":"tab","name":"Morning Routine"},{"id":"af00000011","type":"inject","name":"Weekday 7am","crontab":"0 7 * * 1-5","once":false,"x":100,"y":100,"z":"af00000010","wires":[["af00000012","af00000013"]]},{"id":"af00000012","type":"http request","name":"Lights On","method":"POST","url":"http://YOUR_HA/api/services/light/turn_on","x":380,"y":80,"z":"af00000010","wires":[[]]},{"id":"af00000013","type":"http request","name":"Coffee Maker On","method":"POST","url":"http://YOUR_HA/api/services/switch/turn_on","x":380,"y":140,"z":"af00000010","wires":[[]]}], null, 2) },
  { platform: 'esphome', title: 'ESPHome DHT22 Temperature Monitor', description: 'Read temperature and humidity from a DHT22 sensor and publish to Home Assistant.', tags: JSON.stringify(['temperature','humidity','dht22','sensor']), code: ['esphome:','  name: temp-monitor','  friendly_name: Temperature Monitor','','esp32:','  board: esp32dev','  framework:','    type: arduino','','logger:','api:','  encryption:','    key: "YOUR_KEY_HERE"','ota:','  - platform: esphome','    password: "YOUR_OTA_PASSWORD"','','wifi:','  ssid: !secret wifi_ssid','  password: !secret wifi_password','','sensor:','  - platform: dht','    pin: GPIO4','    model: DHT22','    temperature:','      name: "Room Temperature"','    humidity:','      name: "Room Humidity"','    update_interval: 30s'].join('\n') },
  { platform: 'esphome', title: 'ESPHome PIR Motion with Relay Auto-Off', description: 'PIR motion sensor triggers a relay with auto-off after 60 seconds.', tags: JSON.stringify(['pir','motion','relay','auto-off']), code: ['esphome:','  name: motion-relay','','esp32:','  board: esp32dev','','binary_sensor:','  - platform: gpio','    pin:','      number: GPIO14','      mode: INPUT_PULLUP','    name: "Motion Sensor"','    device_class: motion','    on_press:','      then:','        - switch.turn_on: relay_output','        - delay: 60s','        - switch.turn_off: relay_output','','switch:','  - platform: gpio','    pin: GPIO12','    name: "Relay Output"','    id: relay_output','    restore_mode: RESTORE_DEFAULT_OFF'].join('\n') },
  { platform: 'shelly', title: 'Shelly Energy Monitor Alert', description: 'Alert via webhook when power consumption drops below threshold (appliance done).', tags: JSON.stringify(['energy','power','webhook','appliance']), code: ['"use strict";','','var THRESHOLD_W = 5;','var alerted = false;','','Timer.set(30000, true, function() {','  var em = Shelly.getComponentStatus("em", 0);','  if (!em) return;','  var watts = em.act_power;','  if (watts < THRESHOLD_W && !alerted) {','    alerted = true;','    print("Appliance done! Power:", watts, "W");','  } else if (watts >= THRESHOLD_W) {','    alerted = false;','  }','}, null);'].join('\n') },
  { platform: 'ha', title: 'HA Goodnight Routine', description: 'Turn off all lights, lock doors, and set alarm when goodnight button is pressed.', tags: JSON.stringify(['goodnight','routine','lights','security']), code: ['automation:','  - id: goodnight_routine','    alias: "Goodnight Routine"','    trigger:','      - platform: state','        entity_id: input_button.goodnight','    action:','      - service: light.turn_off','        target:','          area_id: all','      - service: lock.lock','        target:','          entity_id: lock.front_door','      - service: climate.set_temperature','        target:','          entity_id: climate.thermostat','        data:','          temperature: 18','          hvac_mode: heat'].join('\n') },
];

const PRODUCTS = [
  { name: 'Shelly 1 Gen3', brand: 'Shelly', tags: JSON.stringify(['relay','switch']), price: '$12', asin: 'B0CQ16SJ9R', affiliate: 'https://www.amazon.com/dp/B0CQ16SJ9R?tag=automforge-20' },
  { name: 'Shelly Plug S Gen3', brand: 'Shelly', tags: JSON.stringify(['smart_plug','energy_monitor']), price: '$18', asin: 'B0D2K21VJD', affiliate: 'https://www.amazon.com/dp/B0D2K21VJD?tag=automforge-20' },
  { name: 'Shelly 1PM Plus', brand: 'Shelly', tags: JSON.stringify(['relay','energy_monitor']), price: '$16', asin: 'B0BKR3M5MB', affiliate: 'https://www.amazon.com/dp/B0BKR3M5MB?tag=automforge-20' },
  { name: 'Shelly Dimmer 2', brand: 'Shelly', tags: JSON.stringify(['dimmer','light']), price: '$22', asin: 'B09QKCRV13', affiliate: 'https://www.amazon.com/dp/B09QKCRV13?tag=automforge-20' },
  { name: 'Aqara Motion Sensor P1', brand: 'Aqara', tags: JSON.stringify(['motion_sensor','zigbee']), price: '$18', asin: 'B09QKVMMTB', affiliate: 'https://www.amazon.com/dp/B09QKVMMTB?tag=automforge-20' },
  { name: 'Sonoff ZBDONGLE-P Zigbee Coordinator', brand: 'Sonoff', tags: JSON.stringify(['zigbee_coordinator']), price: '$20', asin: 'B09KXTCMSC', affiliate: 'https://www.amazon.com/dp/B09KXTCMSC?tag=automforge-20' },
  { name: 'ESP32 Development Board', brand: 'Espressif', tags: JSON.stringify(['controller','esphome']), price: '$8', asin: 'B0B19KRJN6', affiliate: 'https://www.amazon.com/dp/B0B19KRJN6?tag=automforge-20' },
  { name: 'DHT22 Temperature Sensor', brand: 'Generic', tags: JSON.stringify(['temperature_sensor','humidity_sensor']), price: '$5', asin: 'B0795F19W6', affiliate: 'https://www.amazon.com/dp/B0795F19W6?tag=automforge-20' },
  { name: 'DS18B20 Waterproof Temp Sensor', brand: 'Generic', tags: JSON.stringify(['temperature_sensor','waterproof']), price: '$6', asin: 'B012C597T0', affiliate: 'https://www.amazon.com/dp/B012C597T0?tag=automforge-20' },
  { name: 'Magnetic Door Window Sensor', brand: 'Aqara', tags: JSON.stringify(['door_sensor','zigbee']), price: '$15', asin: 'B07D37VDM3', affiliate: 'https://www.amazon.com/dp/B07D37VDM3?tag=automforge-20' },
  { name: 'GOVEE Water Leak Sensor', brand: 'Govee', tags: JSON.stringify(['leak_sensor','wifi']), price: '$20', asin: 'B07PLLSJPG', affiliate: 'https://www.amazon.com/dp/B07PLLSJPG?tag=automforge-20' },
  { name: 'Raspberry Pi 4 2GB', brand: 'Raspberry Pi', tags: JSON.stringify(['controller','ha_server']), price: '$50', asin: 'B07TD42S27', affiliate: 'https://www.amazon.com/dp/B07TD42S27?tag=automforge-20' },
  { name: 'WLED LED Strip Controller', brand: 'WLED', tags: JSON.stringify(['light','led_strip','esphome']), price: '$15', asin: 'B0B6GP2G8C', affiliate: 'https://www.amazon.com/dp/B0B6GP2G8C?tag=automforge-20' },
  { name: 'PIR Motion Sensor HC-SR501', brand: 'Generic', tags: JSON.stringify(['motion_sensor','pir']), price: '$3', asin: 'B07KBWVJMP', affiliate: 'https://www.amazon.com/dp/B07KBWVJMP?tag=automforge-20' },
  { name: 'Zigbee Smart Plug Ikea Tradfri', brand: 'IKEA', tags: JSON.stringify(['smart_plug','zigbee','energy_monitor']), price: '$12', asin: 'B09FX3876P', affiliate: 'https://www.amazon.com/dp/B09FX3876P?tag=automforge-20' },
];

// ── Run ────────────────────────────────────────────────────────────────────────

console.log('Seeding database...');

db.prepare('DELETE FROM Event').run();
db.prepare('DELETE FROM PageView').run();
db.prepare('DELETE FROM AffiliateLink').run();
db.prepare('DELETE FROM Product').run();
db.prepare('DELETE FROM Script').run();
db.prepare('DELETE FROM RenderedOutput').run();
db.prepare('DELETE FROM AutomationSpec').run();
db.prepare('DELETE FROM AutomationPage').run();

// Products
const insProduct = db.prepare('INSERT INTO Product (name, brand, capabilityTags, priceHint, asin, active, createdAt) VALUES (?, ?, ?, ?, ?, 1, ?)');
const insAffiliate = db.prepare('INSERT INTO AffiliateLink (productId, network, url, country, updatedAt) VALUES (?, ?, ?, ?, ?)');
console.log('  Products...');
for (const p of PRODUCTS) {
  const r = insProduct.run(p.name, p.brand, p.tags, p.price, p.asin, now);
  insAffiliate.run(r.lastInsertRowid, 'amazon', p.affiliate, 'US', now);
}

// Scripts
const insScript = db.prepare('INSERT INTO Script (platform, title, description, codeText, tags, active, createdAt) VALUES (?, ?, ?, ?, ?, 1, ?)');
console.log('  Scripts...');
for (const s of SCRIPTS) {
  insScript.run(s.platform, s.title, s.description, s.code, s.tags, now);
}

// Build Sheets
const insPage = db.prepare('INSERT INTO AutomationPage (slug, title, summary, category, primaryIntent, seoTitle, seoDescription, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insSpec = db.prepare('INSERT INTO AutomationSpec (pageId, specJson, version, createdAt) VALUES (?, ?, 1, ?)');
const insOutput = db.prepare('INSERT INTO RenderedOutput (specId, platform, codeText, createdAt) VALUES (?, ?, ?, ?)');

const shellyTemplate = (title, intent) => [
  '// AutomationForge -- Generated Shelly Gen2 Script',
  '// Automation: ' + title,
  '//',
  '// Deploy via: Shelly Web UI -> Scripts -> New Script -> paste -> Save -> Enable',
  '"use strict";',
  '',
  'Shelly.addEventHandler(function(event) {',
  '  if (event.component === "input:0" && event.info.event === "single_push") {',
  '    Shelly.call("Switch.Set", { id: 0, on: true }, null, null);',
  '    print("' + intent.replace(/"/g, "'").slice(0, 60) + '");',
  '  }',
  '});',
  '',
  'print("Script ready: ' + title.replace(/"/g, "'") + '");',
].join('\n');

const haTemplate = (title, intent) => [
  '# AutomationForge -- Generated Home Assistant Automation',
  '# Automation: ' + title,
  '#',
  '# Deploy: paste into configuration.yaml or automations.yaml -> restart HA',
  '',
  'automation:',
  '  - id: "af_' + title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 30) + '"',
  '    alias: "' + title + '"',
  '    description: "' + intent.slice(0, 80) + '"',
  '    trigger:',
  '      - platform: state',
  '        entity_id: binary_sensor.your_sensor',
  '        to: "on"',
  '    action:',
  '      - service: homeassistant.turn_on',
  '        target:',
  '          entity_id: switch.your_device',
].join('\n');

const noderedTemplate = (title) => JSON.stringify([
  { id: 'af100', type: 'tab', name: title.slice(0, 40), disabled: false },
  { id: 'af101', type: 'inject', name: 'Trigger', payload: '', payloadType: 'date', repeat: '', once: false, x: 100, y: 100, z: 'af100', wires: [['af102']] },
  { id: 'af102', type: 'function', name: 'Process', func: '// ' + title + '\nreturn msg;', outputs: 1, x: 300, y: 100, z: 'af100', wires: [['af103']] },
  { id: 'af103', type: 'debug', name: 'Output', active: true, x: 500, y: 100, z: 'af100', wires: [] },
], null, 2);

const esphomeTemplate = (title) => [
  '# AutomationForge -- Generated ESPHome Configuration',
  '# Automation: ' + title,
  '#',
  '# Deploy: paste into ESPHome dashboard -> run esphome run your-device.yaml',
  '',
  'esphome:',
  '  name: ' + title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30),
  '  friendly_name: ' + title.slice(0, 50),
  '',
  'esp32:',
  '  board: esp32dev',
  '  framework:',
  '    type: arduino',
  '',
  'logger:',
  'api:',
  '  encryption:',
  '    key: "YOUR_ENCRYPTION_KEY_HERE"',
  'ota:',
  '  - platform: esphome',
  '    password: "YOUR_OTA_PASSWORD"',
  '',
  'wifi:',
  '  ssid: !secret wifi_ssid',
  '  password: !secret wifi_password',
  '',
  'binary_sensor:',
  '  - platform: gpio',
  '    pin: GPIO14',
  '    name: "Input Sensor"',
  '    device_class: motion',
  '',
  'switch:',
  '  - platform: gpio',
  '    pin: GPIO12',
  '    name: "Relay"',
  '    restore_mode: RESTORE_DEFAULT_OFF',
].join('\n');

console.log('  Build Sheets (30)...');
for (const bs of BUILD_SHEETS) {
  const seoTitle = bs.title + ' -- Shelly, Home Assistant, Node-RED & ESPHome Code';
  const seoDesc = bs.intent + '. Get copy-paste working code for all 4 platforms plus a complete parts list and deployment guide.';
  const specJson = JSON.stringify({ intent: bs.intent, assumptions: ['Devices powered and connected to local network'], devices: [], triggers: [], conditions: [], actions: [], safetyNotes: [], partsList: [], renderTargets: ['shelly','ha','nodered','esphome'] });

  const page = insPage.run(bs.slug, bs.title, bs.intent, bs.category, bs.intent, seoTitle, seoDesc, 'published', now, now);
  const spec = insSpec.run(page.lastInsertRowid, specJson, now);

  insOutput.run(spec.lastInsertRowid, 'shelly', shellyTemplate(bs.title, bs.intent), now);
  insOutput.run(spec.lastInsertRowid, 'ha', haTemplate(bs.title, bs.intent), now);
  insOutput.run(spec.lastInsertRowid, 'nodered', noderedTemplate(bs.title), now);
  insOutput.run(spec.lastInsertRowid, 'esphome', esphomeTemplate(bs.title), now);

  process.stdout.write('.');
}

console.log('\nSeed complete!');
console.log('  - ' + PRODUCTS.length + ' products');
console.log('  - ' + SCRIPTS.length + ' scripts');
console.log('  - ' + BUILD_SHEETS.length + ' build sheets');

db.close();
