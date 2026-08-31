import { demoScenarios, evaluateSupportRequest } from "/support-engine.js";

const list = document.querySelector("#ticket-list");
const detail = document.querySelector("#ticket-detail");
const metrics = document.querySelector("#ticket-metrics");
const search = document.querySelector("#ticket-search");
const statusFilter = document.querySelector("#status-filter");
const priorityFilter = document.querySelector("#priority-filter");
const seedButton = document.querySelector("#seed-demo");
let tickets = [];
let selectedId = new URLSearchParams(location.search).get("ticket");

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const formatDate = (value) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

async function api(path = "", options = {}) {
  const response = await fetch(`/api/tickets${path}`, { headers: { "content-type": "application/json" }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Ticket request failed");
  return data;
}

function renderMetrics() {
  const values = [
    ["Open", tickets.filter((ticket) => ticket.status === "OPEN").length],
    ["In progress", tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length],
    ["Urgent", tickets.filter((ticket) => ticket.priority === "URGENT" && ticket.status !== "RESOLVED").length],
    ["Resolved", tickets.filter((ticket) => ticket.status === "RESOLVED").length]
  ];
  metrics.innerHTML = values.map(([label, value]) => `<div><small>${label}</small><b>${value}</b></div>`).join("");
}

function filteredTickets() {
  const query = search.value.trim().toLowerCase();
  return tickets.filter((ticket) =>
    (statusFilter.value === "ALL" || ticket.status === statusFilter.value) &&
    (priorityFilter.value === "ALL" || ticket.priority === priorityFilter.value) &&
    (!query || `${ticket.id} ${ticket.category} ${ticket.summary}`.toLowerCase().includes(query))
  );
}

function renderList() {
  const filtered = filteredTickets();
  if (!filtered.length) {
    list.innerHTML = '<div class="queue-empty"><b>No tickets found</b><p>Create demo tickets or change the filters.</p></div>';
    return;
  }
  list.innerHTML = filtered.map((ticket) => `<button class="ticket-row ${ticket.id === selectedId ? "active" : ""}" data-ticket-id="${escapeHtml(ticket.id)}"><div><span class="priority-dot ${ticket.priority.toLowerCase()}"></span><b>${escapeHtml(ticket.id)}</b><span class="ticket-status ${ticket.status.toLowerCase()}">${escapeHtml(ticket.status.replace("_", " "))}</span></div><p>${escapeHtml(ticket.summary)}</p><footer><span>${escapeHtml(ticket.category)}</span><span>${formatDate(ticket.created_at)}</span></footer></button>`).join("");
  list.querySelectorAll("[data-ticket-id]").forEach((button) => button.addEventListener("click", () => {
    selectedId = button.dataset.ticketId;
    renderList();
    renderDetail();
  }));
}

function listBlock(title, items, empty) {
  return `<section class="ticket-section"><h3>${title}</h3>${items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p>${empty}</p>`}</section>`;
}

function renderDetail() {
  const ticket = tickets.find((item) => item.id === selectedId);
  if (!ticket) {
    detail.innerHTML = '<div class="queue-empty"><b>Select a ticket</b><p>Case details and actions will appear here.</p></div>';
    return;
  }
  detail.innerHTML = `<header><div><span class="priority-pill ${ticket.priority.toLowerCase()}">${ticket.priority}</span><span class="ticket-status ${ticket.status.toLowerCase()}">${ticket.status.replace("_", " ")}</span></div><h2>${escapeHtml(ticket.id)}</h2><p>${escapeHtml(ticket.summary)}</p></header><div class="ticket-facts"><div><small>Route</small><b>${escapeHtml(ticket.route_to)}</b></div><div><small>Category</small><b>${escapeHtml(ticket.category)}</b></div><div><small>Assignee</small><b>${escapeHtml(ticket.assignee || "Unassigned")}</b></div><div><small>Created</small><b>${formatDate(ticket.created_at)}</b></div></div><section class="ticket-section"><h3>Escalation reason</h3><p>${escapeHtml(ticket.reason)}</p></section>${listBlock("Troubleshooting attempted", ticket.troubleshooting_attempted, "No troubleshooting captured.")}${listBlock("Missing information", ticket.missing_information, "No missing information.")}<section class="ticket-section activity"><h3>Activity</h3>${ticket.activity.slice().reverse().map((event) => `<div><span>${escapeHtml(event.type.replace("_", " "))}</span><p>${escapeHtml(event.note)}</p><small>${formatDate(event.at)}</small></div>`).join("")}</section><section class="ticket-actions"><textarea id="internal-note" placeholder="Add an internal investigation note…"></textarea><div><button class="secondary-action" id="add-note">Add note</button>${ticket.status === "OPEN" ? '<button class="primary-btn" id="take-ticket">Take ownership</button>' : ""}${ticket.status !== "RESOLVED" ? '<button class="resolve-action" id="resolve-ticket">Resolve</button>' : ""}</div></section>`;
  document.querySelector("#take-ticket")?.addEventListener("click", () => updateTicket(ticket.id, { status: "IN_PROGRESS", assignee: "Demo operator" }));
  document.querySelector("#resolve-ticket")?.addEventListener("click", () => updateTicket(ticket.id, { status: "RESOLVED", resolution: "Resolved in operator demo" }));
  document.querySelector("#add-note")?.addEventListener("click", () => {
    const note = document.querySelector("#internal-note").value.trim();
    if (note) updateTicket(ticket.id, { internal_note: note });
  });
}

async function updateTicket(id, changes) {
  const { ticket } = await api(`/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(changes) });
  tickets = tickets.map((item) => item.id === id ? ticket : item);
  renderAll();
}

function renderAll() {
  renderMetrics();
  renderList();
  renderDetail();
}

async function loadTickets() {
  ({ tickets } = await api());
  if (selectedId && !tickets.some((ticket) => ticket.id === selectedId)) selectedId = null;
  renderAll();
}

async function createDemoTickets() {
  seedButton.disabled = true;
  seedButton.textContent = "Creating…";
  try {
    const knowledge = await fetch("/data/knowledge-base.json").then((response) => response.json());
    for (const id of ["billing", "persistent-401", "outage"]) {
      const scenario = demoScenarios.find((item) => item.id === id);
      const result = evaluateSupportRequest(scenario.message, knowledge);
      if (result.handoff) await api("", { method: "POST", body: JSON.stringify(result.handoff) });
    }
    await loadTickets();
  } finally {
    seedButton.disabled = false;
    seedButton.textContent = "+ Create demo tickets";
  }
}

[search, statusFilter, priorityFilter].forEach((control) => control.addEventListener("input", renderList));
document.querySelector("#refresh-tickets").addEventListener("click", loadTickets);
seedButton.addEventListener("click", createDemoTickets);
loadTickets().catch((error) => { list.innerHTML = `<div class="queue-empty"><b>Queue unavailable</b><p>${escapeHtml(error.message)}</p></div>`; });
