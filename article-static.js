const container = document.querySelector("#article-page");
const slug = new URLSearchParams(location.search).get("slug");

function renderArticle(article, category) {
  document.title = `${article.title} — Multiplai`;
  document.querySelector('meta[name="description"]').setAttribute("content", article.summary);
  container.replaceChildren();
  const breadcrumbs = document.createElement("div");
  breadcrumbs.className = "breadcrumbs";
  breadcrumbs.innerHTML = `<a href="/">Help Center</a><span>›</span><a href="/help.html?category=${category.id}">${category.name}</a><span>›</span><span>Article</span>`;
  const header = document.createElement("header");
  header.className = "article-title";
  header.innerHTML = `<span class="article-category">${category.name}</span><h1>${article.title}</h1><p>${article.summary}</p><small>Updated Aug 31, 2026 · ${article.readTime}</small>`;
  container.append(breadcrumbs, header);
  article.sections.forEach((section) => {
    const block = document.createElement("section");
    const heading = document.createElement("h2");
    heading.textContent = section.heading;
    block.append(heading);
    if (section.body) {
      const paragraph = document.createElement("p");
      paragraph.textContent = section.body;
      block.append(paragraph);
    }
    if (section.steps) {
      const list = document.createElement("ol");
      section.steps.forEach((step) => {
        const item = document.createElement("li");
        item.textContent = step;
        list.append(item);
      });
      block.append(list);
    }
    container.append(block);
  });
  const feedback = document.createElement("div");
  feedback.className = "article-feedback";
  feedback.innerHTML = '<b>Was this article helpful?</b><div><button>Yes</button><button>Not yet</button></div>';
  feedback.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { feedback.innerHTML = "<b>Thanks for your feedback.</b>"; }));
  container.append(feedback);
}

fetch("/data/knowledge-base.json").then((response) => response.json()).then((data) => {
  const article = data.articles.find((item) => item.slug === slug);
  if (!article) {
    container.innerHTML = '<div class="docs-empty"><b>Article not found</b><p>The link may be outdated.</p><a href="/help.html">Browse all documentation →</a></div>';
    return;
  }
  renderArticle(article, data.categories.find((item) => item.id === article.category));
});
