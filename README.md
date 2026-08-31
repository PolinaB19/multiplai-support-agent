# Multiplai Support Agent

A test MVP for a SaaS platform that adapts advertising videos for different channels and markets, with an AI technical-support agent.

## What is included

- an in-product Help Center;
- active campaign context;
- a popular-questions knowledge base;
- an interactive chat with suggested questions;
- a searchable knowledge base with Billing, Account, Integrations, Troubleshooting, API, and Security documentation;
- contextual chat answers linked to the most relevant help article;
- Help Center-first human escalation to L1, L2, or urgent response;
- an internal demo panel with predefined routing scenarios and handoff payloads;
- a demo support response with explanation and escalation;
- responsive desktop and mobile layouts;
- a dependency-free local preview.

## Run locally

```bash
npm run dev
```

Open `http://127.0.0.1:4317`.

## Product hypothesis

A user uploads a successful ad, chooses channels and markets, and requests changes to the talent, wardrobe, location, product, background, or on-screen text. The platform returns a set of independent variations. The support agent sees campaign context and either resolves a common issue, asks for missing information, or escalates the conversation to a specialist with a concise summary.

## Roadmap

### Phase 1 — Product and UX

- [x] Validate the current Higgsfield Ad Multiplier workflow.
- [x] Build the first Help Center and chat interface.
- [ ] Confirm the audience, visual direction, and core user journey.
- [ ] Design campaign creation and results screens.

### Phase 2 — Support operations

- [ ] Define request categories and SLAs.
- [ ] Build the knowledge base and response policies.
- [ ] Add ticket creation and human handoff.
- [ ] Add conversation history, ratings, and resolution analytics.

### Phase 3 — Integrations

- [ ] Connect an AI model to the knowledge base.
- [ ] Validate the available Higgsfield MCP integration path.
- [ ] Store users, campaigns, files, and generation statuses.
- [ ] Add authentication and customer, agent, and administrator roles.

### Phase 4 — Quality and release

- [ ] Add critical-path tests and personal-data safeguards.
- [ ] Add observability, audit logs, and cost limits.
- [ ] Publish a test environment.
- [ ] Add GitHub Actions, documentation, and the first release.

## Project structure

- `index.html` — working prototype;
- `app/globals.css` — visual system and responsive styles;
- `app-static.js` — chat interaction;
- `help.html` and `article.html` — documentation catalogue and article pages;
- `data/knowledge-base.json` — shared source for documentation, search, and support answers;
- `support-engine.js` — deterministic resolution, escalation, priority, and routing rules;
- `docs/escalation-workflow.md` — workflow and internal handoff documentation;
- `server.mjs` — dependency-free local server;
- `scripts/validate.mjs` — basic build validation.

## Current limitation

This version is a product prototype. It does not send data to Higgsfield or use a live AI model yet. Those integrations will be added after the support process and access model are confirmed.
