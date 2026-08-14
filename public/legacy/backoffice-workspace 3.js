(function () {
  const workspace = {
    tasks: [],
    taskAssignees: [],
    notices: [],
    events: [],
    posts: [],
    documents: [],
    attendance: [],
    roleHistory: [],
    organizationChart: [],
    organizationSavedIds: new Set(),
    activeHrModule: "schedule",
    searchResults: [],
    searchActiveIndex: -1,
    drive: { files: [], folderId: "18mdhHygC7zUMlU7U0r_2lR5SXkvg2s8T", rootFolderId: "18mdhHygC7zUMlU7U0r_2lR5SXkvg2s8T", history: [], permissions: { write: true, delete: true }, loading: false, search: "" },
    taskFilter: "open",
    configured: true,
    preview: ["localhost", "127.0.0.1"].includes(window.location.hostname)
      && new URLSearchParams(window.location.search).get("preview") === "1"
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $all = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const api = () => window.RISEUP_BACKOFFICE;
  const core = () => api()?.state || {};
  const client = () => api()?.client;
  const currentUserId = () => core().user?.id || "";
  const currentRole = () => core().viewAsRole || core().profile?.role || "member";
  const isAdmin = () => ["admin", "coordinator", "vice_coordinator"].includes(currentRole());
  const canAssign = () => isAdmin() || currentRole().startsWith("team_leader");
  const canManageHr = () => isAdmin() || ["hr_team", "team_leader_hr"].includes(currentRole());

  const priorityLabels = { low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" };
  const categoryLabels = { statutes: "Estatutos", regulations: "Regulamentos", templates: "Templates", minutes: "Atas", guides: "Guias internos", brand: "Identidade visual", project: "Projetos" };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function safeDate(value, withTime = false) {
    if (!value) return "Sem data";
    const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("pt-PT", withTime
      ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "short", year: "numeric" }).format(date);
  }

  function seedPreview() {
    const today = new Date();
    const plus = (days, hour = 10) => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      date.setHours(hour, 0, 0, 0);
      return date.toISOString();
    };
    workspace.tasks = [
      { id: "task-1", title: "Rever apresentação do ChallANJE", description: "Validar conteúdos antes da reunião.", priority: "high", status: "in_progress", due_date: plus(2).slice(0, 10), created_by: currentUserId(), assigned_to: currentUserId(), assignee_ids: [currentUserId()], project_id: "project-1" },
      { id: "task-2", title: "Preparar calendário editorial", description: "Planeamento das próximas duas semanas.", priority: "medium", status: "todo", due_date: plus(4).slice(0, 10), created_by: currentUserId(), assigned_to: currentUserId(), assignee_ids: [currentUserId()] },
      { id: "task-3", title: "Atualizar pasta de templates", priority: "low", status: "done", due_date: plus(-1).slice(0, 10), created_by: currentUserId(), assigned_to: currentUserId(), assignee_ids: [currentUserId()], completed_at: plus(-1) }
    ];
    workspace.notices = [
      { id: "notice-1", title: "Reunião geral de membros", body: "Confirma presença até sexta-feira.", published_at: plus(-1) },
      { id: "notice-2", title: "Novo regulamento interno", body: "A versão atualizada já está na biblioteca.", published_at: plus(-3) }
    ];
    workspace.events = [
      { id: "event-1", title: "Workshop de Liderança", event_type: "event", starts_at: plus(3, 15), location: "Sala 204" },
      { id: "event-2", title: "Reunião de Team Leaders", event_type: "meeting", starts_at: plus(1, 18), location: "Microsoft Teams" },
      { id: "event-3", title: "Assembleia Geral", event_type: "meeting", starts_at: plus(8, 19), location: "Auditório" }
    ];
    workspace.posts = [
      { id: "post-1", title: "Apresentação da nova equipa", channel: "Instagram", status: "scheduled", scheduled_for: plus(2, 12) },
      { id: "post-2", title: "Resumo do workshop", channel: "LinkedIn", status: "draft", scheduled_for: plus(6, 10) }
    ];
    workspace.documents = [
      { id: "doc-1", title: "Estatutos Rise Up", category: "statutes", created_at: plus(-80), file_url: "#" },
      { id: "doc-2", title: "Template de apresentação", category: "templates", created_at: plus(-20), file_url: "#" },
      { id: "doc-3", title: "Guia de identidade visual", category: "brand", created_at: plus(-12), file_url: "#" }
    ];
    const previewMember = core().team?.[0];
    workspace.roleHistory = [{ id: "role-1", member_id: previewMember?.id || "member-1", role_title: "Coordenação", started_on: "2024-09-01", ended_on: null }];
    workspace.attendance = previewMember ? [{ id: "attendance-1", event_id: "event-1", member_id: previewMember.id, status: "present" }] : [];
    workspace.organizationChart = [
      { id: "org-1", title: "Presidência", member_id: core().team?.[0]?.id || null, parent_id: null, sort_order: 1 },
      { id: "org-2", title: "Team Leader de Projetos e Inovação", member_id: core().team?.[1]?.id || null, parent_id: "org-1", sort_order: 1 },
      { id: "org-3", title: "Team Leader de Comunicação", member_id: core().team?.[2]?.id || null, parent_id: "org-1", sort_order: 2 },
      { id: "org-4", title: "Comunicação", member_id: core().team?.[3]?.id || null, parent_id: "org-3", sort_order: 1 }
    ];
    workspace.organizationSavedIds = new Set(workspace.organizationChart.map((node) => node.id));
    workspace.drive.files = [
      { id: "drive-folder-projects", name: "Projetos", mimeType: "application/vnd.google-apps.folder", modifiedTime: plus(-2) },
      { id: "drive-folder-rh", name: "Recursos Humanos", mimeType: "application/vnd.google-apps.folder", modifiedTime: plus(-4) },
      { id: "drive-file-statutes", name: "Estatutos Rise Up.pdf", mimeType: "application/pdf", modifiedTime: plus(-12), size: "428000", webViewLink: "https://drive.google.com/" },
      { id: "drive-file-brand", name: "Manual de Identidade Visual", mimeType: "application/vnd.google-apps.presentation", modifiedTime: plus(-8), webViewLink: "https://drive.google.com/" }
    ];
  }

  async function selectTable(table, order = "created_at") {
    const response = await client().from(table).select("*").order(order, { ascending: false });
    if (response.error) throw response.error;
    return response.data || [];
  }

  function isMissingTable(error) {
    return error?.code === "42P01" || /does not exist|not found|schema cache/i.test(error?.message || "");
  }

  async function loadWorkspace() {
    if (workspace.preview) {
      seedPreview();
      renderAll();
      return;
    }

    const sources = [
      ["tasks", "workspace_tasks", "created_at"],
      ["taskAssignees", "workspace_task_assignees", "assigned_at"],
      ["notices", "workspace_notices", "published_at"],
      ["events", "workspace_events", "starts_at"],
      ["posts", "communication_posts", "scheduled_for"],
      ["documents", "workspace_documents", "created_at"],
      ["attendance", "attendance_records", "created_at"],
      ["roleHistory", "role_history", "started_on"],
      ["organizationChart", "organization_chart_nodes", "sort_order"]
    ];
    const results = await Promise.allSettled(sources.map(([, table, order]) => selectTable(table, order)));
    results.forEach((result, index) => {
      if (result.status === "fulfilled") workspace[sources[index][0]] = result.value;
      else if (isMissingTable(result.reason)) workspace.configured = false;
      else console.warn(`Workspace ${sources[index][1]} unavailable`, result.reason);
    });
    const assigneesByTask = new Map();
    workspace.taskAssignees.forEach((assignment) => {
      if (!assigneesByTask.has(assignment.task_id)) assigneesByTask.set(assignment.task_id, []);
      assigneesByTask.get(assignment.task_id).push(assignment.user_id);
    });
    workspace.tasks.forEach((task) => {
      task.assignee_ids = [...new Set([...(assigneesByTask.get(task.id) || []), task.assigned_to].filter(Boolean))];
    });
    workspace.organizationSavedIds = new Set(workspace.organizationChart.map((node) => node.id));
    renderAll();
    void loadDrive();
  }

  function renderCompactList(selector, records, kind) {
    const list = $(selector);
    if (!list) return;
    list.replaceChildren();
    if (!records.length) {
      list.appendChild(element("p", "bo-empty-soft", kind === "notice" ? "Sem avisos ativos." : "Nada agendado."));
      return;
    }
    records.slice(0, 4).forEach((record) => {
      const item = element("article", "bo-compact-item");
      const date = element("span", "bo-compact-date", kind === "notice" ? "i" : safeDate(record.starts_at || record.scheduled_for).replace(" de ", " ").slice(0, 6));
      const copy = element("div");
      copy.appendChild(element("h4", null, record.title));
      copy.appendChild(element("p", null, record.body || [safeDate(record.starts_at, true), record.location].filter(Boolean).join(" · ")));
      item.append(date, copy);
      list.appendChild(item);
    });
  }

  function renderDashboard() {
    const own = workspace.tasks.filter((task) => taskHasAssignee(task, currentUserId()));
    const done = own.filter((task) => task.status === "done").length;
    const open = own.length - done;
    const progress = own.length ? Math.round((done / own.length) * 100) : 0;
    const name = core().team?.find((member) => member.user_id === currentUserId())?.name || core().user?.email?.split("@")[0] || "membro Rise Up";
    if ($("[data-dashboard-name]")) $("[data-dashboard-name]").textContent = name;
    if ($("[data-dashboard-date]")) $("[data-dashboard-date]").textContent = new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
    if ($("[data-metric-my-tasks]")) $("[data-metric-my-tasks]").textContent = String(open);
    if ($("[data-metric-progress]")) $("[data-metric-progress]").textContent = `${progress}%`;
    if ($("[data-progress-bar]")) $("[data-progress-bar]").style.width = `${progress}%`;
    renderCompactList("[data-dashboard-notices]", workspace.notices, "notice");
    renderCompactList("[data-dashboard-events]", workspace.events.filter((item) => item.event_type !== "meeting"), "event");
    renderCompactList("[data-dashboard-meetings]", workspace.events.filter((item) => item.event_type === "meeting"), "event");
    renderDashboardTasks();
  }

  function getMemberName(userId) {
    return core().team?.find((member) => member.user_id === userId)?.name || (userId === currentUserId() ? "Eu" : "Por atribuir");
  }

  function taskAssigneeIds(task) {
    return [...new Set([...(task?.assignee_ids || []), task?.assigned_to].filter(Boolean))];
  }

  function taskHasAssignee(task, userId) {
    return taskAssigneeIds(task).includes(userId);
  }

  function taskAssigneeLabel(task) {
    const names = taskAssigneeIds(task).map(getMemberName);
    if (!names.length) return "Por atribuir";
    if (names.length <= 2) return names.join(" e ");
    return `${names[0]} +${names.length - 1}`;
  }

  function taskMatches(task) {
    if (workspace.taskFilter === "done") return task.status === "done";
    if (workspace.taskFilter === "mine") return taskHasAssignee(task, currentUserId()) && task.status !== "done";
    if (workspace.taskFilter === "created") return task.created_by === currentUserId() && task.status !== "done";
    return task.status !== "done";
  }

  function createTaskCard(task, compact = false) {
    const card = element("article", compact ? "bo-list-row bo-task-row" : `bo-task-card${task.status === "done" ? " is-done" : ""}`);
    card.dataset.priority = task.priority || "medium";
    const check = element("input", "bo-task-check");
    check.type = "checkbox";
    check.checked = task.status === "done";
    check.setAttribute("aria-label", `Marcar ${task.title} como ${check.checked ? "pendente" : "concluída"}`);
    check.addEventListener("change", () => toggleTask(task, check.checked));
    const body = element("div");
    body.appendChild(element("h3", null, task.title));
    const meta = element("div", "bo-task-meta");
    meta.append(element("span", "bo-priority", priorityLabels[task.priority] || "Média"));
    meta.append(element("span", null, task.due_date ? `Prazo ${safeDate(task.due_date)}` : "Sem prazo"));
    if (!compact) meta.append(element("span", null, taskAssigneeLabel(task)));
    body.appendChild(meta);
    const actions = element("div", "bo-row-actions");
    const edit = element("button", "bo-button bo-button-ghost", "Editar");
    edit.type = "button";
    edit.addEventListener("click", () => openTaskForm(task));
    actions.appendChild(edit);
    card.append(check, body, actions);
    return card;
  }

  function renderTasks() {
    const list = $("[data-task-list]");
    if (!list) return;
    list.replaceChildren();
    const tasks = workspace.tasks.filter(taskMatches).sort((a, b) => String(a.due_date || "9999").localeCompare(String(b.due_date || "9999")));
    if (!tasks.length) list.appendChild(element("p", "bo-empty-soft", "Não existem tarefas neste filtro."));
    tasks.forEach((task) => list.appendChild(createTaskCard(task)));
    const setup = $("[data-workspace-setup]");
    if (setup) setup.hidden = workspace.configured;
  }

  function renderDashboardTasks() {
    const list = $("[data-dashboard-tasks]");
    if (!list) return;
    list.replaceChildren();
    const tasks = workspace.tasks.filter((task) => taskHasAssignee(task, currentUserId()) && task.status !== "done").slice(0, 4);
    if (!tasks.length) list.appendChild(element("p", "bo-empty-soft", "Sem tarefas pendentes."));
    tasks.forEach((task) => list.appendChild(createTaskCard(task, true)));
  }

  function fillTaskOptions() {
    const assignee = $("[data-task-assignee]");
    const project = $("[data-task-project]");
    if (assignee) {
      assignee.replaceChildren();
      (core().team || []).filter((member) => member.user_id).forEach((member) => {
        const option = element("option", null, member.name);
        option.value = member.user_id;
        assignee.appendChild(option);
      });
      assignee.disabled = !canAssign();
    }
    if (project) {
      project.replaceChildren(new Option("Sem projeto", ""));
      (core().projects || []).filter((item) => item.status !== "archived").forEach((item) => project.add(new Option(item.title, item.id)));
    }
    const documentProject = $("[data-document-project]");
    if (documentProject) {
      documentProject.replaceChildren(new Option("Geral", ""));
      (core().projects || []).forEach((item) => documentProject.add(new Option(item.title, item.id)));
    }
  }

  function openTaskForm(task = null) {
    api()?.showSection("todo");
    const form = $("[data-task-form]");
    form.hidden = false;
    form.reset();
    fillTaskOptions();
    form.elements.id.value = task?.id || "";
    form.elements.title.value = task?.title || "";
    form.elements.description.value = task?.description || "";
    form.elements.priority.value = task?.priority || "medium";
    form.elements.due_date.value = task?.due_date || "";
    const selectedAssignees = task ? taskAssigneeIds(task) : [currentUserId()];
    Array.from(form.elements.assigned_to.options).forEach((option) => {
      option.selected = selectedAssignees.includes(option.value);
    });
    form.elements.assigned_to.dispatchEvent(new Event("change", { bubbles: true }));
    form.elements.project_id.value = task?.project_id || "";
    $("[data-task-form-title]").textContent = task ? "Editar tarefa" : "Nova tarefa";
    $("[data-delete-task]").hidden = !task;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveTaskAssignees(taskId, assigneeIds) {
    if (!workspace.preview) {
      const deletion = await client().from("workspace_task_assignees").delete().eq("task_id", taskId);
      if (deletion.error) throw deletion.error;
      const { error } = await client().from("workspace_task_assignees").insert(
        assigneeIds.map((userId) => ({ task_id: taskId, user_id: userId, assigned_by: currentUserId() }))
      );
      if (error) throw error;
    }
    workspace.taskAssignees = workspace.taskAssignees.filter((assignment) => assignment.task_id !== taskId);
    workspace.taskAssignees.push(...assigneeIds.map((userId) => ({ task_id: taskId, user_id: userId, assigned_by: currentUserId() })));
  }

  async function saveTask(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const existing = workspace.tasks.find((item) => item.id === form.elements.id.value);
    const selectedAssigneeIds = canAssign()
      ? Array.from(form.elements.assigned_to.selectedOptions, (option) => option.value).filter(Boolean)
      : [currentUserId()];
    const assigneeIds = [...new Set(selectedAssigneeIds.length ? selectedAssigneeIds : [currentUserId()])];
    const payload = {
      title: form.elements.title.value.trim(),
      description: form.elements.description.value.trim() || null,
      priority: form.elements.priority.value,
      due_date: form.elements.due_date.value || null,
      assigned_to: assigneeIds[0],
      project_id: form.elements.project_id.value || null,
      created_by: existing?.created_by || currentUserId(),
      status: existing?.status || "todo"
    };
    const status = $("[data-task-status]");
    try {
      if (workspace.preview) {
        const task = existing || { id: crypto.randomUUID(), created_at: new Date().toISOString() };
        Object.assign(task, payload, { assignee_ids: assigneeIds });
        if (!existing) workspace.tasks.unshift(task);
        await saveTaskAssignees(task.id, assigneeIds);
      } else {
        const query = existing
          ? client().from("workspace_tasks").update(payload).eq("id", existing.id).select().single()
          : client().from("workspace_tasks").insert(payload).select().single();
        const { data, error } = await query;
        if (error) throw error;
        await saveTaskAssignees(data.id, assigneeIds);
        data.assignee_ids = assigneeIds;
        if (existing) Object.assign(existing, data); else workspace.tasks.unshift(data);
      }
      status.textContent = "Tarefa guardada.";
      status.className = "bo-status bo-field-full is-success";
      renderAll();
      window.setTimeout(() => { form.hidden = true; }, 350);
    } catch (error) {
      status.textContent = error?.message || "Não foi possível guardar a tarefa.";
      status.className = "bo-status bo-field-full is-error";
    }
  }

  async function toggleTask(task, done) {
    const changes = { status: done ? "done" : "todo", completed_at: done ? new Date().toISOString() : null };
    if (!workspace.preview) {
      const { error } = await client().from("workspace_tasks").update(changes).eq("id", task.id);
      if (error) return console.warn("Task update failed", error);
    }
    Object.assign(task, changes);
    renderAll();
  }

  async function deleteCurrentTask() {
    const id = $("[data-task-form]").elements.id.value;
    if (!id) return;
    if (!workspace.preview) {
      const { error } = await client().from("workspace_tasks").delete().eq("id", id);
      if (error) return;
    }
    workspace.tasks = workspace.tasks.filter((task) => task.id !== id);
    $("[data-task-form]").hidden = true;
    renderAll();
  }

  function renderCommunication() {
    const month = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(new Date());
    if ($("[data-current-month]")) $("[data-current-month]").textContent = month;
    const calendar = $("[data-editorial-calendar]");
    if (calendar) {
      calendar.replaceChildren();
      const today = new Date();
      const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= days; day += 1) {
        const hasItem = workspace.posts.some((post) => new Date(post.scheduled_for).getDate() === day);
        calendar.appendChild(element("span", `bo-calendar-day${hasItem ? " has-item" : ""}`, String(day)));
      }
    }
    renderCompactList("[data-scheduled-posts]", workspace.posts.filter((post) => post.status === "scheduled"), "post");
  }

  function renderDocuments() {
    const categories = $("[data-document-categories]");
    if (categories) {
      categories.replaceChildren();
      const activeFilter = $("[data-document-filter]")?.value || "all";
      [["all", "Todas"], ...Object.entries(categoryLabels)].forEach(([key, label]) => {
        const count = key === "all" ? workspace.documents.length : workspace.documents.filter((item) => item.category === key).length;
        const card = element("button", `bo-document-category${activeFilter === key ? " is-active" : ""}`);
        card.type = "button";
        card.append(element("span", null, label), element("small", null, String(count)));
        card.addEventListener("click", () => {
          const filter = $("[data-document-filter]");
          if (filter) filter.value = key;
          renderDocuments();
        });
        categories.appendChild(card);
      });
    }
    const list = $("[data-document-list]");
    if (!list) return;
    const query = ($("[data-document-search]")?.value || "").toLowerCase();
    const filter = $("[data-document-filter]")?.value || "all";
    const records = workspace.documents.filter((item) => (filter === "all" || item.category === filter) && item.title.toLowerCase().includes(query));
    list.replaceChildren();
    if (!records.length) list.appendChild(element("p", "bo-empty-soft", "Ainda não existem documentos nesta categoria."));
    records.forEach((record) => {
      const row = element("article", "bo-document-row");
      const copy = element("div");
      copy.append(element("h3", null, record.title), element("p", null, `${categoryLabels[record.category] || record.category} · ${safeDate(record.created_at)}`));
      const link = element("a", "bo-button bo-button-ghost", "Abrir");
      link.href = record.file_url || "#";
      link.target = "_blank";
      link.rel = "noopener";
      row.append(copy, link);
      list.appendChild(row);
    });
  }

  function formatBytes(value) {
    const bytes = Number(value || 0);
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / (1024 ** index)).toLocaleString("pt-PT", { maximumFractionDigits: index ? 1 : 0 })} ${units[index]}`;
  }

  function driveIsFolder(file) {
    return file.mimeType === "application/vnd.google-apps.folder";
  }

  function driveFileKind(file) {
    const mime = file.mimeType || "";
    if (driveIsFolder(file)) return { label: "Pasta", className: "is-folder" };
    if (mime === "application/pdf") return { label: "PDF", className: "is-pdf" };
    if (mime === "application/vnd.google-apps.form") return { label: "Google Forms", className: "is-form" };
    if (mime === "application/vnd.google-apps.document") return { label: "Google Docs", className: "is-document" };
    if (mime === "application/vnd.google-apps.spreadsheet") return { label: "Google Sheets", className: "is-spreadsheet" };
    if (mime === "application/vnd.google-apps.presentation") return { label: "Google Slides", className: "is-presentation" };
    if (mime.startsWith("image/")) return { label: "Imagem", className: "is-image" };
    if (mime.startsWith("video/")) return { label: "Vídeo", className: "is-video" };
    return { label: "Ficheiro", className: "is-file" };
  }

  function setDriveMessage(message = "", type = "") {
    const node = $("[data-drive-message]");
    if (!node) return;
    node.textContent = message;
    node.className = `bo-status${type ? ` is-${type}` : ""}`;
  }

  async function driveRequest(path, options = {}) {
    const token = core().session?.access_token;
    if (!token) throw new Error("A sessão expirou. Inicia sessão novamente.");
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    const response = await fetch(path, { ...options, headers });
    if (!response.ok) {
      let message = "Não foi possível comunicar com a Google Drive.";
      try { message = (await response.json()).error || message; } catch { /* resposta sem JSON */ }
      throw new Error(message);
    }
    return response;
  }

  async function loadDrive(folderId = workspace.drive.rootFolderId, folderName = "Drive Rise Up", reset = false) {
    const folderChanged = reset || folderId !== workspace.drive.folderId;
    if (folderChanged) {
      workspace.drive.search = "";
      const search = $("[data-drive-search]");
      if (search) search.value = "";
    }
    workspace.drive.loading = true;
    setDriveMessage();
    if (reset || !workspace.drive.history.length) workspace.drive.history = [{ id: workspace.drive.rootFolderId, name: "Drive Rise Up" }];
    if (!reset && folderId !== workspace.drive.rootFolderId && !workspace.drive.history.some((item) => item.id === folderId)) {
      workspace.drive.history.push({ id: folderId, name: folderName });
    }
    workspace.drive.folderId = folderId;
    renderDrive();
    if (workspace.preview) {
      workspace.drive.loading = false;
      renderDrive();
      return;
    }
    try {
      const response = await driveRequest(`/api/drive/files?folderId=${encodeURIComponent(folderId)}`);
      const data = await response.json();
      workspace.drive.files = data.files || [];
      workspace.drive.rootFolderId = data.rootFolderId || workspace.drive.rootFolderId;
      workspace.drive.permissions = data.permissions || { write: false, delete: false };
      workspace.drive.loading = false;
      renderDrive();
    } catch (error) {
      workspace.drive.loading = false;
      workspace.drive.files = [];
      renderDrive();
      const status = $("[data-drive-status]");
      if (status) {
        status.textContent = "Indisponível";
        status.className = "bo-drive-status is-error";
      }
      setDriveMessage(error?.message || "Não foi possível carregar a pasta.", "error");
    }
  }

  function renderDrive() {
    const list = $("[data-drive-list]");
    if (!list) return;
    const status = $("[data-drive-status]");
    const actions = $("[data-drive-write-actions]");
    if (status) {
      status.textContent = workspace.drive.loading ? "A ligar…" : workspace.preview ? "Demonstração" : "Ligado";
      status.className = `bo-drive-status${workspace.drive.loading ? "" : " is-ready"}`;
    }
    const canWrite = workspace.drive.permissions.write && canAssign();
    const canDelete = workspace.drive.permissions.delete && isAdmin();
    if (actions) actions.hidden = !canWrite;

    const breadcrumbs = $("[data-drive-breadcrumbs]");
    if (breadcrumbs) {
      breadcrumbs.replaceChildren();
      const history = workspace.drive.history.length ? workspace.drive.history : [{ id: workspace.drive.rootFolderId, name: "Drive Rise Up" }];
      history.forEach((item, index) => {
        if (index) breadcrumbs.appendChild(element("span", null, "/"));
        const button = element("button", index === history.length - 1 ? "is-current" : "", item.name);
        button.type = "button";
        button.addEventListener("click", () => {
          workspace.drive.history = history.slice(0, index + 1);
          void loadDrive(item.id, item.name);
        });
        breadcrumbs.appendChild(button);
      });
    }

    const search = workspace.drive.search.trim().toLocaleLowerCase("pt-PT");
    const visibleFiles = workspace.drive.files
      .filter((file) => !search || file.name.toLocaleLowerCase("pt-PT").includes(search))
      .sort((left, right) => {
        const folderDifference = Number(driveIsFolder(right)) - Number(driveIsFolder(left));
        return folderDifference || left.name.localeCompare(right.name, "pt-PT", { sensitivity: "base" });
      });
    const count = $("[data-drive-count]");
    if (count) {
      const total = workspace.drive.files.length;
      count.textContent = search ? `${visibleFiles.length} de ${total} ${total === 1 ? "item" : "itens"}` : `${total} ${total === 1 ? "item" : "itens"}`;
    }

    list.replaceChildren();
    if (workspace.drive.loading) {
      list.appendChild(element("p", "bo-empty-soft", "A carregar ficheiros…"));
      return;
    }
    if (!workspace.drive.files.length) {
      list.appendChild(element("p", "bo-empty-soft", "Esta pasta está vazia."));
      return;
    }
    if (!visibleFiles.length) {
      const empty = element("div", "bo-drive-empty");
      empty.append(element("strong", null, "Nenhum resultado"), element("span", null, "Experimenta pesquisar por outro nome."));
      list.appendChild(empty);
      return;
    }

    const listHead = element("div", "bo-drive-list-head");
    listHead.append(element("span", null, "Nome"), element("span", null, "Última alteração"), element("span", null, "Ações"));
    list.appendChild(listHead);

    visibleFiles.forEach((file) => {
      const folder = driveIsFolder(file);
      const kind = driveFileKind(file);
      const row = element("article", "bo-drive-row");
      const icon = element("span", `bo-drive-icon ${kind.className}`);
      icon.setAttribute("aria-hidden", "true");
      const copy = element("div", "bo-drive-file");
      const title = element("div", "bo-drive-file-title");
      title.append(element("strong", null, file.name), element("span", `bo-drive-kind ${kind.className}`, kind.label));
      copy.append(title, element("span", "bo-drive-size", folder ? "Conteúdo partilhado" : (formatBytes(file.size) || "Documento Google")));
      const modified = element("time", "bo-drive-modified", safeDate(file.modifiedTime));
      if (file.modifiedTime) modified.dateTime = file.modifiedTime;
      const rowActions = element("div", "bo-drive-row-actions");
      const open = element(folder ? "button" : "a", "bo-button bo-button-ghost bo-drive-open", folder ? "Abrir pasta" : "Ver");
      if (folder) {
        open.type = "button";
        open.addEventListener("click", () => void loadDrive(file.id, file.name));
      } else {
        open.href = "#";
        open.addEventListener("click", (event) => { event.preventDefault(); void previewDriveFile(file); });
      }
      rowActions.appendChild(open);
      if (canWrite || canDelete) {
        const more = element("details", "bo-drive-more");
        const summary = element("summary", null, "•••");
        summary.setAttribute("aria-label", `Mais ações para ${file.name}`);
        summary.title = "Mais ações";
        const menu = element("div", "bo-drive-more-menu");
        if (canWrite) {
          const rename = element("button", null, "Renomear");
          rename.type = "button";
          rename.addEventListener("click", () => { more.open = false; void renameDriveFile(file); });
          menu.appendChild(rename);
        }
        if (canDelete) {
          const remove = element("button", "is-danger", "Eliminar");
          remove.type = "button";
          remove.addEventListener("click", () => { more.open = false; void deleteDriveFile(file); });
          menu.appendChild(remove);
        }
        more.append(summary, menu);
        more.addEventListener("toggle", () => {
          if (!more.open) return;
          $all(".bo-drive-more[open]", list).forEach((item) => { if (item !== more) item.open = false; });
        });
        rowActions.appendChild(more);
      }
      row.append(icon, copy, modified, rowActions);
      list.appendChild(row);
    });
  }

  async function previewDriveFile(file) {
    const dialog = $("[data-drive-preview]");
    const body = $("[data-drive-preview-body]");
    if (!dialog || !body) return;
    $("[data-drive-preview-title]").textContent = file.name;
    const original = $("[data-drive-open-original]");
    original.href = file.webViewLink || `https://drive.google.com/open?id=${encodeURIComponent(file.id)}`;
    body.replaceChildren(element("p", "bo-empty-soft", "A preparar a pré-visualização…"));
    dialog.showModal();
    if (workspace.preview) {
      body.replaceChildren(element("p", "bo-empty-soft", "Pré-visualização disponível quando a Google Drive estiver configurada."));
      return;
    }

    if (file.mimeType === "application/vnd.google-apps.form") {
      const frame = element("iframe", "bo-drive-preview-frame");
      frame.src = `https://docs.google.com/forms/d/${encodeURIComponent(file.id)}/viewform?embedded=true`;
      frame.title = `Pré-visualização de ${file.name}`;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      body.replaceChildren(frame);
      return;
    }

    try {
      const response = await driveRequest(`/api/drive/files/${encodeURIComponent(file.id)}/content`);
      const blob = await response.blob();
      if (workspace.drive.previewUrl) URL.revokeObjectURL(workspace.drive.previewUrl);
      workspace.drive.previewUrl = URL.createObjectURL(blob);
      if (blob.type.startsWith("image/")) {
        const image = element("img", "bo-drive-preview-image");
        image.src = workspace.drive.previewUrl;
        image.alt = file.name;
        body.replaceChildren(image);
      } else {
        const frame = element("iframe", "bo-drive-preview-frame");
        frame.src = workspace.drive.previewUrl;
        frame.title = `Pré-visualização de ${file.name}`;
        body.replaceChildren(frame);
      }
    } catch (error) {
      const messages = {
        DRIVE_PREVIEW_UNSUPPORTED: "Este formato não permite pré-visualização no backoffice. Abre o ficheiro diretamente na Drive.",
        DRIVE_FILE_NOT_FOUND: "O ficheiro já não existe ou deixou de estar dentro da pasta da Rise Up.",
        DRIVE_REQUEST_FAILED: "Não foi possível preparar a pré-visualização. Tenta abrir o ficheiro diretamente na Drive."
      };
      const message = messages[error?.message] || "Este ficheiro deve ser aberto diretamente na Drive.";
      body.replaceChildren(element("p", "bo-empty-soft", message));
    }
  }

  async function renameDriveFile(file) {
    const name = window.prompt("Novo nome", file.name)?.trim();
    if (!name || name === file.name) return;
    if (workspace.preview) {
      file.name = name;
      renderDrive();
      return;
    }
    try {
      await driveRequest(`/api/drive/files/${encodeURIComponent(file.id)}`, { method: "PATCH", body: JSON.stringify({ name }) });
      await loadDrive(workspace.drive.folderId);
    } catch (error) { setDriveMessage(error?.message, "error"); }
  }

  async function deleteDriveFile(file) {
    if (!window.confirm(`Eliminar “${file.name}”? Esta ação envia o item para o lixo da Drive.`)) return;
    if (workspace.preview) {
      workspace.drive.files = workspace.drive.files.filter((item) => item.id !== file.id);
      renderDrive();
      return;
    }
    try {
      await driveRequest(`/api/drive/files/${encodeURIComponent(file.id)}`, { method: "DELETE" });
      await loadDrive(workspace.drive.folderId);
    } catch (error) { setDriveMessage(error?.message, "error"); }
  }

  async function createDriveFolder(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.name.value.trim();
    if (!name) return;
    try {
      if (workspace.preview) workspace.drive.files.unshift({ id: crypto.randomUUID(), name, mimeType: "application/vnd.google-apps.folder", modifiedTime: new Date().toISOString() });
      else await driveRequest("/api/drive/files", { method: "POST", body: JSON.stringify({ action: "createFolder", parentId: workspace.drive.folderId, name }) });
      form.reset();
      form.hidden = true;
      if (workspace.preview) renderDrive(); else await loadDrive(workspace.drive.folderId);
      setDriveMessage("Pasta criada.", "success");
    } catch (error) { setDriveMessage(error?.message, "error"); }
  }

  async function uploadDriveFile(event) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setDriveMessage(`A carregar ${file.name}…`);
    try {
      if (workspace.preview) workspace.drive.files.push({ id: crypto.randomUUID(), name: file.name, mimeType: file.type || "application/octet-stream", size: String(file.size), modifiedTime: new Date().toISOString(), webViewLink: "https://drive.google.com/" });
      else {
        const data = new FormData();
        data.set("action", "upload");
        data.set("parentId", workspace.drive.folderId);
        data.set("file", file);
        await driveRequest("/api/drive/files", { method: "POST", body: data });
      }
      event.currentTarget.value = "";
      if (workspace.preview) renderDrive(); else await loadDrive(workspace.drive.folderId);
      setDriveMessage("Ficheiro carregado.", "success");
    } catch (error) { setDriveMessage(error?.message, "error"); }
  }

  function renderProfileModules() {
    const history = $("[data-profile-history]");
    const tasks = $("[data-profile-tasks]");
    const projects = $("[data-profile-projects]");
    if (history) {
      history.replaceChildren();
      (workspace.roleHistory.length ? workspace.roleHistory : [{ role_title: core().team?.find((m) => m.user_id === currentUserId())?.role || "Membro", started_on: null }]).slice(0, 3).forEach((item) => history.appendChild(element("p", "bo-compact-item", `${item.role_title} · ${safeDate(item.started_on)}`)));
    }
    if (tasks) {
      tasks.replaceChildren();
      const own = workspace.tasks.filter((item) => taskHasAssignee(item, currentUserId()) && item.status !== "done").slice(0, 3);
      (own.length ? own : [{ title: "Sem tarefas pendentes" }]).forEach((item) => tasks.appendChild(element("p", "bo-compact-item", item.title)));
    }
    if (projects) {
      projects.replaceChildren();
      const memberId = core().team?.find((m) => m.user_id === currentUserId())?.id;
      const ids = new Set((core().projectMembers || []).filter((link) => link.team_member_id === memberId).map((link) => link.project_id));
      const own = (core().projects || []).filter((item) => ids.has(item.id)).slice(0, 3);
      (own.length ? own : [{ title: "Sem projetos associados" }]).forEach((item) => projects.appendChild(element("p", "bo-compact-item", item.title)));
    }
  }

  async function savePublication(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      title: form.elements.title.value.trim(),
      channel: form.elements.channel.value,
      status: form.elements.status.value,
      scheduled_for: form.elements.scheduled_for.value ? new Date(form.elements.scheduled_for.value).toISOString() : null,
      notes: form.elements.notes.value.trim() || null,
      owner_id: currentUserId()
    };
    const status = $("[data-publication-status]");
    try {
      if (workspace.preview) workspace.posts.unshift({ id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() });
      else {
        const { data, error } = await client().from("communication_posts").insert(payload).select().single();
        if (error) throw error;
        workspace.posts.unshift(data);
      }
      status.textContent = "Publicação guardada.";
      status.className = "bo-status bo-field-full is-success";
      form.reset();
      form.hidden = true;
      renderCommunication();
    } catch (error) {
      status.textContent = error?.message || "Não foi possível guardar a publicação.";
      status.className = "bo-status bo-field-full is-error";
    }
  }

  async function saveDocument(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      title: form.elements.title.value.trim(),
      category: form.elements.category.value,
      file_url: form.elements.file_url.value.trim(),
      project_id: form.elements.project_id.value || null,
      uploaded_by: currentUserId()
    };
    const status = $("[data-document-form-status]");
    try {
      if (workspace.preview) workspace.documents.unshift({ id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() });
      else {
        const { data, error } = await client().from("workspace_documents").insert(payload).select().single();
        if (error) throw error;
        workspace.documents.unshift(data);
      }
      status.textContent = "Documento guardado.";
      status.className = "bo-status bo-field-full is-success";
      form.reset();
      form.hidden = true;
      renderDocuments();
    } catch (error) {
      status.textContent = error?.message || "Não foi possível guardar o documento.";
      status.className = "bo-status bo-field-full is-error";
    }
  }

  function setWorkspaceStatus(selector, message, type = "") {
    const status = $(selector);
    if (!status) return;
    status.textContent = message || "";
    status.className = `bo-status${type ? ` is-${type}` : ""}`;
  }

  function showHrModule(module) {
    workspace.activeHrModule = ["schedule", "calendar", "attendance", "roles", "applications", "organization"].includes(module) ? module : "schedule";
    $all("[data-hr-module-button]").forEach((button) => {
      const active = button.dataset.hrModuleButton === workspace.activeHrModule;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    $all("[data-hr-module-view]").forEach((view) => {
      view.classList.toggle("is-active", view.dataset.hrModuleView === workspace.activeHrModule);
    });
    if (workspace.activeHrModule === "attendance") renderAttendance();
    if (workspace.activeHrModule === "roles") renderRoleHistory();
    if (workspace.activeHrModule === "organization") renderOrganizationChart();
  }

  function eventTypeLabel(type) {
    return { hr: "Marco", event: "Evento", meeting: "Reunião", editorial: "Editorial" }[type] || "Atividade";
  }

  function createHrEventRow(record) {
    const row = element("article", "bo-hr-record-row");
    const date = new Date(record.starts_at);
    const dateBox = element("div", "bo-hr-record-date");
    dateBox.append(
      element("strong", null, Number.isNaN(date.getTime()) ? "—" : String(date.getDate()).padStart(2, "0")),
      element("span", null, Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("pt-PT", { month: "short" }).format(date).replace(".", ""))
    );
    const body = element("div", "bo-hr-record-copy");
    body.appendChild(element("h4", null, record.title));
    const details = [safeDate(record.starts_at, true), record.location].filter(Boolean).join(" · ");
    body.appendChild(element("p", null, details || "Sem detalhes adicionais"));
    if (record.description) body.appendChild(element("small", null, record.description));
    const meta = element("span", "bo-soft-badge", eventTypeLabel(record.event_type));
    const actions = element("div", "bo-row-actions");
    if (canManageHr()) {
      const remove = element("button", "bo-button bo-button-ghost bo-button-danger-text", "Eliminar");
      remove.type = "button";
      remove.addEventListener("click", () => void deleteHrEvent(record));
      actions.appendChild(remove);
    }
    row.append(dateBox, body, meta, actions);
    return row;
  }

  function renderHrEvents() {
    const schedule = $("[data-hr-schedule-list]");
    const calendar = $("[data-hr-calendar-list]");
    const ordered = [...workspace.events].sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
    const render = (container, records, empty) => {
      if (!container) return;
      container.replaceChildren();
      if (!records.length) container.appendChild(element("p", "bo-empty-soft", empty));
      records.forEach((record) => container.appendChild(createHrEventRow(record)));
    };
    render(schedule, ordered.filter((record) => record.event_type === "hr"), "Ainda não existem marcos no cronograma.");
    render(calendar, ordered.filter((record) => record.event_type !== "hr"), "Ainda não existem eventos ou reuniões.");
  }

  async function saveHrEvent(form, forcedType, statusSelector) {
    const payload = {
      title: form.elements.title.value.trim(),
      description: form.elements.description.value.trim() || null,
      event_type: forcedType || form.elements.event_type.value,
      starts_at: new Date(form.elements.starts_at.value).toISOString(),
      ends_at: form.elements.ends_at.value ? new Date(form.elements.ends_at.value).toISOString() : null,
      location: form.elements.location.value.trim() || null,
      created_by: currentUserId()
    };
    try {
      let saved;
      if (workspace.preview) saved = { id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() };
      else {
        const { data, error } = await client().from("workspace_events").insert(payload).select().single();
        if (error) throw error;
        saved = data;
      }
      workspace.events.push(saved);
      form.reset();
      form.hidden = true;
      setWorkspaceStatus(statusSelector, forcedType ? "Marco guardado." : "Evento guardado.", "success");
      renderHrEvents();
      renderAttendance();
      renderDashboard();
    } catch (error) {
      setWorkspaceStatus(statusSelector, error?.message || "Não foi possível guardar.", "error");
    }
  }

  async function deleteHrEvent(record) {
    if (!window.confirm(`Eliminar “${record.title}”?`)) return;
    try {
      if (!workspace.preview) {
        const { error } = await client().from("workspace_events").delete().eq("id", record.id);
        if (error) throw error;
      }
      workspace.events = workspace.events.filter((item) => item.id !== record.id);
      workspace.attendance = workspace.attendance.filter((item) => item.event_id !== record.id);
      renderHrEvents();
      renderAttendance();
      renderDashboard();
    } catch (error) {
      window.alert(error?.message || "Não foi possível eliminar o registo.");
    }
  }

  function renderAttendance() {
    const eventSelect = $("[data-attendance-event]");
    const list = $("[data-attendance-list]");
    if (!eventSelect || !list) return;
    const selected = eventSelect.value;
    const records = [...workspace.events].sort((a, b) => String(b.starts_at).localeCompare(String(a.starts_at)));
    eventSelect.replaceChildren();
    if (!records.length) eventSelect.add(new Option("Sem eventos disponíveis", ""));
    records.forEach((record) => eventSelect.add(new Option(`${record.title} · ${safeDate(record.starts_at)}`, record.id)));
    if (records.some((record) => record.id === selected)) eventSelect.value = selected;
    const eventId = eventSelect.value;
    list.replaceChildren();
    const members = (core().team || []).filter((member) => member.id);
    if (!eventId || !members.length) {
      list.appendChild(element("p", "bo-empty-soft", !eventId ? "Cria primeiro um evento para registar presenças." : "Não existem membros na equipa."));
      return;
    }
    members.forEach((member) => {
      const existing = workspace.attendance.find((item) => item.event_id === eventId && item.member_id === member.id);
      const row = element("label", "bo-attendance-row");
      const identity = element("span", "bo-attendance-member");
      identity.append(element("strong", null, member.name || "Membro"), element("small", null, member.role || member.area || "Equipa"));
      const select = element("select");
      select.name = member.id;
      select.add(new Option("Presente", "present"));
      select.add(new Option("Ausente", "absent"));
      select.add(new Option("Justificada", "justified"));
      select.value = existing?.status || "present";
      row.append(identity, select);
      list.appendChild(row);
    });
  }

  async function saveAttendance(event) {
    event.preventDefault();
    const eventId = $("[data-attendance-event]")?.value;
    if (!eventId) return setWorkspaceStatus("[data-attendance-status]", "Seleciona um evento.", "error");
    const members = (core().team || []).filter((member) => member.id);
    const records = members.map((member) => ({
      event_id: eventId,
      member_id: member.id,
      status: event.currentTarget.elements[member.id]?.value || "present",
      recorded_by: currentUserId()
    }));
    try {
      if (!workspace.preview) {
        const { data, error } = await client().from("attendance_records").upsert(records, { onConflict: "event_id,member_id" }).select();
        if (error) throw error;
        workspace.attendance = workspace.attendance.filter((item) => item.event_id !== eventId).concat(data || []);
      } else {
        workspace.attendance = workspace.attendance.filter((item) => item.event_id !== eventId)
          .concat(records.map((record) => ({ id: crypto.randomUUID(), ...record })));
      }
      setWorkspaceStatus("[data-attendance-status]", "Presenças guardadas.", "success");
      renderAttendance();
    } catch (error) {
      setWorkspaceStatus("[data-attendance-status]", error?.message || "Não foi possível guardar as presenças.", "error");
    }
  }

  function fillRoleHistoryMembers() {
    const select = $("[data-role-history-member]");
    if (!select) return;
    const selected = select.value;
    select.replaceChildren(new Option("Selecionar membro", ""));
    (core().team || []).filter((member) => member.id).forEach((member) => select.add(new Option(member.name || "Membro", member.id)));
    if ([...select.options].some((option) => option.value === selected)) select.value = selected;
  }

  function renderRoleHistory() {
    fillRoleHistoryMembers();
    const list = $("[data-role-history-list]");
    if (!list) return;
    list.replaceChildren();
    const records = [...workspace.roleHistory].sort((a, b) => String(b.started_on).localeCompare(String(a.started_on)));
    if (!records.length) list.appendChild(element("p", "bo-empty-soft", "Ainda não existem cargos registados."));
    records.forEach((record) => {
      const member = (core().team || []).find((item) => item.id === record.member_id);
      const row = element("article", "bo-hr-record-row bo-role-history-row");
      const body = element("div", "bo-hr-record-copy");
      body.append(element("h4", null, record.role_title), element("p", null, member?.name || "Membro não encontrado"));
      if (record.notes) body.appendChild(element("small", null, record.notes));
      const dates = element("span", "bo-hr-role-dates", `${safeDate(record.started_on)} — ${record.ended_on ? safeDate(record.ended_on) : "Atual"}`);
      const actions = element("div", "bo-row-actions");
      if (canManageHr()) {
        const remove = element("button", "bo-button bo-button-ghost bo-button-danger-text", "Eliminar");
        remove.type = "button";
        remove.addEventListener("click", () => void deleteRoleHistory(record));
        actions.appendChild(remove);
      }
      row.append(body, dates, actions);
      list.appendChild(row);
    });
  }

  async function saveRoleHistory(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      member_id: form.elements.member_id.value,
      role_title: form.elements.role_title.value.trim(),
      started_on: form.elements.started_on.value,
      ended_on: form.elements.ended_on.value || null,
      notes: form.elements.notes.value.trim() || null,
      created_by: currentUserId()
    };
    try {
      let saved;
      if (workspace.preview) saved = { id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() };
      else {
        const { data, error } = await client().from("role_history").insert(payload).select().single();
        if (error) throw error;
        saved = data;
      }
      workspace.roleHistory.unshift(saved);
      form.reset();
      form.hidden = true;
      setWorkspaceStatus("[data-role-history-status]", "Cargo guardado.", "success");
      renderRoleHistory();
      renderProfileModules();
    } catch (error) {
      setWorkspaceStatus("[data-role-history-status]", error?.message || "Não foi possível guardar o cargo.", "error");
    }
  }

  async function deleteRoleHistory(record) {
    if (!window.confirm(`Eliminar o registo “${record.role_title}”?`)) return;
    try {
      if (!workspace.preview) {
        const { error } = await client().from("role_history").delete().eq("id", record.id);
        if (error) throw error;
      }
      workspace.roleHistory = workspace.roleHistory.filter((item) => item.id !== record.id);
      renderRoleHistory();
      renderProfileModules();
    } catch (error) {
      window.alert(error?.message || "Não foi possível eliminar o cargo.");
    }
  }

  function organizationMemberName(memberId) {
    return core().team?.find((member) => member.id === memberId)?.name || "Por atribuir";
  }

  function organizationChildren(parentId) {
    return workspace.organizationChart
      .filter((node) => (node.parent_id || null) === (parentId || null))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.title.localeCompare(b.title, "pt"));
  }

  function organizationDescendantIds(nodeId, found = new Set()) {
    organizationChildren(nodeId).forEach((child) => {
      if (found.has(child.id)) return;
      found.add(child.id);
      organizationDescendantIds(child.id, found);
    });
    return found;
  }

  function normalizeOrganizationSort(parentId) {
    organizationChildren(parentId).forEach((node, index) => { node.sort_order = index + 1; });
  }

  function addOrganizationNode(parentId = null) {
    const siblings = organizationChildren(parentId);
    workspace.organizationChart.push({
      id: crypto.randomUUID(),
      title: "Novo cargo",
      member_id: null,
      parent_id: parentId || null,
      sort_order: siblings.length + 1
    });
    renderOrganizationChart();
  }

  function deleteOrganizationNode(node) {
    if (!window.confirm(`Remover o cargo “${node.title || "Sem título"}”? Os cargos subordinados passam para o nível anterior.`)) return;
    workspace.organizationChart.forEach((item) => {
      if (item.parent_id === node.id) item.parent_id = node.parent_id || null;
    });
    workspace.organizationChart = workspace.organizationChart.filter((item) => item.id !== node.id);
    normalizeOrganizationSort(node.parent_id || null);
    renderOrganizationChart();
  }

  function moveOrganizationNode(node, direction) {
    const siblings = organizationChildren(node.parent_id || null);
    const index = siblings.findIndex((item) => item.id === node.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= siblings.length) return;
    const previousOrder = siblings[index].sort_order;
    siblings[index].sort_order = siblings[target].sort_order;
    siblings[target].sort_order = previousOrder;
    normalizeOrganizationSort(node.parent_id || null);
    renderOrganizationChart();
  }

  function createOrganizationCard(node) {
    const card = element("article", "bo-org-node-card");
    card.dataset.orgNodeId = node.id;
    const cardHead = element("div", "bo-org-node-head");
    cardHead.appendChild(element("span", "bo-soft-badge", node.parent_id ? "Cargo" : "Topo"));
    const orderActions = element("div", "bo-org-node-order");
    const up = element("button", "bo-icon-button", "↑");
    up.type = "button";
    up.title = "Mover para a esquerda";
    up.setAttribute("aria-label", "Mover cargo para a esquerda");
    up.addEventListener("click", () => moveOrganizationNode(node, -1));
    const down = element("button", "bo-icon-button", "↓");
    down.type = "button";
    down.title = "Mover para a direita";
    down.setAttribute("aria-label", "Mover cargo para a direita");
    down.addEventListener("click", () => moveOrganizationNode(node, 1));
    orderActions.append(up, down);
    cardHead.appendChild(orderActions);

    const titleLabel = element("label", "bo-org-field");
    titleLabel.appendChild(element("span", "bo-field-label", "Cargo"));
    const title = element("input");
    title.type = "text";
    title.maxLength = 120;
    title.value = node.title || "";
    title.placeholder = "Ex.: Team Leader de Comunicação";
    title.addEventListener("input", () => { node.title = title.value; });
    titleLabel.appendChild(title);

    const memberLabel = element("label", "bo-org-field");
    memberLabel.appendChild(element("span", "bo-field-label", "Membro"));
    const member = element("select");
    member.add(new Option("Por atribuir", ""));
    (core().team || []).filter((item) => item.id).forEach((item) => member.add(new Option(item.name || item.email || "Membro", item.id)));
    member.value = node.member_id || "";
    member.addEventListener("change", () => { node.member_id = member.value || null; });
    memberLabel.appendChild(member);

    const parentLabel = element("label", "bo-org-field");
    parentLabel.appendChild(element("span", "bo-field-label", "Reporta a"));
    const parent = element("select");
    parent.add(new Option("Sem chefia direta", ""));
    const blocked = organizationDescendantIds(node.id);
    workspace.organizationChart.filter((item) => item.id !== node.id && !blocked.has(item.id)).forEach((item) => {
      parent.add(new Option(`${item.title || "Sem título"} · ${organizationMemberName(item.member_id)}`, item.id));
    });
    parent.value = node.parent_id || "";
    parent.addEventListener("change", () => {
      const oldParent = node.parent_id || null;
      node.parent_id = parent.value || null;
      node.sort_order = organizationChildren(node.parent_id).length + 1;
      normalizeOrganizationSort(oldParent);
      normalizeOrganizationSort(node.parent_id);
      renderOrganizationChart();
    });
    parentLabel.appendChild(parent);

    const actions = element("div", "bo-org-node-actions");
    const addChild = element("button", "bo-button bo-button-ghost", "+ Subordinado");
    addChild.type = "button";
    addChild.addEventListener("click", () => addOrganizationNode(node.id));
    const remove = element("button", "bo-button bo-button-danger-text", "Remover");
    remove.type = "button";
    remove.addEventListener("click", () => deleteOrganizationNode(node));
    actions.append(addChild, remove);
    card.append(cardHead, titleLabel, memberLabel, parentLabel, actions);
    return card;
  }

  function createOrganizationBranch(node, visited = new Set()) {
    const branch = element("div", "bo-org-branch");
    if (visited.has(node.id)) return branch;
    visited.add(node.id);
    branch.appendChild(createOrganizationCard(node));
    const children = organizationChildren(node.id);
    if (children.length) {
      const childrenWrap = element("div", "bo-org-children");
      children.forEach((child) => childrenWrap.appendChild(createOrganizationBranch(child, new Set(visited))));
      branch.appendChild(childrenWrap);
    }
    return branch;
  }

  function renderOrganizationChart() {
    const canvas = $("[data-org-chart]");
    if (!canvas) return;
    canvas.replaceChildren();
    if (!workspace.organizationChart.length) {
      const empty = element("div", "bo-org-empty");
      empty.append(element("strong", null, "O organigrama ainda está vazio."), element("p", null, "Começa pelo cargo de topo e adiciona os restantes níveis."));
      const add = element("button", "bo-button bo-button-primary", "Criar primeiro cargo");
      add.type = "button";
      add.addEventListener("click", () => addOrganizationNode());
      empty.appendChild(add);
      canvas.appendChild(empty);
      return;
    }
    const roots = organizationChildren(null);
    const rootWrap = element("div", "bo-org-roots");
    roots.forEach((root) => rootWrap.appendChild(createOrganizationBranch(root)));
    canvas.appendChild(rootWrap);
  }

  async function saveOrganizationChart() {
    if (!canManageHr()) return;
    const status = "[data-org-chart-status]";
    const invalid = workspace.organizationChart.find((node) => !node.title?.trim());
    if (invalid) {
      setWorkspaceStatus(status, "Todos os cargos precisam de um título.", "error");
      $((`[data-org-node-id="${invalid.id}"] input`))?.focus();
      return;
    }
    try {
      setWorkspaceStatus(status, "A guardar organigrama...");
      if (!workspace.preview) {
        const rows = workspace.organizationChart.map((node) => ({
          id: node.id,
          title: node.title.trim(),
          member_id: node.member_id || null,
          parent_id: node.parent_id || null,
          sort_order: node.sort_order || 1,
          updated_at: new Date().toISOString()
        }));
        if (rows.length) {
          const { error } = await client().from("organization_chart_nodes").upsert(rows, { onConflict: "id" });
          if (error) throw error;
        }
        const currentIds = new Set(rows.map((row) => row.id));
        const removedIds = [...workspace.organizationSavedIds].filter((id) => !currentIds.has(id));
        if (removedIds.length) {
          const { error } = await client().from("organization_chart_nodes").delete().in("id", removedIds);
          if (error) throw error;
        }
      }
      workspace.organizationSavedIds = new Set(workspace.organizationChart.map((node) => node.id));
      setWorkspaceStatus(status, "Organigrama guardado.", "success");
    } catch (error) {
      setWorkspaceStatus(status, error?.message || "Não foi possível guardar o organigrama.", "error");
    }
  }

  function organizationDepth(node, byId, memo = new Map(), visiting = new Set()) {
    if (memo.has(node.id)) return memo.get(node.id);
    if (!node.parent_id || !byId.has(node.parent_id) || visiting.has(node.id)) return 0;
    visiting.add(node.id);
    const depth = organizationDepth(byId.get(node.parent_id), byId, memo, visiting) + 1;
    visiting.delete(node.id);
    memo.set(node.id, depth);
    return depth;
  }

  function truncatePdfText(font, text, size, maxWidth) {
    const value = String(text || "");
    if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
    let result = value;
    while (result.length && font.widthOfTextAtSize(`${result}…`, size) > maxWidth) result = result.slice(0, -1);
    return `${result}…`;
  }

  function wrapPdfText(font, text, size, maxWidth, maxLines = 2) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (!current || font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate;
      else {
        lines.push(current);
        current = word;
      }
    });
    if (current) lines.push(current);
    if (lines.length <= maxLines) return lines.map((line) => truncatePdfText(font, line, size, maxWidth));
    const visible = lines.slice(0, maxLines);
    visible[maxLines - 1] = truncatePdfText(font, `${visible[maxLines - 1]} ${lines.slice(maxLines).join(" ")}`, size, maxWidth);
    return visible;
  }

  async function exportOrganizationPdf() {
    const status = "[data-org-chart-status]";
    if (!workspace.organizationChart.length) {
      setWorkspaceStatus(status, "Adiciona pelo menos um cargo antes de exportar.", "error");
      return;
    }
    if (!window.PDFLib) {
      setWorkspaceStatus(status, "O gerador de PDF ainda não está disponível. Atualiza a página e tenta novamente.", "error");
      return;
    }
    try {
      setWorkspaceStatus(status, "A preparar PDF...");
      const { PDFDocument, StandardFonts, PageSizes, rgb } = window.PDFLib;
      const pdf = await PDFDocument.create();
      const [portraitWidth, portraitHeight] = PageSizes.A4;
      const page = pdf.addPage([portraitHeight, portraitWidth]);
      const width = page.getWidth();
      const height = page.getHeight();
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(1, 1, 1)
      });
      const regular = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const logoResponse = await window.fetch("/img/riseup-logo.png");
      if (!logoResponse.ok) throw new Error("Não foi possível carregar o logótipo.");
      const logo = await pdf.embedPng(await logoResponse.arrayBuffer());
      const logoSize = logo.scale(0.3);
      page.drawImage(logo, { x: 38, y: height - 62, width: logoSize.width, height: logoSize.height });
      page.drawText("ORGANIGRAMA", { x: width - 178, y: height - 42, size: 17, font: bold, color: rgb(0.08, 0.14, 0.18) });
      page.drawText("Estrutura organizacional da Rise Up", { x: width - 232, y: height - 58, size: 8.5, font: regular, color: rgb(0.38, 0.46, 0.53) });
      page.drawLine({ start: { x: 38, y: height - 76 }, end: { x: width - 38, y: height - 76 }, thickness: 1, color: rgb(0.86, 0.89, 0.92) });

      const byId = new Map(workspace.organizationChart.map((node) => [node.id, node]));
      const memo = new Map();
      const levels = new Map();
      workspace.organizationChart.forEach((node) => {
        const depth = organizationDepth(node, byId, memo);
        if (!levels.has(depth)) levels.set(depth, []);
        levels.get(depth).push(node);
      });
      levels.forEach((nodes) => nodes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      const depthCount = Math.max(...levels.keys()) + 1;
      const maxInLevel = Math.max(...[...levels.values()].map((nodes) => nodes.length));
      const contentTop = height - 105;
      const contentBottom = 48;
      const usableHeight = contentTop - contentBottom;
      const verticalGap = Math.max(12, Math.min(30, usableHeight / Math.max(depthCount * 3, 1)));
      const boxHeight = Math.max(34, Math.min(54, (usableHeight - verticalGap * Math.max(depthCount - 1, 0)) / depthCount));
      const sideMargin = 38;
      const usableWidth = width - sideMargin * 2;
      const horizontalGap = 12;
      const boxWidth = Math.max(62, Math.min(142, (usableWidth - horizontalGap * Math.max(maxInLevel - 1, 0)) / maxInLevel));
      const positions = new Map();

      [...levels.entries()].sort(([a], [b]) => a - b).forEach(([depth, nodes]) => {
        const totalWidth = nodes.length * boxWidth + Math.max(nodes.length - 1, 0) * horizontalGap;
        const startX = (width - totalWidth) / 2;
        const y = contentTop - boxHeight - depth * (boxHeight + verticalGap);
        nodes.forEach((node, index) => positions.set(node.id, { x: startX + index * (boxWidth + horizontalGap), y }));
      });

      workspace.organizationChart.forEach((node) => {
        if (!node.parent_id) return;
        const child = positions.get(node.id);
        const parent = positions.get(node.parent_id);
        if (!child || !parent) return;
        const start = { x: parent.x + boxWidth / 2, y: parent.y };
        const end = { x: child.x + boxWidth / 2, y: child.y + boxHeight };
        const middleY = (start.y + end.y) / 2;
        const lineColor = rgb(0.63, 0.7, 0.77);
        page.drawLine({ start, end: { x: start.x, y: middleY }, thickness: 1, color: lineColor });
        page.drawLine({ start: { x: start.x, y: middleY }, end: { x: end.x, y: middleY }, thickness: 1, color: lineColor });
        page.drawLine({ start: { x: end.x, y: middleY }, end, thickness: 1, color: lineColor });
      });

      workspace.organizationChart.forEach((node) => {
        const position = positions.get(node.id);
        const titleSize = boxWidth < 85 ? 6.5 : 8;
        const memberSize = boxWidth < 85 ? 5.8 : 7;
        page.drawRectangle({ x: position.x, y: position.y, width: boxWidth, height: boxHeight, borderWidth: 1, borderColor: rgb(0.72, 0.82, 0.92), color: rgb(0.97, 0.985, 1) });
        page.drawRectangle({ x: position.x, y: position.y + boxHeight - 4, width: boxWidth, height: 4, color: rgb(0.14, 0.43, 0.79) });
        const titleLines = wrapPdfText(bold, node.title || "Sem título", titleSize, boxWidth - 12, 2);
        const memberName = truncatePdfText(regular, organizationMemberName(node.member_id), memberSize, boxWidth - 12);
        titleLines.forEach((line, index) => page.drawText(line, { x: position.x + 6, y: position.y + boxHeight - 19 - index * (titleSize + 2), size: titleSize, font: bold, color: rgb(0.09, 0.16, 0.22) }));
        page.drawText(memberName, { x: position.x + 6, y: position.y + 9, size: memberSize, font: regular, color: rgb(0.38, 0.46, 0.53) });
      });

      const generated = new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "long", year: "numeric" }).format(new Date());
      page.drawText(`Gerado em ${generated}`, { x: 38, y: 22, size: 7, font: regular, color: rgb(0.48, 0.55, 0.61) });
      page.drawText("Rise Up - Documento interno", { x: width - 142, y: 22, size: 7, font: regular, color: rgb(0.48, 0.55, 0.61) });
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = url;
      download.download = "organigrama-rise-up.pdf";
      document.body.appendChild(download);
      download.click();
      download.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setWorkspaceStatus(status, "PDF exportado com o logótipo da Rise Up.", "success");
    } catch (error) {
      setWorkspaceStatus(status, error?.message || "Não foi possível exportar o PDF.", "error");
    }
  }

  function renderHrModules() {
    renderHrEvents();
    renderAttendance();
    renderRoleHistory();
    renderOrganizationChart();
    showHrModule(workspace.activeHrModule);
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function canSearchView(view) {
    const button = $(`[data-view-button="${view}"]`);
    return Boolean(button && !button.hidden);
  }

  function globalSearchEntries() {
    const entries = [];
    const add = (entry) => {
      if (canSearchView(entry.view)) entries.push(entry);
    };
    const sections = [
      ["dashboard", "Dashboard", "Painel, avisos, eventos e reuniões"],
      ["todo", "To-Do", "Tarefas e prioridades"],
      ["projects", "Projetos", "Projetos, clientes e equipas"],
      ["team", "Equipa", "Membros e contactos"],
      ["hr", "Recursos Humanos", "Cronograma, eventos, presenças, cargos, candidaturas e organigrama"],
      ["communication", "Comunicação", "Calendário editorial e publicações"],
      ["documents", "Documentos", "Biblioteca e Google Drive"],
      ["contacts", "Contactos", "Mensagens recebidas"],
      ["settings", "Definições", "Permissões e visualização por cargo"],
      ["profile", "Perfil", "Dados pessoais e histórico"]
    ];
    sections.forEach(([view, title, meta]) => add({ type: "Área", title, meta, view, searchable: `${title} ${meta}` }));

    workspace.tasks.forEach((task) => add({ type: "Tarefa", title: task.title, meta: `${priorityLabels[task.priority] || "Média"} · ${task.status === "done" ? "Concluída" : task.due_date ? `Prazo ${safeDate(task.due_date)}` : "Sem prazo"}`, view: "todo", searchable: `${task.title} ${task.description || ""} ${taskAssigneeIds(task).map(getMemberName).join(" ")}`, action: () => openTaskForm(task) }));
    (core().projects || []).forEach((project) => add({ type: "Projeto", title: project.title || "Projeto sem título", meta: [project.client_name, project.category, project.status].filter(Boolean).join(" · ") || "Projeto", view: "projects", searchable: `${project.title || ""} ${project.client_name || ""} ${project.category || ""} ${project.tags || ""}`, action: () => api()?.openProject?.(project.id) }));
    (core().team || []).forEach((member) => add({ type: "Membro", title: member.name || member.email || "Membro", meta: [member.role, member.email].filter(Boolean).join(" · ") || "Equipa", view: "team", searchable: `${member.name || ""} ${member.email || ""} ${member.role || ""} ${member.position || ""}`, filter: "[data-team-search]" }));
    workspace.events.forEach((event) => add({ type: eventTypeLabel(event.event_type), title: event.title, meta: [safeDate(event.starts_at, true), event.location].filter(Boolean).join(" · "), view: "hr", searchable: `${event.title} ${event.location || ""} ${eventTypeLabel(event.event_type)}`, action: () => showHrModule(event.event_type === "hr" ? "schedule" : "calendar") }));
    workspace.posts.forEach((post) => add({ type: "Publicação", title: post.title, meta: [post.channel, safeDate(post.scheduled_for, true)].filter(Boolean).join(" · "), view: "communication", searchable: `${post.title} ${post.channel || ""} ${post.status || ""}` }));
    workspace.documents.forEach((documentRecord) => add({ type: "Documento", title: documentRecord.title, meta: categoryLabels[documentRecord.category] || "Documento", view: "documents", searchable: `${documentRecord.title} ${categoryLabels[documentRecord.category] || ""}`, filter: "[data-document-search]" }));
    (core().contactSubmissions || []).forEach((contact) => add({ type: "Contacto", title: contact.name || contact.email || "Contacto", meta: contact.email || contact.subject || "Mensagem recebida", view: "contacts", searchable: `${contact.name || ""} ${contact.email || ""} ${contact.subject || ""} ${contact.message || ""}`, filter: "[data-contact-search]" }));
    return entries;
  }

  function closeGlobalSearch({ clear = false } = {}) {
    const input = $("[data-global-search]");
    const results = $("[data-global-search-results]");
    workspace.searchResults = [];
    workspace.searchActiveIndex = -1;
    if (results) {
      results.hidden = true;
      results.replaceChildren();
    }
    if (input) {
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      if (clear) input.value = "";
    }
  }

  function openGlobalSearchResult(result) {
    if (!result) return;
    api()?.showSection(result.view);
    if (result.filter) {
      const filter = $(result.filter);
      if (filter) {
        filter.value = result.title;
        filter.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    result.action?.();
    closeGlobalSearch({ clear: true });
  }

  function renderGlobalSearch() {
    const input = $("[data-global-search]");
    const panel = $("[data-global-search-results]");
    if (!input || !panel) return;
    const query = normalizeSearchText(input.value);
    const entries = globalSearchEntries();
    workspace.searchResults = (query
      ? entries.filter((entry) => normalizeSearchText(`${entry.title} ${entry.searchable || ""}`).includes(query))
      : entries.filter((entry) => entry.type === "Área"))
      .sort((a, b) => {
        if (!query) return 0;
        const aTitle = normalizeSearchText(a.title);
        const bTitle = normalizeSearchText(b.title);
        const rank = (title) => title === query ? 0 : title.startsWith(query) ? 1 : 2;
        return rank(aTitle) - rank(bTitle) || aTitle.localeCompare(bTitle, "pt");
      })
      .slice(0, 8);
    workspace.searchActiveIndex = workspace.searchResults.length ? 0 : -1;
    panel.replaceChildren();

    if (!workspace.searchResults.length) {
      const empty = element("p", "bo-global-search-empty", `Sem resultados para “${input.value.trim()}”.`);
      panel.appendChild(empty);
    } else {
      workspace.searchResults.forEach((result, index) => {
        const option = element("button", `bo-global-search-option${index === workspace.searchActiveIndex ? " is-active" : ""}`);
        option.type = "button";
        option.id = `bo-global-search-option-${index}`;
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", index === workspace.searchActiveIndex ? "true" : "false");
        const copy = element("span", "bo-global-search-copy");
        copy.append(element("strong", null, result.title), element("small", null, `${result.type} · ${result.meta}`));
        option.append(copy);
        option.addEventListener("mouseenter", () => {
          workspace.searchActiveIndex = index;
          renderGlobalSearchActiveOption();
        });
        option.addEventListener("mousedown", (event) => event.preventDefault());
        option.addEventListener("click", () => openGlobalSearchResult(result));
        panel.appendChild(option);
      });
    }
    panel.hidden = false;
    input.setAttribute("aria-expanded", "true");
    renderGlobalSearchActiveOption();
  }

  function renderGlobalSearchActiveOption() {
    const input = $("[data-global-search]");
    $all(".bo-global-search-option").forEach((option, index) => {
      const active = index === workspace.searchActiveIndex;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (input && workspace.searchActiveIndex >= 0) input.setAttribute("aria-activedescendant", `bo-global-search-option-${workspace.searchActiveIndex}`);
    else input?.removeAttribute("aria-activedescendant");
  }

  function handleGlobalSearchKeydown(event) {
    if (event.key === "Escape") {
      closeGlobalSearch();
      event.currentTarget.blur();
      return;
    }
    if (!workspace.searchResults.length || !["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowDown") workspace.searchActiveIndex = (workspace.searchActiveIndex + 1) % workspace.searchResults.length;
    if (event.key === "ArrowUp") workspace.searchActiveIndex = (workspace.searchActiveIndex - 1 + workspace.searchResults.length) % workspace.searchResults.length;
    if (event.key === "Enter") return openGlobalSearchResult(workspace.searchResults[workspace.searchActiveIndex]);
    renderGlobalSearchActiveOption();
  }

  function renderAll() {
    fillTaskOptions();
    renderDashboard();
    renderTasks();
    renderCommunication();
    renderDocuments();
    renderDrive();
    renderProfileModules();
    renderHrModules();
  }

  function bindEvents() {
    $all("[data-hr-module-button]").forEach((button) => button.addEventListener("click", () => showHrModule(button.dataset.hrModuleButton)));
    $("[data-add-org-node]")?.addEventListener("click", () => addOrganizationNode());
    $("[data-save-org-chart]")?.addEventListener("click", saveOrganizationChart);
    $("[data-export-org-pdf]")?.addEventListener("click", exportOrganizationPdf);
    $("[data-new-hr-milestone]")?.addEventListener("click", () => { $("[data-hr-milestone-form]").hidden = false; });
    $("[data-close-hr-milestone-form]")?.addEventListener("click", () => { $("[data-hr-milestone-form]").hidden = true; });
    $("[data-hr-milestone-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      void saveHrEvent(event.currentTarget, "hr", "[data-hr-milestone-status]");
    });
    $("[data-new-hr-event]")?.addEventListener("click", () => { $("[data-hr-event-form]").hidden = false; });
    $("[data-close-hr-event-form]")?.addEventListener("click", () => { $("[data-hr-event-form]").hidden = true; });
    $("[data-hr-event-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      void saveHrEvent(event.currentTarget, "", "[data-hr-event-status]");
    });
    $("[data-attendance-event]")?.addEventListener("change", renderAttendance);
    $("[data-attendance-form]")?.addEventListener("submit", saveAttendance);
    $("[data-new-role-history]")?.addEventListener("click", () => {
      fillRoleHistoryMembers();
      $("[data-role-history-form]").hidden = false;
    });
    $("[data-close-role-history-form]")?.addEventListener("click", () => { $("[data-role-history-form]").hidden = true; });
    $("[data-role-history-form]")?.addEventListener("submit", saveRoleHistory);
    $("[data-task-form]")?.addEventListener("submit", saveTask);
    $("[data-new-task]")?.addEventListener("click", () => openTaskForm());
    $("[data-open-todo]")?.addEventListener("click", () => api()?.showSection("todo"));
    $("[data-close-task-form]")?.addEventListener("click", () => { $("[data-task-form]").hidden = true; });
    $("[data-delete-task]")?.addEventListener("click", deleteCurrentTask);
    $all("[data-task-filter]").forEach((button) => button.addEventListener("click", () => {
      workspace.taskFilter = button.dataset.taskFilter;
      $all("[data-task-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderTasks();
    }));
    $("[data-document-search]")?.addEventListener("input", renderDocuments);
    $("[data-document-filter]")?.addEventListener("change", renderDocuments);
    $("[data-new-publication]")?.addEventListener("click", () => { $("[data-publication-form]").hidden = false; });
    $("[data-close-publication-form]")?.addEventListener("click", () => { $("[data-publication-form]").hidden = true; });
    $("[data-publication-form]")?.addEventListener("submit", savePublication);
    $("[data-new-document]")?.addEventListener("click", () => { $("[data-document-form]").hidden = false; });
    $("[data-close-document-form]")?.addEventListener("click", () => { $("[data-document-form]").hidden = true; });
    $("[data-document-form]")?.addEventListener("submit", saveDocument);
    $("[data-drive-new-folder]")?.addEventListener("click", () => { $("[data-drive-folder-form]").hidden = false; });
    $("[data-drive-cancel-folder]")?.addEventListener("click", () => { $("[data-drive-folder-form]").hidden = true; });
    $("[data-drive-folder-form]")?.addEventListener("submit", createDriveFolder);
    $("[data-drive-upload]")?.addEventListener("click", () => $("[data-drive-file-input]")?.click());
    $("[data-drive-file-input]")?.addEventListener("change", uploadDriveFile);
    $("[data-drive-search]")?.addEventListener("input", (event) => {
      workspace.drive.search = event.currentTarget.value;
      renderDrive();
    });
    $("[data-drive-close-preview]")?.addEventListener("click", () => $("[data-drive-preview]")?.close());
    $("[data-drive-preview]")?.addEventListener("close", () => {
      if (workspace.drive.previewUrl) URL.revokeObjectURL(workspace.drive.previewUrl);
      workspace.drive.previewUrl = "";
    });
    $("[data-global-search]")?.addEventListener("input", renderGlobalSearch);
    $("[data-global-search]")?.addEventListener("focus", renderGlobalSearch);
    $("[data-global-search]")?.addEventListener("keydown", handleGlobalSearchKeydown);
    document.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".bo-global-search")) closeGlobalSearch();
    });
  }

  bindEvents();
  document.addEventListener("riseup:backoffice-ready", loadWorkspace);
  document.addEventListener("riseup:view-as-changed", renderAll);
  if (api()?.state?.user && $("[data-app-view]") && !$("[data-app-view]").hidden) {
    void loadWorkspace();
  }
})();
