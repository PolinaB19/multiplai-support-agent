const input = document.querySelector("#message");
const form = document.querySelector("#chat-form");
const messages = document.querySelector("#messages");
const searchInput = document.querySelector("#knowledge-search");
const searchResults = document.querySelector("#search-results");
const categoryGrid = document.querySelector("#category-grid");
let knowledgeBase = { categories: [], articles: [] };

const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
const tokens = (value) => [...new Set(normalize(value).split(/\s+/).filter((word) => word.length > 2))];

function articleScore(article, query) {
  const words = tokens(query);
  if (!words.length) return 0;
  const title = normalize(article.title);
  const keywords = normalize(article.keywords.join(" "));
  const summary = normalize(article.summary);
  return words.reduce((score, word) => score + (title.includes(word) ? 5 : 0) + (keywords.includes(word) ? 3 : 0) + (summary.includes(word) ? 1 : 0), 0);
}

function rankedArticles(query) {
  return knowledgeBase.articles
    .map((article) => ({ article, score: articleScore(article, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.article);
}

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
  const results = rankedArticles(query).slice(0, 5);
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

function answerQuestion(question) {
  appendMessage("user-message", question);
  const article = rankedArticles(question)[0];
  const reply = document.createElement("div");
  reply.className = "agent-message sourced-answer";
  if (article) {
    const copy = document.createElement("span");
    copy.textContent = article.summary + " ";
    const source = document.createElement("a");
    source.href = `/article.html?slug=${encodeURIComponent(article.slug)}`;
    source.textContent = `Read: ${article.title} →`;
    reply.append(copy, source);
  } else {
    reply.textContent = "I couldn’t find an exact match in the documentation. Browse the Help Center or ask me with more detail so I can route the issue correctly.";
    const source = document.createElement("a");
    source.href = "/help.html";
    source.textContent = " Browse all documentation →";
    reply.append(source);
  }
  messages.append(reply);
  messages.scrollTop = messages.scrollHeight;
}

document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.question;
    input.focus();
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  answerQuestion(text);
  input.value = "";
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
  })
  .catch(() => {
    categoryGrid.innerHTML = '<div class="search-empty">Knowledge base is temporarily unavailable.</div>';
  });
