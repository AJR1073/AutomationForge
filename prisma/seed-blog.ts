/**
 * Seed 5 blog posts for content marketing.
 * Run: npx tsx prisma/seed-blog.ts
 */
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const posts = [
  {
    slug: 'shelly-vs-esphome-which-platform',
    title: 'Shelly vs ESPHome: Which Platform Should You Choose?',
    excerpt: 'A head-to-head comparison of Shelly and ESPHome for home automation. We cover ease of setup, flexibility, cost, and when to use each one.',
    category: 'comparison',
    tags: JSON.stringify(['shelly', 'esphome', 'comparison', 'home automation']),
    seoTitle: 'Shelly vs ESPHome — Which Home Automation Platform Is Best?',
    seoDescription: 'Comparing Shelly devices and ESPHome for smart home automation. Detailed breakdown of setup, cost, flexibility, and best use cases for each platform.',
    contentHtml: `
<h2>The Two Most Popular DIY Automation Platforms</h2>
<p>If you're building a smart home without relying on cloud-only ecosystems, two platforms stand out: <strong>Shelly</strong> and <strong>ESPHome</strong>. Both are local-first, both work with Home Assistant, and both have passionate communities. But they take very different approaches.</p>

<h2>Shelly: Plug-and-Play Automation</h2>
<p>Shelly devices are pre-built, certified hardware that you install behind switches, in junction boxes, or on DIN rails. They come with a built-in web UI, cloud app (optional), and support for scripting via JavaScript (Gen2+).</p>
<ul>
<li><strong>Best for:</strong> People who want to automate without soldering or flashing firmware</li>
<li><strong>Setup time:</strong> Minutes — connect to WiFi, configure via app</li>
<li><strong>Code support:</strong> JavaScript scripts on Gen2/Gen3 devices</li>
<li><strong>Cost:</strong> $12–$40 per device depending on the model</li>
</ul>

<h2>ESPHome: Maximum Flexibility</h2>
<p>ESPHome is a firmware framework for ESP32/ESP8266 boards. You define your device in YAML, flash it, and it integrates directly with Home Assistant. You can use any sensor, relay, or display — the hardware possibilities are essentially unlimited.</p>
<ul>
<li><strong>Best for:</strong> Makers who want full control over hardware and logic</li>
<li><strong>Setup time:</strong> Longer — requires flashing, wiring, and YAML configuration</li>
<li><strong>Code support:</strong> YAML configuration with C++ lambda support</li>
<li><strong>Cost:</strong> $3–$15 per board + components</li>
</ul>

<h2>Head-to-Head Comparison</h2>
<p>Here's how they stack up on the factors that matter most:</p>
<ul>
<li><strong>Ease of setup:</strong> Shelly wins — no flashing, no soldering</li>
<li><strong>Flexibility:</strong> ESPHome wins — any sensor, any protocol</li>
<li><strong>Reliability:</strong> Tie — both run locally without cloud dependency</li>
<li><strong>Cost at scale:</strong> ESPHome wins — cheaper per node for large deployments</li>
<li><strong>Safety certifications:</strong> Shelly wins — UL/CE certified for mains wiring</li>
</ul>

<h2>Our Recommendation</h2>
<p>Use <strong>Shelly</strong> for anything that touches mains electricity (light switches, relays, power monitoring). Use <strong>ESPHome</strong> for sensors, displays, and custom projects where you need specific hardware.</p>
<p>The best smart homes use both. AutomationForge generates code for both platforms — <a href="/build">try the build wizard</a> to see working code for your specific automation.</p>
`,
  },
  {
    slug: '5-automations-that-save-money',
    title: '5 Home Automations That Actually Save You Money',
    excerpt: 'Not all smart home automations are about convenience. These 5 setups will reduce your electricity bill, prevent water damage, and pay for themselves.',
    category: 'guide',
    tags: JSON.stringify(['energy saving', 'cost reduction', 'smart home', 'practical']),
    seoTitle: '5 Home Automations That Save Money — Shelly & Home Assistant',
    seoDescription: 'Five practical home automations that reduce your electricity and water bills. Includes working code for Shelly, Home Assistant, Node-RED, and ESPHome.',
    contentHtml: `
<h2>Smart Home Automation That Pays For Itself</h2>
<p>Most smart home content focuses on cool demos. But the real value is in automations that <strong>save you money every month</strong>. Here are five setups that genuinely pay for themselves — with actual code you can deploy today.</p>

<h2>1. Vampire Power Shutoff</h2>
<p>Many devices draw 5–15W even when "off." A smart plug that cuts power when the device enters standby can save $50–$100/year for a home office setup.</p>
<p><strong>Hardware:</strong> Shelly Plug S or any smart plug with power monitoring</p>
<p><strong>Logic:</strong> When power drops below 3W for 5 minutes → cut power. When button pressed → restore power.</p>
<p><a href="/build-sheets/vampire-power-shutoff">View the full build sheet →</a></p>

<h2>2. HVAC Schedule Override</h2>
<p>Your HVAC running while you're away is the biggest energy waste in most homes. A presence-based automation saves 15–25% on heating/cooling.</p>
<p><strong>Hardware:</strong> Smart thermostat or Shelly relay + temperature sensor</p>
<p><strong>Logic:</strong> When no one is home for 30 minutes → set to eco mode. When someone arrives → restore comfort temp.</p>

<h2>3. Water Leak Detection & Auto-Shutoff</h2>
<p>A single water leak can cause $10,000+ in damage. A $25 sensor + $40 shutoff valve automation prevents that entirely.</p>
<p><strong>Hardware:</strong> Water leak sensor + smart valve actuator</p>
<p><strong>Logic:</strong> When leak detected → close main valve → send alert</p>
<p><a href="/build-sheets/water-leak-shutoff">View the full build sheet →</a></p>

<h2>4. Motion-Based Lighting</h2>
<p>Lights left on in empty rooms account for 10–15% of your electricity bill. Motion sensors fix this permanently.</p>
<p><strong>Hardware:</strong> Motion sensor + Shelly relay or smart bulb</p>
<p><strong>Logic:</strong> Motion detected → lights on. No motion for 5 min → lights off. Override during movie time.</p>
<p><a href="/build-sheets/motion-activated-lights">View the full build sheet →</a></p>

<h2>5. Solar-Aware Appliance Scheduling</h2>
<p>If you have solar panels, running heavy appliances during peak generation can save significant money on grid power.</p>
<p><strong>Hardware:</strong> Power monitoring device + smart plugs</p>
<p><strong>Logic:</strong> When solar generation exceeds threshold → enable EV charging / dishwasher / pool pump</p>

<h2>Getting Started</h2>
<p>Each of these automations can be built with our <a href="/build">automation code generator</a>. Describe what you want, and we'll give you working code for Shelly, Home Assistant, Node-RED, and ESPHome.</p>
<p>Not sure what hardware to buy? Check our <a href="/starter-kit">starter kit guide</a>.</p>
`,
  },
  {
    slug: 'getting-started-home-assistant-2026',
    title: 'Getting Started with Home Assistant Automations in 2026',
    excerpt: 'A practical beginner\'s guide to creating Home Assistant automations. Covers YAML format, triggers, conditions, actions, and common patterns.',
    category: 'tutorial',
    tags: JSON.stringify(['home assistant', 'beginner', 'yaml', 'tutorial']),
    seoTitle: 'Home Assistant Automations for Beginners — 2026 Guide',
    seoDescription: 'Learn to write Home Assistant automations in 2026. This beginner guide covers triggers, conditions, actions, and YAML formatting with real examples.',
    contentHtml: `
<h2>Why Home Assistant?</h2>
<p>Home Assistant is the most popular open-source home automation platform. It runs locally on a Raspberry Pi or mini PC, supports 2,000+ integrations, and gives you complete control over your data. But writing automations can be intimidating if you're new.</p>

<h2>Anatomy of an Automation</h2>
<p>Every Home Assistant automation has three parts:</p>
<ol>
<li><strong>Trigger:</strong> What starts the automation (motion detected, time of day, state change)</li>
<li><strong>Condition:</strong> Optional checks that must be true (only after sunset, only on weekdays)</li>
<li><strong>Action:</strong> What happens (turn on light, send notification, activate scene)</li>
</ol>

<h2>Your First Automation: Motion-Activated Light</h2>
<pre><code>automation:
  - alias: "Motion Light - Hallway"
    trigger:
      - platform: state
        entity_id: binary_sensor.hallway_motion
        to: "on"
    condition:
      - condition: sun
        after: sunset
    action:
      - service: light.turn_on
        target:
          entity_id: light.hallway
        data:
          brightness_pct: 80
      - delay: "00:03:00"
      - service: light.turn_off
        target:
          entity_id: light.hallway</code></pre>

<h2>Common Trigger Types</h2>
<ul>
<li><strong>State trigger:</strong> When an entity changes state</li>
<li><strong>Time trigger:</strong> At a specific time or interval</li>
<li><strong>Sun trigger:</strong> At sunrise or sunset (with offset)</li>
<li><strong>Numeric state:</strong> When a sensor crosses a threshold</li>
<li><strong>Webhook:</strong> From an external HTTP request</li>
</ul>

<h2>Pro Tips</h2>
<ul>
<li>Use <code>mode: restart</code> for motion automations so the timer resets on new motion</li>
<li>Use <code>choose:</code> for if/else logic within a single automation</li>
<li>Use <code>variables:</code> to calculate values once and reuse them</li>
<li>Always test with the Developer Tools → Services panel first</li>
</ul>

<h2>Generate HA Code Automatically</h2>
<p>Don't want to write YAML by hand? <a href="/build">Use our automation generator</a> — describe your goal in plain English and get working Home Assistant YAML instantly.</p>
`,
  },
  {
    slug: 'motion-activated-lights-any-platform',
    title: 'How to Set Up Motion-Activated Lights with Any Platform',
    excerpt: 'The complete guide to motion-activated lighting. Covers Shelly, Home Assistant, Node-RED, and ESPHome with working code for each platform.',
    category: 'tutorial',
    tags: JSON.stringify(['motion sensor', 'lighting', 'shelly', 'home assistant', 'esphome']),
    seoTitle: 'Motion-Activated Lights — Shelly, Home Assistant, Node-RED & ESPHome Code',
    seoDescription: 'Set up motion-activated lights with working code for Shelly, Home Assistant, Node-RED, and ESPHome. Covers hardware selection, timeout logic, and brightness control.',
    contentHtml: `
<h2>The Most Popular Automation</h2>
<p>Motion-activated lighting is the single most useful home automation. It's practical (no fumbling for switches), saves energy (lights turn off automatically), and works in every room of your house.</p>

<h2>Hardware You Need</h2>
<ul>
<li><strong>Motion sensor:</strong> Any PIR or mmWave sensor (Shelly Motion, Aqara P1, IKEA Vallhorn)</li>
<li><strong>Light control:</strong> Smart bulb, Shelly relay behind existing switch, or smart plug for lamps</li>
<li><strong>Optional:</strong> Lux sensor to only activate when it's dark</li>
</ul>

<h2>The Logic Pattern</h2>
<p>Every platform implements the same core logic:</p>
<ol>
<li>Motion detected → turn on light</li>
<li>Start a timeout timer (e.g., 5 minutes)</li>
<li>New motion detected → restart the timer</li>
<li>Timer expires → turn off light</li>
<li>Optional: Only activate when ambient light is below threshold</li>
</ol>

<h2>Platform-Specific Code</h2>
<p>We've written complete implementations for all four platforms in our <a href="/build-sheets/motion-activated-lights">Motion-Activated Lights build sheet</a>. Each includes:</p>
<ul>
<li>Full working code — copy and paste</li>
<li>Configurable timeout and brightness</li>
<li>Dark-only activation (lux threshold)</li>
<li>Override/disable switch</li>
</ul>

<h2>Pro Tips</h2>
<ul>
<li><strong>Bathroom:</strong> Use a longer timeout (10–15 min) and add a humidity sensor to keep lights on during showers</li>
<li><strong>Hallway:</strong> Use a short timeout (2–3 min) and lower brightness at night</li>
<li><strong>Kitchen:</strong> Use mmWave sensors instead of PIR — they detect presence (sitting still) not just motion</li>
<li><strong>Bedroom:</strong> Add a "movie mode" override that disables the automation</li>
</ul>

<h2>Generate Code For Your Setup</h2>
<p>Every room is different. Use our <a href="/build">automation generator</a> to describe your specific setup and get customized code for all four platforms.</p>
`,
  },
  {
    slug: 'smart-home-starter-kit-what-you-need',
    title: 'The Complete Smart Home Starter Kit: What You Actually Need',
    excerpt: 'Skip the marketing hype. Here\'s exactly what hardware you need to start automating your home — organized by budget with real product recommendations.',
    category: 'guide',
    tags: JSON.stringify(['starter kit', 'hardware', 'buying guide', 'beginner']),
    seoTitle: 'Smart Home Starter Kit 2026 — What Hardware You Actually Need',
    seoDescription: 'The essential smart home starter kit for 2026. Three budget tiers with specific product recommendations for Shelly, ESP32, and Home Assistant.',
    contentHtml: `
<h2>Don't Overbuy</h2>
<p>The biggest mistake new smart home builders make is buying too much hardware before they know what they actually need. Start small, automate one thing well, then expand.</p>

<h2>The $50 Essential Kit</h2>
<p>Start with the three devices that give you the most impact:</p>
<ul>
<li><strong>1x Shelly Plus 1 relay (~$12):</strong> Automate one existing light switch without changing the switch itself</li>
<li><strong>1x Motion sensor (~$18):</strong> The trigger for your first automation</li>
<li><strong>1x Smart plug with power monitoring (~$15):</strong> Control a lamp and track power usage</li>
</ul>
<p>With just these three devices, you can build motion-activated lighting and power monitoring — the two most practical automations.</p>

<h2>The $120 Standard Kit</h2>
<p>Add sensors and expand coverage:</p>
<ul>
<li>Everything in the Essential kit, plus:</li>
<li><strong>1x Temperature/humidity sensor (~$15):</strong> Climate-aware automations</li>
<li><strong>1x Door/window sensor (~$12):</strong> Security alerts and HVAC optimization</li>
<li><strong>2x Additional smart bulbs (~$25):</strong> Multi-room lighting control</li>
<li><strong>1x Additional relay (~$12):</strong> Second room automation</li>
</ul>

<h2>The $250 Advanced Kit</h2>
<p>Full-house automation coverage:</p>
<ul>
<li>Everything in the Standard kit, plus:</li>
<li><strong>Water leak sensor (~$15):</strong> Prevent water damage</li>
<li><strong>Power monitor (~$20):</strong> Whole-house energy tracking</li>
<li><strong>Dimmer module (~$18):</strong> Smooth brightness control</li>
<li><strong>RGBW controller (~$20):</strong> Color lighting and ambiance</li>
<li><strong>Additional sensors and relays (~$40):</strong> Cover remaining rooms</li>
</ul>

<h2>Shop the Kits</h2>
<p>We've put together curated kits with tested, compatible products. Each tier includes a one-click "Buy All" button for Amazon:</p>
<p><a href="/starter-kit">View our starter kits →</a></p>

<h2>What About a Hub?</h2>
<p>If you're using WiFi-based devices (Shelly, ESP32), you don't need a hub. If you want Zigbee sensors (Aqara, IKEA), you'll need either Home Assistant with a Zigbee coordinator (~$30) or a Zigbee hub.</p>
<p>Our recommendation: Start with WiFi devices, add Zigbee later when you need battery-powered sensors.</p>

<h2>Generate Code For Your Hardware</h2>
<p>Once you have your hardware, use our <a href="/build">automation generator</a> to create working code for Shelly, Home Assistant, Node-RED, and ESPHome.</p>
`,
  },
];

async function main() {
  console.log('🌱 Seeding blog posts...');

  for (const post of posts) {
    const existing = await db.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log(`  ⏭ Skip: ${post.slug} (exists)`);
      continue;
    }
    await db.blogPost.create({ data: post });
    console.log(`  ✓ Created: ${post.slug}`);
  }

  console.log(`\n✅ Done — ${posts.length} blog posts seeded.`);
  await db.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
