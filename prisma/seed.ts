import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { renderShelly } from '../src/lib/engine/renderer-shelly';
import { renderHA } from '../src/lib/engine/renderer-ha';
import { renderNodeRed } from '../src/lib/engine/renderer-nodered';
import { renderESPHome } from '../src/lib/engine/renderer-esphome';
import { buildSpecFromWizard } from '../src/lib/engine/spec-builder';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// ── 30 Build Sheet definitions ────────────────────────────────────────────────

const BUILD_SHEETS = [
  // Lighting
  { slug: 'motion-activated-lights', title: 'Motion-Activated Lights', category: 'Lighting', intent: 'Turn lights on when motion is detected, off after 5 minutes of no motion', devices: ['motion_sensor', 'relay', 'light'], constraints: ['only at night'] },
  { slug: 'sunset-lights-on', title: 'Lights On at Sunset', category: 'Lighting', intent: 'Automatically turn on porch lights at sunset and off at sunrise', devices: ['relay', 'light'], constraints: ['daily schedule'] },
  { slug: 'christmas-lights-schedule', title: 'Christmas Lights Schedule', category: 'Lighting', intent: 'Turn on Christmas lights at dusk and off at midnight on a timer', devices: ['smart_plug'], constraints: ['seasonal schedule'] },
  { slug: 'motion-staircase-night-light', title: 'Staircase Night Light', category: 'Lighting', intent: 'Dim LED strip on staircase when motion detected at night', devices: ['motion_sensor', 'dimmer'], constraints: ['only at night', 'dim to 30%'] },
  { slug: 'smart-dimmer-bedtime', title: 'Bedtime Dimming Routine', category: 'Lighting', intent: 'Gradually dim bedroom lights to off at bedtime to aid sleep', devices: ['dimmer'], constraints: ['only at night', '30 minute ramp'] },

  // Security
  { slug: 'door-open-alert', title: 'Door Open Alert', category: 'Security', intent: 'Send notification when front door is left open for more than 2 minutes', devices: ['door_sensor'], constraints: ['alert after 2 minutes'] },
  { slug: 'motion-security-camera-trigger', title: 'Motion → Camera Record', category: 'Security', intent: 'Trigger camera recording when outdoor motion sensor is activated', devices: ['motion_sensor'], constraints: ['only when away from home'] },
  { slug: 'garage-door-left-open', title: 'Garage Door Left Open Alert', category: 'Security', intent: 'Alert if garage door is left open for more than 10 minutes', devices: ['door_sensor'], constraints: ['alert after 10 minutes'] },
  { slug: 'smoke-detector-alert', title: 'Smoke Detector Smart Alert', category: 'Security', intent: 'Send alerts and turn on all lights when smoke detector triggers', devices: ['smoke_detector', 'light', 'relay'], constraints: ['safety critical'] },
  { slug: 'window-sensor-alarm', title: 'Window Break-In Alert', category: 'Security', intent: 'Alert when window sensor trips while security mode is armed', devices: ['door_sensor'], constraints: ['only when armed'] },

  // Climate
  { slug: 'thermostat-schedule', title: 'Thermostat Schedule', category: 'Climate', intent: 'Set thermostat to away temperature when nobody is home', devices: ['temperature_sensor'], constraints: ['presence-based'] },
  { slug: 'fan-auto-on-temperature', title: 'Fan on When Hot', category: 'Climate', intent: 'Automatically turn on ceiling fan when temperature exceeds 26°C', devices: ['temperature_sensor', 'relay'], constraints: ['temp above 26'] },
  { slug: 'hvac-filter-reminder', title: 'HVAC Filter Reminder', category: 'Climate', intent: 'Send monthly reminder to check and replace HVAC filter', devices: ['smart_plug'], constraints: ['monthly schedule'] },
  { slug: 'window-open-hvac-off', title: 'Window Open → Stop HVAC', category: 'Climate', intent: 'Turn off HVAC system when a window is opened to save energy', devices: ['door_sensor', 'relay'], constraints: [] },
  { slug: 'smart-radiator-control', title: 'Smart Radiator Control', category: 'Climate', intent: 'Control electric radiator based on room temperature and schedule', devices: ['temperature_sensor', 'smart_plug'], constraints: ['morning and evening schedule'] },

  // Energy
  { slug: 'energy-monitor-appliance', title: 'Appliance Energy Monitor', category: 'Energy', intent: 'Monitor washing machine power usage and notify when cycle is done', devices: ['smart_plug'], constraints: ['below 5W = done'] },
  { slug: 'solar-excess-heater', title: 'Solar Excess → Water Heater', category: 'Energy', intent: 'Turn on water heater when solar production exceeds household needs', devices: ['relay', 'smart_plug'], constraints: ['solar export > 1kW'] },
  { slug: 'standby-device-off', title: 'Standby Device Power Off', category: 'Energy', intent: 'Cut power to entertainment system standby devices overnight', devices: ['smart_plug'], constraints: ['midnight to 6am'] },
  { slug: 'peak-tariff-alerts', title: 'Peak Tariff Energy Alert', category: 'Energy', intent: 'Notify when high-tariff electricity period starts and suggest actions', devices: ['smart_plug'], constraints: ['time-based tariff schedule'] },
  { slug: 'ev-charger-off-peak', title: 'EV Charger Off-Peak', category: 'Energy', intent: 'Start EV charger only during off-peak electricity hours', devices: ['relay', 'smart_plug'], constraints: ['off-peak hours only'] },

  // Water & Garden
  { slug: 'water-leak-shutoff', title: 'Water Leak Auto Shutoff', category: 'Water', intent: 'Close main water valve when a leak sensor detects water', devices: ['leak_sensor', 'relay'], constraints: ['safety critical'] },
  { slug: 'garden-irrigation-schedule', title: 'Smart Garden Irrigation', category: 'Garden', intent: 'Water garden automatically at dawn, skip if rain sensor detects rain', devices: ['relay', 'leak_sensor'], constraints: ['skip if wet'] },
  { slug: 'pool-pump-schedule', title: 'Pool Pump Schedule', category: 'Garden', intent: 'Run pool pump 4 hours per day during off-peak electricity hours', devices: ['relay', 'smart_plug'], constraints: ['off-peak schedule'] },
  { slug: 'rain-sensor-irrigation-skip', title: 'Rain Skip for Irrigation', category: 'Garden', intent: 'Automatically skip irrigation if rain sensor detects rainfall', devices: ['leak_sensor', 'relay'], constraints: [] },

  // Convenience
  { slug: 'good-morning-routine', title: 'Good Morning Routine', category: 'Convenience', intent: 'At alarm time: turn on lights gradually, start coffee maker, adjust thermostat', devices: ['light', 'smart_plug', 'dimmer'], constraints: ['weekdays only', 'morning schedule'] },
  { slug: 'leave-home-automation', title: 'Leave Home Automation', category: 'Convenience', intent: 'When leaving home: turn off all lights, lock doors, set security mode', devices: ['light', 'relay', 'door_sensor'], constraints: ['presence detection'] },
  { slug: 'doorbell-smart-alert', title: 'Doorbell Smart Alert', category: 'Convenience', intent: 'When doorbell rings: flash lights inside and send phone notification', devices: ['button', 'light'], constraints: [] },
  { slug: 'pet-feeder-schedule', title: 'Automatic Pet Feeder', category: 'Convenience', intent: 'Trigger automatic pet feeder at scheduled meal times via relay', devices: ['relay', 'button'], constraints: ['morning and evening schedule'] },
  { slug: 'tv-presence-detection', title: 'Room Presence TV Control', category: 'Convenience', intent: 'Turn on TV ambient light when someone enters living room in evening', devices: ['motion_sensor', 'light'], constraints: ['only at night'] },
  { slug: 'car-charging-alert', title: 'Car Charging Complete Alert', category: 'Convenience', intent: 'Notify when EV charging stops drawing power above threshold', devices: ['smart_plug'], constraints: ['power below 500W = done'] },
];

// ── Sample Scripts ────────────────────────────────────────────────────────────

const SCRIPTS = [
  {
    platform: 'shelly',
    title: 'Shelly 1 Single-Button Toggle',
    description: 'Toggle relay on/off with a single push button using Shelly Gen2 Script component.',
    tags: ['relay', 'button', 'toggle', 'shelly-gen2'],
    code: `"use strict";

Shelly.addEventHandler(function(event) {
  if (event.component === "input:0" && event.info.event === "single_push") {
    var current = Shelly.getComponentStatus("switch", 0);
    Shelly.call("Switch.Set", { id: 0, on: !current.output }, null, null);
    print("Toggled relay:", !current.output);
  }
});

print("Single-button toggle script ready.");`,
  },
  {
    platform: 'shelly',
    title: 'Shelly Motion → Light with Timeout',
    description: 'Turn on a light when motion is detected, auto-off after 5 minutes of inactivity.',
    tags: ['motion', 'light', 'timeout', 'auto-off'],
    code: `"use strict";

var OFF_DELAY_MS = 5 * 60 * 1000; // 5 minutes
var offTimer = null;

Shelly.addEventHandler(function(event) {
  if (event.component === "input:0" && event.info.state === true) {
    // Motion detected
    if (offTimer !== null) { Timer.clear(offTimer); offTimer = null; }
    Shelly.call("Switch.Set", { id: 0, on: true }, null, null);
    print("Motion detected — light ON");
    offTimer = Timer.set(OFF_DELAY_MS, false, function() {
      Shelly.call("Switch.Set", { id: 0, on: false }, null, null);
      print("No motion — light OFF");
      offTimer = null;
    }, null);
  }
});

print("Motion light script ready.");`,
  },
  {
    platform: 'ha',
    title: 'HA Motion Light (Night Only)',
    description: 'Turn on a light when motion is detected, but only between sunset and sunrise.',
    tags: ['motion', 'light', 'night', 'sunset'],
    code: `automation:
  - id: motion_light_night
    alias: "Motion Light Night Only"
    trigger:
      - platform: state
        entity_id: binary_sensor.hallway_motion
        to: "on"
    condition:
      - condition: sun
        after: sunset
        before: sunrise
    action:
      - service: light.turn_on
        target:
          entity_id: light.hallway
      - delay:
          minutes: 5
      - service: light.turn_off
        target:
          entity_id: light.hallway`,
  },
  {
    platform: 'ha',
    title: 'HA Door Security Alert',
    description: 'Send a mobile notification when a door is opened while in away mode.',
    tags: ['door', 'security', 'notification', 'away'],
    code: `automation:
  - id: door_security_alert
    alias: "Door Open Alert (Away Mode)"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door
        to: "on"
    condition:
      - condition: state
        entity_id: alarm_control_panel.home
        state: armed_away
    action:
      - service: notify.mobile_app_your_phone
        data:
          title: "🚨 Security Alert"
          message: "Front door opened while you're away!"
          data:
            push:
              sound: "default"`,
  },
  {
    platform: 'nodered',
    title: 'Node-RED MQTT Relay Toggle',
    description: 'Subscribe to an MQTT topic and toggle a Shelly relay via HTTP.',
    tags: ['mqtt', 'relay', 'shelly', 'toggle'],
    code: JSON.stringify([
      { id: 'af00000001', type: 'tab', name: 'MQTT Relay Toggle' },
      { id: 'af00000002', type: 'mqtt in', name: 'MQTT Subscribe', topic: 'home/relay/command', broker: 'your-broker', x: 100, y: 100, z: 'af00000001', wires: [['af00000003']] },
      { id: 'af00000003', type: 'function', name: 'Build URL', func: 'var on = msg.payload === "ON";\nmsg.url = "http://YOUR_SHELLY_IP/rpc/Switch.Set?id=0&on=" + on;\nreturn msg;', outputs: 1, x: 320, y: 100, z: 'af00000001', wires: [['af00000004']] },
      { id: 'af00000004', type: 'http request', name: 'Shelly API', method: 'GET', ret: 'txt', url: '', x: 520, y: 100, z: 'af00000001', wires: [[]] },
    ], null, 2),
  },
  {
    platform: 'nodered',
    title: 'Node-RED Morning Routine',
    description: 'Trigger a morning routine at 7am on weekdays via cron schedule.',
    tags: ['schedule', 'morning', 'routine', 'cron'],
    code: JSON.stringify([
      { id: 'af00000010', type: 'tab', name: 'Morning Routine' },
      { id: 'af00000011', type: 'inject', name: 'Weekday 7am', crontab: '0 7 * * 1-5', repeat: '', once: false, payload: 'morning', payloadType: 'str', x: 100, y: 100, z: 'af00000010', wires: [['af00000012', 'af00000013']] },
      { id: 'af00000012', type: 'http request', name: 'Lights On', method: 'POST', url: 'http://YOUR_HA/api/services/light/turn_on', x: 380, y: 80, z: 'af00000010', wires: [[]] },
      { id: 'af00000013', type: 'http request', name: 'Coffee Maker On', method: 'POST', url: 'http://YOUR_HA/api/services/switch/turn_on', x: 380, y: 140, z: 'af00000010', wires: [[]] },
    ], null, 2),
  },
  {
    platform: 'esphome',
    title: 'ESPHome DHT22 Temperature Monitor',
    description: 'Read temperature and humidity from a DHT22 sensor and publish to Home Assistant.',
    tags: ['temperature', 'humidity', 'dht22', 'sensor'],
    code: `esphome:
  name: temp-monitor
  friendly_name: Temperature Monitor

esp32:
  board: esp32dev
  framework:
    type: arduino

logger:
api:
  encryption:
    key: "YOUR_KEY_HERE"
ota:
  - platform: esphome
    password: "YOUR_OTA_PASSWORD"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

sensor:
  - platform: dht
    pin: GPIO4
    model: DHT22
    temperature:
      name: "Room Temperature"
    humidity:
      name: "Room Humidity"
    update_interval: 30s`,
  },
  {
    platform: 'esphome',
    title: 'ESPHome PIR Motion + Relay',
    description: 'PIR motion sensor triggers a relay with auto-off after 60 seconds.',
    tags: ['pir', 'motion', 'relay', 'auto-off'],
    code: `esphome:
  name: motion-relay
  friendly_name: Motion Relay

esp32:
  board: esp32dev
  framework:
    type: arduino

logger:
api:
ota:
  - platform: esphome
    password: "YOUR_OTA_PASSWORD"
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

binary_sensor:
  - platform: gpio
    pin:
      number: GPIO14
      mode: INPUT_PULLUP
    name: "Motion Sensor"
    device_class: motion
    on_press:
      then:
        - switch.turn_on: relay_output
        - delay: 60s
        - switch.turn_off: relay_output

switch:
  - platform: gpio
    pin: GPIO12
    name: "Relay Output"
    id: relay_output
    restore_mode: RESTORE_DEFAULT_OFF`,
  },
  {
    platform: 'shelly',
    title: 'Shelly Energy Monitor Alert',
    description: 'Alert via webhook when power consumption drops below threshold (appliance done).',
    tags: ['energy', 'power', 'webhook', 'appliance'],
    code: `"use strict";

var THRESHOLD_W = 5;  // Below 5W = appliance done
var WEBHOOK_URL = "https://YOUR_WEBHOOK_URL";
var alerted = false;

Timer.set(30000, true, function() {
  var em = Shelly.getComponentStatus("em", 0);
  if (!em) return;
  var watts = em.act_power;
  print("Current power:", watts, "W");

  if (watts < THRESHOLD_W && !alerted) {
    alerted = true;
    Shelly.call("HTTP.Request", {
      method: "POST",
      url: WEBHOOK_URL,
      body: JSON.stringify({ message: "Appliance done!", power: watts })
    }, null, null);
    print("Alert sent: appliance completed");
  } else if (watts >= THRESHOLD_W) {
    alerted = false;
  }
}, null);`,
  },
  {
    platform: 'ha',
    title: 'HA Goodnight Routine',
    description: 'Turn off all lights, lock doors, and set alarm when goodnight button is pressed.',
    tags: ['goodnight', 'routine', 'lights', 'security'],
    code: `automation:
  - id: goodnight_routine
    alias: "Goodnight Routine"
    trigger:
      - platform: state
        entity_id: input_button.goodnight
    action:
      - service: light.turn_off
        target:
          area_id: all
      - service: lock.lock
        target:
          entity_id: lock.front_door
      - service: alarm_control_panel.alarm_arm_home
        target:
          entity_id: alarm_control_panel.home
        data:
          code: !secret alarm_code
      - service: climate.set_temperature
        target:
          entity_id: climate.thermostat
        data:
          temperature: 18
          hvac_mode: heat`,
  },
];

// ── Sample Products ───────────────────────────────────────────────────────────

const PRODUCTS = [
  { name: 'Shelly 1 Gen3', brand: 'Shelly', tags: ['relay', 'switch'], price: '$12', image: '/products/shelly-relay.png', asin: 'B0D8YPW46Y', affiliate: 'https://www.amazon.com/s?k=Shelly+1+Gen3+relay&tag=automforge20-20' },
  { name: 'Shelly Plug S Gen3', brand: 'Shelly', tags: ['smart_plug', 'energy_monitor'], price: '$18', image: '/products/smart-plug.png', asin: 'B0D2K21VJD', affiliate: 'https://www.amazon.com/s?k=Shelly+Plug+S+smart+plug&tag=automforge20-20' },
  { name: 'Shelly 1PM Plus', brand: 'Shelly', tags: ['relay', 'energy_monitor'], price: '$16', image: '/products/shelly-relay.png', asin: 'B0BKR3M5MB', affiliate: 'https://www.amazon.com/s?k=Shelly+1PM+Plus+relay&tag=automforge20-20' },
  { name: 'Shelly Dimmer 2', brand: 'Shelly', tags: ['dimmer', 'light'], price: '$22', image: '/products/dimmer.png', asin: 'B08182Y88D', affiliate: 'https://www.amazon.com/s?k=Shelly+Dimmer+2&tag=automforge20-20' },
  { name: 'Aqara Motion Sensor P1', brand: 'Aqara', tags: ['motion_sensor', 'zigbee'], price: '$18', image: '/products/motion-sensor.png', asin: 'B0B9XZ1D51', affiliate: 'https://www.amazon.com/s?k=Aqara+Motion+Sensor+P1&tag=automforge20-20' },
  { name: 'Sonoff ZBDONGLE-P Zigbee Coordinator', brand: 'Sonoff', tags: ['zigbee_coordinator'], price: '$20', image: '/products/zigbee-dongle.png', asin: 'B09KXTCMSC', affiliate: 'https://www.amazon.com/s?k=Sonoff+ZBDONGLE-P+Zigbee&tag=automforge20-20' },
  { name: 'ESP32 Development Board', brand: 'Espressif', tags: ['controller', 'esphome'], price: '$8', image: '/products/esp32.png', asin: 'B0B19KRJN6', affiliate: 'https://www.amazon.com/s?k=ESP32+development+board&tag=automforge20-20' },
  { name: 'DHT22 Temperature Sensor', brand: 'Generic', tags: ['temperature_sensor', 'humidity_sensor'], price: '$5', image: '/products/temp-sensor.png', asin: 'B0795F19W6', affiliate: 'https://www.amazon.com/s?k=DHT22+temperature+humidity+sensor&tag=automforge20-20' },
  { name: 'DS18B20 Waterproof Temp Sensor', brand: 'Generic', tags: ['temperature_sensor', 'waterproof'], price: '$6', image: '/products/temp-sensor.png', asin: 'B012C597T0', affiliate: 'https://www.amazon.com/s?k=DS18B20+waterproof+temperature+sensor&tag=automforge20-20' },
  { name: 'Magnetic Door/Window Sensor', brand: 'Aqara', tags: ['door_sensor', 'zigbee'], price: '$15', image: '/products/door-sensor.png', asin: 'B07D37VDM3', affiliate: 'https://www.amazon.com/s?k=Aqara+door+window+sensor+zigbee&tag=automforge20-20' },
  { name: 'GOVEE Water Leak Sensor', brand: 'Govee', tags: ['leak_sensor', 'wifi'], price: '$20', image: '/products/leak-sensor.png', asin: 'B07PLLSJPG', affiliate: 'https://www.amazon.com/s?k=Govee+water+leak+sensor&tag=automforge20-20' },
  { name: 'Raspberry Pi 4 (2GB)', brand: 'Raspberry Pi', tags: ['controller', 'ha_server'], price: '$50', image: '/products/raspberry-pi.png', asin: 'B07TD42S27', affiliate: 'https://www.amazon.com/s?k=Raspberry+Pi+4+2GB&tag=automforge20-20' },
  { name: 'WLED LED Strip Controller', brand: 'WLED', tags: ['light', 'led_strip', 'esphome'], price: '$15', image: '/products/esp32.png', asin: 'B0B6GP2G8C', affiliate: 'https://www.amazon.com/s?k=WLED+ESP32+LED+strip+controller&tag=automforge20-20' },
  { name: 'PIR Motion Sensor HC-SR501', brand: 'Generic', tags: ['motion_sensor', 'pir'], price: '$3', image: '/products/motion-sensor.png', asin: 'B07KBWVJMP', affiliate: 'https://www.amazon.com/s?k=HC-SR501+PIR+motion+sensor&tag=automforge20-20' },
  { name: 'Zigbee Smart Plug (Ikea Tradfri)', brand: 'IKEA', tags: ['smart_plug', 'zigbee', 'energy_monitor'], price: '$12', image: '/products/smart-plug.png', asin: 'B09FX3876P', affiliate: 'https://www.amazon.com/s?k=IKEA+Tradfri+smart+plug+zigbee&tag=automforge20-20' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await db.event.deleteMany();
  await db.pageView.deleteMany();
  await db.affiliateLink.deleteMany();
  await db.product.deleteMany();
  await db.script.deleteMany();
  await db.renderedOutput.deleteMany();
  await db.automationSpec.deleteMany();
  await db.automationPage.deleteMany();

  // Seed Products
  console.log('  → Products...');
  for (const p of PRODUCTS) {
    const product = await db.product.create({
      data: {
        name: p.name,
        brand: p.brand,
        capabilityTags: JSON.stringify(p.tags),
        priceHint: p.price,
        imageUrl: p.image,
        asin: p.asin,
        active: true,
      },
    });
    await db.affiliateLink.create({
      data: {
        productId: product.id,
        network: 'amazon',
        url: p.affiliate,
        country: 'US',
      },
    });
  }

  // Seed Scripts
  console.log('  → Scripts...');
  for (const s of SCRIPTS) {
    await db.script.create({
      data: {
        platform: s.platform,
        title: s.title,
        description: s.description,
        codeText: s.code,
        tags: JSON.stringify(s.tags),
        active: true,
      },
    });
  }

  // Seed Build Sheets
  console.log('  → Build Sheets (30)...');
  for (const bs of BUILD_SHEETS) {
    const spec = buildSpecFromWizard({
      goal: bs.intent,
      deviceTypes: bs.devices,
      constraints: bs.constraints,
      platforms: ['shelly', 'ha', 'nodered', 'esphome'],
    });

    const page = await db.automationPage.create({
      data: {
        slug: bs.slug,
        title: bs.title,
        summary: bs.intent,
        category: bs.category,
        primaryIntent: bs.intent,
        seoTitle: `${bs.title} — Shelly, Home Assistant, Node-RED, ESPHome`,
        seoDescription: `${bs.intent}. Get working code for Shelly, Home Assistant, Node-RED, and ESPHome with a complete parts list and step-by-step instructions.`,
        status: 'published',
      },
    });

    const automationSpec = await db.automationSpec.create({
      data: {
        pageId: page.id,
        specJson: JSON.stringify(spec),
        version: 1,
      },
    });

    // Render all 4 platforms
    await db.renderedOutput.createMany({
      data: [
        { specId: automationSpec.id, platform: 'shelly', codeText: renderShelly(spec) },
        { specId: automationSpec.id, platform: 'ha', codeText: renderHA(spec) },
        { specId: automationSpec.id, platform: 'nodered', codeText: renderNodeRed(spec) },
        { specId: automationSpec.id, platform: 'esphome', codeText: renderESPHome(spec) },
      ],
    });

    process.stdout.write('.');
  }

  console.log('\n✅ Seed complete!');
  console.log(`   - ${PRODUCTS.length} products`);
  console.log(`   - ${SCRIPTS.length} scripts`);
  console.log(`   - ${BUILD_SHEETS.length} build sheets`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
