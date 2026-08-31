import { readFile } from "node:fs/promises";
import { demoScenarios, evaluateSupportRequest } from "../support-engine.js";
import { applyTicketUpdate, buildTicket, validateTicketInput } from "../ticket-store.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [home, help, articlePage, operatorPage, knowledgeText] = await Promise.all([
  read("index.html"), read("help.html"), read("article.html"), read("operator.html"), read("data/knowledge-base.json")
]);
const knowledge = JSON.parse(knowledgeText);
for (const marker of ["Multiplai", "Help Center", "Knowledge base", "Summer Glow"]) {
  if (!home.includes(marker)) throw new Error(`Missing home marker: ${marker}`);
}
for (const category of ["billing", "account", "integrations", "troubleshooting", "api", "security"]) {
  if (!knowledge.categories.some((item) => item.id === category)) throw new Error(`Missing category: ${category}`);
  if (!knowledge.articles.some((item) => item.category === category)) throw new Error(`Category has no articles: ${category}`);
}
if (knowledge.articles.length < 12) throw new Error("Knowledge base needs at least 12 articles");
if (!help.includes("article-grid") || !articlePage.includes("article-page")) throw new Error("Documentation routes are incomplete");
if (!operatorPage.includes("ticket-list") || !operatorPage.includes("ticket-detail")) throw new Error("Operator queue is incomplete");
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
const rank = (query) => {
  const words = [...new Set(normalize(query).split(/\s+/).filter((word) => word.length > 2))];
  return knowledge.articles.map((article) => {
    const title = normalize(article.title);
    const keywords = normalize(article.keywords.join(" "));
    const summary = normalize(article.summary);
    const score = words.reduce((total, word) => total + (title.includes(word) ? 5 : 0) + (keywords.includes(word) ? 3 : 0) + (summary.includes(word) ? 1 : 0), 0);
    return { article, score };
  }).sort((a, b) => b.score - a.score)[0].article.category;
};
for (const [query, expected] of [["download my invoice", "billing"], ["invite a teammate", "account"], ["connect Higgsfield", "integrations"], ["upload was rejected", "troubleshooting"], ["API rate limit", "api"], ["report a security incident", "security"]]) {
  if (rank(query) !== expected) throw new Error(`Wrong contextual answer for: ${query}`);
}
for (const scenario of demoScenarios) {
  const result = evaluateSupportRequest(scenario.message, knowledge);
  if (result.outcome !== scenario.expected) throw new Error(`${scenario.id}: expected ${scenario.expected}, received ${result.outcome}`);
  if (scenario.expectedPriority && result.handoff?.priority !== scenario.expectedPriority) throw new Error(`${scenario.id}: expected priority ${scenario.expectedPriority}`);
  if (result.outcome === "RESOLVED_BY_AI" && !result.article) throw new Error(`${scenario.id}: AI answer is missing a Help Center source`);
  if (result.outcome !== "RESOLVED_BY_AI") {
    for (const field of ["status", "category", "priority", "route_to", "reason", "summary", "troubleshooting_attempted", "missing_information"]) {
      if (!(field in result.handoff)) throw new Error(`${scenario.id}: handoff is missing ${field}`);
    }
    const valid = validateTicketInput(result.handoff);
    const ticket = buildTicket(result.handoff, 1, new Date("2026-08-31T12:00:00Z"));
    if (ticket.status !== "OPEN" || !ticket.id.startsWith("TKT-20260831-")) throw new Error(`${scenario.id}: ticket creation failed`);
    const updated = applyTicketUpdate(ticket, { status: "IN_PROGRESS", assignee: "Test operator", internal_note: "Investigating" }, new Date("2026-08-31T12:05:00Z"));
    if (updated.status !== "IN_PROGRESS" || updated.assignee !== "Test operator" || updated.activity.length < 3 || !valid.summary) throw new Error(`${scenario.id}: ticket update failed`);
  }
}
const firstTechnicalQuestion = evaluateSupportRequest("My API returns 401. What should I check?", knowledge);
if (firstTechnicalQuestion.outcome !== "RESOLVED_BY_AI") throw new Error("A first technical question must use Help Center troubleshooting before escalation");
console.log(`Support workflow validation passed: ${knowledge.categories.length} categories, ${knowledge.articles.length} articles, ${demoScenarios.length} routing scenarios`);
