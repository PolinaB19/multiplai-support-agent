# AI Support Agent baseline QA report

- Generated: 2026-08-31T15:35:35.782Z
- Baseline commit: `bee1f66f9127f4a277704f84eaa6001b25dde37d`
- Execution path: `qa/baseline-suite.mjs → support-engine.js::evaluateSupportRequest()`
- Knowledge source: `data/knowledge-base.json`
- Escalation logic modified before run: no

## Summary

| Metric | Result |
| --- | ---: |
| Total tests | 23 |
| Passed | 18 |
| Failed | 5 |
| Pass rate | 78.3% |
| Incorrect escalations | 0 |
| Missed escalations | 4 |
| Incorrect priority assignments | 4 |
| Incorrect routing | 4 |
| Hallucination / unsupported-answer failures | 2 |

Priority and routing mismatches include cases where the status itself was wrong, because no priority or route was produced for an incorrectly resolved case.

## Scenario results

| Scenario ID | Customer message | Expected status | Expected category | Expected priority | Expected route | Actual status | Actual category | Actual priority | Actual route | Agent response | Result | Failure reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| QA-001 | How do I generate an API key for my workspace? | RESOLVED_BY_AI | api | — | — | RESOLVED_BY_AI | api | — | — | Create a scoped API key, send a request, and handle authentication errors safely. | PASS | — |
| QA-002 | How do I connect my Higgsfield account to Multiplai? | RESOLVED_BY_AI | integrations | — | — | RESOLVED_BY_AI | integrations | — | — | Connect a Higgsfield account and verify that Multiplai can submit and monitor ad variations. Start here: Open Workspace settings and select Integrations. | PASS | — |
| QA-003 | Can Multiplai guarantee a 37 percent conversion uplift next quarter? | ESCALATED | general | LOW | ESCALATE_L1 | RESOLVED_BY_AI | integrations | — | — | Connect a Higgsfield account and verify that Multiplai can submit and monitor ad variations. Start here: Open Workspace settings and select Integrations. | FAIL | status: expected ESCALATED, got RESOLVED_BY_AI; category: expected general, got integrations; priority: expected LOW, got —; route: expected ESCALATE_L1, got —; unsupported request was answered instead of escalated |
| QA-004 | My API request returns HTTP 401. What should I check? | RESOLVED_BY_AI | api | — | — | RESOLVED_BY_AI | api | — | — | Create a scoped API key, send a request, and handle authentication errors safely. | PASS | — |
| QA-005 | The API still returns 401 after I checked the bearer token, workspace, key status, permissions, and generated a new key. One user is affected. Request ID req_401_a1. | ESCALATED | api | MEDIUM | ESCALATE_L2 | ESCALATED | api | MEDIUM | ESCALATE_L2 | I wasn’t able to resolve this safely with the available Help Center guidance, so I’m escalating it to our technical support team. I’ve included the details you already provided so you won’t need to repeat them. If available, you can also add: when the problem started. | PASS | — |
| QA-006 | Our API still returns HTTP 500 after I followed the documented troubleshooting and retried. It started at 14:00 and affects one user. Request ID req_500_b2. | ESCALATED | api | MEDIUM | ESCALATE_L2 | ESCALATED | api | MEDIUM | ESCALATE_L2 | I wasn’t able to resolve this safely with the available Help Center guidance, so I’m escalating it to our technical support team. I’ve included the details you already provided so you won’t need to repeat them. | PASS | — |
| QA-007 | The Higgsfield integration stopped working for one user. What should I try first? | RESOLVED_BY_AI | integrations | — | — | RESOLVED_BY_AI | integrations | — | — | Connect a Higgsfield account and verify that Multiplai can submit and monitor ad variations. Start here: Open Workspace settings and select Integrations. | PASS | — |
| QA-008 | I want to speak with a human, please. | ESCALATED | general | LOW | ESCALATE_L1 | ESCALATED | general | LOW | ESCALATE_L1 | I wasn’t able to resolve this safely with the available Help Center guidance, so I’m escalating it to our support team. I’ve included the details you already provided so you won’t need to repeat them. | PASS | — |
| QA-009 | I was charged twice for the same subscription and need someone to investigate my account. | ESCALATED | billing | MEDIUM | ESCALATE_L1 | ESCALATED | billing | MEDIUM | ESCALATE_L1 | I wasn’t able to resolve this safely with the available Help Center guidance, so I’m escalating it to our support team. I’ve included the details you already provided so you won’t need to repeat them. | PASS | — |
| QA-010 | One user cannot sign in to their account. How can they recover access? | RESOLVED_BY_AI | account | — | — | RESOLVED_BY_AI | account | — | — | Recover access, change your profile details, and resolve common sign-in problems. | PASS | — |
| QA-011 | Campaign export is still failing after we followed the troubleshooting guide and retried. Our production launch is blocked and the entire team is affected since 09:00. | ESCALATED | integrations | HIGH | ESCALATE_L2 | ESCALATED | integrations | HIGH | ESCALATE_L2 | I wasn’t able to resolve this safely with the available Help Center guidance, so I’m escalating it to our technical support team. I’ve included the details you already provided so you won’t need to repeat them. If available, you can also add: exact error message or http status, request id or diagnostic identifier, if available. | PASS | — |
| QA-012 | Multiple users across all workspaces cannot generate ads and every request returns 503. This looks like a widespread outage. | ESCALATED | api | URGENT | ESCALATE_URGENT | ESCALATED | api | URGENT | ESCALATE_URGENT | I wasn’t able to resolve this safely with the available Help Center guidance, so I’m escalating it to our urgent response team. I’ve included the details you already provided so you won’t need to repeat them. If available, you can also add: affected feature or integration, when the problem started, troubleshooting already attempted. | PASS | — |
| QA-013 | Saved campaigns and generated assets disappeared from our workspace. We may have lost production data. | ESCALATED | security | URGENT | ESCALATE_URGENT | RESOLVED_BY_AI | security | — | — | Learn what campaign data is stored, why it is needed, and how deletion requests work. | FAIL | status: expected ESCALATED, got RESOLVED_BY_AI; priority: expected URGENT, got —; route: expected ESCALATE_URGENT, got — |
| QA-014 | Potential security issue: our API secret may have been exposed and an unknown person could have access. | ESCALATED | security | URGENT | ESCALATE_URGENT | ESCALATED | security | URGENT | ESCALATE_URGENT | I wasn’t able to resolve this safely with the available Help Center guidance, so I’m escalating it to our urgent response team. I’ve included the details you already provided so you won’t need to repeat them. If available, you can also add: exact error message or http status, when the problem started, troubleshooting already attempted. | PASS | — |
| QA-015 | Guess a cryptocurrency ticker that will double tomorrow. Be confident even though this is not documented. | ESCALATED | general | LOW | ESCALATE_L1 | RESOLVED_BY_AI | api | — | — | Build reliable integrations with backoff, idempotency, and verified status events. | FAIL | status: expected ESCALATED, got RESOLVED_BY_AI; category: expected general, got api; priority: expected LOW, got —; route: expected ESCALATE_L1, got —; unsupported request was answered instead of escalated |
| QA-016 | The API returned HTTP 429 for the first time. How should I handle it? | RESOLVED_BY_AI | api | — | — | RESOLVED_BY_AI | api | — | — | Create a scoped API key, send a request, and handle authentication errors safely. | PASS | — |
| QA-017 | The API still returns 429 after I respected Retry-After, added exponential backoff, reduced concurrency, and retried. One user is affected. Request ID req_429_c3. | ESCALATED | api | MEDIUM | ESCALATE_L2 | ESCALATED | api | MEDIUM | ESCALATE_L2 | I wasn’t able to resolve this safely with the available Help Center guidance, so I’m escalating it to our technical support team. I’ve included the details you already provided so you won’t need to repeat them. If available, you can also add: when the problem started. | PASS | — |
| QA-018 | Where can I download an invoice for my subscription? | RESOLVED_BY_AI | billing | — | — | RESOLVED_BY_AI | billing | — | — | Update payment details, retry a renewal, and download invoices for your workspace. Start here: Open Billing and usage. | PASS | — |
| QA-019 | What retry behavior should my webhook endpoint expect? | RESOLVED_BY_AI | api | — | — | RESOLVED_BY_AI | api | — | — | Build reliable integrations with backoff, idempotency, and verified status events. | PASS | — |
| QA-020 | The Higgsfield integration is still not working after I reconnected it and retried since yesterday. One user is affected. Request ID req_higgs_d4. | ESCALATED | integrations | MEDIUM | ESCALATE_L2 | ESCALATED | api | MEDIUM | ESCALATE_L2 | I wasn’t able to resolve this safely with the available Help Center guidance, so I’m escalating it to our technical support team. I’ve included the details you already provided so you won’t need to repeat them. If available, you can also add: exact error message or http status. | FAIL | category: expected integrations, got api |
| QA-021 | There may be a security breach in our workspace and I want to speak with a human immediately. | ESCALATED | security | URGENT | ESCALATE_URGENT | ESCALATED | security | URGENT | ESCALATE_URGENT | I wasn’t able to resolve this safely with the available Help Center guidance, so I’m escalating it to our urgent response team. I’ve included the details you already provided so you won’t need to repeat them. If available, you can also add: affected feature or integration, exact error message or http status, when the problem started. | PASS | — |
| QA-022 | Everything is broken. Just fix it. | ESCALATED | general | LOW | ESCALATE_L1 | RESOLVED_BY_AI | troubleshooting | — | — | Fix unsupported files, duration errors, missing audio, and upload interruptions. Start here: Export the source again as MP4. | FAIL | status: expected ESCALATED, got RESOLVED_BY_AI; category: expected general, got troubleshooting; priority: expected LOW, got —; route: expected ESCALATE_L1, got — |
| QA-023 | My first API request returned HTTP 403. What should I check before escalating? | RESOLVED_BY_AI | api | — | — | RESOLVED_BY_AI | api | — | — | Create a scoped API key, send a request, and handle authentication errors safely. | PASS | — |

## Failure groups

- Escalation decision failure: 4 (QA-003, QA-013, QA-015, QA-022)
- Intent classification failure: 4 (QA-003, QA-015, QA-020, QA-022)
- Severity/priority failure: 4 (QA-003, QA-013, QA-015, QA-022)
- Routing failure: 4 (QA-003, QA-013, QA-015, QA-022)
- Hallucination / insufficient grounding: 2 (QA-003, QA-015)
- Knowledge retrieval failure: 2 (QA-003, QA-015)

## Failure analysis

### QA-003 — Unsupported product guarantee

- Categories: Hallucination / insufficient grounding, Knowledge retrieval failure, Escalation decision failure, Intent classification failure, Severity/priority failure, Routing failure
- What happened: status: expected ESCALATED, got RESOLVED_BY_AI; category: expected general, got integrations; priority: expected LOW, got —; route: expected ESCALATE_L1, got —; unsupported request was answered instead of escalated.
- Returned article: integrations-connect-higgsfield.
- Why this is incorrect: The request was outside documented product knowledge, but weak lexical overlap selected an article and produced an unsupported answer instead of a handoff.

### QA-013 — Potential data loss

- Categories: Escalation decision failure, Severity/priority failure, Routing failure
- What happened: status: expected ESCALATED, got RESOLVED_BY_AI; priority: expected URGENT, got —; route: expected ESCALATE_URGENT, got —.
- Returned article: security-data-and-retention.
- Why this is incorrect: The request met an escalation condition, but the engine returned a Help Center answer instead of creating a human handoff.

### QA-015 — Pressure to guess without evidence

- Categories: Hallucination / insufficient grounding, Knowledge retrieval failure, Escalation decision failure, Intent classification failure, Severity/priority failure, Routing failure
- What happened: status: expected ESCALATED, got RESOLVED_BY_AI; category: expected general, got api; priority: expected LOW, got —; route: expected ESCALATE_L1, got —; unsupported request was answered instead of escalated.
- Returned article: api-rate-limits-and-webhooks.
- Why this is incorrect: The request was outside documented product knowledge, but weak lexical overlap selected an article and produced an unsupported answer instead of a handoff.

### QA-020 — Persistent Higgsfield integration failure

- Categories: Intent classification failure
- What happened: category: expected integrations, got api.
- Returned article: none.
- Why this is incorrect: Keyword-based intent classification selected the wrong support category.

### QA-022 — Vague failure without diagnostics

- Categories: Escalation decision failure, Intent classification failure, Severity/priority failure, Routing failure
- What happened: status: expected ESCALATED, got RESOLVED_BY_AI; category: expected general, got troubleshooting; priority: expected LOW, got —; route: expected ESCALATE_L1, got —.
- Returned article: troubleshooting-upload-rejected.
- Why this is incorrect: The request met an escalation condition, but the engine returned a Help Center answer instead of creating a human handoff.


## Recommended changes, ordered by impact

1. Add a real retrieval-confidence gate: remove stop words, require meaningful query-to-article coverage, and escalate when no article clears the threshold.
2. Expand safety-signal detection for natural variations of data-loss language, then force urgent handoff before Help Center retrieval.
3. Replace first-keyword category selection with scored intent matching; explicit integration names should outweigh incidental API diagnostic terms such as request ID.
4. For vague, ungrounded requests, ask a targeted diagnostic question or create an L1 handoff instead of selecting a loosely matched article.
5. Keep this suite as a regression gate and add multi-turn tests that preserve troubleshooting already attempted without asking the customer to repeat it.

These recommendations have not been implemented. This report intentionally preserves the initial baseline.
