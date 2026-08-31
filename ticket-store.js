import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"];
export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const text = (value, max = 1000) => typeof value === "string" ? value.trim().slice(0, max) : "";
const list = (value) => Array.isArray(value) ? value.map((item) => text(item, 240)).filter(Boolean).slice(0, 20) : [];

export function validateTicketInput(input) {
  if (!input || input.status !== "ESCALATED") throw new Error("Only escalated cases can create tickets");
  if (!TICKET_PRIORITIES.includes(input.priority)) throw new Error("Invalid priority");
  if (!["ESCALATE_L1", "ESCALATE_L2", "ESCALATE_URGENT"].includes(input.route_to)) throw new Error("Invalid route");
  if (!text(input.summary)) throw new Error("Ticket summary is required");
  return {
    category: text(input.category, 80) || "general",
    priority: input.priority,
    route_to: input.route_to,
    reason: text(input.reason, 600),
    summary: text(input.summary, 1000),
    troubleshooting_attempted: list(input.troubleshooting_attempted),
    missing_information: list(input.missing_information)
  };
}

export function buildTicket(input, sequence, now = new Date()) {
  const valid = validateTicketInput(input);
  const stamp = now.toISOString();
  const date = stamp.slice(0, 10).replaceAll("-", "");
  return {
    id: `TKT-${date}-${String(sequence).padStart(4, "0")}`,
    status: "OPEN",
    ...valid,
    assignee: null,
    resolution: null,
    created_at: stamp,
    updated_at: stamp,
    activity: [{ type: "CREATED", at: stamp, note: `Routed to ${valid.route_to}` }]
  };
}

export function applyTicketUpdate(ticket, changes, now = new Date()) {
  const updated = structuredClone(ticket);
  const stamp = now.toISOString();
  if (changes.status !== undefined) {
    if (!TICKET_STATUSES.includes(changes.status)) throw new Error("Invalid status");
    if (changes.status !== updated.status) {
      updated.status = changes.status;
      updated.activity.push({ type: "STATUS_CHANGED", at: stamp, note: `Status changed to ${changes.status}` });
    }
  }
  if (changes.assignee !== undefined) {
    updated.assignee = text(changes.assignee, 120) || null;
    updated.activity.push({ type: "ASSIGNED", at: stamp, note: updated.assignee ? `Assigned to ${updated.assignee}` : "Assignment cleared" });
  }
  if (changes.resolution !== undefined) updated.resolution = text(changes.resolution, 800) || null;
  const internalNote = text(changes.internal_note, 800);
  if (internalNote) updated.activity.push({ type: "INTERNAL_NOTE", at: stamp, note: internalNote });
  updated.updated_at = stamp;
  return updated;
}

export function createTicketStore(filePath) {
  let writeQueue = Promise.resolve();

  async function load() {
    try {
      const parsed = JSON.parse(await readFile(filePath, "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  async function save(tickets) {
    await mkdir(dirname(filePath), { recursive: true });
    const temporary = `${filePath}.tmp`;
    await writeFile(temporary, JSON.stringify(tickets, null, 2), "utf8");
    await rename(temporary, filePath);
  }

  function mutate(operation) {
    const result = writeQueue.then(async () => {
      const tickets = await load();
      const value = await operation(tickets);
      await save(tickets);
      return value;
    });
    writeQueue = result.catch(() => undefined);
    return result;
  }

  return {
    async list() {
      const weight = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (await load()).sort((a, b) => weight[b.priority] - weight[a.priority] || b.created_at.localeCompare(a.created_at));
    },
    create(input) {
      return mutate((tickets) => {
        const ticket = buildTicket(input, tickets.length + 1);
        tickets.push(ticket);
        return ticket;
      });
    },
    update(id, changes) {
      return mutate((tickets) => {
        const index = tickets.findIndex((ticket) => ticket.id === id);
        if (index < 0) return null;
        tickets[index] = applyTicketUpdate(tickets[index], changes);
        return tickets[index];
      });
    }
  };
}
