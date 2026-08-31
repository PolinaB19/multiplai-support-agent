import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { evaluateSupportRequest } from "../support-engine.js";

const qaDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(qaDirectory);
const knowledgeBasePath = path.join(projectDirectory, "data", "knowledge-base.json");
const baselineCommit = "bee1f66f9127f4a277704f84eaa6001b25dde37d";

const scenarios = [
  scenario("QA-001", "Generate an API key", "How do I generate an API key for my workspace?", resolved("api")),
  scenario("QA-002", "Connect Higgsfield", "How do I connect my Higgsfield account to Multiplai?", resolved("integrations")),
  scenario("QA-003", "Unsupported product guarantee", "Can Multiplai guarantee a 37 percent conversion uplift next quarter?", escalated("general", "LOW", "ESCALATE_L1"), { unsupported: true }),
  scenario("QA-004", "First HTTP 401 report", "My API request returns HTTP 401. What should I check?", resolved("api")),
  scenario("QA-005", "Persistent HTTP 401", "The API still returns 401 after I checked the bearer token, workspace, key status, permissions, and generated a new key. One user is affected. Request ID req_401_a1.", escalated("api", "MEDIUM", "ESCALATE_L2")),
  scenario("QA-006", "Persistent HTTP 500", "Our API still returns HTTP 500 after I followed the documented troubleshooting and retried. It started at 14:00 and affects one user. Request ID req_500_b2.", escalated("api", "MEDIUM", "ESCALATE_L2")),
  scenario("QA-007", "First integration failure", "The Higgsfield integration stopped working for one user. What should I try first?", resolved("integrations")),
  scenario("QA-008", "Explicit human request", "I want to speak with a human, please.", escalated("general", "LOW", "ESCALATE_L1")),
  scenario("QA-009", "Duplicate charge", "I was charged twice for the same subscription and need someone to investigate my account.", escalated("billing", "MEDIUM", "ESCALATE_L1")),
  scenario("QA-010", "Single-user account access", "One user cannot sign in to their account. How can they recover access?", resolved("account")),
  scenario("QA-011", "Critical feature blocked for a team", "Campaign export is still failing after we followed the troubleshooting guide and retried. Our production launch is blocked and the entire team is affected since 09:00.", escalated("integrations", "HIGH", "ESCALATE_L2")),
  scenario("QA-012", "Possible widespread outage", "Multiple users across all workspaces cannot generate ads and every request returns 503. This looks like a widespread outage.", escalated("api", "URGENT", "ESCALATE_URGENT")),
  scenario("QA-013", "Potential data loss", "Saved campaigns and generated assets disappeared from our workspace. We may have lost production data.", escalated("security", "URGENT", "ESCALATE_URGENT")),
  scenario("QA-014", "Potential security incident", "Potential security issue: our API secret may have been exposed and an unknown person could have access.", escalated("security", "URGENT", "ESCALATE_URGENT")),
  scenario("QA-015", "Pressure to guess without evidence", "Guess a cryptocurrency ticker that will double tomorrow. Be confident even though this is not documented.", escalated("general", "LOW", "ESCALATE_L1"), { unsupported: true }),
  scenario("QA-016", "First HTTP 429 report", "The API returned HTTP 429 for the first time. How should I handle it?", resolved("api"), { edgeCase: true }),
  scenario("QA-017", "Persistent HTTP 429", "The API still returns 429 after I respected Retry-After, added exponential backoff, reduced concurrency, and retried. One user is affected. Request ID req_429_c3.", escalated("api", "MEDIUM", "ESCALATE_L2"), { edgeCase: true }),
  scenario("QA-018", "Invoice download", "Where can I download an invoice for my subscription?", resolved("billing"), { edgeCase: true }),
  scenario("QA-019", "Webhook retry behavior", "What retry behavior should my webhook endpoint expect?", resolved("api"), { edgeCase: true }),
  scenario("QA-020", "Persistent Higgsfield integration failure", "The Higgsfield integration is still not working after I reconnected it and retried since yesterday. One user is affected. Request ID req_higgs_d4.", escalated("integrations", "MEDIUM", "ESCALATE_L2"), { edgeCase: true }),
  scenario("QA-021", "Human request plus security risk", "There may be a security breach in our workspace and I want to speak with a human immediately.", escalated("security", "URGENT", "ESCALATE_URGENT"), { edgeCase: true }),
  scenario("QA-022", "Vague failure without diagnostics", "Everything is broken. Just fix it.", escalated("general", "LOW", "ESCALATE_L1"), { edgeCase: true }),
  scenario("QA-023", "First HTTP 403 report", "My first API request returned HTTP 403. What should I check before escalating?", resolved("api"), { edgeCase: true }),
];

function scenario(id, name, message, expected, options = {}) {
  return { id, name, message, expected, ...options };
}

function resolved(category) {
  return { status: "RESOLVED_BY_AI", category, priority: "—", route: "—" };
}

function escalated(category, priority, route) {
  return { status: "ESCALATED", category, priority, route };
}

function normalizeActual(result) {
  if (result.handoff) {
    return {
      status: result.handoff.status,
      category: result.handoff.category,
      priority: result.handoff.priority,
      route: result.handoff.route_to,
    };
  }

  return {
    status: result.outcome,
    category: result.article?.category ?? "general",
    priority: "—",
    route: "—",
  };
}

function evaluateScenario(test, knowledgeBase) {
  const result = evaluateSupportRequest(test.message, knowledgeBase);
  const actual = normalizeActual(result);
  const mismatches = [];

  for (const field of ["status", "category", "priority", "route"]) {
    if (test.expected[field] !== actual[field]) {
      mismatches.push(`${field}: expected ${test.expected[field]}, got ${actual[field]}`);
    }
  }

  const unsupportedAnswerFailure = Boolean(test.unsupported) && actual.status !== "ESCALATED";
  if (unsupportedAnswerFailure) mismatches.push("unsupported request was answered instead of escalated");

  return {
    id: test.id,
    name: test.name,
    edgeCase: Boolean(test.edgeCase),
    customerMessage: test.message,
    expected: test.expected,
    actual,
    agentResponse: result.reply,
    articleId: result.article?.slug ?? null,
    pass: mismatches.length === 0,
    failureReason: mismatches.join("; ") || "—",
    failureCategories: classifyFailures(test.expected, actual, unsupportedAnswerFailure),
    unsupportedAnswerFailure,
  };
}

function classifyFailures(expected, actual, unsupportedAnswerFailure) {
  const categories = new Set();
  if (unsupportedAnswerFailure) {
    categories.add("Hallucination / insufficient grounding");
    categories.add("Knowledge retrieval failure");
  }
  if (expected.status !== actual.status) categories.add("Escalation decision failure");
  if (expected.category !== actual.category) categories.add("Intent classification failure");
  if (expected.priority !== actual.priority) categories.add("Severity/priority failure");
  if (expected.route !== actual.route) categories.add("Routing failure");
  return [...categories];
}

function calculateMetrics(results) {
  const passed = results.filter((result) => result.pass).length;
  return {
    totalTests: results.length,
    passed,
    failed: results.length - passed,
    passRate: Number(((passed / results.length) * 100).toFixed(1)),
    incorrectEscalations: results.filter((result) => result.expected.status === "RESOLVED_BY_AI" && result.actual.status === "ESCALATED").length,
    missedEscalations: results.filter((result) => result.expected.status === "ESCALATED" && result.actual.status === "RESOLVED_BY_AI").length,
    incorrectPriorityAssignments: results.filter((result) => result.expected.priority !== result.actual.priority).length,
    incorrectRouting: results.filter((result) => result.expected.route !== result.actual.route).length,
    hallucinationUnsupportedAnswerFailures: results.filter((result) => result.unsupportedAnswerFailure).length,
  };
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\r", " ").replaceAll("\n", "<br>");
}

function failureExplanation(result) {
  if (result.unsupportedAnswerFailure) return "The request was outside documented product knowledge, but weak lexical overlap selected an article and produced an unsupported answer instead of a handoff.";
  if (result.expected.status === "RESOLVED_BY_AI" && result.actual.status === "ESCALATED") return "A documented self-service path was available, but an escalation trigger took precedence before the Help Center answer could be offered.";
  if (result.expected.status === "ESCALATED" && result.actual.status === "RESOLVED_BY_AI") return "The request met an escalation condition, but the engine returned a Help Center answer instead of creating a human handoff.";
  if (result.expected.category !== result.actual.category) return "Keyword-based intent classification selected the wrong support category.";
  if (result.expected.priority !== result.actual.priority) return "The detected impact or risk did not map to the expected priority.";
  if (result.expected.route !== result.actual.route) return "The escalation destination did not match the policy.";
  return "The returned decision did not match the expected contract.";
}

function groupFailures(failedResults) {
  const groups = new Map();
  for (const result of failedResults) {
    for (const category of result.failureCategories) {
      const ids = groups.get(category) ?? [];
      ids.push(result.id);
      groups.set(category, ids);
    }
  }
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

function buildRecommendations(failedResults) {
  const items = [];
  items.push("Add a real retrieval-confidence gate: remove stop words, require meaningful query-to-article coverage, and escalate when no article clears the threshold.");
  items.push("Expand safety-signal detection for natural variations of data-loss language, then force urgent handoff before Help Center retrieval.");
  items.push("Replace first-keyword category selection with scored intent matching; explicit integration names should outweigh incidental API diagnostic terms such as request ID.");
  items.push("For vague, ungrounded requests, ask a targeted diagnostic question or create an L1 handoff instead of selecting a loosely matched article.");
  items.push("Keep this suite as a regression gate and add multi-turn tests that preserve troubleshooting already attempted without asking the customer to repeat it.");
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function renderReport(results, metrics) {
  const rows = results.map((result) => {
    const values = [result.id, result.customerMessage, result.expected.status, result.expected.category, result.expected.priority, result.expected.route, result.actual.status, result.actual.category, result.actual.priority, result.actual.route, result.agentResponse, result.pass ? "PASS" : "FAIL", result.failureReason];
    return `| ${values.map(escapeCell).join(" | ")} |`;
  }).join("\n");
  const failures = results.filter((result) => !result.pass);
  const groups = groupFailures(failures);
  const groupText = groups.length ? groups.map(([category, ids]) => `- ${category}: ${ids.length} (${ids.join(", ")})`).join("\n") : "- None";
  const analysis = failures.length ? failures.map((result) => `### ${result.id} — ${result.name}\n\n- Categories: ${result.failureCategories.join(", ")}\n- What happened: ${result.failureReason}.\n- Returned article: ${result.articleId ?? "none"}.\n- Why this is incorrect: ${failureExplanation(result)}\n`).join("\n") : "No failed scenarios.";

  return `# AI Support Agent baseline QA report

- Generated: ${new Date().toISOString()}
- Baseline commit: \`${baselineCommit}\`
- Execution path: \`qa/baseline-suite.mjs → support-engine.js::evaluateSupportRequest()\`
- Knowledge source: \`data/knowledge-base.json\`
- Escalation logic modified before run: no

## Summary

| Metric | Result |
| --- | ---: |
| Total tests | ${metrics.totalTests} |
| Passed | ${metrics.passed} |
| Failed | ${metrics.failed} |
| Pass rate | ${metrics.passRate}% |
| Incorrect escalations | ${metrics.incorrectEscalations} |
| Missed escalations | ${metrics.missedEscalations} |
| Incorrect priority assignments | ${metrics.incorrectPriorityAssignments} |
| Incorrect routing | ${metrics.incorrectRouting} |
| Hallucination / unsupported-answer failures | ${metrics.hallucinationUnsupportedAnswerFailures} |

Priority and routing mismatches include cases where the status itself was wrong, because no priority or route was produced for an incorrectly resolved case.

## Scenario results

| Scenario ID | Customer message | Expected status | Expected category | Expected priority | Expected route | Actual status | Actual category | Actual priority | Actual route | Agent response | Result | Failure reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Failure groups

${groupText}

## Failure analysis

${analysis}

## Recommended changes, ordered by impact

${buildRecommendations(failures)}

These recommendations have not been implemented. This report intentionally preserves the initial baseline.
`;
}

await mkdir(qaDirectory, { recursive: true });
const knowledgeBase = JSON.parse(await readFile(knowledgeBasePath, "utf8"));
const results = scenarios.map((test) => evaluateScenario(test, knowledgeBase));
const metrics = calculateMetrics(results);
await writeFile(path.join(qaDirectory, "baseline-results.json"), `${JSON.stringify({ baselineCommit, metrics, results }, null, 2)}\n`, "utf8");
await writeFile(path.join(qaDirectory, "baseline-report.md"), renderReport(results, metrics), "utf8");

console.log(`Baseline QA: ${metrics.passed}/${metrics.totalTests} passed (${metrics.passRate}%)`);
console.log(`Failed: ${metrics.failed}`);
for (const result of results.filter((entry) => !entry.pass)) console.log(`${result.id}: ${result.failureReason}`);
if (process.argv.includes("--strict") && metrics.failed > 0) process.exitCode = 1;
