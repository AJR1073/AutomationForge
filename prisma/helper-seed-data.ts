// Helper page seed data — 12 entries (8 ESPHome + 4 MQTT)

export interface HelperSeed {
  slug: string;
  title: string;
  summary: string;
  category: string;
  seoTitle: string;
  seoDescription: string;
  contentJson: string;
  capabilityTags: string;
  relatedBuildSheetSlugs: string;
}

const h = (
  slug: string, title: string, summary: string, category: string,
  whenToUse: string,
  codeBlocks: { language: string; filename?: string; code: string }[],
  troubleshooting: string[],
  faqs: { q: string; a: string }[],
  capTags: string[],
  relatedSlugs: string[],
): HelperSeed => ({
  slug, title, summary, category,
  seoTitle: `${title} — AutomationForge Helper`,
  seoDescription: `${summary} Step-by-step guide with working code, troubleshooting, and parts list.`,
  contentJson: JSON.stringify({ whenToUse, codeBlocks, troubleshooting, faqs }),
  capabilityTags: JSON.stringify(capTags),
  relatedBuildSheetSlugs: JSON.stringify(relatedSlugs),
});

export const HELPER_PAGES: HelperSeed[] = [
  // ── ESPHome (8) ─────────────────────────────────────────────
  h('esphome-bme280-temperature-humidity-pressure',
    'ESPHome BME280 Temperature, Humidity & Pressure Sensor',
    'Set up a BME280 I2C sensor on ESP32 to report temperature, humidity, and barometric pressure to Home Assistant.',
    'esphome',
    'Use this when you want accurate indoor climate monitoring with a single sensor that reports temperature, humidity, and atmospheric pressure over I2C.',
    [{ language: 'yaml', filename: 'bme280-sensor.yaml', code: `esphome:
  name: bme280-sensor
  friendly_name: BME280 Climate

esp32:
  board: esp32dev
  framework:
    type: arduino

logger:
api:
  encryption:
    key: "YOUR_API_KEY"
ota:
  - platform: esphome
    password: "YOUR_OTA_PASSWORD"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

i2c:
  sda: GPIO21
  scl: GPIO22
  scan: true

sensor:
  - platform: bme280_i2c
    temperature:
      name: "Temperature"
      oversampling: 16x
    pressure:
      name: "Pressure"
    humidity:
      name: "Humidity"
    address: 0x76
    update_interval: 30s` }],
    [
      'If no readings appear, run an I2C scan to verify the address (0x76 or 0x77).',
      'Ensure SDA/SCL wires are connected to the correct GPIO pins.',
      'BME280 and BMP280 are different — BMP280 has no humidity sensor.',
      'If values drift, increase oversampling or add a filter.',
    ],
    [
      { q: 'What is the difference between BME280 and BMP280?', a: 'BME280 measures temperature, humidity, and pressure. BMP280 only measures temperature and pressure — no humidity.' },
      { q: 'What I2C address does the BME280 use?', a: 'Most modules default to 0x76. Some use 0x77 — check with an I2C scan if readings fail.' },
      { q: 'How often should I poll the sensor?', a: '30s is a good default. Faster than 10s may cause slight self-heating.' },
    ],
    ['temperature_sensor', 'humidity_sensor', 'controller', 'esphome'],
    ['thermostat-schedule', 'fan-auto-on-temperature', 'smart-radiator-control']),

  h('esphome-dht22-basic',
    'ESPHome DHT22 Basic Temperature & Humidity',
    'Read temperature and humidity from a DHT22 sensor on ESP32 and publish to Home Assistant.',
    'esphome',
    'Use this for a simple, low-cost temperature and humidity setup when I2C is not needed.',
    [{ language: 'yaml', filename: 'dht22-basic.yaml', code: `esphome:
  name: dht22-basic
  friendly_name: DHT22 Sensor

esp32:
  board: esp32dev
  framework:
    type: arduino

logger:
api:
  encryption:
    key: "YOUR_API_KEY"
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
    update_interval: 30s` }],
    [
      'If you get NaN readings, check your wiring and add a 10kΩ pull-up resistor on the data pin.',
      'DHT22 needs a minimum 2-second interval between reads — 30s is safe.',
      'Use GPIO4 by default; avoid strapping pins (GPIO0, GPIO2, GPIO15).',
      'If the sensor stops responding, power-cycle the ESP32.',
    ],
    [
      { q: 'DHT11 vs DHT22 — which should I use?', a: 'DHT22 is more accurate (±0.5°C vs ±2°C) and has a wider range. Use DHT22 unless cost is the only factor.' },
      { q: 'Do I need a pull-up resistor?', a: 'Most breakout boards include one. If using a bare sensor, add a 10kΩ resistor between VCC and the data pin.' },
      { q: 'Can I use this on ESP8266?', a: 'Yes — change the board to esp8266 (e.g., nodemcuv2) and use an appropriate GPIO pin.' },
    ],
    ['temperature_sensor', 'humidity_sensor', 'controller', 'esphome'],
    ['thermostat-schedule', 'fan-auto-on-temperature', 'window-open-hvac-off']),

  h('esphome-relay-gpio-output',
    'ESPHome Relay GPIO Output Control',
    'Control a relay module via GPIO on ESP32 with ESPHome, including toggle and restore-on-boot.',
    'esphome',
    'Use this when you need to switch a load (light, pump, heater) on/off via a relay connected to an ESP32 GPIO pin.',
    [{ language: 'yaml', filename: 'relay-output.yaml', code: `esphome:
  name: relay-controller
  friendly_name: Relay Controller

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

switch:
  - platform: gpio
    pin: GPIO12
    name: "Relay 1"
    id: relay_1
    restore_mode: RESTORE_DEFAULT_OFF
    inverted: false` }],
    [
      'If the relay clicks but the load does not switch, verify the relay is rated for your voltage/current.',
      'Use RESTORE_DEFAULT_OFF for safety — prevents relay from turning on after power loss.',
      'Some relay modules are active-low — set inverted: true if the relay is on when it should be off.',
      'Never switch mains voltage without proper isolation and electrical knowledge.',
    ],
    [
      { q: 'Which GPIO pins are safe for relays?', a: 'GPIO12, GPIO13, GPIO14, GPIO25-27 are good choices. Avoid strapping pins (GPIO0, 2, 15) and input-only pins (GPIO34-39).' },
      { q: 'Can I control multiple relays?', a: 'Yes — add additional switch entries with different pin numbers and IDs.' },
      { q: 'What does restore_mode do?', a: 'It controls the relay state after reboot. RESTORE_DEFAULT_OFF keeps it off, ALWAYS_ON forces it on.' },
    ],
    ['relay', 'controller', 'esphome'],
    ['motion-activated-lights', 'water-leak-shutoff', 'garden-irrigation-schedule']),

  h('esphome-motion-pir-sensor',
    'ESPHome PIR Motion Sensor Setup',
    'Connect an HC-SR501 PIR motion sensor to ESP32 and trigger automations in Home Assistant.',
    'esphome',
    'Use this to detect motion in a room and trigger lights, alarms, or notifications via Home Assistant.',
    [{ language: 'yaml', filename: 'pir-motion.yaml', code: `esphome:
  name: pir-motion
  friendly_name: PIR Motion

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
    name: "Motion Detected"
    device_class: motion
    filters:
      - delayed_off: 30s` }],
    [
      'Adjust the HC-SR501 potentiometers for sensitivity and delay time.',
      'The delayed_off filter prevents rapid on/off toggling — adjust the value to your needs.',
      'If false triggers occur, reduce sensitivity or add a delayed_on filter.',
      'Mount the sensor away from heat sources like radiators or HVAC vents.',
    ],
    [
      { q: 'What is the detection range of the HC-SR501?', a: 'Up to 7 meters with a 120° detection angle. Adjust the sensitivity potentiometer to reduce range.' },
      { q: 'Why does my sensor keep triggering?', a: 'Common causes: nearby heat sources, pets, or the sensitivity set too high. Add a delayed_on filter to ignore short triggers.' },
      { q: 'Can I use multiple PIR sensors on one ESP32?', a: 'Yes — add additional binary_sensor entries on different GPIO pins.' },
    ],
    ['motion_sensor', 'pir', 'controller', 'esphome'],
    ['motion-activated-lights', 'motion-staircase-night-light', 'motion-security-camera-trigger']),

  h('esphome-i2c-scan-and-address-fix',
    'ESPHome I2C Scan & Address Troubleshooting',
    'Diagnose I2C bus issues: scan for devices, fix address conflicts, and verify wiring.',
    'esphome',
    'Use this when an I2C device (BME280, OLED, etc.) is not detected or returns errors.',
    [{ language: 'yaml', filename: 'i2c-scan.yaml', code: `esphome:
  name: i2c-scanner
  friendly_name: I2C Scanner

esp32:
  board: esp32dev
  framework:
    type: arduino

logger:
  level: DEBUG

api:
ota:
  - platform: esphome
    password: "YOUR_OTA_PASSWORD"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

i2c:
  sda: GPIO21
  scl: GPIO22
  scan: true
  frequency: 100kHz` }],
    [
      'Check the ESPHome log output for "Found i2c device at address 0xNN" messages.',
      'If no devices found, verify SDA→SDA and SCL→SCL wiring (not swapped).',
      'Try reducing frequency to 50kHz for long cable runs.',
      'Some modules need external pull-up resistors (4.7kΩ to 3.3V) on SDA and SCL.',
      'Multiple devices on the same address? Check if the module has an address jumper.',
    ],
    [
      { q: 'What are the default I2C pins on ESP32?', a: 'GPIO21 (SDA) and GPIO22 (SCL). You can reassign them in the i2c config.' },
      { q: 'Can I use multiple I2C devices?', a: 'Yes — as long as each has a unique address. Use the scan feature to check.' },
      { q: 'What I2C frequency should I use?', a: '100kHz is safe for most sensors. Some displays support 400kHz for faster updates.' },
    ],
    ['controller', 'esphome', 'temperature_sensor'],
    ['thermostat-schedule', 'fan-auto-on-temperature', 'smart-radiator-control']),

  h('esphome-wifi-dropouts-stability',
    'ESPHome WiFi Dropout Fixes & Stability',
    'Diagnose and fix frequent WiFi disconnections on ESP32/ESP8266 ESPHome devices.',
    'esphome',
    'Use this when your ESPHome device frequently goes offline or shows "WiFi connection lost" in logs.',
    [{ language: 'yaml', filename: 'wifi-stable.yaml', code: `wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  power_save_mode: NONE
  fast_connect: true
  reboot_timeout: 15min
  output_power: 20dB

  ap:
    ssid: "YOUR_DEVICE_NAME Fallback"
    password: "YOUR_AP_PASSWORD"

  manual_ip:
    static_ip: 192.168.1.100
    gateway: 192.168.1.1
    subnet: 255.255.255.0` }],
    [
      'Set power_save_mode to NONE — this prevents the radio from sleeping and losing connection.',
      'Use a static IP to avoid DHCP lease issues and speed up reconnection.',
      'Enable fast_connect if you know your SSID — skips the full scan on boot.',
      'If still unstable, check your router for channel congestion and try a fixed channel.',
      'Place the ESP within 10m of your access point or add a WiFi repeater.',
    ],
    [
      { q: 'Why does my ESP32 keep disconnecting?', a: 'Common causes: power_save_mode enabled, weak signal, DHCP issues, or router channel congestion. Apply the fixes above.' },
      { q: 'Should I use a static IP?', a: 'Yes — static IPs reduce reconnection time and avoid DHCP lease expiry issues.' },
      { q: 'What does the fallback AP do?', a: 'If the ESP cannot connect to your WiFi, it creates its own hotspot so you can still access and reconfigure it.' },
    ],
    ['controller', 'esphome'],
    ['motion-activated-lights', 'thermostat-schedule', 'energy-monitor-appliance']),

  h('esphome-ota-and-secrets-template',
    'ESPHome OTA Updates & Secrets Template',
    'Set up secure over-the-air updates and a secrets.yaml template for managing credentials.',
    'esphome',
    'Use this to configure OTA updates and centralize your WiFi/API credentials in secrets.yaml.',
    [
      { language: 'yaml', filename: 'secrets.yaml', code: `# secrets.yaml — place in your ESPHome config directory
wifi_ssid: "YOUR_WIFI_SSID"
wifi_password: "YOUR_WIFI_PASSWORD"
api_key: "YOUR_API_ENCRYPTION_KEY"
ota_password: "YOUR_OTA_PASSWORD"` },
      { language: 'yaml', filename: 'device.yaml', code: `esphome:
  name: my-device
  friendly_name: My Device

esp32:
  board: esp32dev
  framework:
    type: arduino

logger:
api:
  encryption:
    key: !secret api_key
ota:
  - platform: esphome
    password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password` },
    ],
    [
      'Never commit secrets.yaml to version control — add it to .gitignore.',
      'Generate a random API key with: openssl rand -base64 32',
      'If OTA fails, check that the device is online and on the same network.',
      'OTA updates require enough free flash space — use a board with 4MB+ flash.',
    ],
    [
      { q: 'What is secrets.yaml?', a: 'A file that stores sensitive values (WiFi passwords, API keys) separately. ESPHome reads it with the !secret directive.' },
      { q: 'How do I generate an API encryption key?', a: 'Run: openssl rand -base64 32 — paste the result as your api_key in secrets.yaml.' },
      { q: 'Can I update over USB after setting up OTA?', a: 'Yes — USB flashing always works as a fallback if OTA fails.' },
    ],
    ['controller', 'esphome'],
    ['motion-activated-lights', 'thermostat-schedule', 'good-morning-routine']),

  h('esphome-deep-sleep-battery-sensor',
    'ESPHome Deep Sleep for Battery-Powered Sensors',
    'Configure deep sleep on ESP32 to maximize battery life for remote sensors.',
    'esphome',
    'Use this for battery-powered sensors that wake periodically, send readings, then sleep to conserve power.',
    [{ language: 'yaml', filename: 'deep-sleep-sensor.yaml', code: `esphome:
  name: battery-sensor
  friendly_name: Battery Sensor

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
  fast_connect: true

deep_sleep:
  run_duration: 30s
  sleep_duration: 5min

sensor:
  - platform: dht
    pin: GPIO4
    model: DHT22
    temperature:
      name: "Outdoor Temperature"
    humidity:
      name: "Outdoor Humidity"
    update_interval: 10s
  - platform: adc
    pin: GPIO35
    name: "Battery Voltage"
    attenuation: 11db
    filters:
      - multiply: 2.0` }],
    [
      'run_duration is how long the ESP stays awake — keep it short (20-30s) for battery life.',
      'sleep_duration controls the interval between readings — 5min is a good balance.',
      'Use fast_connect: true to reduce WiFi connection time during wake cycles.',
      'OTA updates only work while the device is awake — use a longer run_duration temporarily for updates.',
      'Monitor battery voltage via ADC to get low-battery warnings in Home Assistant.',
    ],
    [
      { q: 'How long will a battery last?', a: 'With 5min sleep cycles on a 3000mAh 18650, expect 2-4 weeks. Longer sleep intervals extend battery life significantly.' },
      { q: 'Can I wake the sensor with a button?', a: 'Yes — wire a button to a GPIO and configure a wakeup_pin in the deep_sleep component.' },
      { q: 'Why does OTA fail on deep sleep devices?', a: 'The device is asleep most of the time. Temporarily increase run_duration or press the reset button to keep it awake.' },
    ],
    ['temperature_sensor', 'humidity_sensor', 'controller', 'esphome'],
    ['thermostat-schedule', 'garden-irrigation-schedule', 'rain-sensor-irrigation-skip']),

  // ── MQTT (4) ────────────────────────────────────────────────
  h('mqtt-topic-naming-convention-home',
    'MQTT Topic Naming Conventions for Smart Homes',
    'Best practices for structuring MQTT topic hierarchies in home automation.',
    'mqtt',
    'Use this when setting up MQTT for the first time or reorganizing your topic structure for scalability.',
    [{ language: 'yaml', filename: 'topic-examples.yaml', code: `# Recommended MQTT topic structure
# Pattern: home/{floor}/{room}/{device_type}/{device_id}/{property}

# Examples:
# home/ground/kitchen/light/ceiling/state        → ON/OFF
# home/ground/kitchen/light/ceiling/brightness    → 0-255
# home/ground/kitchen/sensor/temperature/state    → 22.5
# home/first/bedroom/switch/fan/command           → ON/OFF
# home/garage/door/main/state                     → open/closed

# Command topics use /command suffix:
# home/ground/kitchen/light/ceiling/command       → ON/OFF

# Status topics use /state suffix:
# home/ground/kitchen/light/ceiling/state         → ON/OFF

# Availability:
# home/ground/kitchen/light/ceiling/availability  → online/offline` }],
    [
      'Use lowercase, forward-slash separated topics — never use spaces or special characters.',
      'Keep a consistent hierarchy: location → room → device_type → device_id → property.',
      'Use /command for incoming commands and /state for outgoing status — never mix them.',
      'Avoid starting topics with $ — those are reserved for broker system topics.',
    ],
    [
      { q: 'Should I use JSON or plain values in MQTT payloads?', a: 'Use JSON for devices with multiple properties (e.g., sensor bundles). Use plain values (ON/OFF, numbers) for simple switches.' },
      { q: 'How many topic levels should I use?', a: '4-6 levels is typical. Too few loses organization; too many becomes unwieldy.' },
      { q: 'Can I use wildcards?', a: 'Yes — + matches one level, # matches all remaining levels. Example: home/+/kitchen/# subscribes to all kitchen devices on any floor.' },
    ],
    ['controller'],
    ['motion-activated-lights', 'door-open-alert', 'thermostat-schedule']),

  h('mqtt-json-payload-schema-sensors',
    'MQTT JSON Payload Schema for Sensors',
    'Standard JSON payload format for publishing sensor data over MQTT to Home Assistant.',
    'mqtt',
    'Use this when publishing multi-value sensor data (temperature, humidity, battery) as structured JSON payloads.',
    [{ language: 'json', filename: 'sensor-payload.json', code: `{
  "temperature": 22.5,
  "humidity": 45.2,
  "pressure": 1013.25,
  "battery": 87,
  "linkquality": 95,
  "timestamp": "2025-01-15T10:30:00Z"
}` },
    { language: 'yaml', filename: 'ha-mqtt-sensor.yaml', code: `mqtt:
  sensor:
    - name: "Living Room Temperature"
      state_topic: "home/ground/livingroom/sensor/climate/state"
      value_template: "{{ value_json.temperature }}"
      unit_of_measurement: "°C"
      device_class: temperature

    - name: "Living Room Humidity"
      state_topic: "home/ground/livingroom/sensor/climate/state"
      value_template: "{{ value_json.humidity }}"
      unit_of_measurement: "%"
      device_class: humidity

    - name: "Sensor Battery"
      state_topic: "home/ground/livingroom/sensor/climate/state"
      value_template: "{{ value_json.battery }}"
      unit_of_measurement: "%"
      device_class: battery` }],
    [
      'Always include a timestamp field for debugging stale data.',
      'Use value_template with value_json to extract fields in Home Assistant.',
      'Keep payload size under 256KB — MQTT brokers may reject larger messages.',
      'Use retain: true for sensor state so new subscribers get the last value immediately.',
    ],
    [
      { q: 'Should I use JSON or separate topics per value?', a: 'JSON is better for related values (temp + humidity from one sensor). Separate topics work for independent devices.' },
      { q: 'How do I parse JSON in Home Assistant?', a: 'Use value_template: "{{ value_json.field_name }}" in your MQTT sensor configuration.' },
      { q: 'What QoS level should I use for sensors?', a: 'QoS 0 is fine for periodic sensor updates. Use QoS 1 for critical values like leak detection.' },
    ],
    ['temperature_sensor', 'humidity_sensor'],
    ['thermostat-schedule', 'fan-auto-on-temperature', 'energy-monitor-appliance']),

  h('mqtt-home-assistant-mqtt-sensor-template',
    'Home Assistant MQTT Sensor Template',
    'Configure MQTT sensors in Home Assistant with auto-discovery and manual YAML setup.',
    'mqtt',
    'Use this when integrating custom MQTT devices into Home Assistant — covers both auto-discovery and manual configuration.',
    [{ language: 'yaml', filename: 'mqtt-sensor-manual.yaml', code: `# configuration.yaml — manual MQTT sensor setup
mqtt:
  sensor:
    - name: "Garage Temperature"
      state_topic: "home/garage/sensor/temp/state"
      unit_of_measurement: "°C"
      device_class: temperature
      expire_after: 300
      force_update: true

  binary_sensor:
    - name: "Garage Door"
      state_topic: "home/garage/door/main/state"
      payload_on: "open"
      payload_off: "closed"
      device_class: garage_door

  switch:
    - name: "Garage Fan"
      state_topic: "home/garage/fan/main/state"
      command_topic: "home/garage/fan/main/command"
      payload_on: "ON"
      payload_off: "OFF"` },
    { language: 'json', filename: 'auto-discovery.json', code: `{
  "topic": "homeassistant/sensor/garage_temp/config",
  "payload": {
    "name": "Garage Temperature",
    "state_topic": "home/garage/sensor/temp/state",
    "unit_of_measurement": "°C",
    "device_class": "temperature",
    "unique_id": "garage_temp_001",
    "device": {
      "identifiers": ["garage_sensor_01"],
      "name": "Garage Sensor",
      "manufacturer": "DIY"
    }
  }
}` }],
    [
      'After editing configuration.yaml, restart HA or use Developer Tools → YAML → Reload MQTT.',
      'expire_after removes stale entities if no update is received within the timeout.',
      'For auto-discovery, publish a JSON config to homeassistant/{component}/{id}/config with retain.',
      'Check MQTT integration is installed: Settings → Devices → MQTT.',
    ],
    [
      { q: 'Auto-discovery vs manual — which is better?', a: 'Auto-discovery is easier for many devices and self-configures. Manual YAML gives more control and works without discovery.' },
      { q: 'How do I remove a stale auto-discovered entity?', a: 'Publish an empty payload to its config topic: homeassistant/sensor/{id}/config with retain=true.' },
      { q: 'What is expire_after?', a: 'It marks the sensor as unavailable if no MQTT message is received within the specified seconds.' },
      { q: 'Do I need a separate MQTT broker?', a: 'Yes — install Mosquitto as an HA add-on or run it separately. HA connects to it as a client.' },
    ],
    ['controller', 'ha_server', 'temperature_sensor'],
    ['thermostat-schedule', 'door-open-alert', 'smoke-detector-alert']),

  h('mqtt-acl-security-basics-mosquitto',
    'MQTT ACL & Security Basics for Mosquitto',
    'Secure your Mosquitto MQTT broker with authentication, ACLs, and TLS encryption.',
    'mqtt',
    'Use this when hardening your MQTT broker — essential before exposing it to the network or internet.',
    [{ language: 'text', filename: 'mosquitto.conf', code: `# /etc/mosquitto/mosquitto.conf
listener 1883
protocol mqtt

# Authentication
allow_anonymous false
password_file /etc/mosquitto/passwd

# Access Control
acl_file /etc/mosquitto/acl

# Logging
log_dest syslog
log_type warning
log_type error
log_type notice` },
    { language: 'text', filename: 'acl', code: `# /etc/mosquitto/acl
# Pattern: user <username> / topic <read|write|readwrite> <topic>

# Home Assistant — full access
user homeassistant
topic readwrite home/#

# ESP sensors — can only publish to their own topics
user esp_kitchen
topic write home/ground/kitchen/#
topic read home/ground/kitchen/+/command

# Read-only dashboard user
user dashboard
topic read home/#` }],
    [
      'Create password file: mosquitto_passwd -c /etc/mosquitto/passwd <username>',
      'Always set allow_anonymous false in production.',
      'ACL changes require a broker restart to take effect.',
      'For TLS, add certfile/keyfile/cafile directives and use listener 8883.',
      'Test ACL rules with mosquitto_pub/mosquitto_sub using each user account.',
    ],
    [
      { q: 'How do I create MQTT users?', a: 'Run: mosquitto_passwd -c /etc/mosquitto/passwd username — then enter a password. Use -b flag for batch mode.' },
      { q: 'Do I need TLS for a local network?', a: 'For LAN-only use it is optional but recommended. It is mandatory if the broker is exposed to the internet.' },
      { q: 'What happens if ACL denies a publish?', a: 'The message is silently dropped. Enable log_type warning to see denied attempts in the log.' },
    ],
    ['controller'],
    ['door-open-alert', 'smoke-detector-alert', 'water-leak-shutoff']),
];
