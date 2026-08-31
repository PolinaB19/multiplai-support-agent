# Human escalation workflow

The support agent follows a Help Center-first policy. It should answer from documented evidence whenever possible and must not invent guidance when the knowledge base is insufficient.

## Outcomes

- `RESOLVED_BY_AI` — reliable Help Center guidance answers the question or provides the documented first troubleshooting step.
- `ESCALATE_L1` — a human was requested, account access needs review, billing requires account-specific action, or the Help Center has no reliable answer.
- `ESCALATE_L2` — documented troubleshooting did not resolve an API, integration, generation, upload, or other technical issue.
- `ESCALATE_URGENT` — suspected outage, widespread impact, possible data loss, or a security incident.

## Priorities

- `LOW` — non-blocking or unusual request requiring human assistance.
- `MEDIUM` — one-customer feature failure, account access, billing investigation, or persistent API/integration failure.
- `HIGH` — reserved for serious business impact without an active security, data-loss, or widespread-outage signal.
- `URGENT` — security issue, possible data loss, or widespread outage.

## Handoff payload

Escalated cases create an internal object with this shape:

```json
{
  "status": "ESCALATED",
  "category": "api",
  "priority": "MEDIUM",
  "route_to": "ESCALATE_L2",
  "reason": "Documented troubleshooting did not resolve a persistent API failure.",
  "summary": "Concise case summary for the investigating agent.",
  "troubleshooting_attempted": [],
  "missing_information": []
}
```

The payload is internal. The customer receives a natural confirmation that the details already provided are included in the handoff.

## Testing

Open the Help Center and select **Test escalation**. The internal demo view includes scenarios for an API-key question, first and persistent 401 errors, a human request, duplicate billing, a suspected outage, and potential data loss.
