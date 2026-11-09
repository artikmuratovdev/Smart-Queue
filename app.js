import { createRealtimeClient } from "@neon/realtime/client";

const SERVICES = [
  {
    id: "admission",
    name: "Qabul va maâ€™lumot",
    description: "Hujjatlar, arizalar va umumiy savollar",
    wait: 8,
    icon: '<path d="M7 4.5h10l4 4v13H7z"/><path d="M17 4.5v4h4M10 13h8M10 16.5h6"/>',
  },
  {
    id: "documents",
    name: "Hujjatlarni rasmiylashtirish",
    description: "Maâ€™lumotnoma va hujjat topshirish",
    wait: 12,
    icon: '<path d="M6 4.5h12v16H6z"/><path d="M9 9h6M9 12.5h6M9 16h4M9 2.5v4M15 2.5v4"/>',
  },
  {
    id: "consultation",
    name: "Maslahat va yordam",
    description: "Mutaxassis bilan maslahatlashish",
    wait: 5,
    icon: '<path d="M5 5.5h14v11H11l-5 4z"/><path d="M9 10h6M9 13h4"/>',
  },
];
const state = { tickets: [], current: null, sequence: 1 };
let toastTimer;
function save() {}
function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
}
function ticketNo(n) {
  return `A-${String(n).padStart(3, "0")}`;
}
function activeTickets() {
  return state.tickets.filter((t) => t.status === "waiting").length;
}
function renderServices() {
  document.querySelector("#service-count").textContent =
    `${SERVICES.length} ta xizmat`;
  document.querySelector("#service-list").innerHTML = SERVICES.map(
    (s) =>
      `<article class="service-row"><div class="service-icon"><svg viewBox="0 0 28 28">${s.icon}</svg></div><div class="service-info"><h3>${s.name}</h3><p>${s.description}</p></div><div class="service-wait"><strong>~${s.wait} daq</strong><span>taxminiy kutish</span></div><button class="service-arrow" data-service="${s.id}" aria-label="${s.name} uchun navbat olish">â†—</button></article>`,
  ).join("");
  document
    .querySelectorAll("[data-service]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        createTicket(button.dataset.service),
      ),
    );
}
function renderTicket() {
  const current = [...state.tickets]
    .reverse()
    .find((t) => ["waiting", "called"].includes(t.status));
  const empty = document.querySelector("#empty-ticket"),
    active = document.querySelector("#active-ticket");
  if (!current) {
    empty.classList.remove("hidden");
    active.classList.add("hidden");
    return;
  }
  const service = SERVICES.find((s) => s.id === current.service);
  empty.classList.add("hidden");
  active.classList.remove("hidden");
  const ahead = state.tickets.filter(
    (t) => t.status === "waiting" && t.created < current.created,
  ).length;
  const label =
    current.status === "called" ? "Sizni chaqirishmoqda" : "Navbatda kutmoqda";
  active.innerHTML = `<span class="ticket-status ${current.status === "called" ? "called" : ""}"><i>â—</i> ${label}</span><div class="ticket-number">${ticketNo(current.number)}</div><div class="ticket-service">${service?.name || "Xizmat"}</div><div class="ticket-detail"><span>Oldingizda <strong>${ahead} kishi</strong></span><button class="cancel-ticket" id="cancel-ticket">Navbatni bekor qilish</button></div>`;
  document
    .querySelector("#cancel-ticket")
    .addEventListener("click", () => cancelTicket(current.id));
}
function renderOperator() {
  const current = state.tickets.find(
    (t) => t.id === state.current && t.status === "called",
  );
  const container = document.querySelector("#operator-current");
  if (!current)
    container.innerHTML = `<span class="operator-empty">Hozir chaqirilgan mijoz yoâ€˜q. Keyingi navbatni chaqiring.</span>`;
  else {
    const service = SERVICES.find((s) => s.id === current.service);
    container.innerHTML = `<div class="current-info"><strong class="current-number">${ticketNo(current.number)}</strong><span class="current-label"><strong>${service?.name || "Xizmat"}</strong>Operatorga yoâ€˜naltirilgan</span></div><span class="ticket-status called">â— Chaqirildi</span>`;
  }
  document.querySelector("#call-next").disabled = !state.tickets.some(
    (t) => t.status === "waiting",
  );
  document.querySelector("#finish-current").disabled = !current;
  document.querySelector("#finish-current").style.opacity = current
    ? "1"
    : ".45";
}
function render() {
  renderServices();
  renderTicket();
  renderOperator();
  document.querySelector("#hero-ticket-count").textContent = String(
    activeTickets(),
  ).padStart(2, "0");
  save();
}
function createTicket(serviceId) {
  if (!SERVICES.some((s) => s.id === serviceId)) return;
  if (state.tickets.some((t) => ["waiting", "called"].includes(t.status))) {
    toast("Sizda faol navbat bor. Avval uni yakunlang yoki bekor qiling.");
    return;
  }
  const ticket = {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    number: state.sequence++,
    service: serviceId,
    status: "waiting",
    created: Date.now(),
  };
  state.tickets.push(ticket);
  render();
  toast(`Navbatingiz ${ticketNo(ticket.number)} â€” muvaffaqiyatli olindi.`);
  document
    .querySelector("#ticket-card")
    .scrollIntoView({ behavior: "smooth", block: "center" });
}
function cancelTicket(id) {
  const ticket = state.tickets.find((t) => t.id === id);
  if (!ticket) return;
  ticket.status = "cancelled";
  if (state.current === id) state.current = null;
  render();
  toast("Navbatingiz bekor qilindi.");
}
function callNext() {
  if (state.current) {
    const prev = state.tickets.find((t) => t.id === state.current);
    if (prev?.status === "called") prev.status = "done";
  }
  const next = state.tickets
    .filter((t) => t.status === "waiting")
    .sort((a, b) => a.created - b.created)[0];
  if (!next) {
    state.current = null;
    render();
    toast("Kutayotgan navbat yoâ€˜q.");
    return;
  }
  next.status = "called";
  state.current = next.id;
  render();
  toast(`${ticketNo(next.number)} raqamli mijoz chaqirildi.`);
}
function finishCurrent() {
  const ticket = state.tickets.find((t) => t.id === state.current);
  if (!ticket) return;
  ticket.status = "done";
  state.current = null;
  render();
  toast(`${ticketNo(ticket.number)} navbati yakunlandi.`);
}
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2900);
}
document.querySelector("#call-next").addEventListener("click", callNext);
document
  .querySelector("#finish-current")
  .addEventListener("click", finishCurrent);
document.querySelector("#reset-demo").addEventListener("click", () => {
  state.tickets = [];
  state.current = null;
  state.sequence = 1;
  render();
  toast("Demo maâ€™lumotlari tozalandi.");
});
document
  .querySelector("#help-button")
  .addEventListener("click", () =>
    toast("Xizmatni tanlang va navbat raqamingizni oling."),
  );
const qrUrl = `${location.origin}${location.pathname}`;
document.querySelector("#qr-image").src =
  `https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=3d5b42&bgcolor=ffffff&data=${encodeURIComponent(qrUrl)}`;
render();

// Screen modes and service-specific operator queue.
function setMode(mode) {
  document.body.classList.toggle("operator-mode", mode === "operator");
  document.body.classList.toggle("user-mode", mode !== "operator");
  document
    .querySelectorAll(".mode-tab")
    .forEach((tab) =>
      tab.classList.toggle("active", tab.dataset.mode === mode),
    );
  if (mode === "operator") renderOperator();
}
document
  .querySelectorAll(".mode-tab")
  .forEach((tab) =>
    tab.addEventListener("click", () => setMode(tab.dataset.mode)),
  );
const serviceSelect = document.querySelector("#operator-service");
if (serviceSelect) {
  serviceSelect.innerHTML += SERVICES.map(
    (s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`,
  ).join("");
  serviceSelect.addEventListener("change", renderOperator);
}
const renderOperatorBase = renderOperator;
renderOperator = function () {
  renderOperatorBase();
  const filter = serviceSelect?.value || "all";
  const waiting = state.tickets
    .filter(
      (t) =>
        t.status === "waiting" && (filter === "all" || t.service === filter),
    )
    .sort((a, b) => a.created - b.created);
  const list = document.querySelector("#operator-queue");
  if (list)
    list.innerHTML =
      `<h3>Kutayotganlar <span>${waiting.length}</span></h3>` +
      (waiting.length
        ? waiting
            .map(
              (t) =>
                `<div class="queue-row"><strong>${ticketNo(t.number)}</strong><span>${escapeHtml(SERVICES.find((s) => s.id === t.service)?.name || "Xizmat")}</span></div>`,
            )
            .join("")
        : `<p class="queue-empty">Bu xizmatda kutayotgan navbat yoï¿½q.</p>`);
  const canCall = waiting.length > 0;
  document.querySelector("#call-next").disabled = !canCall;
};
callNext = function () {
  const filter = serviceSelect?.value || "all";
  const next = state.tickets
    .filter(
      (t) =>
        t.status === "waiting" && (filter === "all" || t.service === filter),
    )
    .sort((a, b) => a.created - b.created)[0];
  if (!next) {
    toast("Tanlangan xizmatda kutayotgan navbat yoï¿½q.");
    return;
  }
  const previous = state.tickets.find((t) => t.id === state.current);
  if (previous?.status === "called") previous.status = "done";
  next.status = "called";
  state.current = next.id;
  render();
  toast(`${ticketNo(next.number)} raqamli mijoz chaqirildi.`);
};

// Shared backend state: SSE keeps every connected screen current.
const API = `${import.meta.env.VITE_QUEUE_API_URL.replace(/\/$/, "")}/api`;
save = function() {};
async function syncState(snapshot) { Object.assign(state, snapshot); render(); }
async function apiRequest(route, payload) {
  const response = await fetch(`${API}/${route}`, { method: payload === undefined ? "GET" : "POST", headers: { "content-type": "application/json" }, body: payload === undefined ? undefined : JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) { const error = new Error(data.error || "Request failed"); error.snapshot = data.state; throw error; }
  return data;
}
createTicket = async function(serviceId) {
  try { await syncState(await apiRequest("tickets", { service: serviceId })); toast("Navbat serverda yaratildi."); }
  catch (error) { if (error.snapshot) await syncState(error.snapshot); toast(error.message); }
};
cancelTicket = async function(id) {
  try { await syncState(await apiRequest("cancel", { id, deviceId })); toast("Navbat bekor qilindi."); }
  catch (error) { if (error.snapshot) await syncState(error.snapshot); toast(error.message); }
};
callNext = async function() {
  try { await syncState(await apiRequest("call", { service: serviceSelect?.value || "all" })); toast("Keyingi mijoz chaqirildi."); }
  catch (error) { if (error.snapshot) await syncState(error.snapshot); toast(error.message); }
};
finishCurrent = async function() {
  try { await syncState(await apiRequest("finish", {})); toast("Xizmat yakunlandi."); }
  catch (error) { if (error.snapshot) await syncState(error.snapshot); toast(error.message); }
};
function rebindButton(id, handler) {
  const oldButton = document.querySelector(id);
  const button = oldButton.cloneNode(true);
  oldButton.replaceWith(button);
  button.addEventListener("click", handler);
  return button;
}
rebindButton("#call-next", callNext);
rebindButton("#finish-current", finishCurrent);
rebindButton("#reset-demo", async () => {
  try { await syncState(await apiRequest("reset", {})); toast("Demo holati tozalandi."); }
  catch (error) { if (error.snapshot) await syncState(error.snapshot); toast(error.message); }
});
const DEVICE_KEY = "navbat-device-id";
const deviceId = localStorage.getItem(DEVICE_KEY) || (crypto.randomUUID ? crypto.randomUUID() : `device-${Date.now()}-${Math.random()}`);
localStorage.setItem(DEVICE_KEY, deviceId);
createTicket = async function(serviceId) {
  try { await syncState(await apiRequest("tickets", { service: serviceId, deviceId })); toast("Yangi navbat chiptasi olindi."); }
  catch (error) { if (error.snapshot) await syncState(error.snapshot); toast(error.message); }
};
renderTicket = function() {
  const ticket = [...state.tickets].reverse().find(t => t.deviceId === deviceId && ["waiting", "called"].includes(t.status));
  const empty = document.querySelector("#empty-ticket"), active = document.querySelector("#active-ticket");
  if (!ticket) { empty.classList.remove("hidden"); active.classList.add("hidden"); return; }
  const service = SERVICES.find(s => s.id === ticket.service);
  const ahead = state.tickets.filter(t => t.service === ticket.service && t.status === "waiting" && t.created < ticket.created).length;
  empty.classList.add("hidden"); active.classList.remove("hidden");
  active.innerHTML = `<span class="ticket-status ${ticket.status === "called" ? "called" : ""}">${ticket.status === "called" ? "Sizni chaqirishmoqda" : "Navbatda kutmoqda"}</span><div class="ticket-number">${ticketNo(ticket.number)}</div><div class="ticket-service">${escapeHtml(service?.name || "Xizmat")}</div><div class="ticket-detail"><span>Oldingizda <strong>${ahead} kishi</strong></span><button class="cancel-ticket" id="cancel-ticket">Navbatni bekor qilish</button></div>`;
  document.querySelector("#cancel-ticket").addEventListener("click", () => cancelTicket(ticket.id));
};
const renderOperatorWithServiceQueue = renderOperator;
renderOperator = function() {
  renderOperatorWithServiceQueue();
  const currentTicket = state.tickets.find(t => t.id === state.current && t.status === "called");
  if (currentTicket) {
    const info = document.querySelector("#operator-current .current-label");
    if (info) info.innerHTML = `<strong>${escapeHtml(SERVICES.find(s => s.id === currentTicket.service)?.name || "Xizmat")}</strong>Chaqirildi`;
  }
  const filter = serviceSelect?.value || "all";
  const waiting = state.tickets.filter(t => t.status === "waiting" && (filter === "all" || t.service === filter)).sort((a,b) => a.created-b.created);
  const list = document.querySelector("#operator-queue");
  if (list) list.innerHTML = `<h3>Kutayotganlar <span>${waiting.length}</span></h3>` + (waiting.length ? waiting.map(t => `<div class="queue-row"><strong>${ticketNo(t.number)}</strong><span>${escapeHtml(SERVICES.find(s => s.id === t.service)?.name || "Xizmat")}</span></div>`).join("") : `<p class="queue-empty">Bu xizmatda kutayotgan navbat yo‘q.</p>`);
};
renderServices();




const realtimeClient = createRealtimeClient({ url: import.meta.env.VITE_NEON_REALTIME_URL });
async function connectRealtime() {
  try {
    const sealedQuery = await apiRequest("live", {});
    const subscription = realtimeClient.subscribe(sealedQuery);
    subscription.onChange((snapshot) => {
      if (!snapshot.data) return;
      const tickets = snapshot.data.map((row) => ({ id: row.id, number: Number(row.number), service: row.service, deviceId: row.deviceId, status: row.status, created: row.created instanceof Date ? row.created.getTime() : new Date(row.created).getTime() }));
      syncState({ tickets, current: tickets.find((ticket) => ticket.status === "called")?.id ?? null, sequence: tickets.length ? Math.max(...tickets.map((ticket) => ticket.number)) + 1 : 1 });
    });
    subscription.onStateChange((connectionState) => { if (connectionState.status === "error") toast(`Realtime uzildi: ${connectionState.error.message}`); });
    window.addEventListener("beforeunload", () => { subscription.unsubscribe(); realtimeClient.close(); }, { once: true });
  } catch (error) { toast(`Neon Realtime ulanmadi: ${error.message}`); }
}
connectRealtime();



