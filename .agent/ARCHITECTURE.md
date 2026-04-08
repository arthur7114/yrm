# Antigravity Architecture

> Current map of the `.agent/` execution layer in this repository.

---

## Overview

The `.agent/` directory is the project's local instruction system. It currently contains:

- **21 agents** in `.agent/agents/`
- **38 skills** in `.agent/skills/`
- **11 workflows** in `.agent/workflows/`
- **4 top-level scripts** in `.agent/scripts/`
- **1 shared resource pack** in `.agent/.shared/`

This file describes the **current filesystem layout**.
When agent frontmatter or older docs drift from the filesystem, treat the filesystem as authoritative.

---

## Directory Structure

```plaintext
.agent/
├── .shared/                # Shared resource packs used across workflows or agents
├── agents/                 # Specialist agent definitions
├── rules/                  # Global project rules
├── scripts/                # Top-level helper and validation scripts
├── skills/                 # Project-local skills with SKILL.md entrypoints
├── workflows/              # Reusable workflow/playbook documents
├── ARCHITECTURE.md         # This file
└── mcp_config.json         # MCP config reference
```

---

## Rules Layer

Global behavior starts here:

- `.agent/rules/GEMINI.md`

This file defines the intent of the Antigravity workflow:
- route work through specialized agents
- load skills progressively
- prefer explicit planning for larger tasks
- apply validation before completion

Use it as the high-level behavioral source, but adapt any harness-specific instruction to the current runtime.

---

## Shared Resources

### `.agent/.shared/`

Shared packs are not regular skills. They hold reusable datasets or scripts that support multiple flows.

Currently:
- `ui-ux-pro-max/`

This pack contains CSV knowledge bases and helper scripts for design-system and UI exploration work.

---

## Agents

Agents are stored in `.agent/agents/` and define domain-specific execution styles plus the skills they expect to load.

Current agent set:

| Agent | Focus |
| --- | --- |
| `backend-specialist` | APIs, backend logic, integrations |
| `code-archaeologist` | Legacy code reading and refactoring |
| `database-architect` | Database design, SQL, schema changes |
| `debugger` | Root-cause analysis and bug isolation |
| `devops-engineer` | Deployment, operations, runtime setup |
| `documentation-writer` | Docs and explanatory material |
| `explorer-agent` | Codebase discovery and mapping |
| `frontend-specialist` | React, Next.js, UI, styling |
| `game-developer` | Game-specific implementation |
| `mobile-developer` | Mobile-focused development |
| `n8n-automation-specialist` | n8n workflows, MCP usage, automation design |
| `orchestrator` | Multi-domain coordination |
| `penetration-tester` | Offensive security testing |
| `performance-optimizer` | Performance profiling and optimization |
| `product-manager` | Product framing and requirements |
| `product-owner` | Scope and roadmap decisions |
| `project-planner` | Planning and task decomposition |
| `qa-automation-engineer` | QA and automation workflows |
| `security-auditor` | Security review and hardening |
| `seo-specialist` | SEO and discoverability |
| `test-engineer` | Tests and verification |

### Routing Heuristics

Use these defaults unless the task clearly spans multiple domains:

- frontend/UI: `frontend-specialist`
- backend/API/integrations: `backend-specialist`
- database/SQL/migrations: `database-architect`
- debugging: `debugger`
- testing: `test-engineer`
- security/auth review: `security-auditor`
- n8n automation: `n8n-automation-specialist`
- cross-cutting or sequencing-heavy work: `orchestrator`
- planning a substantial feature or refactor: `project-planner`

For the exact `skills:` list of any agent, inspect the agent file directly.

---

## Skills

Skills live in `.agent/skills/`. Each skill uses `SKILL.md` as the entrypoint and may include `references/`, `scripts/`, or `assets/`.

Current skill directories:

- `api-patterns`
- `app-builder`
- `architecture`
- `bash-linux`
- `behavioral-modes`
- `brainstorming`
- `clean-code`
- `code-review-checklist`
- `database-design`
- `deployment-procedures`
- `documentation-templates`
- `frontend-design`
- `game-development`
- `geo-fundamentals`
- `i18n-localization`
- `intelligent-routing`
- `lint-and-validate`
- `mcp-builder`
- `mobile-design`
- `n8n-automation-specialist`
- `nextjs-react-expert`
- `nodejs-best-practices`
- `parallel-agents`
- `performance-profiling`
- `plan-writing`
- `powershell-windows`
- `python-patterns`
- `red-team-tactics`
- `rust-pro`
- `seo-fundamentals`
- `server-management`
- `systematic-debugging`
- `tailwind-patterns`
- `tdd-workflow`
- `testing-patterns`
- `vulnerability-scanner`
- `web-design-guidelines`
- `webapp-testing`

### Supporting Files

In addition to skill directories, `.agent/skills/` also contains:

- `doc.md` - guidance on how the local skill system is structured and used

### Skill Loading Model

The intended model is progressive disclosure:

1. Match the request to the relevant skill
2. Read `SKILL.md`
3. Load only the specific references or scripts needed for the task

Do not bulk-read the entire `skills/` tree.

---

## Architecture Skill

The `architecture` skill is a decision framework, not a mandate to over-engineer.

Files:

- `SKILL.md` - entrypoint and file map
- `context-discovery.md` - requirements and constraints discovery
- `pattern-selection.md` - architectural pattern selection
- `trade-off-analysis.md` - ADR and trade-off framing
- `examples.md` - concrete examples by project type
- `patterns-reference.md` - quick lookup table

Use it when architecture choices are part of the task. Skip it for straightforward edits that do not change structure or boundaries.

---

## Workflows

Workflow documents in `.agent/workflows/` are lightweight playbooks.

Current workflows:

- `brainstorm.md`
- `create.md`
- `debug.md`
- `deploy.md`
- `enhance.md`
- `orchestrate.md`
- `plan.md`
- `preview.md`
- `status.md`
- `test.md`
- `ui-ux-pro-max.md`

Use these when the task naturally maps to a reusable procedure. They are guidance documents, not executable commands.

---

## Scripts

Top-level scripts in `.agent/scripts/`:

- `auto_preview.py`
- `checklist.py`
- `session_manager.py`
- `verify_all.py`

### Typical Usage

- `checklist.py` for lighter validation passes
- `verify_all.py` for broader verification before concluding larger work
- `auto_preview.py` and `session_manager.py` as operational helpers

Skill-specific scripts also exist inside some skill folders and should be used when the relevant skill recommends them.

---

## Current Practical Interpretation

The `.agent/` system in this repository is best understood as:

- a **local agent catalog** in `.agent/agents/`
- a **local knowledge base** in `.agent/skills/`
- a **workflow library** in `.agent/workflows/`
- a **validation/helper layer** in `.agent/scripts/`
- a **shared asset layer** in `.agent/.shared/`

Use `AGENTS.md` at the repo root to bridge this structure into Codex instruction discovery.
