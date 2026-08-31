const input = document.querySelector("#message");
const form = document.querySelector("#chat-form");
const messages = document.querySelector("#messages");

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
  const user = document.createElement("div");
  user.className = "user-message";
  user.textContent = text;
  const reply = document.createElement("div");
  reply.className = "agent-message";
  reply.textContent = "I’m checking your campaign. Four variations are waiting for caption adaptation for the German and Polish markets. I can prepare recommendations or escalate the task to a specialist.";
  messages.append(user, reply);
  input.value = "";
  messages.scrollTop = messages.scrollHeight;
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector(".search input").focus();
  }
});
