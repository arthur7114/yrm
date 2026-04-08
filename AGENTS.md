# AGENTS.md

## Project Instruction Layer

This repository already maintains its project-specific AI guidance inside `.agent/`.

Primary references:
- `.agent/rules/GEMINI.md`
- `.agent/ARCHITECTURE.md`

Use them as the project source of truth for agent selection, skill discovery, and execution style.
When those files describe harness-specific behavior that does not exist in Codex, preserve the intent and adapt it to the current runtime instead of copying it literally.

## How To Use `.agent`

For non-trivial work, inspect the most relevant specialist in `.agent/agents/` and then load only the skill material that actually applies.

Execution order:
1. Identify the domain.
2. Read the relevant agent file in `.agent/agents/`.
3. Check its `skills:` frontmatter.
4. Read each referenced `SKILL.md` selectively, not the whole skill tree.
5. Load extra reference files only when the task requires them.

The skill model in this repo is progressive disclosure, as described in `.agent/skills/doc.md`.
Do not bulk-read `.agent/skills/`.

## Routing Guide

Use these `.agent` specialists as the default mapping:

- Frontend, UI, styling, React, Next.js: `.agent/agents/frontend-specialist.md`
- Backend, API routes, business logic, integrations: `.agent/agents/backend-specialist.md`
- Database, schema, Supabase SQL and migrations: `.agent/agents/database-architect.md`
- Debugging and root-cause analysis: `.agent/agents/debugger.md`
- Security review or auth hardening: `.agent/agents/security-auditor.md`
- Multi-domain or sequencing-heavy work: `.agent/agents/orchestrator.md`
- Planning major features or refactors: `.agent/agents/project-planner.md`
- n8n workflows, MCP usage, automation design: `.agent/agents/n8n-automation-specialist.md`

If multiple domains are involved, prefer the orchestrator mindset, but keep execution grounded in the files and tools that actually exist in this repo.

## Architecture Guidance

The `architecture` skill is a decision framework, not a requirement to over-design.
Use `.agent/skills/architecture/SKILL.md` first, then selectively load:

- `context-discovery.md` when requirements or constraints are unclear
- `pattern-selection.md` when choosing architectural patterns
- `trade-off-analysis.md` when documenting why one option beats another
- `examples.md` and `patterns-reference.md` only as supporting references

Default bias:
- prefer the simplest design that fits the current scale and constraints
- justify new abstractions with a concrete problem
- favor modular additions over broad rewrites

## Repository Conventions

- Stack: Next.js 16, React 19, TypeScript, Supabase
- Runtime: Node `>=20.9.0`
- Shell context is usually Windows PowerShell
- Keep changes aligned with existing app structure in `app/`, `lib/`, `components/`, and `supabase/`
- Reuse established patterns before introducing new ones
- Keep code and comments in English unless the file already follows another convention

## Validation

After code changes, run the smallest meaningful validation set for the affected area.

Baseline for JS/TS changes:
- `npm run lint`
- `npx tsc --noEmit`

Add `npm run build` when the change affects routing, configuration, rendering boundaries, or release behavior.

For database or Supabase changes:
- review affected SQL or migration files in `supabase/`
- verify schema assumptions against the actual code paths that use them
- do not apply destructive database changes without explicit need

For n8n-related work:
- prefer the playbook in `.agent/skills/n8n-automation-specialist/`
- validate workflow code before create or update
- test manually before publish

## Practical Rules

- Prefer focused edits over sweeping refactors.
- Keep implementation consistent with current project patterns.
- Ask clarifying questions only when ambiguity materially affects correctness, architecture, or safety.
- When the repo already contains a playbook in `.agent/workflows/`, use it as a guide when directly relevant.
- Treat `.agent` as project instructions, not as dead documentation.
