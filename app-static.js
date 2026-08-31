import { demoScenarios, evaluateSupportRequest, rankedArticles } from "/support-engine.js";

const input = document.querySelector("#message");
const form = document.querySelector("#chat-form");
const messages = document.querySelector("#messages");
const searchInput = document.querySelector("#knowledge-search");
const searchResults = document.querySelector("#search-results");
const categoryGrid = document.querySelector("#category-grid");
const demoToggle = document.querySelector("#demo-toggle");
const demoPanel = document.querySelector("#demo-panel");
const scenarioList = document.querySelector("#scenario-list");
const internalResult = document.querySelector("#internal-result");
let knowledgeBase = { categories: [], articles: [] };

function renderCategories() {
  categoryGrid.replaceChildren();
  knowledgeBase.categories.forEach((category) => {
    const count = knowledgeBase.articles.filter((article) => article.category === category.id).length;
    const link = document.createElement("a");
    link.className = "category-card";
    link.href = `/help.html?category=${category.id}`;
    link.innerHTML = `<span class="category-icon">${category.icon}</span><div><b>${category.name}</b><small>${count} articles</small></div><span class="arrow">›</span>`;
    categoryGrid.append(link);
  });
}

function renderSearch(query) {
  const results = rankedArticles(knowledgeBase, query).slice(0, 5).map((item) => item.article);
  searchResults.replaceChildren();
  if (!query.trim()) {
    searchResults.hidden = true;
    return;
  }
  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = "No matching articles. Ask Mia for help.";
    searchResults.append(empty);
  } else {
    results.forEach((article) => {
      const link = document.createElement("a");
      link.href = `/article.html?slug=${encodeURIComponent(article.slug)}`;
      link.innerHTML = `<b>${article.title}</b><small>${article.summary}</small>`;
      searchResults.append(link);
    });
  }
  searchResults.hidden = false;
}

function appendMessage(className, text) {
  const message = document.createElement("div");
  message.className = className;
  message.textContent = text;
  messages.append(message);
  return message;
}

function showInternalResult(result, ticket = null, ticketError = null) {
  internalResult.replaceChildren();
  const outcome = document.createElement("div");
  outcome.className = `outcome-badge ${result.outcome.toLowerCase()}`;
  outcome.textContent = result.outcome;
  internalResult.append(outcome);
  if (result.handoff) {
    const note = document.createElement("small");
    note.textContent = ticketError ? `Ticket creation failed: ${ticketError.message}` : ticket ? `Saved as ${ticket.id} — internal record never shown to the customer` : "Internal handoff payload — never shown to the customer";
    const code = document.createElement("pre");
    code.textContent = JSON.stringify(ticket || result.handoff, null, 2);
    internalResult.append(note, code);
    if (ticket) {
      const link = document.createElement("a");
      link.className = "internal-ticket-link";
      link.href = `/operator.html?ticket=${encodeURIComponent(ticket.id)}`;
      link.textContent = "Open in Operator Queue →";
      internalResult.append(link);
    }
  } else {
    const note = document.createElement("p");
    note.textContent = `Answered from Help Center${result.article ? `: ${result.article.title}` : ""}. No ticket created.`;
    internalResult.append(note);
  }
}

async function answerQuestion(question) {
  appendMessage("user-message", question);
  const result = evaluateSupportRequest(question, knowledgeBase);
  let ticket = null;
  let ticketError = null;
  if (result.handoff) {
    try {
      const response = await fetch("/api/tickets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(result.handoff) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ticket creation failed");
      ticket = data.ticket;
    } catch (error) {
      ticketError = error;
    }
  }
  const reply = document.createElement("div");
  reply.className = "agent-message sourced-answer";
  const copy = document.createElement("span");
  copy.textContent = ticketError ? "I couldn’t complete the support handoff right now. Please try again in a moment; you won’t need to re-enter the details already in this conversation." : result.reply + (ticket ? ` Your case ID is ${ticket.id}.` : "");
  reply.append(copy);
  if (result.article) {
    const source = document.createElement("a");
    source.href = `/article.html?slug=${encodeURIComponent(result.article.slug)}`;
    source.textContent = `Read: ${result.article.title} →`;
    reply.append(source);
  }
  messages.append(reply);
  messages.scrollTop = messages.scrollHeight;
  showInternalResult(result, ticket, ticketError);
  return result;
}

function renderScenarios() {
  scenarioList.replaceChildren();
  demoScenarios.forEach((scenario) => {
    const button = document.createElement("button");
    button.innerHTML = `<span>${scenario.label}</span><small>Expected: ${scenario.expected}</small>`;
    button.addEventListener("click", async () => {
      input.value = scenario.message;
      await answerQuestion(scenario.message);
      input.value = "";
    });
    scenarioList.append(button);
  });
}

document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.question;
    input.focus();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  await answerQuestion(text);
  input.value = "";
});

demoToggle.addEventListener("click", () => {
  demoPanel.hidden = !demoPanel.hidden;
  demoToggle.setAttribute("aria-expanded", String(!demoPanel.hidden));
  if (!demoPanel.hidden) demoPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});
searchInput.addEventListener("input", () => renderSearch(searchInput.value));
searchInput.addEventListener("focus", () => renderSearch(searchInput.value));
document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-wrap")) searchResults.hidden = true;
});
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }
});

fetch("/data/knowledge-base.json")
  .then((response) => {
    if (!response.ok) throw new Error("Knowledge base unavailable");
    return response.json();
  })
  .then((data) => {
    knowledgeBase = data;
    renderCategories();
    renderScenarios();
    if (new URLSearchParams(location.search).get("demo") === "escalation") {
      demoPanel.hidden = false;
      demoToggle.setAttribute("aria-expanded", "true");
    }
  })
  .catch(() => {
    categoryGrid.innerHTML = '<div class="search-empty">Knowledge base is temporarily unavailable.</div>';
    form.querySelector("button.send").disabled = true;
  });
