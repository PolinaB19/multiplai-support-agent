import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { createTicketStore } from "./ticket-store.js";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4317);
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
const tickets = createTicketStore(resolve(root, "runtime", "tickets.json"));

function sendJson(response, status, data) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(data));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 100_000) throw new Error("Request body is too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function handleTicketApi(request, response, pathname) {
  if (pathname === "/api/tickets" && request.method === "GET") {
    sendJson(response, 200, { tickets: await tickets.list() });
    return true;
  }
  if (pathname === "/api/tickets" && request.method === "POST") {
    const ticket = await tickets.create(await readJson(request));
    sendJson(response, 201, { ticket });
    return true;
  }
  const match = pathname.match(/^\/api\/tickets\/([^/]+)$/);
  if (match && request.method === "PATCH") {
    const ticket = await tickets.update(decodeURIComponent(match[1]), await readJson(request));
    sendJson(response, ticket ? 200 : 404, ticket ? { ticket } : { error: "Ticket not found" });
    return true;
  }
  return false;
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      if (await handleTicketApi(request, response, url.pathname)) return;
      sendJson(response, 404, { error: "API route not found" });
      return;
    }
    const relative = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    if (relative === "runtime" || relative.startsWith(`runtime${sep}`) || relative.startsWith("runtime/") || relative.startsWith(".git")) throw new Error("Private path");
    const file = resolve(root, relative);
    if (file !== root && !file.startsWith(root + sep)) throw new Error("Invalid path");
    const data = await readFile(file);
    response.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
    response.end(data);
  } catch (error) {
    if (request.url.startsWith("/api/")) sendJson(response, 400, { error: error.message || "Invalid request" });
    else {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  }
}).listen(port, "127.0.0.1", () => console.log(`Local URL: http://127.0.0.1:${port}`));
