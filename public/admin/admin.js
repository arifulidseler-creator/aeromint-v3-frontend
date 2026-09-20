const API_BASE = "https://aeromint-v3-backend-production.up.railway.app";
const tg = window.Telegram?.WebApp;

const $ = (id) => document.getElementById(id);
const form = $("taskForm");
const taskList = $("taskList");
const message = $("message");

let tasks = [];
let editingId = null;

if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor("#07110d");
  tg.setBackgroundColor("#07110d");
}

function showMessage(text, type = "ok") {
  message.textContent = text;
  message.className = `message ${type}`;
}

function clearMessage() {
  message.textContent = "";
  message.className = "message hidden";
}

async function api(path, options = {}) {
  const initData = tg?.initData || "";
  const headers = {
    "Content-Type": "application/json",
    "X-Telegram-Init-Data": initData,
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}

function normalizeTask(t) {
  return {
    id: t.id,
    title: t.title ?? "",
    description: t.description ?? "",
    reward: Number(t.reward ?? t.reward_amt ?? 0),
    category: t.category ?? "social",
    verificationType: t.verification_type ?? t.verificationType ?? "none",
    target: t.action_url ?? t.target ?? t.url ?? t.link ?? "",
    active: Boolean(t.is_active ?? t.active ?? true)
  };
}

function resetForm() {
  editingId = null;
  $("taskId").value = "";
  $("title").value = "";
  $("description").value = "";
  $("reward").value = "0.20";
  $("category").value = "social";
  $("verificationType").value = "none";
  $("target").value = "";
  $("active").checked = true;
  $("formTitle").textContent = "Add Task";
  $("saveBtn").textContent = "Add Task";
  $("cancelEditBtn").classList.add("hidden");
}

function editTask(task) {
  editingId = task.id;
  $("taskId").value = task.id;
  $("title").value = task.title;
  $("description").value = task.description;
  $("reward").value = task.reward.toFixed(2);
  $("category").value = task.category;
  $("verificationType").value = task.verificationType;
  $("target").value = task.target;
  $("active").checked = task.active;
  $("formTitle").textContent = "Edit Task";
  $("saveBtn").textContent = "Save Changes";
  $("cancelEditBtn").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function taskCard(task) {
  const status = task.active ? "Active" : "Inactive";
  const safe = (value) => String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  return `
    <article class="task-card">
      <div class="task-main">
        <div class="task-top">
          <h3>${safe(task.title)}</h3>
          <span class="status ${task.active ? "active" : "inactive"}">${status}</span>
        </div>
        <p>${safe(task.description || "No description")}</p>
        <div class="meta">
          <span>${task.reward.toFixed(2)} AMT</span>
          <span>${safe(task.category)}</span>
          <span>${safe(task.verificationType)}</span>
        </div>
        ${task.target ? `<div class="target">${safe(task.target)}</div>` : ""}
      </div>
      <div class="actions">
        <button class="btn secondary" data-edit="${safe(task.id)}">Edit</button>
        <button class="btn ghost" data-toggle="${safe(task.id)}">${task.active ? "Disable" : "Enable"}</button>
        <button class="btn danger" data-delete="${safe(task.id)}">Remove</button>
      </div>
    </article>
  `;
}

function renderTasks() {
  $("taskCount").textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
  if (!tasks.length) {
    taskList.innerHTML = `<div class="empty">No tasks found.</div>`;
    return;
  }
  taskList.innerHTML = tasks.map(taskCard).join("");
}

async function loadTasks() {
  clearMessage();
  taskList.innerHTML = `<div class="empty">Loading tasks…</div>`;
  try {
    const data = await api("/api/admin/tasks");
    tasks = (data.tasks || data || []).map(normalizeTask);
    renderTasks();
  } catch (err) {
    taskList.innerHTML = `<div class="empty">Could not load tasks.</div>`;
    showMessage(err.message, "error");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

  const title = $("title").value.trim();
  const description = $("description").value.trim();
  const reward = Number($("reward").value);
  const category = $("category").value;
  const verification_type = $("verificationType").value;
  const target = $("target").value.trim();
  const active = $("active").checked;

  if (!title || !Number.isFinite(reward) || reward <= 0) {
    showMessage("Enter a valid title and reward.", "error");
    return;
  }

  const payload = { title, description, reward, category, verification_type, target, active };
  const saveBtn = $("saveBtn");
  saveBtn.disabled = true;

  try {
    if (editingId !== null) {
      await api(`/api/admin/tasks/${encodeURIComponent(editingId)}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showMessage("Task updated successfully.");
    } else {
      await api("/api/admin/tasks", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showMessage("Task added successfully.");
    }
    resetForm();
    await loadTasks();
  } catch (err) {
    showMessage(err.message, "error");
  } finally {
    saveBtn.disabled = false;
  }
});

$("cancelEditBtn").addEventListener("click", resetForm);
$("refreshBtn").addEventListener("click", loadTasks);

taskList.addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-edit]");
  const toggle = e.target.closest("[data-toggle]");
  const del = e.target.closest("[data-delete]");

  if (edit) {
    const task = tasks.find(t => String(t.id) === String(edit.dataset.edit));
    if (task) editTask(task);
    return;
  }

  if (toggle) {
    const task = tasks.find(t => String(t.id) === String(toggle.dataset.toggle));
    if (!task) return;
    try {
      await api(`/api/admin/tasks/${encodeURIComponent(task.id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !task.active })
      });
      showMessage(`Task ${task.active ? "disabled" : "enabled"}.`);
      await loadTasks();
    } catch (err) {
      showMessage(err.message, "error");
    }
    return;
  }

  if (del) {
    const task = tasks.find(t => String(t.id) === String(del.dataset.delete));
    if (!task) return;
    if (!confirm(`Remove "${task.title}"?`)) return;

    try {
      await api(`/api/admin/tasks/${encodeURIComponent(task.id)}`, {
        method: "DELETE"
      });
      showMessage("Task removed.");
      if (String(editingId) === String(task.id)) resetForm();
      await loadTasks();
    } catch (err) {
      showMessage(err.message, "error");
    }
  }
});

loadTasks();
