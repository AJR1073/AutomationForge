# Agent Skills — AutomationForge

> Modular skill files that any AI coding agent (Claude Code, Cursor, Copilot) loads
> on demand. Inspired by Andrej Karpathy's "skill.md" pattern — embed engineering
> judgment directly into the codebase so agents stop acting like "junior devs who
> never ask questions."

## How It Works

Each `.md` file in this directory is a **skill**: a focused instruction set that an
agent consults when performing a specific type of task. Skills encode project-specific
conventions, gotchas, and quality standards so the agent doesn't have to rediscover
them every session.

**Load a skill** by referencing it in your prompt or CLAUDE.md:
```
Read skills/frontend-design.md before changing any UI component.
```

## Available Skills

| Skill File | Purpose |
|---|---|
| `frontend-design.md` | Visual quality standards, color system, component patterns |
| `code-quality.md` | TypeScript conventions, Prisma patterns, Next.js App Router rules |
| `seo-affiliate.md` | SEO metadata, JSON-LD, affiliate disclosure, click tracking |
| `testing.md` | Playwright E2E patterns, what to test, how to verify |

## Principles (Karpathy Rules)

These apply to ALL agent work on this codebase:

1. **Think before coding.** State your assumptions. Ask if unclear.
2. **Simplicity first.** Minimal solution > over-engineered abstraction.
3. **Surgical changes.** Touch ONLY the files that need to change.
4. **No unsolicited renovations.** Don't refactor what you weren't asked to.
5. **Verify success.** Run `npm run build` after every meaningful change.
6. **Read before writing.** View the file before editing it.
