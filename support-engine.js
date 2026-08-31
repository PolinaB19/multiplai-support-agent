const normalize = (value = "") => value.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
const tokens = (value) => [...new Set(normalize(value).split(/\s+/).filter((word) => word.length > 2))];

export function articleScore(article, query) {
  const words = tokens(query);
  if (!words.length) return 0;
  const title = normalize(article.title);
  const keywords = normalize(article.keywords.join(" "));
  const summary = normalize(article.summary);
  const sectionText = normalize(article.sections.map((section) => `${section.heading} ${section.body || ""} ${(section.steps || []).join(" ")}`).join(" "));
  return words.reduce((score, word) => score +
    (title.includes(word) ? 5 : 0) +
    (keywords.includes(word) ? 3 : 0) +
    (summary.includes(word) ? 2 : 0) +
    (sectionText.includes(word) ? 1 : 0), 0);
}

export function rankedArticles(knowledgeBase, query) {
  return knowledgeBase.articles
    .map((article) => ({ article, score: articleScore(article, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

const includesAny = (text, phrases) => phrases.some((phrase) => text.includes(phrase));
const detectedStatuses = (message) => [...new Set(message.match(/\b(?:401|403|429|5\d\d)\b/g) || [])];

function detectCategory(text) {
  if (includesAny(text, ["invoice", "payment", "charged", "charge", "refund", "billing", "renewal", "card"])) return "billing";
  if (includesAny(text, ["security", "breach", "hacked", "suspicious", "data loss", "files disappeared", "leak", "exposed"])) return "security";
  if (includesAny(text, ["api", "401", "403", "429", "500", "502", "503", "504", "request id", "webhook", "token", "api key"])) return "api";
  if (includesAny(text, ["higgsfield", "integration", "connect", "tiktok", "reels", "shorts", "export"])) return "integrations";
  if (includesAny(text, ["sign in", "login", "locked out", "account", "workspace", "member", "role", "email"])) return "account";
  if (includesAny(text, ["upload", "generation", "stuck", "pending", "processing", "error", "failed", "not working"])) return "troubleshooting";
  return "general";
}

function troubleshootingAttempted(message) {
  const attempts = [];
  const patterns = [
    [/(followed|completed|went through).*(steps|guide|article|troubleshooting)/i, "Followed documented troubleshooting"],
    [/(regenerated|recreated|rotated|new).*(key|token)/i, "Regenerated the API credential"],
    [/(checked|verified).*(scope|permission|authorization)/i, "Checked scopes and permissions"],
    [/(retried|tried again|retry)/i, "Retried the operation"],
    [/(reconnect|connected again|reauthorized)/i, "Reconnected the integration"],
    [/(re-export|exported again|encoded again)/i, "Re-exported the source file"],
    [/(refresh|refreshed).*(status|page|campaign)/i, "Refreshed the campaign status"]
  ];
  patterns.forEach(([pattern, label]) => { if (pattern.test(message)) attempts.push(label); });
  return attempts;
}

function missingTechnicalInformation(message) {
  const missing = [];
  if (!/(api|higgsfield|integration|upload|generation|export|webhook|tiktok|reels|shorts)/i.test(message)) missing.push("Affected feature or integration");
  if (!/(401|403|429|5\d\d|error|failed|stuck|pending)/i.test(message)) missing.push("Exact error message or HTTP status");
  if (!/(since|started|today|yesterday|ago|\d{1,2}:\d{2}|am|pm)/i.test(message)) missing.push("When the problem started");
  if (!/(followed|tried|checked|verified|retried|reconnect|refresh|regenerated)/i.test(message)) missing.push("Troubleshooting already attempted");
  if (!/(one user|single user|multiple users|everyone|team|workspace|all users|\d+ users)/i.test(message)) missing.push("Scope and number of affected users");
  if (!/(request id|request-id|req[_ -]?[a-z0-9-]+)/i.test(message)) missing.push("Request ID or diagnostic identifier, if available");
  return missing;
}

function createHandoff({ category, priority, routeTo, reason, message, attempts, missing }) {
  const statusCodes = detectedStatuses(message);
  const identifiers = message.match(/(?:request[ -]?id[: ]+|req[_ -]?)[a-z0-9-]+/ig) || [];
  const facts = [message.trim()];
  if (statusCodes.length) facts.push(`Reported HTTP status: ${statusCodes.join(", ")}.`);
  if (identifiers.length) facts.push(`Diagnostic identifier: ${identifiers.join(", ")}.`);
  return {
    status: "ESCALATED",
    category,
    priority,
    route_to: routeTo,
    reason,
    summary: facts.join(" ").slice(0, 420),
    troubleshooting_attempted: attempts,
    missing_information: missing
  };
}

function escalationReply(routeTo, missing) {
  const team = routeTo === "ESCALATE_URGENT" ? "our urgent response team" : routeTo === "ESCALATE_L2" ? "our technical support team" : "our support team";
  const base = `I wasn’t able to resolve this safely with the available Help Center guidance, so I’m escalating it to ${team}. I’ve included the details you already provided so you won’t need to repeat them.`;
  if (!missing.length) return base;
  return `${base} If available, you can also add: ${missing.slice(0, 3).join(", ").toLowerCase()}.`;
}

export function evaluateSupportRequest(message, knowledgeBase) {
  const text = normalize(message);
  const category = detectCategory(text);
  const attempts = troubleshootingAttempted(message);
  const statuses = detectedStatuses(message);
  const articles = rankedArticles(knowledgeBase, message);
  const bestArticle = articles[0]?.article || null;

  const suspectedOutage = includesAny(text, ["outage", "service down", "system down", "across all", "multiple users", "everyone", "all users", "multiple workspaces"]) && includesAny(text, ["cannot", "can t", "unavailable", "failing", "failed", "5xx", "500", "502", "503", "504", "down"]);
  const dataOrSecurityRisk = includesAny(text, ["data loss", "files disappeared", "deleted unexpectedly", "security issue", "breach", "hacked", "account takeover", "leak", "exposed secret", "stolen key"]);
  const asksForHuman = includesAny(text, ["human", "real person", "support agent", "speak to someone", "talk to someone", "representative"]);
  const billingManual = category === "billing" && includesAny(text, ["charged twice", "duplicate charge", "wrong charge", "refund", "payment missing", "manual review", "dispute"]);
  const accountRisk = category === "account" && includesAny(text, ["locked out", "cannot access", "can t access", "lost access"]);
  const persistentSignal = includesAny(text, ["still", "keeps", "persistent", "again", "after troubleshooting", "followed the steps", "didn t work", "did not work", "unresolved"]);
  const repeatedTechnicalFailure = ["api", "integrations", "troubleshooting"].includes(category) && persistentSignal && (statuses.length > 0 || attempts.length > 0 || includesAny(text, ["failed", "error", "not working", "stuck"]));
  const highBusinessImpact = includesAny(text, ["major functionality", "production blocked", "launch blocked", "business critical", "entire team", "whole team", "cannot operate"]);

  if (suspectedOutage || dataOrSecurityRisk) {
    const reason = dataOrSecurityRisk ? "Potential data loss or security issue requires immediate human investigation." : "Suspected service outage or impact across multiple users/features.";
    const handoff = createHandoff({ category: dataOrSecurityRisk ? "security" : category, priority: "URGENT", routeTo: "ESCALATE_URGENT", reason, message, attempts, missing: missingTechnicalInformation(message) });
    return { outcome: "ESCALATE_URGENT", reply: escalationReply(handoff.route_to, handoff.missing_information), handoff };
  }

  if (repeatedTechnicalFailure) {
    const handoff = createHandoff({ category, priority: highBusinessImpact ? "HIGH" : "MEDIUM", routeTo: "ESCALATE_L2", reason: "Documented troubleshooting did not resolve a persistent technical, API, or integration failure.", message, attempts, missing: missingTechnicalInformation(message) });
    return { outcome: "ESCALATE_L2", reply: escalationReply(handoff.route_to, handoff.missing_information), handoff };
  }

  if (billingManual || asksForHuman || accountRisk) {
    const reason = billingManual ? "Billing or payment case requires account-specific manual investigation." : accountRisk ? "Account access issue requires identity-aware human review." : "Customer explicitly requested human assistance.";
    const handoff = createHandoff({ category, priority: billingManual || accountRisk ? "MEDIUM" : "LOW", routeTo: "ESCALATE_L1", reason, message, attempts, missing: [] });
    return { outcome: "ESCALATE_L1", reply: escalationReply(handoff.route_to, handoff.missing_information), handoff };
  }

  if (bestArticle) {
    const firstStep = bestArticle.sections.find((section) => section.steps)?.steps?.[0];
    const guidance = firstStep ? `${bestArticle.summary} Start here: ${firstStep}` : bestArticle.summary;
    return { outcome: "RESOLVED_BY_AI", reply: guidance, article: bestArticle, handoff: null };
  }

  const handoff = createHandoff({ category: "general", priority: "LOW", routeTo: "ESCALATE_L1", reason: "The Help Center does not contain enough reliable information to answer without making assumptions.", message, attempts: [], missing: ["Desired outcome", "Relevant workspace or campaign"] });
  return { outcome: "ESCALATE_L1", reply: escalationReply(handoff.route_to, handoff.missing_information), handoff };
}

export const demoScenarios = [
  { id: "api-key", label: "API key question", expected: "RESOLVED_BY_AI", message: "How do I generate an API key?" },
  { id: "first-401", label: "First 401 error", expected: "RESOLVED_BY_AI", message: "My API request returns 401. What should I check?" },
  { id: "persistent-401", label: "Persistent 401", expected: "ESCALATE_L2", message: "I followed the API troubleshooting guide, regenerated the token, and checked permissions, but all requests still return 401 since 10:15 AM. One user is affected. Request ID req-api-7842." },
  { id: "high-impact", label: "High business impact", expected: "ESCALATE_L2", expectedPriority: "HIGH", message: "Campaign export is still failing after we followed the troubleshooting guide and retried. Our production launch is blocked and the entire team is affected since 9:00 AM." },
  { id: "human", label: "Requests a human", expected: "ESCALATE_L1", message: "I need to speak with a human about changing the owner of our workspace." },
  { id: "billing", label: "Duplicate charge", expected: "ESCALATE_L1", message: "Our workspace was charged twice for the same renewal today. Please investigate the duplicate charge." },
  { id: "outage", label: "Suspected outage", expected: "ESCALATE_URGENT", message: "Multiple users across all workspaces cannot generate ads. Every request has returned 503 for 30 minutes. Request ID req-outage-9201." },
  { id: "data-loss", label: "Potential data loss", expected: "ESCALATE_URGENT", message: "Several approved campaign files disappeared today and multiple users are affected. This may be data loss." }
];
