(function () {
  const defaultTables = {
    userProfiles: "user_profiles",
    teamMembers: "team_members",
    projects: "projects",
    projectMembers: "project_members",
    interviewEvaluations: "interview_evaluations",
    auditLogs: "audit_logs"
  };

  const defaultStorage = {
    teamPhotos: "team-photos",
    projectImages: "project-images"
  };

  const state = {
    client: null,
    session: null,
    user: null,
    profile: null,
    userProfiles: [],
    team: [],
    projects: [],
    projectMembers: [],
    interviewEvaluations: [],
    auditLogs: [],
    projectImageItems: [],
    projectMemberSelection: new Set(),
    projectMemberSearch: "",
    projectMemberSearchOpen: false,
    projectSearch: "",
    projectStatusFilter: "all",
    teamSearch: "",
    teamStatusFilter: "all",
    hrSearch: "",
    hrDecisionFilter: "all",
    projectPreviewUrls: [],
    dragProjectImageId: "",
    activeView: "dashboard",
    activeHrView: "guide",
    hrSetupMissing: false
  };

  const projectTextReplacements = [
    ["HOJE - National Exhibition of Young Entrepreneurs 2025", "HOJE - Mostra Nacional de Jovens Empreendedores 2025"],
    ["Qual o valor das coisas? - Financial Literacy Workshops", "Qual o valor das coisas? - Workshops de Literacia Financeira"],
    ["TEDx Figueiro dos Vinhos", "TEDx Figueiró dos Vinhos"],
    ["Media Production", "Produção multimédia"],
    ["Parceria Estrategica", "Parceria Estratégica"],
    ["Conferencia Internacional", "Conferência Internacional"],
    ["Formacao", "Formação"],
    ["Organizacao do evento", "Organização do evento"],
    ["Organizacao", "Organização"],
    ["Participacao", "Participação"],
    ["Coorganizacao", "Coorganização"],
    ["coorganizacao", "coorganização"],
    ["coordenacao", "coordenação"],
    ["logistica", "logística"],
    ["inteligencia artificial", "inteligência artificial"],
    ["organizacao", "organização"],
    ["gestao", "gestão"],
    ["Fundacao", "Fundação"],
    ["lideranca", "liderança"],
    ["dinamizacao", "dinamização"],
    ["universitarios", "universitários"],
    ["conteudos", "conteúdos"],
    ["praticos", "práticos"],
    ["pedagogica", "pedagógica"],
    ["execucao", "execução"],
    ["colaboracao", "colaboração"],
    ["captacao", "captação"],
    ["multimedia", "multimédia"],
    ["comunicacao", "comunicação"],
    ["producao audiovisual", "produção audiovisual"],
    ["producao de media", "produção multimédia"],
    ["producao", "produção"],
    ["conferencias academicas", "conferências académicas"],
    ["academicas", "académicas"],
    ["pos-producao", "pós-produção"],
    ["padroes", "padrões"],
    ["edicao", "edição"],
    ["voluntarios", "voluntários"],
    ["Fundacao da Juventude", "Fundação da Juventude"],
    ["Figueiro", "Figueiró"],
    ["4. edicao", "4.ª edição"]
  ];

  const projectTagReplacements = {
    media: "multimédia",
    logistica: "logística",
    "inteligencia artificial": "inteligência artificial",
    organizacao: "organização",
    lideranca: "liderança",
    formacao: "formação",
    "fundacao da juventude": "Fundação da Juventude",
    comunicacao: "comunicação",
    "producao audiovisual": "produção audiovisual"
  };

  const evaluationCriteria = [
    { key: "motivation", label: "Motiva\u00e7\u00e3o real" },
    { key: "maturity", label: "Maturidade" },
    { key: "communication", label: "Comunica\u00e7\u00e3o" },
    { key: "commitment", label: "Compromisso / disponibilidade" },
    { key: "humility", label: "Humildade / aprendizagem" },
    { key: "culture_fit", label: "Fit cultural Rise Up" }
  ];

  const finalReadingCriteria = [
    { key: "wants_rise_up", label: "Quer mesmo estar na Rise Up" },
    { key: "handles_pressure", label: "Aguenta o n\u00edvel de exig\u00eancia" },
    { key: "adds_culture", label: "Acrescenta \u00e0 cultura" }
  ];

  const backofficeRoles = {
    admin: {
      label: "Administrador",
      summary: "Acesso total ao Painel, Perfil, Equipa, Projetos e Recursos Humanos."
    },
    communication_team: {
      label: "Equipa Comunica\u00e7\u00e3o",
      summary: "Acesso ao Perfil e Projetos."
    },
    hr_team: {
      label: "Equipa Recursos Humanos",
      summary: "Acesso ao Perfil e \u00e0 p\u00e1gina Recursos Humanos."
    },
    member: {
      label: "Membro",
      summary: "Acesso apenas ao Perfil."
    }
  };

  const selectors = {
    authView: "[data-auth-view]",
    appView: "[data-app-view]",
    loginForm: "[data-login-form]",
    loginStatus: "[data-login-status]",
    globalStatus: "[data-global-status]",
    userEmail: "[data-user-email]",
    userRole: "[data-user-role]",
    pageTitle: "[data-page-title]",
    profileForm: "[data-profile-form]",
    profileStatus: "[data-profile-form-status]",
    teamList: "[data-team-list]",
    teamForm: "[data-team-form]",
    teamFormTitle: "[data-team-form-title]",
    teamStatus: "[data-team-form-status]",
    projectList: "[data-project-list]",
    projectForm: "[data-project-form]",
    projectFormTitle: "[data-project-form-title]",
    projectStatus: "[data-project-form-status]",
    projectImagePreview: "[data-project-image-preview]",
    projectMemberOptions: "[data-project-member-options]",
    projectMemberSearchToggle: "[data-project-member-search-toggle]",
    projectMemberSearchWrap: "[data-project-member-search-wrap]",
    projectMemberSearchInput: "[data-project-member-search]",
    projectMemberSearchClear: "[data-project-member-search-clear]",
    permissionList: "[data-permission-list]",
    permissionStatus: "[data-permission-status]",
    dashboardTasks: "[data-dashboard-tasks]",
    activityList: "[data-activity-list]",
    teamSearch: "[data-team-search]",
    teamStatusFilter: "[data-team-status-filter]",
    projectSearch: "[data-project-search]",
    projectStatusFilter: "[data-project-status-filter]",
    hrEvaluationList: "[data-hr-evaluation-list]",
    hrSearch: "[data-hr-search]",
    hrDecisionFilter: "[data-hr-decision-filter]",
    hrForm: "[data-hr-form]",
    hrFormTitle: "[data-hr-form-title]",
    hrFormStatus: "[data-hr-form-status]",
    hrAverage: "[data-hr-average]",
    hrSetupNotice: "[data-hr-setup-notice]"
  };

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function getConfig() {
    const source = window.RISEUP_SUPABASE || {};
    const publicKey = source.publicKey || source.anonKey || source.publishableKey || source.key || "";

    return {
      url: typeof source.url === "string" ? source.url.replace(/\/+$/, "") : "",
      publicKey,
      tables: { ...defaultTables, ...(source.tables || {}) },
      storage: { ...defaultStorage, ...(source.storage || {}) }
    };
  }

  function table(key) {
    return getConfig().tables[key] || key;
  }

  function bucket(key) {
    return getConfig().storage[key] || key;
  }

  function isConfigured(config) {
    return Boolean(config.url && config.publicKey && !/COLOCA_AQUI|YOUR_|SUPABASE_/i.test(config.publicKey));
  }

  function setStatus(element, message, type) {
    if (!element) {
      return;
    }

    element.textContent = message || "";
    element.classList.toggle("is-error", type === "error");
    element.classList.toggle("is-success", type === "success");
  }

  function setGlobalStatus(message, type) {
    setStatus($(selectors.globalStatus), message, type);
  }

  function getCurrentRole() {
    return state.profile?.role || "member";
  }

  function getRoleMeta(role) {
    return backofficeRoles[role] || backofficeRoles.member;
  }

  function getRoleLabel(role) {
    return getRoleMeta(role).label;
  }

  function canManageProjects() {
    return ["admin", "communication_team"].includes(getCurrentRole());
  }

  function canDeleteProjects() {
    return isAdmin();
  }

  function canManageHr() {
    return ["admin", "hr_team"].includes(getCurrentRole());
  }

  function isAdmin() {
    return getCurrentRole() === "admin";
  }

  function requireAdmin() {
    if (!isAdmin()) {
      throw new Error("Apenas administradores podem executar esta ação.");
    }
  }

  function requireProjectAccess() {
    if (!canManageProjects()) {
      throw new Error("N\u00e3o tens permiss\u00e3o para gerir projetos.");
    }
  }

  function requireHrAccess() {
    if (!canManageHr()) {
      throw new Error("N\u00e3o tens permiss\u00e3o para gerir Recursos Humanos.");
    }
  }

  function canAccessView(view) {
    if (view === "dashboard" || view === "team") {
      return isAdmin();
    }

    if (view === "projects") {
      return canManageProjects();
    }

    if (view === "hr") {
      return canManageHr();
    }

    return view === "profile";
  }

  function getDefaultView() {
    return isAdmin() ? "dashboard" : "profile";
  }

  function getErrorMessage(error) {
    return error?.message || "Ocorreu um erro inesperado.";
  }

  function randomId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || randomId();
  }

  function sanitizeFileName(value) {
    const clean = String(value || "upload")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    return clean || "upload";
  }

  function splitTags(value) {
    return String(value || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function normalizeSearchValue(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function normalizeProjectText(value) {
    if (typeof value !== "string") {
      return value;
    }

    return projectTextReplacements.reduce(
      (current, [search, replacement]) => current.replaceAll(search, replacement),
      value
    );
  }

  function normalizeProjectTag(tag) {
    const clean = String(tag || "").trim();
    return projectTagReplacements[clean] || normalizeProjectText(clean);
  }

  function normalizeStructuredCopy(value) {
    if (typeof value === "string") {
      return normalizeProjectText(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => normalizeStructuredCopy(item));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, entryValue]) => [key, normalizeStructuredCopy(entryValue)])
      );
    }

    return value;
  }

  function normalizeProjectRecord(project) {
    return {
      ...project,
      status: project.status || "draft",
      title: normalizeProjectText(project.title),
      category: normalizeProjectText(project.category),
      description: normalizeProjectText(project.description),
      tags: Array.isArray(project.tags)
        ? project.tags.map((tag) => normalizeProjectTag(tag))
        : typeof project.tags === "string"
          ? splitTags(project.tags).map((tag) => normalizeProjectTag(tag))
          : project.tags,
      details: normalizeStructuredCopy(project.details)
    };
  }

  function getProjectStatusLabel(status) {
    const labels = {
      draft: "Rascunho",
      in_review: "Em revis\u00e3o",
      published: "Publicado",
      archived: "Arquivado"
    };

    return labels[status] || "Sem estado";
  }

  function getLocalAuditLogs() {
    try {
      return JSON.parse(localStorage.getItem("riseupBackofficeAuditLogs") || "[]");
    } catch (error) {
      return [];
    }
  }

  function setLocalAuditLogs(logs) {
    localStorage.setItem("riseupBackofficeAuditLogs", JSON.stringify(logs.slice(0, 60)));
  }

  function buildAuditEntry(action, entityType, entityLabel) {
    return {
      id: randomId(),
      action,
      entity_type: entityType,
      entity_label: entityLabel || "Sem nome",
      user_id: state.user?.id || null,
      user_label: getCurrentUserDisplayName() || state.user?.email || "Utilizador",
      created_at: new Date().toISOString()
    };
  }

  async function recordAudit(action, entityType, entityLabel) {
    const entry = buildAuditEntry(action, entityType, entityLabel);
    state.auditLogs = [entry, ...state.auditLogs].slice(0, 60);
    setLocalAuditLogs(state.auditLogs);

    try {
      await state.client.from(table("auditLogs")).insert(entry);
    } catch (error) {
      // O registo local mantém o histórico visível mesmo antes de a tabela opcional existir.
    }
  }

  function safeNumber(value) {
    return value === "" || value === null || value === undefined ? null : Number(value);
  }

  function normalizeProjectSortEntries(projects) {
    return projects.map((project, index) => ({
      id: project.id,
      sort_order: index + 1
    }));
  }

  function clampProjectSortOrder(value, total) {
    const parsed = safeNumber(value);
    if (!Number.isFinite(parsed)) {
      return 1;
    }

    return Math.min(Math.max(Math.round(parsed), 1), Math.max(total, 1));
  }

  function getProjectPosition(projectId) {
    const index = state.projects.findIndex((project) => project.id === projectId);
    return index >= 0 ? index + 1 : null;
  }

  function buildProjectSortEntries(projectId, requestedOrder) {
    const projects = state.projects.filter((project) => project.id !== projectId);
    const targetOrder = clampProjectSortOrder(requestedOrder, projects.length + 1);
    projects.splice(targetOrder - 1, 0, { id: projectId });
    return normalizeProjectSortEntries(projects);
  }

  async function persistProjectSortEntries(entries) {
    if (!entries.length) {
      return;
    }

    for (const entry of entries) {
      const { error } = await state.client
        .from(table("projects"))
        .update({ sort_order: entry.sort_order })
        .eq("id", entry.id);

      if (error) {
        throw error;
      }
    }
  }

  function formatDate(value) {
    if (!value) {
      return "Sem data";
    }

    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(date);
  }

  function formatFullDate(value) {
    if (!value) {
      return "Sem data";
    }

    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function formatDecisionLabel(value) {
    if (value === "advance") {
      return "Avan\u00e7ar";
    }

    if (value === "reject") {
      return "N\u00e3o avan\u00e7ar";
    }

    return "Sem decis\u00e3o";
  }

  function formatReadingLabel(value) {
    if (value === "yes") {
      return "Sim";
    }

    if (value === "partial") {
      return "Parcialmente";
    }

    if (value === "no") {
      return "N\u00e3o";
    }

    return "Por preencher";
  }

  function averageEvaluationScore(scores) {
    const values = evaluationCriteria
      .map((criterion) => Number(scores?.[criterion.key]))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!values.length) {
      return null;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function formatAverageLabel(value) {
    if (!Number.isFinite(value)) {
      return "M\u00e9dia a calcular";
    }

    return `M\u00e9dia ${value.toLocaleString("pt-PT", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })}/5`;
  }

  function normalizeEvaluationRecord(record) {
    return {
      ...record,
      scores: record?.scores && typeof record.scores === "object" && !Array.isArray(record.scores)
        ? record.scores
        : {},
      final_reading: record?.final_reading && typeof record.final_reading === "object" && !Array.isArray(record.final_reading)
        ? record.final_reading
        : {}
    };
  }

  function isMissingRelationError(error) {
    return Boolean(
      error?.code === "42P01"
      || /does not exist/i.test(error?.message || "")
      || /not found/i.test(error?.message || "")
    );
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }

    if (typeof text === "string") {
      element.textContent = text;
    }

    return element;
  }

  function showAuthView() {
    clearMemberPhotoPreview($(selectors.profileForm));
    clearMemberPhotoPreview($(selectors.teamForm));
    $(selectors.authView).hidden = false;
    $(selectors.appView).hidden = true;
    document.body.classList.remove("is-member");
  }

  function syncViewVisibility() {
    $all("[data-view-button]").forEach((button) => {
      button.hidden = !canAccessView(button.dataset.viewButton);
    });

    $all("[data-section]").forEach((section) => {
      section.hidden = !canAccessView(section.dataset.section);
    });

    const navMain = $(".bo-nav-main");
    const navDivider = $(".bo-nav-divider");
    const visibleMainButtons = $all(".bo-nav-main [data-view-button]").filter((button) => !button.hidden).length;

    if (navMain) {
      navMain.hidden = visibleMainButtons === 0;
    }

    if (navDivider) {
      navDivider.hidden = visibleMainButtons === 0;
    }
  }

  function getCurrentUserDisplayName() {
    const member = getOwnTeamMember();
    const name = member?.name?.trim();

    if (name) {
      return name;
    }

    return state.user?.email || "";
  }

  function renderCurrentUserSummary() {
    const userLabel = $(selectors.userEmail);
    if (userLabel) {
      userLabel.textContent = getCurrentUserDisplayName();
    }

    $(selectors.userRole).textContent = getRoleLabel(getCurrentRole());
  }

  function showAppView() {
    $(selectors.authView).hidden = true;
    $(selectors.appView).hidden = false;
    document.body.classList.toggle("is-member", !isAdmin());
    syncViewVisibility();
    renderCurrentUserSummary();
  }

  async function optimizeImageFile(file, options = {}) {
    if (!file?.type?.startsWith("image/") || file.type === "image/gif") {
      return file;
    }

    const maxSize = options.maxSize || 1800;
    const quality = options.quality || 0.82;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));

    if (scale >= 1 && file.size < 900000) {
      bitmap.close?.();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) {
      return file;
    }

    const name = `${sanitizeFileName(file.name).replace(/\.[^.]+$/, "")}.jpg`;
    return new File([blob], name, { type: "image/jpeg" });
  }

  async function uploadFile(file, bucketName, folder) {
    if (!file) {
      return "";
    }

    const preparedFile = await optimizeImageFile(file);
    const path = `${folder}/${Date.now()}-${sanitizeFileName(preparedFile.name)}`;
    const { data, error } = await state.client.storage
      .from(bucketName)
      .upload(path, preparedFile, {
        upsert: true,
        contentType: preparedFile.type || "application/octet-stream"
      });

    if (error) {
      throw error;
    }

    const { data: publicData } = state.client.storage.from(bucketName).getPublicUrl(data.path);
    return publicData.publicUrl;
  }

  async function loadProfile() {
    const { data, error } = await state.client
      .from(table("userProfiles"))
      .select("id,email,role")
      .eq("id", state.user.id)
      .limit(1);

    if (error) {
      throw error;
    }

    state.profile = data?.[0] || {
      id: state.user.id,
      email: state.user.email,
      role: "member"
    };
  }

  async function loadUserProfiles() {
    if (!isAdmin()) {
      state.userProfiles = [];
      return;
    }

    const { data, error } = await state.client
      .from(table("userProfiles"))
      .select("id,email,role")
      .order("email", { ascending: true });

    if (error) {
      throw error;
    }

    state.userProfiles = data || [];
  }

  async function loadTeam() {
    let query = state.client
      .from(table("teamMembers"))
      .select("*")
      .order("name", { ascending: true });

    if (!isAdmin() && !canManageProjects()) {
      query = query.eq("user_id", state.user.id);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    state.team = data || [];
  }

  async function loadProjects() {
    if (!canManageProjects()) {
      state.projects = [];
      state.projectMembers = [];
      return;
    }

    const [{ data: projects, error: projectsError }, { data: links, error: linksError }] = await Promise.all([
      state.client
        .from(table("projects"))
        .select("*")
        .order("sort_order", { ascending: true })
        .order("project_date", { ascending: false, nullsFirst: false }),
      state.client
        .from(table("projectMembers"))
        .select("*")
    ]);

    if (projectsError) {
      throw projectsError;
    }

    if (linksError) {
      throw linksError;
    }

    state.projects = (projects || []).map((project) => normalizeProjectRecord(project));
    state.projectMembers = links || [];
  }

  async function loadInterviewEvaluations() {
    state.hrSetupMissing = false;

    if (!canManageHr()) {
      state.interviewEvaluations = [];
      return;
    }

    const { data, error } = await state.client
      .from(table("interviewEvaluations"))
      .select("*")
      .order("interview_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingRelationError(error)) {
        state.hrSetupMissing = true;
        state.interviewEvaluations = [];
        return;
      }

      throw error;
    }

    state.interviewEvaluations = (data || []).map((record) => normalizeEvaluationRecord(record));
  }

  async function loadAuditLogs() {
    state.auditLogs = getLocalAuditLogs();

    if (!isAdmin()) {
      return;
    }

    try {
      const { data, error } = await state.client
        .from(table("auditLogs"))
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      state.auditLogs = data?.length ? data : state.auditLogs;
      setLocalAuditLogs(state.auditLogs);
    } catch (error) {
      if (!isMissingRelationError(error)) {
        console.warn("Audit log unavailable", error);
      }
    }
  }

  async function loadData() {
    setGlobalStatus("A carregar dados...");
    await loadProfile();
    await loadUserProfiles();
    await loadTeam();
    await loadProjects();
    await loadInterviewEvaluations();
    await loadAuditLogs();
    showAppView();
    renderAll();
    setGlobalStatus("");
  }

  function renderAll() {
    renderCurrentUserSummary();
    renderMetrics();
    renderDashboardTasks();
    renderActivityList();
    syncDashboardAccessCopy();
    renderPermissionManager();
    renderProfileSection();
    renderTeamList();
    renderProjectList();
    renderProjectMemberOptions();
    renderInterviewEvaluationList();
    renderHrSection();
  }

  function renderMetrics() {
    $("[data-metric-team]").textContent = String(state.team.length);
    const published = state.projects.filter((project) => project.status === "published").length;
    const drafts = state.projects.filter((project) => project.status === "draft").length;

    const publishedMetric = $("[data-metric-published]");
    const draftMetric = $("[data-metric-draft]");
    if (publishedMetric) {
      publishedMetric.textContent = String(published);
    }
    if (draftMetric) {
      draftMetric.textContent = String(drafts);
    }

    const dashboardCopy = $("[data-dashboard-copy]");
    dashboardCopy.textContent = isAdmin()
      ? "Tens permissão para gerir a equipa, os projetos, os estados de publicação, as associações e os recursos humanos."
      : "Podes editar apenas o perfil associado ao teu utilizador.";
  }

  function syncDashboardAccessCopy() {
    const dashboardCopy = $("[data-dashboard-copy]");
    if (!dashboardCopy) {
      return;
    }

    dashboardCopy.textContent = getRoleMeta(getCurrentRole()).summary;
  }

  function addTask(tasks, title, detail, actionLabel, view, onOpen) {
    tasks.push({ title, detail, actionLabel, view, onOpen });
  }

  function renderDashboardTasks() {
    const list = $(selectors.dashboardTasks);
    if (!list) {
      return;
    }

    list.replaceChildren();
    const tasks = [];
    const drafts = state.projects.filter((project) => project.status === "draft");
    const inReview = state.projects.filter((project) => project.status === "in_review");
    const incompleteProjects = state.projects.filter((project) => project.status !== "archived" && (!project.description || !getProjectImageUrls(project).length));
    const incompleteProfiles = state.team.filter((member) => member.is_active && (!member.photo_url || !member.description));

    if (drafts.length) {
      addTask(tasks, `${drafts.length} projeto(s) em rascunho`, "Podem precisar de texto, imagens ou validação antes de publicar.", "Ver projetos", "projects");
    }

    if (inReview.length) {
      addTask(tasks, `${inReview.length} projeto(s) em revisão`, "Há conteúdos prontos para uma leitura final da comunicação.", "Rever", "projects");
    }

    if (incompleteProjects.length) {
      addTask(tasks, `${incompleteProjects.length} projeto(s) incompleto(s)`, "Faltam descrições ou imagens de capa.", "Completar", "projects");
    }

    if (incompleteProfiles.length) {
      addTask(tasks, `${incompleteProfiles.length} perfil/perfis incompleto(s)`, "Faltam fotografias ou descrições nos perfis públicos.", "Ver equipa", "team");
    }

    if (!tasks.length) {
      list.appendChild(createElement("p", "bo-empty", "Sem tarefas pendentes. Está tudo com bom aspeto operacional."));
      return;
    }

    tasks.slice(0, 6).forEach((task) => {
      const row = createElement("article", "bo-list-row bo-task-row");
      const body = createElement("div");
      body.appendChild(createElement("h3", null, task.title));
      body.appendChild(createElement("p", null, task.detail));

      const actions = createElement("div", "bo-row-actions");
      const open = createElement("button", "bo-button bo-button-ghost", task.actionLabel);
      open.type = "button";
      open.addEventListener("click", () => {
        if (typeof task.onOpen === "function") {
          task.onOpen();
        }
        showSection(task.view);
      });
      actions.appendChild(open);
      row.append(body, actions);
      list.appendChild(row);
    });
  }

  function renderActivityList() {
    const list = $(selectors.activityList);
    if (!list) {
      return;
    }

    list.replaceChildren();

    if (!state.auditLogs.length) {
      list.appendChild(createElement("p", "bo-empty", "Ainda não há alterações registadas nesta instalação."));
      return;
    }

    state.auditLogs.slice(0, 8).forEach((entry) => {
      const row = createElement("article", "bo-list-row bo-activity-row");
      const body = createElement("div");
      body.appendChild(createElement("h3", null, entry.entity_label || "Alteração no backoffice"));
      body.appendChild(createElement("p", null, `${entry.action || "Atualização"} - ${entry.user_label || "Utilizador"} - ${formatFullDate((entry.created_at || "").slice(0, 10))}`));
      row.appendChild(body);
      list.appendChild(row);
    });
  }

  function findTeamMemberForProfile(profile) {
    if (!profile) {
      return null;
    }

    return state.team.find((member) => (
      (member.user_id && member.user_id === profile.id)
      || (
        member.email
        && profile.email
        && member.email.toLowerCase() === profile.email.toLowerCase()
      )
    )) || null;
  }

  function renderPermissionManager() {
    const list = $(selectors.permissionList);
    const status = $(selectors.permissionStatus);
    if (!list || !status) {
      return;
    }

    setStatus(status, "");
    list.replaceChildren();

    if (!isAdmin()) {
      return;
    }

    const profiles = [...state.userProfiles].sort((left, right) => {
      const leftMember = findTeamMemberForProfile(left);
      const rightMember = findTeamMemberForProfile(right);
      const leftLabel = (leftMember?.name || left.email || left.id || "").toLowerCase();
      const rightLabel = (rightMember?.name || right.email || right.id || "").toLowerCase();
      return leftLabel.localeCompare(rightLabel, "pt");
    });

    if (!profiles.length) {
      list.appendChild(createElement("p", "bo-empty", "Ainda n\u00e3o existem utilizadores para gerir permiss\u00f5es."));
      return;
      list.appendChild(createElement("p", "bo-empty", "Ainda nÃ£o existem utilizadores para gerir permissÃµes."));
      return;
    }

    profiles.forEach((profile) => {
      const roleMeta = getRoleMeta(profile.role);
      const member = findTeamMemberForProfile(profile);
      const row = createElement("article", "bo-list-row bo-permission-row");
      const body = createElement("div");
      const displayName = member?.name || profile.email?.split("@")[0] || "Sem nome";

      body.appendChild(createElement("h3", null, displayName));
      body.appendChild(createElement("p", null, profile.email || "Sem email associado"));
      body.appendChild(createElement("p", null, `${roleMeta.label} · ${roleMeta.summary}`));

      body.lastChild.textContent = `${roleMeta.label} · ${roleMeta.summary}`;

      body.lastChild.textContent = `${roleMeta.label} - ${roleMeta.summary}`;

      const actions = createElement("div", "bo-row-actions bo-permission-actions");
      const select = document.createElement("select");
      select.setAttribute("aria-label", `PermissÃ£o de ${displayName}`);

      select.setAttribute("aria-label", `Permiss\u00e3o de ${displayName}`);

      Object.entries(backofficeRoles).forEach(([value, meta]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = meta.label;
        option.selected = profile.role === value;
        select.appendChild(option);
      });

      const save = createElement("button", "bo-button bo-button-ghost", "Guardar acesso");
      save.type = "button";
      save.addEventListener("click", () => saveUserPermission(profile, select.value));

      actions.append(select, save);
      row.append(body, actions);
      list.appendChild(row);
    });
  }

  async function saveUserPermission(profile, nextRole) {
    requireAdmin();

    const status = $(selectors.permissionStatus);
    const targetRole = backofficeRoles[nextRole] ? nextRole : "member";
    const adminCount = state.userProfiles.filter((entry) => entry.role === "admin").length;

    if (profile.id === state.user?.id && profile.role === "admin" && targetRole !== "admin" && adminCount <= 1) {
      setStatus(status, "Mant\u00e9m pelo menos um administrador ativo antes de remover o teu acesso total.", "error");
      return;
    }

    try {
      setStatus(status, "A guardar permiss\u00f5es...");
      const { error } = await state.client
        .from(table("userProfiles"))
        .update({ role: targetRole })
        .eq("id", profile.id);

      if (error) {
        throw error;
      }

      await loadData();
      await recordAudit("Permissão atualizada", "permission", profile.email || profile.id);
      showSection(canAccessView(state.activeView) ? state.activeView : getDefaultView());
      setStatus($(selectors.permissionStatus), "Permiss\u00f5es atualizadas.", "success");
      setGlobalStatus("Permiss\u00f5es atualizadas.", "success");
    } catch (error) {
      setStatus(status, getErrorMessage(error), "error");
    }
  }

  function isOwnMember(member) {
    if (!member || !state.user) {
      return false;
    }

    if (member.user_id && member.user_id === state.user.id) {
      return true;
    }

    return Boolean(
      member.email
      && state.user.email
      && member.email.toLowerCase() === state.user.email.toLowerCase()
    );
  }

  function getOwnTeamMember() {
    return state.team.find((member) => isOwnMember(member)) || null;
  }

  function populateMemberForm(form, member, options = {}) {
    form.reset();
    setField(form, "id", member?.id || "");
    setField(form, "name", member?.name || "");
    setField(form, "role", member?.role || "");
    setField(form, "description", member?.description || "");
    setField(form, "photo_url", member?.photo_url || "");
    setField(form, "linkedin_url", member?.linkedin_url || "");
    setField(form, "email", member?.email || "");
    setField(form, "joined_month", member?.joined_month || "");
    setField(form, "joined_year", member?.joined_year || "");

    if (options.allowAdminFields && form.elements.is_active) {
      setField(form, "is_active", member?.is_active ?? true);
    }

    updateMemberPhotoPreview(form, { url: member?.photo_url || "" });
  }

  function renderProfileSection() {
    const form = $(selectors.profileForm);
    const empty = $("[data-profile-empty]");
    if (!form || !empty) {
      return;
    }

    const member = getOwnTeamMember();
    if (!member) {
      form.hidden = true;
      empty.hidden = false;
      clearMemberPhotoPreview(form);
      empty.textContent = "Ainda não existe um perfil associado a esta conta. Confirma se o SQL de setup foi executado depois de criares o utilizador.";
      return;
    }

    empty.hidden = true;
    form.hidden = false;
    populateMemberForm(form, member);
  }

  function renderTeamList() {
    const list = $(selectors.teamList);
    list.replaceChildren();

    const query = normalizeSearchValue(state.teamSearch);
    const visibleTeam = state.team.filter((member) => {
      const matchesSearch = !query || normalizeSearchValue([member.name, member.role, member.email].filter(Boolean).join(" ")).includes(query);
      const matchesStatus = state.teamStatusFilter === "all"
        || (state.teamStatusFilter === "active" && member.is_active)
        || (state.teamStatusFilter === "inactive" && !member.is_active);
      return matchesSearch && matchesStatus;
    });

    if (!state.team.length) {
      const message = isAdmin()
        ? "Ainda não existem perfis. Cria contas em Authentication > Users; os perfis aparecem aqui automaticamente."
        : "O teu perfil ainda não foi gerado. Confirma se o SQL de setup foi executado depois de criares a conta.";
      list.appendChild(createElement("p", "bo-empty", message));
      return;
    }

    if (!visibleTeam.length) {
      list.appendChild(createElement("p", "bo-empty", "Nenhum perfil corresponde aos filtros ativos."));
      return;
    }

    visibleTeam.forEach((member) => {
      const row = createElement("article", "bo-list-row");
      const body = createElement("div");
      const stateLabel = member.is_active ? "Ativo" : "Inativo";
      body.appendChild(createElement("h3", null, member.name || "Sem nome"));
      body.appendChild(createElement("p", null, `${member.role || "Sem cargo"} · ${stateLabel}`));

      const actions = createElement("div", "bo-row-actions");
      const edit = createElement("button", "bo-button bo-button-ghost", "Editar");
      edit.type = "button";
      edit.addEventListener("click", () => openTeamForm(member));
      actions.appendChild(edit);

      row.append(body, actions);
      list.appendChild(row);
    });
  }

  function projectLinks(projectId) {
    return state.projectMembers.filter((link) => link.project_id === projectId);
  }

  function getFilteredProjects() {
    const query = normalizeSearchValue(state.projectSearch);
    return state.projects.filter((project) => {
      const searchable = normalizeSearchValue([
        project.title,
        project.category,
        project.description,
        ...(Array.isArray(project.tags) ? project.tags : [])
      ].filter(Boolean).join(" "));
      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = state.projectStatusFilter === "all" || project.status === state.projectStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  function renderProjectList() {
    const list = $(selectors.projectList);
    if (!list) {
      return;
    }

    list.replaceChildren();
    const visibleProjects = getFilteredProjects();

    if (!state.projects.length) {
      list.appendChild(createElement("p", "bo-empty", "Ainda não existem projetos registados."));
      return;
    }

    if (!visibleProjects.length) {
      list.appendChild(createElement("p", "bo-empty", "Nenhum projeto corresponde aos filtros ativos."));
      return;
    }

    visibleProjects.forEach((project) => {
      const row = createElement("article", "bo-list-row");
      const body = createElement("div");
      body.appendChild(createElement("h3", null, project.title || "Sem titulo"));
      body.appendChild(createElement("p", null, `${getProjectStatusLabel(project.status)} - ${project.category || "Sem categoria"} - ${formatDate(project.project_date)}`));

      const actions = createElement("div", "bo-row-actions");
      actions.appendChild(createElement("span", "bo-pill", `${projectLinks(project.id).length} pessoas`));
      const edit = createElement("button", "bo-button bo-button-ghost", "Editar");
      edit.type = "button";
      edit.addEventListener("click", () => openProjectForm(project));
      actions.appendChild(edit);

      row.append(body, actions);
      list.appendChild(row);
    });
  }

  function getFilteredEvaluations() {
    const query = normalizeSearchValue(state.hrSearch);
    return state.interviewEvaluations.filter((record) => {
      const searchable = normalizeSearchValue([
        record.candidate_name,
        record.potential_area,
        record.course_year,
        record.interviewers
      ].filter(Boolean).join(" "));
      const matchesSearch = !query || searchable.includes(query);
      const matchesDecision = state.hrDecisionFilter === "all" || record.final_decision === state.hrDecisionFilter;
      return matchesSearch && matchesDecision;
    });
  }

  function renderInterviewEvaluationList() {
    const list = $(selectors.hrEvaluationList);
    if (!list) {
      return;
    }

    list.replaceChildren();

    if (state.hrSetupMissing) {
      return;
    }

    const visibleEvaluations = getFilteredEvaluations();

    if (!state.interviewEvaluations.length) {
      list.appendChild(createElement("p", "bo-empty", "Ainda não existem avaliações registadas."));
      return;
    }

    if (!visibleEvaluations.length) {
      list.appendChild(createElement("p", "bo-empty", "Nenhuma avaliação corresponde aos filtros ativos."));
      return;
    }

    visibleEvaluations.forEach((record) => {
      const row = createElement("article", "bo-list-row");
      const body = createElement("div");
      const average = averageEvaluationScore(record.scores);

      body.appendChild(createElement("h3", null, record.candidate_name || "Sem nome"));
      body.appendChild(createElement(
        "p",
        null,
        `${formatFullDate(record.interview_date)} · ${record.potential_area || "Sem área definida"} · ${formatDecisionLabel(record.final_decision)}`
      ));

      if (record.interviewers) {
        body.appendChild(createElement("p", null, `Entrevistadores: ${record.interviewers}`));
      }

      const actions = createElement("div", "bo-row-actions");
      actions.appendChild(createElement("span", "bo-pill", formatAverageLabel(average)));
      actions.appendChild(createElement("span", "bo-pill", `Quer estar: ${formatReadingLabel(record.final_reading?.wants_rise_up)}`));

      const edit = createElement("button", "bo-button bo-button-ghost", "Abrir");
      edit.type = "button";
      edit.addEventListener("click", () => openInterviewEvaluationForm(record));
      actions.appendChild(edit);

      row.append(body, actions);
      list.appendChild(row);
    });
  }

  function renderHrSection() {
    const notice = $(selectors.hrSetupNotice);
    const newButton = $("[data-new-evaluation]");

    if (notice) {
      notice.hidden = !state.hrSetupMissing;
      notice.textContent = state.hrSetupMissing
        ? "Para ativar esta área, executa novamente o ficheiro supabase-setup.sql no Supabase. A tabela de avaliações de RH ainda não existe."
        : "";
    }

    if (newButton) {
      newButton.disabled = state.hrSetupMissing;
    }

    if (state.hrSetupMissing) {
      closeInterviewEvaluationForm();
    }

    showHrView(state.activeHrView);
  }

  function setField(form, name, value) {
    const field = form.elements[name];
    if (!field) {
      return;
    }

    if (field.type === "checkbox") {
      field.checked = Boolean(value);
      return;
    }

    field.value = value ?? "";
  }

  function clearMemberPhotoPreview(form) {
    const preview = form?.querySelector("[data-photo-preview]");
    const image = form?.querySelector("[data-photo-preview-image]");
    const empty = form?.querySelector("[data-photo-preview-empty]");
    const caption = form?.querySelector("[data-photo-preview-caption]");

    if (!preview || !image || !empty || !caption) {
      return;
    }

    if (preview.dataset.objectUrl) {
      URL.revokeObjectURL(preview.dataset.objectUrl);
      delete preview.dataset.objectUrl;
    }

    image.hidden = true;
    image.removeAttribute("src");
    empty.hidden = false;
    caption.textContent = "Mostra a fotografia atual ou a nova imagem antes de guardar.";
  }

  function updateMemberPhotoPreview(form, options = {}) {
    const preview = form?.querySelector("[data-photo-preview]");
    const image = form?.querySelector("[data-photo-preview-image]");
    const empty = form?.querySelector("[data-photo-preview-empty]");
    const caption = form?.querySelector("[data-photo-preview-caption]");

    if (!preview || !image || !empty || !caption) {
      return;
    }

    clearMemberPhotoPreview(form);

    const file = options.file || null;
    const url = options.url || "";
    if (!file && !url) {
      return;
    }

    const source = file ? URL.createObjectURL(file) : url;
    if (file) {
      preview.dataset.objectUrl = source;
    }

    image.src = source;
    image.hidden = false;
    empty.hidden = true;
    caption.textContent = file
      ? "Nova fotografia selecionada. Guarda o perfil para substituir a imagem atual."
      : "Fotografia atualmente associada ao perfil.";
  }

  function syncMemberPhotoPreview(form) {
    const file = form?.elements.photo?.files?.[0] || null;
    const photoUrl = form?.elements.photo_url?.value?.trim() || "";
    updateMemberPhotoPreview(form, file ? { file } : { url: photoUrl });
  }

  function openTeamForm(member) {
    const form = $(selectors.teamForm);
    const isNew = !member;

    if (isNew) {
      setGlobalStatus("Os perfis são criados automaticamente quando a conta é criada no Supabase Auth.");
      return;
    }

    form.hidden = false;
    $(selectors.teamFormTitle).textContent = "Editar membro";
    setStatus($(selectors.teamStatus), "");
    populateMemberForm(form, member, { allowAdminFields: true });

    setGlobalStatus("");
  }

  function closeTeamForm() {
    clearMemberPhotoPreview($(selectors.teamForm));
    $(selectors.teamForm).hidden = true;
  }

  async function saveMemberForm({ form, statusElement, memberId, allowAdminFields, successMessage }) {
    const existing = state.team.find((member) => member.id === memberId);

    if (!existing) {
      setStatus(statusElement, "Este perfil ainda não existe. Cria a conta no Supabase Auth para gerar o perfil.", "error");
      return null;
    }

    if (!allowAdminFields && !isOwnMember(existing)) {
      setStatus(statusElement, "Não podes editar este perfil.", "error");
      return null;
    }

    const payload = {
      name: form.elements.name.value.trim(),
      role: form.elements.role.value.trim(),
      description: form.elements.description.value.trim() || null,
      photo_url: form.elements.photo_url.value.trim() || null,
      linkedin_url: form.elements.linkedin_url.value.trim() || null,
      email: form.elements.email.value.trim() || null,
      joined_month: safeNumber(form.elements.joined_month.value),
      joined_year: safeNumber(form.elements.joined_year.value)
    };

    if (allowAdminFields && form.elements.is_active) {
      payload.user_id = existing.user_id || null;
      payload.is_active = form.elements.is_active.checked;
    }

    try {
      setStatus(statusElement, "A guardar perfil...");
      const photoFile = form.elements.photo.files?.[0];
      if (photoFile) {
        const photoFolder = allowAdminFields ? `members/${existing.id}` : `members/${state.user.id}`;
        payload.photo_url = await uploadFile(photoFile, bucket("teamPhotos"), photoFolder);
      }

      const { error } = await state.client.from(table("teamMembers")).update(payload).eq("id", existing.id);
      if (error) {
        throw error;
      }

      await loadTeam();
      await recordAudit(allowAdminFields ? "Perfil de equipa atualizado" : "Perfil próprio atualizado", "team_member", payload.name || existing.name);
      renderAll();
      const refreshed = state.team.find((member) => member.id === existing.id) || null;
      setStatus(statusElement, successMessage || "Perfil guardado.", "success");
      return refreshed;
    } catch (error) {
      setStatus(statusElement, getErrorMessage(error), "error");
      return null;
    }
  }

  async function saveProfileForm(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const status = $(selectors.profileStatus);
    const member = getOwnTeamMember();
    const refreshed = await saveMemberForm({
      form,
      statusElement: status,
      memberId: member?.id,
      allowAdminFields: false,
      successMessage: "Perfil Rise Up guardado."
    });

    if (refreshed) {
      populateMemberForm(form, refreshed);
    }
  }

  async function saveTeamMember(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const status = $(selectors.teamStatus);
    const refreshed = await saveMemberForm({
      form,
      statusElement: status,
      memberId: form.elements.id.value,
      allowAdminFields: true,
      successMessage: "Perfil guardado."
    });

    if (refreshed) {
      openTeamForm(refreshed);
    }
  }

  async function deleteTeamMember() {
    requireAdmin();
    const form = $(selectors.teamForm);
    const id = form.elements.id.value;
    const status = $(selectors.teamStatus);
    if (!id || !window.confirm("Apagar este membro? Esta ação remove também as associações a projetos.")) {
      return;
    }

    try {
      setStatus(status, "A apagar membro...");
      const { error } = await state.client.from(table("teamMembers")).delete().eq("id", id);
      if (error) {
        throw error;
      }

      await loadTeam();
      await loadProjects();
      await recordAudit("Perfil de equipa apagado", "team_member", form.elements.name.value || id);
      renderAll();
      closeTeamForm();
      setGlobalStatus("Membro apagado.", "success");
    } catch (error) {
      setStatus(status, getErrorMessage(error), "error");
    }
  }

  function updateProjectMemberSearchUI() {
    const toggle = $(selectors.projectMemberSearchToggle);
    const wrap = $(selectors.projectMemberSearchWrap);
    const input = $(selectors.projectMemberSearchInput);
    const isOpen = Boolean(state.projectMemberSearchOpen);

    if (toggle) {
      toggle.textContent = isOpen ? "Fechar pesquisa" : "Pesquisar pessoas";
    }

    if (wrap) {
      wrap.hidden = !isOpen;
    }

    if (input && input.value !== state.projectMemberSearch) {
      input.value = state.projectMemberSearch;
    }
  }

  function resetProjectMemberPicker(projectId) {
    state.projectMemberSelection = new Set(projectId ? projectLinks(projectId).map((link) => link.team_member_id) : []);
    state.projectMemberSearch = "";
    state.projectMemberSearchOpen = false;
    updateProjectMemberSearchUI();
  }

  function setProjectMemberSelection(memberId, checked) {
    if (!memberId) {
      return;
    }

    if (checked) {
      state.projectMemberSelection.add(memberId);
      return;
    }

    state.projectMemberSelection.delete(memberId);
  }

  function renderProjectMemberOptions() {
    const wrap = $(selectors.projectMemberOptions);
    if (!wrap) {
      return;
    }

    updateProjectMemberSearchUI();
    wrap.replaceChildren();
    if (!state.team.length) {
      wrap.appendChild(createElement("p", "bo-empty", "Os perfis aparecem aqui depois de criares contas no Supabase Auth."));
      return;
    }

    const selected = state.projectMemberSelection instanceof Set ? state.projectMemberSelection : new Set();
    const query = normalizeSearchValue(state.projectMemberSearch);
    const visibleMembers = state.team.filter((member) => {
      const searchable = normalizeSearchValue([member.name, member.email].filter(Boolean).join(" "));
      return !query || searchable.includes(query) || selected.has(member.id);
    });

    if (!visibleMembers.length) {
      wrap.appendChild(createElement("p", "bo-empty", `Nenhuma pessoa encontrada para "${state.projectMemberSearch}".`));
      return;
    }

    visibleMembers.forEach((member) => {
      const label = createElement("label");
      const input = createElement("input");
      input.type = "checkbox";
      input.name = "project_members";
      input.value = member.id;
      input.checked = selected.has(member.id);
      input.addEventListener("change", () => {
        setProjectMemberSelection(member.id, input.checked);
      });
      label.append(input, document.createTextNode(member.name || member.email || "Sem nome"));
      wrap.appendChild(label);
    });
  }

  function getProjectImageUrls(project) {
    const urls = [];
    if (project?.image_url) {
      urls.push(project.image_url);
    }

    if (Array.isArray(project?.image_urls)) {
      urls.push(...project.image_urls);
    }

    return [...new Set(urls.filter(Boolean))];
  }

  function normalizeImageUrls(project, imageUrls) {
    const preferred = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    return [...new Set([
      ...preferred.filter(Boolean),
      ...getProjectImageUrls(project)
    ])];
  }

  function syncProjectCoverField() {
    const form = $(selectors.projectForm);
    if (form?.elements.image_url) {
      form.elements.image_url.value = state.projectImageItems[0]?.url || "";
    }
  }

  function clearProjectImageState() {
    state.projectPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    state.projectPreviewUrls = [];
    state.projectImageItems = [];
    state.dragProjectImageId = "";
    syncProjectCoverField();
  }

  function resetProjectImageItems(project) {
    clearProjectImageState();
    state.projectImageItems = getProjectImageUrls(project).map((url, index) => ({
      id: `existing-${index}-${randomId()}`,
      type: "existing",
      url
    }));
    syncProjectCoverField();
  }

  function appendProjectImageFiles(files) {
    Array.from(files || []).forEach((file) => {
      const url = URL.createObjectURL(file);
      state.projectPreviewUrls.push(url);
      state.projectImageItems.push({
        id: `new-${randomId()}`,
        type: "new",
        url,
        file
      });
    });

    syncProjectCoverField();
    renderProjectImagePreview();
  }

  function removeProjectImageItem(id) {
    const item = state.projectImageItems.find((imageItem) => imageItem.id === id);
    if (!item) {
      return;
    }

    if (item.type === "new") {
      URL.revokeObjectURL(item.url);
      state.projectPreviewUrls = state.projectPreviewUrls.filter((url) => url !== item.url);
    }

    state.projectImageItems = state.projectImageItems.filter((imageItem) => imageItem.id !== id);
    syncProjectCoverField();
    renderProjectImagePreview();
  }

  function moveProjectImageItem(id, direction) {
    const currentIndex = state.projectImageItems.findIndex((item) => item.id === id);
    const targetIndex = currentIndex + direction;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= state.projectImageItems.length) {
      return;
    }

    const [item] = state.projectImageItems.splice(currentIndex, 1);
    state.projectImageItems.splice(targetIndex, 0, item);
    syncProjectCoverField();
    renderProjectImagePreview();
  }

  function moveProjectImageBefore(sourceId, targetId) {
    if (!sourceId || sourceId === targetId) {
      return;
    }

    const sourceIndex = state.projectImageItems.findIndex((item) => item.id === sourceId);
    if (sourceIndex < 0) {
      return;
    }

    const [item] = state.projectImageItems.splice(sourceIndex, 1);
    const targetIndex = state.projectImageItems.findIndex((candidate) => candidate.id === targetId);
    state.projectImageItems.splice(targetIndex < 0 ? state.projectImageItems.length : targetIndex, 0, item);
    syncProjectCoverField();
    renderProjectImagePreview();
  }

  function createTrashIcon() {
    const wrap = document.createElement("span");
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = [
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '<path d="M3 6h18"></path>',
      '<path d="M8 6V4h8v2"></path>',
      '<path d="M19 6l-1 14H6L5 6"></path>',
      '<path d="M10 11v5"></path>',
      '<path d="M14 11v5"></path>',
      '</svg>'
    ].join("");
    return wrap;
  }

  function renderProjectImagePreview() {
    const preview = $(selectors.projectImagePreview);
    if (!preview) {
      return;
    }

    preview.replaceChildren();

    const grid = createElement("div", "bo-image-preview-grid");
    state.projectImageItems.forEach((item, index) => {
      const figure = createElement("figure", "bo-image-thumb bo-image-sortable");
      figure.draggable = true;
      figure.dataset.imageId = item.id;

      figure.addEventListener("dragstart", (event) => {
        state.dragProjectImageId = item.id;
        figure.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.id);
      });
      figure.addEventListener("dragover", (event) => {
        event.preventDefault();
        figure.classList.add("is-drop-target");
      });
      figure.addEventListener("dragleave", () => {
        figure.classList.remove("is-drop-target");
      });
      figure.addEventListener("drop", (event) => {
        event.preventDefault();
        figure.classList.remove("is-drop-target");
        moveProjectImageBefore(event.dataTransfer.getData("text/plain") || state.dragProjectImageId, item.id);
      });
      figure.addEventListener("dragend", () => {
        state.dragProjectImageId = "";
        figure.classList.remove("is-dragging");
      });

      const media = createElement("div", "bo-image-thumb-media");
      const img = createElement("img");
      img.src = item.url;
      img.alt = index === 0 ? "Principal - Foto de capa" : `Imagem ${index + 1}`;
      img.loading = "lazy";

      const remove = createElement("button", "bo-image-remove");
      remove.type = "button";
      remove.setAttribute("aria-label", "Remover imagem");
      remove.appendChild(createTrashIcon());
      remove.addEventListener("click", () => removeProjectImageItem(item.id));

      media.append(img, remove);

      const caption = createElement("figcaption");
      caption.appendChild(createElement("span", null, index === 0 ? "Principal - Foto de capa" : `Imagem ${index + 1}`));

      const order = createElement("span", "bo-image-order");
      const moveLeft = createElement("button", "bo-image-move", "<");
      moveLeft.type = "button";
      moveLeft.disabled = index === 0;
      moveLeft.setAttribute("aria-label", "Mover imagem para a esquerda");
      moveLeft.addEventListener("click", () => moveProjectImageItem(item.id, -1));

      const moveRight = createElement("button", "bo-image-move", ">");
      moveRight.type = "button";
      moveRight.disabled = index === state.projectImageItems.length - 1;
      moveRight.setAttribute("aria-label", "Mover imagem para a direita");
      moveRight.addEventListener("click", () => moveProjectImageItem(item.id, 1));

      order.append(moveLeft, moveRight);
      caption.appendChild(order);
      figure.append(media, caption);
      grid.appendChild(figure);
    });

    const add = createElement("button", "bo-image-add");
    add.type = "button";
    add.setAttribute("aria-label", "Adicionar fotos");
    add.innerHTML = '<span aria-hidden="true">+</span><small>Adicionar fotos</small>';
    add.addEventListener("click", () => {
      $(selectors.projectForm)?.elements.image?.click();
    });
    add.addEventListener("dragover", (event) => {
      event.preventDefault();
      add.classList.add("is-drop-target");
    });
    add.addEventListener("dragleave", () => {
      add.classList.remove("is-drop-target");
    });
    add.addEventListener("drop", (event) => {
      event.preventDefault();
      add.classList.remove("is-drop-target");
      moveProjectImageBefore(event.dataTransfer.getData("text/plain") || state.dragProjectImageId, "");
    });
    grid.appendChild(add);

    preview.appendChild(grid);

    if (!state.projectImageItems.length) {
      preview.appendChild(createElement("p", "bo-image-preview-empty", "Ainda não existem imagens. Usa o quadrado + para adicionar fotos."));
    }
  }

  function openProjectForm(project) {
    requireProjectAccess();
    const form = $(selectors.projectForm);
    const isNew = !project;
    const maxPosition = state.projects.length + (isNew ? 1 : 0);

    form.reset();
    form.hidden = false;
    $(selectors.projectFormTitle).textContent = isNew ? "Criar projeto" : "Editar projeto";
    setStatus($(selectors.projectStatus), "");

    setField(form, "id", project?.id || "");
    setField(form, "title", project?.title || "");
    setField(form, "category", project?.category || "");
    setField(form, "project_date", project?.project_date || "");
    setField(form, "status", project?.status || "draft");
    setField(form, "description", project?.description || "");
    setField(form, "external_link", project?.external_link || "");
    setField(form, "tags", Array.isArray(project?.tags) ? project.tags.join(", ") : "");
    form.elements.sort_order.min = "1";
    form.elements.sort_order.max = String(Math.max(maxPosition, 1));
    setField(form, "sort_order", project ? getProjectPosition(project.id) ?? 1 : 1);
    resetProjectImageItems(project);
    resetProjectMemberPicker(project?.id);
    renderProjectMemberOptions();
    renderProjectImagePreview();
    $("[data-preview-project]").hidden = isNew;
    $("[data-archive-project]").hidden = isNew || project?.status === "archived";
    $("[data-delete-project]").hidden = isNew || !canDeleteProjects();
  }

  function closeProjectForm() {
    clearProjectImageState();
    resetProjectMemberPicker("");
    renderProjectMemberOptions();
    $(selectors.projectForm).hidden = true;
  }

  async function saveProject(event) {
    event.preventDefault();
    requireProjectAccess();

    const form = event.currentTarget;
    const status = $(selectors.projectStatus);
    const id = form.elements.id.value || randomId();
    const existing = state.projects.find((project) => project.id === id);
    const titleField = form.querySelector('[name="title"]');
    const title = titleField?.value.trim() || existing?.title?.trim() || "";

    if (!title) {
      setStatus(status, "Preenche o tÃ­tulo do projeto antes de guardar.", "error");
      titleField?.focus();
      return;
    }

    const sortEntries = buildProjectSortEntries(id, form.elements.sort_order.value);
    const normalizedSortOrder = sortEntries.find((project) => project.id === id)?.sort_order || 1;
    const nextStatus = ["draft", "in_review", "published", "archived"].includes(form.elements.status.value)
      ? form.elements.status.value
      : "draft";

    const payload = {
      title,
      description: form.elements.description.value.trim() || null,
      project_date: form.elements.project_date.value || null,
      category: form.elements.category.value.trim() || null,
      tags: splitTags(form.elements.tags.value),
      external_link: form.elements.external_link.value.trim() || null,
      status: nextStatus,
      sort_order: normalizedSortOrder,
      details: existing?.details || {},
      slug: existing?.slug || slugify(title)
    };

    try {
      setStatus(status, "A guardar projeto...");
      const orderedImageUrls = [];
      for (const item of state.projectImageItems) {
        if (item.type === "new" && item.file) {
          orderedImageUrls.push(await uploadFile(item.file, bucket("projectImages"), `projects/${id}`));
        } else if (item.url) {
          orderedImageUrls.push(item.url);
        }
      }

      payload.image_urls = [...new Set(orderedImageUrls.filter(Boolean))];
      payload.image_url = payload.image_urls[0] || null;

      if (existing) {
        const { error } = await state.client.from(table("projects")).update(payload).eq("id", id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await state.client.from(table("projects")).insert({ id, ...payload });
        if (error) {
          throw error;
        }
      }

      await persistProjectSortEntries(sortEntries);

      const selectedMembers = Array.from(state.projectMemberSelection);
      const { error: deleteError } = await state.client.from(table("projectMembers")).delete().eq("project_id", id);
      if (deleteError) {
        throw deleteError;
      }

      if (selectedMembers.length) {
        const rows = selectedMembers.map((teamMemberId) => ({
          project_id: id,
          team_member_id: teamMemberId
        }));
        const { error: insertError } = await state.client.from(table("projectMembers")).insert(rows);
        if (insertError) {
          throw insertError;
        }
      }

      await loadProjects();
      await recordAudit(existing ? "Projeto atualizado" : "Projeto criado", "project", title);
      renderAll();
      openProjectForm(state.projects.find((project) => project.id === id));
      setStatus(status, "Projeto guardado.", "success");
    } catch (error) {
      setStatus(status, getErrorMessage(error), "error");
    }
  }

  async function deleteProject() {
    requireProjectAccess();
    if (!canDeleteProjects()) {
      setStatus($(selectors.projectStatus), "Só administradores podem apagar definitivamente projetos.", "error");
      return;
    }
    const form = $(selectors.projectForm);
    const id = form.elements.id.value;
    const status = $(selectors.projectStatus);
    const project = state.projects.find((entry) => entry.id === id);
    if (project?.status === "published") {
      setStatus(status, "Arquiva o projeto antes de apagar definitivamente.", "error");
      return;
    }
    if (!id || !window.confirm("Apagar este projeto? Esta ação remove também as associações a membros.")) {
      return;
    }

    try {
      setStatus(status, "A apagar projeto...");
      const { error } = await state.client.from(table("projects")).delete().eq("id", id);
      if (error) {
        throw error;
      }

      await persistProjectSortEntries(
        normalizeProjectSortEntries(state.projects.filter((project) => project.id !== id))
      );
      await loadProjects();
      await recordAudit("Projeto apagado definitivamente", "project", project?.title || id);
      renderAll();
      closeProjectForm();
      setGlobalStatus("Projeto apagado.", "success");
    } catch (error) {
      setStatus(status, getErrorMessage(error), "error");
    }
  }

  async function archiveProject() {
    requireProjectAccess();
    const form = $(selectors.projectForm);
    const id = form.elements.id.value;
    const status = $(selectors.projectStatus);
    const project = state.projects.find((entry) => entry.id === id);

    if (!id || !project || !window.confirm("Arquivar este projeto? Ele deixa de aparecer no site público, mas fica guardado no backoffice.")) {
      return;
    }

    try {
      setStatus(status, "A arquivar projeto...");
      const { error } = await state.client.from(table("projects")).update({ status: "archived" }).eq("id", id);
      if (error) {
        throw error;
      }

      await loadProjects();
      await recordAudit("Projeto arquivado", "project", project.title);
      renderAll();
      openProjectForm(state.projects.find((entry) => entry.id === id));
      setStatus(status, "Projeto arquivado.", "success");
    } catch (error) {
      setStatus(status, getErrorMessage(error), "error");
    }
  }

  function previewProject() {
    const form = $(selectors.projectForm);
    const id = form?.elements.id.value;
    const project = state.projects.find((entry) => entry.id === id);
    const slug = project?.slug || slugify(form?.elements.title.value || "");

    if (!id || !slug) {
      setStatus($(selectors.projectStatus), "Guarda o projeto antes de pré-visualizar.", "error");
      return;
    }

    window.open(`projetos.html#${encodeURIComponent(slug)}`, "_blank", "noopener");
  }

  function updateInterviewAverage() {
    const form = $(selectors.hrForm);
    const badge = $(selectors.hrAverage);
    if (!form || !badge) {
      return;
    }

    const scores = Object.fromEntries(
      evaluationCriteria.map((criterion) => [
        criterion.key,
        safeNumber(form.elements[`score_${criterion.key}`]?.value)
      ])
    );

    badge.textContent = formatAverageLabel(averageEvaluationScore(scores));
  }

  function populateInterviewEvaluationForm(form, record) {
    form.reset();
    setField(form, "id", record?.id || "");
    setField(form, "candidate_name", record?.candidate_name || "");
    setField(form, "interview_date", record?.interview_date || "");
    setField(form, "course_year", record?.course_year || "");
    setField(form, "potential_area", record?.potential_area || "");
    setField(form, "interviewers", record?.interviewers || "");
    setField(form, "final_decision", record?.final_decision || "");
    setField(form, "strongest_point", record?.strongest_point || "");
    setField(form, "main_risk", record?.main_risk || "");
    setField(form, "doubts_to_validate", record?.doubts_to_validate || "");
    setField(form, "evaluator_comment", record?.evaluator_comment || "");

    evaluationCriteria.forEach((criterion) => {
      setField(form, `score_${criterion.key}`, record?.scores?.[criterion.key] || "");
    });

    finalReadingCriteria.forEach((criterion) => {
      setField(form, `reading_${criterion.key}`, record?.final_reading?.[criterion.key] || "");
    });

    updateInterviewAverage();
  }

  function openInterviewEvaluationForm(record) {
    requireHrAccess();

    if (state.hrSetupMissing) {
      setGlobalStatus("Executa o ficheiro supabase-setup.sql para ativar a área de Recursos Humanos.", "error");
      return;
    }

    const form = $(selectors.hrForm);
    if (!form) {
      return;
    }

    form.hidden = false;
    $(selectors.hrFormTitle).textContent = record ? "Editar avaliação" : "Nova avaliação";
    form.closest(".bo-hr-workspace")?.classList.add("is-editing");
    setStatus($(selectors.hrFormStatus), "");
    populateInterviewEvaluationForm(form, record || null);
    $("[data-delete-evaluation]").hidden = !record;
    showHrView("evaluation");
    setGlobalStatus("");
  }

  function closeInterviewEvaluationForm() {
    const form = $(selectors.hrForm);
    if (!form) {
      return;
    }

    form.hidden = true;
    form.closest(".bo-hr-workspace")?.classList.remove("is-editing");
    setStatus($(selectors.hrFormStatus), "");
    const deleteButton = $("[data-delete-evaluation]");
    if (deleteButton) {
      deleteButton.hidden = true;
    }
  }

  async function saveInterviewEvaluation(event) {
    event.preventDefault();
    requireHrAccess();

    if (state.hrSetupMissing) {
      setStatus($(selectors.hrFormStatus), "Falta executar o SQL de setup para esta área.", "error");
      return;
    }

    const form = event.currentTarget;
    const status = $(selectors.hrFormStatus);
    const id = form.elements.id.value || randomId();
    const existing = state.interviewEvaluations.find((record) => record.id === id);

    const scores = Object.fromEntries(
      evaluationCriteria.map((criterion) => [
        criterion.key,
        safeNumber(form.elements[`score_${criterion.key}`]?.value)
      ])
    );

    const finalReading = Object.fromEntries(
      finalReadingCriteria.map((criterion) => [
        criterion.key,
        form.elements[`reading_${criterion.key}`]?.value || null
      ])
    );

    const payload = {
      candidate_name: form.elements.candidate_name.value.trim(),
      interview_date: form.elements.interview_date.value || null,
      course_year: form.elements.course_year.value.trim() || null,
      potential_area: form.elements.potential_area.value.trim() || null,
      interviewers: form.elements.interviewers.value.trim() || null,
      final_decision: form.elements.final_decision.value || null,
      scores,
      final_reading: finalReading,
      strongest_point: form.elements.strongest_point.value.trim() || null,
      main_risk: form.elements.main_risk.value.trim() || null,
      doubts_to_validate: form.elements.doubts_to_validate.value.trim() || null,
      evaluator_comment: form.elements.evaluator_comment.value.trim() || null,
      created_by: existing?.created_by || state.user?.id || null
    };

    try {
      setStatus(status, "A guardar avaliação...");

      if (existing) {
        const { error } = await state.client
          .from(table("interviewEvaluations"))
          .update(payload)
          .eq("id", id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await state.client
          .from(table("interviewEvaluations"))
          .insert({ id, ...payload });
        if (error) {
          throw error;
        }
      }

      await loadInterviewEvaluations();
      await recordAudit(existing ? "Avaliação de RH atualizada" : "Avaliação de RH criada", "interview_evaluation", payload.candidate_name);
      renderAll();
      openInterviewEvaluationForm(state.interviewEvaluations.find((record) => record.id === id) || null);
      setStatus(status, "Avaliação guardada.", "success");
    } catch (error) {
      setStatus(status, getErrorMessage(error), "error");
    }
  }

  async function deleteInterviewEvaluation() {
    requireHrAccess();

    const form = $(selectors.hrForm);
    const id = form?.elements.id.value;
    const status = $(selectors.hrFormStatus);

    if (!id || !window.confirm("Apagar esta avaliação? Esta ação remove o registo do Supabase.")) {
      return;
    }

    try {
      setStatus(status, "A apagar avaliação...");
      const { error } = await state.client.from(table("interviewEvaluations")).delete().eq("id", id);
      if (error) {
        throw error;
      }

      await loadInterviewEvaluations();
      await recordAudit("Avaliação de RH apagada", "interview_evaluation", form.elements.candidate_name.value || id);
      renderAll();
      closeInterviewEvaluationForm();
      setGlobalStatus("Avaliação apagada.", "success");
    } catch (error) {
      setStatus(status, getErrorMessage(error), "error");
    }
  }

  function showHrView(view) {
    state.activeHrView = view === "evaluation" ? "evaluation" : "guide";

    $all("[data-hr-view]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.hrView === state.activeHrView);
    });

    $all("[data-hr-view-button]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.hrViewButton === state.activeHrView);
    });
  }

  function showSection(view) {
    if (!canAccessView(view)) {
      view = getDefaultView();
    }

    state.activeView = view;
    $all("[data-section]").forEach((section) => {
      section.classList.toggle("is-active", section.dataset.section === view);
    });

    $all("[data-view-button]").forEach((button) => {
      const isActive = button.dataset.viewButton === view;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    const titles = {
      dashboard: "Painel",
      profile: "Perfil",
      team: "Equipa",
      projects: "Projetos",
      hr: "Recursos Humanos"
    };
    $(selectors.pageTitle).textContent = titles[view] || "BackOffice";
  }

  function bindEvents() {
    $(selectors.loginForm).addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const status = $(selectors.loginStatus);

      try {
        setStatus(status, "A entrar...");
        const { data, error } = await state.client.auth.signInWithPassword({
          email: form.elements.email.value.trim(),
          password: form.elements.password.value
        });

        if (error) {
          throw error;
        }

        state.session = data.session;
        state.user = data.user;
        await loadData();
        showSection(getDefaultView());
        setStatus(status, "");
      } catch (error) {
        setStatus(status, getErrorMessage(error), "error");
      }
    });

    $("[data-logout]").addEventListener("click", async () => {
      await state.client.auth.signOut();
      state.session = null;
      state.user = null;
      state.profile = null;
      state.userProfiles = [];
      state.team = [];
      state.projects = [];
      state.projectMembers = [];
      state.interviewEvaluations = [];
      state.projectMemberSelection = new Set();
      state.projectMemberSearch = "";
      state.projectMemberSearchOpen = false;
      state.projectSearch = "";
      state.projectStatusFilter = "all";
      state.teamSearch = "";
      state.teamStatusFilter = "all";
      state.hrSearch = "";
      state.hrDecisionFilter = "all";
      state.hrSetupMissing = false;
      state.activeHrView = "guide";
      showAuthView();
    });

    $all("[data-view-button]").forEach((button) => {
      button.addEventListener("click", () => showSection(button.dataset.viewButton));
    });

    const newTeamMemberButton = $("[data-new-team-member]");
    if (newTeamMemberButton) {
      newTeamMemberButton.addEventListener("click", () => openTeamForm(null));
    }
    $(selectors.profileForm).addEventListener("submit", saveProfileForm);
    $(selectors.profileForm).elements.photo.addEventListener("change", (event) => {
      syncMemberPhotoPreview(event.currentTarget.form);
    });
    $("[data-close-team-form]").addEventListener("click", closeTeamForm);
    $(selectors.teamForm).addEventListener("submit", saveTeamMember);
    $(selectors.teamForm).elements.photo.addEventListener("change", (event) => {
      syncMemberPhotoPreview(event.currentTarget.form);
    });
    const deleteTeamMemberButton = $("[data-delete-team-member]");
    if (deleteTeamMemberButton) {
      deleteTeamMemberButton.addEventListener("click", deleteTeamMember);
    }
    $(selectors.teamSearch)?.addEventListener("input", (event) => {
      state.teamSearch = event.currentTarget.value;
      renderTeamList();
    });
    $(selectors.teamStatusFilter)?.addEventListener("change", (event) => {
      state.teamStatusFilter = event.currentTarget.value;
      renderTeamList();
    });

    $("[data-new-project]").addEventListener("click", () => openProjectForm(null));
    $("[data-close-project-form]").addEventListener("click", closeProjectForm);
    $(selectors.projectForm).addEventListener("submit", saveProject);
    $(selectors.projectForm).elements.image.addEventListener("change", (event) => {
      appendProjectImageFiles(event.currentTarget.files);
      event.currentTarget.value = "";
    });
    $("[data-preview-project]").addEventListener("click", previewProject);
    $("[data-archive-project]").addEventListener("click", archiveProject);
    $("[data-delete-project]").addEventListener("click", deleteProject);
    $(selectors.projectSearch)?.addEventListener("input", (event) => {
      state.projectSearch = event.currentTarget.value;
      renderProjectList();
    });
    $(selectors.projectStatusFilter)?.addEventListener("change", (event) => {
      state.projectStatusFilter = event.currentTarget.value;
      renderProjectList();
    });
    $(selectors.projectMemberSearchToggle).addEventListener("click", () => {
      state.projectMemberSearchOpen = !state.projectMemberSearchOpen;
      if (!state.projectMemberSearchOpen) {
        state.projectMemberSearch = "";
      }
      updateProjectMemberSearchUI();
      renderProjectMemberOptions();
      if (state.projectMemberSearchOpen) {
        $(selectors.projectMemberSearchInput)?.focus();
      }
    });
    $(selectors.projectMemberSearchInput).addEventListener("input", (event) => {
      state.projectMemberSearch = event.currentTarget.value;
      renderProjectMemberOptions();
    });
    $(selectors.projectMemberSearchClear).addEventListener("click", () => {
      state.projectMemberSearch = "";
      updateProjectMemberSearchUI();
      renderProjectMemberOptions();
      $(selectors.projectMemberSearchInput)?.focus();
    });

    $all("[data-hr-view-button]").forEach((button) => {
      button.addEventListener("click", () => showHrView(button.dataset.hrViewButton));
    });
    $("[data-new-evaluation]").addEventListener("click", () => openInterviewEvaluationForm(null));
    $("[data-close-hr-form]").addEventListener("click", closeInterviewEvaluationForm);
    $(selectors.hrForm).addEventListener("submit", saveInterviewEvaluation);
    $(selectors.hrForm).addEventListener("change", (event) => {
      if (event.target?.name?.startsWith("score_")) {
        updateInterviewAverage();
      }
    });
    $("[data-delete-evaluation]").addEventListener("click", deleteInterviewEvaluation);
    $(selectors.hrSearch)?.addEventListener("input", (event) => {
      state.hrSearch = event.currentTarget.value;
      renderInterviewEvaluationList();
    });
    $(selectors.hrDecisionFilter)?.addEventListener("change", (event) => {
      state.hrDecisionFilter = event.currentTarget.value;
      renderInterviewEvaluationList();
    });
  }

  async function init() {
    const config = getConfig();
    const loginStatus = $(selectors.loginStatus);

    if (!isConfigured(config)) {
      setStatus(loginStatus, "Configura o Supabase em supabase-config.js.", "error");
      return;
    }

    if (!window.supabase?.createClient) {
      setStatus(loginStatus, "Não foi possível carregar a biblioteca do Supabase.", "error");
      return;
    }

    state.client = window.supabase.createClient(config.url, config.publicKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    bindEvents();

    const { data, error } = await state.client.auth.getSession();
    if (error) {
      setStatus(loginStatus, getErrorMessage(error), "error");
      return;
    }

    if (!data.session) {
      showAuthView();
      return;
    }

    state.session = data.session;
    state.user = data.session.user;

    try {
      await loadData();
      showSection(getDefaultView());
    } catch (loadError) {
      showAuthView();
      setStatus(loginStatus, `${getErrorMessage(loadError)}. Confirma que executaste o SQL de setup.`, "error");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
