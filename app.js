class PersistenceAdapter {
  getItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      console.error("Falha ao ler", key, err);
      return null;
    }
  }
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      console.error("Falha ao salvar", key, err);
    }
  }
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.error("Falha ao remover", key, err);
    }
  }
}
const storage = new PersistenceAdapter();

const SEED_USERS = [
  { name: "Ana Silva", password: "admin123", role: "Admin", team: "Equipe A" },
  { name: "Carlos Souza", password: "membro123", role: "Membro", team: "Equipe A" },
  { name: "Beatriz Lima", password: "admin123", role: "Admin", team: "Equipe B" },
  { name: "Rafael Nogueira", password: "membro123", role: "Membro", team: "Equipe B" },
];

const PRIORITY_META = {
  urgente: { label: "Urgente", color: "#ff4d4f" },
  alta: { label: "Alta", color: "#ff9f43" },
  normal: { label: "Normal", color: "#4c8dff" },
  baixa: { label: "Baixa", color: "#9aa0ab" },
};

const AVATAR_PALETTE = ["#6c8cff", "#4fe3a5", "#ff9f6c", "#f3a8e0", "#7ad1ff", "#ffce6c"];
function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
function initialsOf(name) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

class UserManager {
  constructor(storage) {
    this.storage = storage;
    this.STORAGE_KEY = "taskflow-users";
    this.users = [];
  }

  load() {
    const raw = this.storage.getItem(this.STORAGE_KEY);
    if (raw) {
      this.users = JSON.parse(raw);
    } else {
      this.users = [...SEED_USERS];
      this.save();
    }
  }

  save() {
    this.storage.setItem(this.STORAGE_KEY, JSON.stringify(this.users));
  }

  findByName(name) {
    return this.users.find((u) => u.name.toLowerCase() === name.toLowerCase());
  }

  register(name, password, team) {
    const cleanName = name.trim();
    const cleanTeam = team.trim();
    if (!cleanName || !password || !cleanTeam) {
      throw new Error("Preencha todos os campos.");
    }
    if (this.findByName(cleanName)) {
      throw new Error("Já existe uma conta com esse nome.");
    }
    const user = { name: cleanName, password, role: "Membro", team: cleanTeam };
    this.users.push(user);
    this.save();
    return user;
  }

  teamMembers(team) {
    return this.users.filter((u) => u.team === team).map((u) => u.name);
  }
}

class AuthManager {
  constructor(storage, userManager) {
    this.storage = storage;
    this.userManager = userManager;
    this.STORAGE_KEY = "taskflow-session";
    this.currentUser = null;
  }

  loadSession() {
    const raw = this.storage.getItem(this.STORAGE_KEY);
    this.currentUser = raw ? JSON.parse(raw) : null;
    return this.currentUser;
  }

  login(name, password) {
    const match = this.userManager.users.find(
      (u) => u.name.toLowerCase() === name.toLowerCase() && u.password === password
    );
    if (!match) return null;
    this.currentUser = { name: match.name, role: match.role, team: match.team };
    this.storage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));
    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
    this.storage.removeItem(this.STORAGE_KEY);
  }

  isAdmin() {
    return !!this.currentUser && this.currentUser.role === "Admin";
  }
}

class TaskManager {
  constructor(storage) {
    this.storage = storage;
    this.STORAGE_KEY = "taskflow-tasks";
    this.tasks = [];
  }

  load() {
    const raw = this.storage.getItem(this.STORAGE_KEY);
    this.tasks = raw ? JSON.parse(raw) : [];
  }

  save() {
    this.storage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks));
  }

  nextId() {
    return this.tasks.length ? Math.max(...this.tasks.map((t) => t.id)) + 1 : 1;
  }

  addTask({ title, description, startDate, endDate, assignees, team, priority, checklist, attachments }) {
    const task = {
      id: this.nextId(),
      title: title.trim(),
      description: (description || "").trim(),
      startDate: startDate || "",
      endDate: endDate || "",
      assignees: assignees.map((a) => a.trim()).filter(Boolean),
      status: "pendente",
      team,
      priority: priority || "normal",
      checklist: checklist || [],
      comments: [],
      attachments: attachments || [],
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    this.save();
    return task;
  }

  updateTask(id, { title, description, startDate, endDate, assignees, priority }) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    task.title = title.trim();
    task.description = (description || "").trim();
    task.startDate = startDate || "";
    task.endDate = endDate || "";
    task.assignees = assignees.map((a) => a.trim()).filter(Boolean);
    task.priority = priority || task.priority;
    this.save();
    return task;
  }

  moveTask(id, newStatus) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    task.status = newStatus;
    this.save();
    return task;
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.save();
  }

  toggleChecklistItem(taskId, itemId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;
    const item = task.checklist.find((i) => i.id === itemId);
    if (item) item.done = !item.done;
    this.save();
    return task;
  }

  addChecklistItem(taskId, text) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;
    task.checklist.push({ id: Date.now(), text: text.trim(), done: false });
    this.save();
    return task;
  }

  removeChecklistItem(taskId, itemId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;
    task.checklist = task.checklist.filter((i) => i.id !== itemId);
    this.save();
    return task;
  }

  addComment(taskId, author, role, text) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;
    task.comments.push({ id: Date.now(), author, role, text: text.trim(), timestamp: new Date().toISOString() });
    this.save();
    return task;
  }

  addAttachment(taskId, filename) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;
    task.attachments.push(filename);
    this.save();
    return task;
  }

  getFiltered(team, status, query) {
    const q = (query || "").trim().toLowerCase();
    return this.tasks.filter(
      (t) => t.team === team && t.status === status && (!q || t.title.toLowerCase().includes(q))
    );
  }
}

class ChatManager {
  constructor(storage) {
    this.storage = storage;
    this.STORAGE_KEY = "taskflow-chat";
    this.messages = [];
  }

  load() {
    const raw = this.storage.getItem(this.STORAGE_KEY);
    this.messages = raw ? JSON.parse(raw) : [];
  }

  save() {
    this.storage.setItem(this.STORAGE_KEY, JSON.stringify(this.messages));
  }

  _push({ type, user, role, team, to, text }) {
    const message = {
      id: Date.now() + Math.random(),
      type,
      user,
      role,
      team,
      to: to || null,
      color: colorForName(user),
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    this.messages.push(message);
    this.save();
    return message;
  }

  addTeamMessage(userName, role, team, text) {
    return this._push({ type: "team", user: userName, role, team, text });
  }

  addDirectMessage(userName, role, team, to, text) {
    return this._push({ type: "dm", user: userName, role, team, to, text });
  }

  getByTeam(team) {
    return this.messages.filter((m) => m.type === "team" && m.team === team);
  }

  getDirectMessages(team, a, b) {
    return this.messages.filter(
      (m) => m.type === "dm" && m.team === team && ((m.user === a && m.to === b) || (m.user === b && m.to === a))
    );
  }
}

class App {
  constructor() {
    this.userManager = new UserManager(storage);
    this.authManager = new AuthManager(storage, this.userManager);
    this.taskManager = new TaskManager(storage);
    this.chatManager = new ChatManager(storage);
    this.draggedTaskId = null;
    this.selectedAssignees = [];
    this.editingTaskId = null;
    this.workingChecklist = [];
    this.workingAttachments = [];
    this.chatMode = "team";
    this.dmRecipient = null;
    this.touchState = null;
    this.suppressNextClick = false;
  }

  init() {
    this.applySavedTheme();
    this.bindThemeSwitcher();
    this.userManager.load();
    this.bindLoginTabs();
    this.bindLoginForm();
    this.bindSignupForm();
    this.setupAssigneesInput();

    const session = this.authManager.loadSession();
    if (session) this.showApp();
  }

  applySavedTheme() {
    const theme = storage.getItem("taskflow-theme") || "dark";
    document.body.setAttribute("data-theme", theme);
    this.highlightThemeDot(theme);
  }

  highlightThemeDot(theme) {
    document.querySelectorAll(".theme-dot").forEach((dot) => {
      dot.classList.toggle("active", dot.dataset.theme === theme);
    });
  }

  bindThemeSwitcher() {
    document.getElementById("themeSwitcher").addEventListener("click", (e) => {
      const btn = e.target.closest(".theme-dot");
      if (btn) this.setTheme(btn.dataset.theme);
    });
  }

  setTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    this.highlightThemeDot(theme);
    storage.setItem("taskflow-theme", theme);
  }

  bindLoginTabs() {
    document.querySelectorAll(".login-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".login-tab").forEach((t) => t.classList.remove("active"));
        document.querySelectorAll(".login-panel").forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`${tab.dataset.tab}Panel`).classList.add("active");
      });
    });

    document.getElementById("signupTeam").addEventListener("change", (e) => {
      document.getElementById("signupNewTeamField").classList.toggle("hidden", e.target.value !== "__new__");
    });
  }

  bindLoginForm() {
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("loginName").value;
      const password = document.getElementById("loginPassword").value;
      const errorEl = document.getElementById("loginError");
      const user = this.authManager.login(name, password);
      if (!user) {
        errorEl.textContent = "Nome ou senha inválidos.";
        return;
      }
      errorEl.textContent = "";
      document.getElementById("loginPassword").value = "";
      this.showApp();
      showToast(`Bem-vindo(a), ${user.name}!`);
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.authManager.logout();
      document.getElementById("appRoot").classList.add("hidden");
      document.getElementById("loginScreen").classList.remove("hidden");
    });
  }

  bindSignupForm() {
    document.getElementById("signupForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("signupError");
      const name = document.getElementById("signupName").value;
      const password = document.getElementById("signupPassword").value;
      const teamSelect = document.getElementById("signupTeam").value;
      const team = teamSelect === "__new__" ? document.getElementById("signupNewTeam").value : teamSelect;

      try {
        this.userManager.register(name, password, team);
      } catch (err) {
        errorEl.textContent = err.message;
        return;
      }
      errorEl.textContent = "";
      const user = this.authManager.login(name.trim(), password);
      e.target.reset();
      document.getElementById("signupNewTeamField").classList.add("hidden");
      this.showApp();
      showToast(`Conta criada! Bem-vindo(a) à ${user.team}, ${user.name}.`);
    });
  }

  showApp() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("appRoot").classList.remove("hidden");
    this.renderSessionChip();
    this.applyRolePermissions();

    this.taskManager.load();
    this.chatManager.load();
    this.renderBoard();
    this.renderChatIdentity();
    this.renderChat();
    this.bindAppEvents();
  }

  renderSessionChip() {
    const user = this.authManager.currentUser;
    const avatar = document.getElementById("sessionAvatar");
    avatar.textContent = initialsOf(user.name);
    avatar.style.background = colorForName(user.name);
    document.getElementById("sessionName").textContent = `${user.name} · ${user.role} · ${user.team}`;
  }

  applyRolePermissions() {
    const isAdmin = this.authManager.isAdmin();
    document.getElementById("newTaskBtn").classList.toggle("hidden", !isAdmin);
  }

  formatDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  createTaskCard(task) {
    const isAdmin = this.authManager.isAdmin();
    const meta = PRIORITY_META[task.priority] || PRIORITY_META.normal;
    const card = document.createElement("div");
    card.className = "task-card";
    card.draggable = true;
    card.dataset.id = task.id;
    card.style.borderLeftColor = meta.color;

    const dateRange =
      task.startDate || task.endDate
        ? `📅 ${this.formatDate(task.startDate) || "—"} → ${this.formatDate(task.endDate) || "—"}`
        : "";

    const checklistTotal = (task.checklist || []).length;
    const checklistDone = (task.checklist || []).filter((i) => i.done).length;
    const attachmentsCount = (task.attachments || []).length;

    card.innerHTML = `
      <div class="task-card-top">
        <div style="flex:1;min-width:0;">
          <span class="priority-badge" style="background:${meta.color}26;color:${meta.color};"></span>
          <p class="task-title"></p>
        </div>
        ${
          isAdmin
            ? `<div class="task-card-actions">
                <button class="task-edit" aria-label="Editar tarefa">✏️</button>
                <button class="task-delete" aria-label="Remover tarefa">🗑️</button>
               </div>`
            : ""
        }
      </div>
      ${task.description ? `<p class="task-desc"></p>` : ""}
      ${dateRange ? `<div class="task-dates"></div>` : ""}
      <div class="task-assignees"></div>
      ${
        checklistTotal || attachmentsCount
          ? `<div class="task-meta-row">
              ${checklistTotal ? `<span class="task-chip">☑ ${checklistDone}/${checklistTotal}</span>` : ""}
              ${attachmentsCount ? `<span class="task-chip">📎 ${attachmentsCount}</span>` : ""}
             </div>`
          : ""
      }
    `;

    card.querySelector(".priority-badge").textContent = meta.label;
    card.querySelector(".task-title").textContent = task.title;
    if (task.description) card.querySelector(".task-desc").textContent = task.description;
    if (dateRange) card.querySelector(".task-dates").textContent = dateRange;

    const assigneesEl = card.querySelector(".task-assignees");
    task.assignees.forEach((name) => {
      const chip = document.createElement("span");
      chip.className = "avatar-chip";
      chip.style.background = colorForName(name);
      chip.textContent = initialsOf(name);
      chip.title = name;
      assigneesEl.appendChild(chip);
    });

    if (isAdmin) {
      card.querySelector(".task-delete").addEventListener("click", (e) => {
        e.stopPropagation();
        this.taskManager.deleteTask(task.id);
        this.renderBoard();
        showToast(`Tarefa "${task.title}" removida.`, "error");
      });
      card.querySelector(".task-edit").addEventListener("click", (e) => {
        e.stopPropagation();
        this.openTaskModal(task);
      });
    }

    card.addEventListener("click", (e) => {
      if (this.suppressNextClick) {
        this.suppressNextClick = false;
        return;
      }
      if (e.target.closest(".task-card-actions")) return;
      this.openTaskModal(task);
    });

    card.addEventListener("dragstart", () => {
      this.draggedTaskId = task.id;
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));

    card.addEventListener("touchstart", (e) => this.handleCardTouchStart(e, task, card), { passive: true });
    card.addEventListener("touchmove", (e) => this.handleCardTouchMove(e), { passive: false });
    card.addEventListener("touchend", (e) => this.handleCardTouchEnd(e), { passive: false });

    return card;
  }

  renderBoard() {
    const team = this.authManager.currentUser.team;
    const query = document.getElementById("taskSearch").value;
    const statuses = ["pendente", "andamento", "concluido"];
    statuses.forEach((status) => {
      const container = document.getElementById(`col-${status}`);
      container.innerHTML = "";
      const tasks = this.taskManager.getFiltered(team, status, query);
      document.getElementById(`count-${status}`).textContent = tasks.length;
      if (tasks.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-column";
        empty.textContent = query ? "Nenhuma tarefa encontrada." : "Nenhuma tarefa aqui.";
        container.appendChild(empty);
      } else {
        tasks.forEach((task) => container.appendChild(this.createTaskCard(task)));
      }
    });
  }

  handleCardTouchStart(e, task, card) {
    if (e.target.closest(".task-card-actions")) return;
    const touch = e.touches[0];
    this.touchState = { task, card, startX: touch.clientX, startY: touch.clientY, dragging: false, ghost: null };
  }

  handleCardTouchMove(e) {
    const state = this.touchState;
    if (!state) return;
    const touch = e.touches[0];
    const dx = touch.clientX - state.startX;
    const dy = touch.clientY - state.startY;

    if (!state.dragging && Math.hypot(dx, dy) > 10) {
      state.dragging = true;
      state.card.classList.add("dragging");
      const ghost = document.createElement("div");
      ghost.className = "touch-ghost";
      ghost.textContent = state.task.title;
      document.body.appendChild(ghost);
      state.ghost = ghost;
    }

    if (state.dragging) {
      e.preventDefault();
      state.ghost.style.left = `${touch.clientX}px`;
      state.ghost.style.top = `${touch.clientY}px`;
      document.querySelectorAll(".column-body").forEach((c) => c.classList.remove("drag-over"));
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const col = el && el.closest(".column-body");
      if (col) col.classList.add("drag-over");
    }
  }

  handleCardTouchEnd(e) {
    const state = this.touchState;
    if (!state) return;
    if (state.dragging) {
      const touch = e.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const col = el && el.closest(".column-body");
      document.querySelectorAll(".column-body").forEach((c) => c.classList.remove("drag-over"));
      state.card.classList.remove("dragging");
      if (state.ghost) state.ghost.remove();
      if (col) {
        const newStatus = col.closest(".column").dataset.status;
        const task = this.taskManager.moveTask(state.task.id, newStatus);
        this.renderBoard();
        if (task) {
          const labels = { pendente: "Pendente", andamento: "Em Andamento", concluido: "Concluído" };
          showToast(`"${task.title}" movida para ${labels[newStatus]}.`);
        }
      }
      this.suppressNextClick = true;
    }
    this.touchState = null;
  }

  renderChatIdentity() {
    const user = this.authManager.currentUser;
    const el = document.getElementById("chatIdentity");
    el.innerHTML = `
      <span class="chat-avatar"></span>
      Enviando como <strong></strong> · <span class="role-badge role-${user.role}"></span>
    `;
    const avatar = el.querySelector(".chat-avatar");
    avatar.textContent = initialsOf(user.name);
    avatar.style.background = colorForName(user.name);
    el.querySelector("strong").textContent = user.name;
    el.querySelector(".role-badge").textContent = user.role;
  }

  appendMessageRow(container, msg) {
    const row = document.createElement("div");
    row.className = "chat-msg";
    row.innerHTML = `
      <div class="chat-avatar" style="background:${msg.color}"></div>
      <div class="chat-msg-body">
        <div class="chat-msg-meta">
          <span class="chat-msg-name"></span>
          <span class="role-badge role-${msg.role}"></span>
          <span class="chat-msg-time"></span>
        </div>
        <span class="chat-msg-text"></span>
      </div>
    `;
    row.querySelector(".chat-avatar").textContent = initialsOf(msg.user);
    row.querySelector(".chat-msg-name").textContent = msg.user;
    row.querySelector(".role-badge").textContent = msg.role;
    row.querySelector(".chat-msg-time").textContent = this.formatTime(msg.timestamp);
    row.querySelector(".chat-msg-text").textContent = msg.text;
    container.appendChild(row);
  }

  renderChat() {
    if (this.chatMode === "dm") this.renderDmMessages();
    else this.renderTeamMessages();
  }

  renderTeamMessages() {
    const team = this.authManager.currentUser.team;
    const container = document.getElementById("chatMessages");
    container.innerHTML = "";
    const teamMessages = this.chatManager.getByTeam(team);
    if (teamMessages.length === 0) {
      container.innerHTML = `<p class="chat-empty">Nenhuma mensagem ainda na ${team}.</p>`;
      return;
    }
    teamMessages.forEach((msg) => this.appendMessageRow(container, msg));
    container.scrollTop = container.scrollHeight;
  }

  renderDmMessages() {
    const user = this.authManager.currentUser;
    const container = document.getElementById("chatMessages");
    container.innerHTML = "";
    if (!this.dmRecipient) {
      container.innerHTML = '<p class="chat-empty">Nenhum outro integrante nesta equipe ainda.</p>';
      return;
    }
    const thread = this.chatManager.getDirectMessages(user.team, user.name, this.dmRecipient);
    if (thread.length === 0) {
      container.innerHTML = `<p class="chat-empty">Nenhuma mensagem com ${this.dmRecipient} ainda.</p>`;
      return;
    }
    thread.forEach((msg) => this.appendMessageRow(container, msg));
    container.scrollTop = container.scrollHeight;
  }

  populateDmRecipients() {
    const user = this.authManager.currentUser;
    const select = document.getElementById("dmRecipient");
    const members = this.userManager.teamMembers(user.team).filter((n) => n !== user.name);
    select.innerHTML = "";
    members.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
    this.dmRecipient = members[0] || null;
    if (this.dmRecipient) select.value = this.dmRecipient;
  }

  bindChatTabs() {
    document.querySelectorAll(".chat-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".chat-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this.chatMode = tab.dataset.chat;
        document.getElementById("chatDmSelect").classList.toggle("hidden", this.chatMode !== "dm");
        if (this.chatMode === "dm") this.populateDmRecipients();
        this.renderChat();
      });
    });

    document.getElementById("dmRecipient").addEventListener("change", (e) => {
      this.dmRecipient = e.target.value;
      this.renderChat();
    });
  }

  setupAssigneesInput() {
    const textInput = document.getElementById("assigneesText");
    const dropdown = document.getElementById("assigneesDropdown");
    const chipsContainer = document.getElementById("assigneesChips");

    const renderChips = () => {
      chipsContainer.innerHTML = "";
      this.selectedAssignees.forEach((name) => {
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.style.background = colorForName(name);
        chip.innerHTML = `<span></span><button type="button" aria-label="Remover ${name}">✕</button>`;
        chip.querySelector("span").textContent = name;
        chip.querySelector("button").addEventListener("click", () => {
          this.selectedAssignees = this.selectedAssignees.filter((n) => n !== name);
          renderChips();
        });
        chipsContainer.appendChild(chip);
      });
    };
    this.renderAssigneeChips = renderChips;

    const renderDropdown = (query) => {
      const team = this.authManager.currentUser ? this.authManager.currentUser.team : null;
      const pool = team ? this.userManager.teamMembers(team) : [];
      const q = query.trim().toLowerCase();
      const matches = pool
        .filter((name) => !this.selectedAssignees.includes(name))
        .filter((name) => name.toLowerCase().includes(q));

      dropdown.innerHTML = "";
      if (matches.length === 0) {
        const empty = document.createElement("div");
        empty.className = "autocomplete-empty";
        empty.textContent = "Nenhum usuário encontrado nesta equipe.";
        dropdown.appendChild(empty);
      } else {
        matches.forEach((name) => {
          const item = document.createElement("div");
          item.className = "autocomplete-item";
          item.innerHTML = `<span class="avatar-chip" style="width:20px;height:20px;font-size:0.6rem;"></span><span></span>`;
          const dot = item.querySelector(".avatar-chip");
          dot.style.background = colorForName(name);
          dot.textContent = initialsOf(name);
          item.querySelector("span:last-child").textContent = name;
          item.addEventListener("click", () => {
            this.selectedAssignees.push(name);
            renderChips();
            textInput.value = "";
            dropdown.classList.remove("open");
            textInput.focus();
          });
          dropdown.appendChild(item);
        });
      }
      dropdown.classList.add("open");
    };

    textInput.addEventListener("input", () => renderDropdown(textInput.value));
    textInput.addEventListener("focus", () => renderDropdown(textInput.value));
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#assigneesTagsInput")) dropdown.classList.remove("open");
    });
  }

  resetAssigneesInput(prefill = []) {
    this.selectedAssignees = [...prefill];
    this.renderAssigneeChips();
    document.getElementById("assigneesText").value = "";
    document.getElementById("assigneesDropdown").classList.remove("open");
  }

  renderChecklist(task) {
    const list = document.getElementById("checklistList");
    const items = task ? task.checklist : this.workingChecklist;
    const isAdmin = this.authManager.isAdmin();
    list.innerHTML = "";
    if (!items || items.length === 0) {
      list.innerHTML = '<p class="checklist-empty">Nenhum item ainda.</p>';
      return;
    }
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "checklist-item";
      row.innerHTML = `
        <label>
          <input type="checkbox" ${item.done ? "checked" : ""} />
          <span></span>
        </label>
        ${isAdmin ? '<button type="button" class="checklist-remove">✕</button>' : ""}
      `;
      row.querySelector("span").textContent = item.text;
      row.querySelector("input").addEventListener("change", () => {
        if (task) {
          this.taskManager.toggleChecklistItem(task.id, item.id);
          this.renderBoard();
          this.renderChecklist(this.taskManager.tasks.find((t) => t.id === task.id));
        } else {
          item.done = !item.done;
          this.renderChecklist(null);
        }
      });
      const removeBtn = row.querySelector(".checklist-remove");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          if (task) {
            this.taskManager.removeChecklistItem(task.id, item.id);
            this.renderBoard();
            this.renderChecklist(this.taskManager.tasks.find((t) => t.id === task.id));
          } else {
            this.workingChecklist = this.workingChecklist.filter((i) => i.id !== item.id);
            this.renderChecklist(null);
          }
        });
      }
      list.appendChild(row);
    });
  }

  renderComments(task) {
    const list = document.getElementById("commentsList");
    list.innerHTML = "";
    if (!task.comments || task.comments.length === 0) {
      list.innerHTML = '<p class="comments-empty">Nenhum comentário ainda.</p>';
      return;
    }
    task.comments.forEach((c) => {
      const row = document.createElement("div");
      row.className = "comment-item";
      row.innerHTML = `
        <div class="comment-meta">
          <span class="comment-author"></span>
          <span class="role-badge role-${c.role}"></span>
          <span class="comment-time"></span>
        </div>
        <p class="comment-text"></p>
      `;
      row.querySelector(".comment-author").textContent = c.author;
      row.querySelector(".role-badge").textContent = c.role;
      row.querySelector(".comment-time").textContent = this.formatTime(c.timestamp);
      row.querySelector(".comment-text").textContent = c.text;
      list.appendChild(row);
    });
    list.scrollTop = list.scrollHeight;
  }

  renderAttachments(task) {
    const list = document.getElementById("taskAttachmentsList");
    const files = task ? task.attachments : this.workingAttachments;
    list.innerHTML = "";
    (files || []).forEach((name) => {
      const chip = document.createElement("span");
      chip.className = "attachment-chip";
      chip.textContent = `📄 ${name}`;
      list.appendChild(chip);
    });
  }

  setBasicFieldsEditable(editable) {
    ["taskTitle", "taskDescription", "taskStart", "taskEnd", "taskPriority", "assigneesText"].forEach((id) => {
      document.getElementById(id).disabled = !editable;
    });
    document.getElementById("assigneesTagsInput").classList.toggle("readonly", !editable);
  }

  openCreateModal() {
    this.editingTaskId = null;
    this.workingChecklist = [];
    this.workingAttachments = [];
    document.getElementById("taskModalTitle").textContent = "Nova Tarefa";
    document.getElementById("taskSubmitBtn").textContent = "Criar Tarefa";
    document.getElementById("taskSubmitBtn").classList.remove("hidden");
    document.getElementById("cancelTaskBtn").textContent = "Cancelar";
    document.getElementById("taskForm").reset();
    document.getElementById("taskPriority").value = "normal";
    this.setBasicFieldsEditable(true);
    this.resetAssigneesInput([]);
    document.getElementById("commentsSection").classList.add("hidden");
    document.getElementById("checklistAddRow").classList.remove("hidden");
    this.renderChecklist(null);
    this.renderAttachments(null);
    document.getElementById("modalOverlay").classList.add("open");
  }

  openTaskModal(task) {
    this.editingTaskId = task.id;
    const isAdmin = this.authManager.isAdmin();
    document.getElementById("taskModalTitle").textContent = isAdmin ? "Editar Tarefa" : task.title;
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskDescription").value = task.description;
    document.getElementById("taskStart").value = task.startDate;
    document.getElementById("taskEnd").value = task.endDate;
    document.getElementById("taskPriority").value = task.priority || "normal";
    this.setBasicFieldsEditable(isAdmin);
    this.resetAssigneesInput(task.assignees);
    document.getElementById("taskSubmitBtn").textContent = "Salvar Alterações";
    document.getElementById("taskSubmitBtn").classList.toggle("hidden", !isAdmin);
    document.getElementById("cancelTaskBtn").textContent = isAdmin ? "Cancelar" : "Fechar";
    document.getElementById("commentsSection").classList.remove("hidden");
    document.getElementById("checklistAddRow").classList.toggle("hidden", !isAdmin);
    this.renderChecklist(task);
    this.renderComments(task);
    this.renderAttachments(task);
    document.getElementById("modalOverlay").classList.add("open");
  }

  bindAppEvents() {
    if (this.appEventsBound) return;
    this.appEventsBound = true;

    this.bindChatTabs();

    const overlay = document.getElementById("modalOverlay");
    document.getElementById("newTaskBtn").addEventListener("click", () => this.openCreateModal());
    document.getElementById("cancelTaskBtn").addEventListener("click", () => overlay.classList.remove("open"));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });

    document.getElementById("taskForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.authManager.isAdmin()) return;
      const title = document.getElementById("taskTitle").value.trim();
      if (!title) {
        showToast("O título da tarefa é obrigatório.", "error");
        return;
      }
      const payload = {
        title,
        description: document.getElementById("taskDescription").value,
        startDate: document.getElementById("taskStart").value,
        endDate: document.getElementById("taskEnd").value,
        assignees: this.selectedAssignees,
        priority: document.getElementById("taskPriority").value,
      };

      let task;
      if (this.editingTaskId) {
        task = this.taskManager.updateTask(this.editingTaskId, payload);
        showToast(`Tarefa "${task.title}" atualizada.`);
      } else {
        task = this.taskManager.addTask({
          ...payload,
          team: this.authManager.currentUser.team,
          checklist: this.workingChecklist,
          attachments: this.workingAttachments,
        });
        showToast(`Tarefa "${task.title}" criada com sucesso!`);
      }

      this.renderBoard();
      overlay.classList.remove("open");
      this.editingTaskId = null;
    });

    document.getElementById("checklistAddBtn").addEventListener("click", () => {
      const input = document.getElementById("checklistNewItem");
      const text = input.value.trim();
      if (!text) return;
      if (this.editingTaskId) {
        const task = this.taskManager.addChecklistItem(this.editingTaskId, text);
        this.renderChecklist(task);
        this.renderBoard();
      } else {
        this.workingChecklist.push({ id: Date.now(), text, done: false });
        this.renderChecklist(null);
      }
      input.value = "";
    });

    document.getElementById("commentAddBtn").addEventListener("click", () => {
      const input = document.getElementById("commentInput");
      const text = input.value.trim();
      if (!text || !this.editingTaskId) return;
      const user = this.authManager.currentUser;
      const task = this.taskManager.addComment(this.editingTaskId, user.name, user.role, text);
      this.renderComments(task);
      input.value = "";
    });

    document.getElementById("attachTaskBtn").addEventListener("click", () => {
      document.getElementById("taskFileInput").click();
    });

    document.getElementById("taskFileInput").addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => {
        if (this.editingTaskId) {
          const task = this.taskManager.addAttachment(this.editingTaskId, file.name);
          this.renderAttachments(task);
          this.renderBoard();
        } else {
          this.workingAttachments.push(file.name);
          this.renderAttachments(null);
        }
      });
      if (files.length) showToast(`${files.length} arquivo(s) anexado(s) (simulação).`);
      e.target.value = "";
    });

    document.getElementById("taskSearch").addEventListener("input", () => this.renderBoard());

    document.querySelectorAll(".column-body").forEach((col) => {
      col.addEventListener("dragover", (e) => {
        e.preventDefault();
        col.classList.add("drag-over");
      });
      col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
      col.addEventListener("drop", (e) => {
        e.preventDefault();
        col.classList.remove("drag-over");
        const newStatus = col.closest(".column").dataset.status;
        const task = this.taskManager.moveTask(this.draggedTaskId, newStatus);
        this.renderBoard();
        if (task) {
          const labels = { pendente: "Pendente", andamento: "Em Andamento", concluido: "Concluído" };
          showToast(`"${task.title}" movida para ${labels[newStatus]}.`);
        }
      });
    });

    const chatPanel = document.getElementById("chatPanel");
    document.getElementById("chatToggleBtn").addEventListener("click", () => chatPanel.classList.add("open"));
    document.getElementById("chatCloseBtn").addEventListener("click", () => chatPanel.classList.remove("open"));

    document.getElementById("chatAttachBtn").addEventListener("click", () => {
      showToast("Simulação: seletor de arquivo aberto (recurso de demonstração).");
    });

    document.getElementById("chatForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("chatInput");
      const text = input.value.trim();
      if (!text) return;
      const user = this.authManager.currentUser;
      if (this.chatMode === "dm") {
        if (!this.dmRecipient) {
          showToast("Selecione um destinatário.", "error");
          return;
        }
        this.chatManager.addDirectMessage(user.name, user.role, user.team, this.dmRecipient, text);
      } else {
        this.chatManager.addTeamMessage(user.name, user.role, user.team, text);
      }
      this.renderChat();
      input.value = "";
    });
  }
}

const app = new App();
app.init();
