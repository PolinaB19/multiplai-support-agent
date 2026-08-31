const grid = document.querySelector("#article-grid");
const tabs = document.querySelector("#category-tabs");
const search = document.querySelector("#docs-search");
const title = document.querySelector("#results-title");
const count = document.querySelector("#results-count");
const params = new URLSearchParams(location.search);
let selectedCategory = params.get("category") || "all";
let data = { categories: [], articles: [] };

function articleCard(article) {
  const category = data.categories.find((item) => item.id === article.category);
  const link = document.createElement("a");
  link.className = "article-card";
  link.href = `/article.html?slug=${encodeURIComponent(article.slug)}`;
  link.innerHTML = `<div><span class="article-category">${category.name}</span><span class="read-time">${article.readTime}</span></div><h3>${article.title}</h3><p>${article.summary}</p><b>Read article →</b>`;
  return link;
}

function renderTabs() {
  tabs.replaceChildren();
  [{ id: "all", name: "All" }, ...data.categories].forEach((category) => {
    const button = document.createElement("button");
    button.textContent = category.name;
    button.className = selectedCategory === category.id ? "active" : "";
    button.addEventListener("click", () => {
      selectedCategory = category.id;
      history.replaceState({}, "", category.id === "all" ? "/help.html" : `/help.html?category=${category.id}`);
      renderTabs();
      renderArticles();
    });
    tabs.append(button);
  });
}

function renderArticles() {
  const query = search.value.trim().toLowerCase();
  const articles = data.articles.filter((article) => {
    const inCategory = selectedCategory === "all" || article.category === selectedCategory;
    const haystack = `${article.title} ${article.summary} ${article.keywords.join(" ")}`.toLowerCase();
    return inCategory && (!query || haystack.includes(query));
  });
  const category = data.categories.find((item) => item.id === selectedCategory);
  title.textContent = query ? `Results for “${search.value.trim()}”` : category ? category.name : "All articles";
  count.textContent = `${articles.length} article${articles.length === 1 ? "" : "s"}`;
  grid.replaceChildren(...articles.map(articleCard));
  if (!articles.length) grid.innerHTML = '<div class="docs-empty"><b>No matching articles</b><p>Try another term or ask Mia from the Support home.</p></div>';
}

search.addEventListener("input", renderArticles);
fetch("/data/knowledge-base.json").then((response) => response.json()).then((result) => {
  data = result;
  if (selectedCategory !== "all" && !data.categories.some((item) => item.id === selectedCategory)) selectedCategory = "all";
  renderTabs();
  renderArticles();
});
