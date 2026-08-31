import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [home, help, articlePage, knowledgeText] = await Promise.all([
  read("index.html"), read("help.html"), read("article.html"), read("data/knowledge-base.json")
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
console.log(`Knowledge base validation passed: ${knowledge.categories.length} categories, ${knowledge.articles.length} articles`);
