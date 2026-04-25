import { AutomationSpec } from './types';

/**
 * Renders an AutomationSpec as ESPHome YAML configuration
 */
export function renderESPHome(spec: AutomationSpec): string {
  const { intent, devices, triggers, conditions, actions, safetyNotes } = spec;

  const safetyBlock = safetyNotes.length
    ? `# ⚠️  Safety Notes:\n${safetyNotes.map((n) => `#   ${n}`).join('\n')}\n#\n`
    : '';

  const deviceComment = devices
    .map((d) => `#   - ${d.name} (${d.type})`)
    .join('\n');

  // Board/platform defaults
  const hasTemp = devices.some((d) => d.type.includes('temp'));
  const hasMotion = devices.some((d) => d.type.includes('motion') || d.type.includes('pir'));
  const hasRelay = devices.some((d) => d.type.includes('relay') || d.type.includes('switch'));
  const hasLight = devices.some((d) => d.type.includes('light') || d.type.includes('led'));

  const sensorsBlock = [];

  if (hasTemp) {
    sensorsBlock.push(`# Temperature & Humidity Sensor (DHT22 on GPIO4)
sensor:
  - platform: dht
    pin: GPIO4
    temperature:
      name: "${intent} Temperature"
      id: main_temperature
    humidity:
      name: "${intent} Humidity"
      id: main_humidity
    update_interval: 60s`);
  }

  if (hasMotion) {
    sensorsBlock.push(`# PIR Motion Sensor (GPIO14)
binary_sensor:
  - platform: gpio
    pin:
      number: GPIO14
      mode: INPUT_PULLUP
    name: "${intent} Motion"
    id: motion_sensor
	    device_class: motion
	    on_press:
	      then:
	        - logger.log: "Motion detected!"
	        - script.execute: run_automation`);
  }

  if (hasRelay) {
    sensorsBlock.push(`# Relay / Switch (GPIO12)
switch:
  - platform: gpio
    pin: GPIO12
    name: "${intent} Relay"
    id: main_relay
    restore_mode: RESTORE_DEFAULT_OFF`);
  }

  if (hasLight) {
    sensorsBlock.push(`# LED Light Strip (GPIO13, PWM)
light:
  - platform: monochromatic
    output: light_output
    name: "${intent} Light"
    id: main_light

output:
  - platform: ledc
    pin: GPIO13
    id: light_output`);
  }

  if (!sensorsBlock.length) {
    sensorsBlock.push(`# GPIO pin configuration — update pins to match your board
binary_sensor:
  - platform: gpio
    pin:
      number: GPIO14
      mode: INPUT_PULLUP
	    name: "${intent} Input"
	    id: main_input
	    on_press:
	      then:
	        - script.execute: run_automation

switch:
  - platform: gpio
    pin: GPIO12
    name: "${intent} Output"
    id: main_output`);
  }

  const automationTriggers = triggers
    .map((t) => {
      if (t.type === 'time') {
        return `      - cron: "0 ${(t.at || '08:00').replace(':', ' ')} * * *"`;
      }
      if (t.type === 'numeric_state') {
        return `      - sensor.on_value_range:
          id: main_temperature
          above: ${t.value || 25.0}`;
      }
      return `      - binary_sensor.on_press:
          id: main_input`;
    })
    .join('\n');

  const automationActions = actions
    .map((a) => {
      if (a.type === 'turn_on') return `          - switch.turn_on: main_relay`;
      if (a.type === 'turn_off') return `          - switch.turn_off: main_relay`;
      if (a.type === 'delay')
        return `          - delay: ${Math.floor((a.duration || 5000) / 1000)}s`;
      if (a.type === 'notify') return `          - homeassistant.event:
              event: automationforge_notification
              data:
                message: "${a.message || intent}"`;
      return `          - logger.log: "Action: ${a.type}"`;
    })
    .join('\n');

  const conditionCode =
    conditions.length > 0
      ? `          - if:
              condition:
                lambda: |
                  // Conditions: ${conditions.map((c) => `${c.type} ${c.operator || ''} ${c.value || ''}`).join(', ')}
                  return true;
              then:
${automationActions || '                - logger.log: "Automation triggered"'}
`
      : '';

  return `# AutomationForge — Generated ESPHome Configuration
# Automation: ${intent}
#
# Required devices:
${deviceComment}
#
${safetyBlock}# Deploy: copy to your ESPHome dashboard → New Device → use manual config
# Then: esphome run ${intent.toLowerCase().replace(/\s+/g, '-')}.yaml

esphome:
  name: ${intent.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30)}
  friendly_name: ${intent.slice(0, 50)}

esp32:
  board: esp32dev
  framework:
    type: arduino

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: "YOUR_ENCRYPTION_KEY_HERE"

ota:
  - platform: esphome
    password: "YOUR_OTA_PASSWORD_HERE"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "${intent.slice(0, 20)} Fallback"
    password: "fallback1234"

captive_portal:

	${sensorsBlock.join('\n\n')}

	script:
	  - id: run_automation
	    mode: restart
	    then:
	${conditionCode || automationActions || '          - logger.log: "Automation triggered"'}

	# ── Automation ────────────────────────────────────────────────────────────────
	${
	  automationTriggers
	    ? `# Inline automation triggered by sensor events
	# Sensor events call script.execute: run_automation above.
	# For complex automations, use Home Assistant's automation engine via the API.`
    : ''
}
`;
}
