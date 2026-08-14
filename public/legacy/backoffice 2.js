(function () {
  const defaultTables = {
    userProfiles: "user_profiles",
    teamMembers: "team_members",
    projects: "projects",
    projectMembers: "project_members",
    interviewEvaluations: "interview_evaluations",
    joinApplications: "join_applications",
    contactSubmissions: "contact_submissions",
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
    presenceChannel: null,
    onlineUserIds: new Set(),
    onlineEmails: new Set(),
    userProfiles: [],
    team: [],
    projects: [],
    projectMembers: [],
    interviewEvaluations: [],
    joinApplications: [],
    contactSubmissions: [],
    auditLogs: [],
    projectImageItems: [],
    projectMemberSelection: new Set(),
    projectResponsibleSelection: new Set(),
    projectMemberSearch: "",
    projectMemberSearchOpen: false,
    projectSearch: "",
    projectStatusFilter: "all",
    teamSearch: "",
    teamStatusFilter: "all",
    hrSearch: "",
    hrDecisionFilter: "all",
    applicationSearch: "",
    applicationStatusFilter: "all",
    contactSearch: "",
    contactStatusFilter: "all",
    applicationAccessMissing: false,
    contactAccessMissing: false,
    projectPreviewUrls: [],
    dragProjectImageId: "",
    viewAsRole: "",
    activeView: "dashboard",
    activeHrView: "guide",
    hrSetupMissing: false,
    projectFormBaseline: ""
  };

  window.RISEUP_BACKOFFICE = {
    get client() { return state.client; },
    get state() { return state; },
    showSection: (view) => showSection(view),
    openProject: (projectId) => {
      const project = state.projects.find((entry) => entry.id === projectId);
      if (project && canManageProjects() && confirmProjectNavigation()) openProjectForm(project);
    },
    renderAll: () => renderAll()
  };

  const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  const maxImageUploadBytes = 8 * 1024 * 1024;
  const minPasswordLength = 10;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
      summary: "Acesso total a todas as áreas, definições e gestão de permissões."
    },
    communication_team: {
      label: "Comunicação",
      summary: "Acesso ao Dashboard, To-Do, Comunicação, Contactos e Perfil."
    },
    projects_innovation_team: {
      label: "Projetos e Inovação",
      summary: "Acesso ao Dashboard, To-Do, Projetos e Perfil."
    },
    hr_team: {
      label: "Recursos Humanos",
      summary: "Acesso ao Dashboard, To-Do, Equipa, Recursos Humanos e Perfil."
    },
    team_leader_communication: {
      label: "Team Líder — Comunicação",
      summary: "Lidera Comunicação, acompanha tarefas, contactos, projetos e documentos."
    },
    team_leader_projects_innovation: {
      label: "Team Líder — Projetos e Inovação",
      summary: "Lidera Projetos e Inovação, gere projetos, tarefas e documentos."
    },
    team_leader_commercial: {
      label: "Team Líder — Comercial",
      summary: "Acompanha tarefas, projetos, contactos comerciais e documentos."
    },
    team_leader_hr: {
      label: "Team Líder — Recursos Humanos",
      summary: "Lidera a equipa e Recursos Humanos e acompanha tarefas e documentos."
    },
    team_leader: {
      label: "Team Leader",
      summary: "Cargo antigo mantido apenas para compatibilidade.",
      legacy: true
    },
    member: {
      label: "Membro",
      summary: "Cargo antigo mantido para contas ainda sem área atribuída.",
      legacy: true
    }
  };

  const teamLeaderRoles = new Set([
    "team_leader",
    "team_leader_communication",
    "team_leader_projects_innovation",
    "team_leader_commercial",
    "team_leader_hr"
  ]);

  const roleDisplayGroups = [
    { label: "Administração", hint: "Controlo completo", roles: ["admin"] },
    { label: "Team Líderes", hint: "Coordenação por área", roles: ["team_leader_communication", "team_leader_projects_innovation", "team_leader_commercial", "team_leader_hr"] },
    { label: "Equipas", hint: "Acesso operacional", roles: ["communication_team", "projects_innovation_team", "hr_team"] }
  ];

  const accessViewLabels = {
    dashboard: "Dashboard",
    todo: "To-Do",
    projects: "Projetos",
    team: "Equipa",
    hr: "Recursos Humanos",
    communication: "Comunicação",
    documents: "Documentos",
    contacts: "Contactos",
    profile: "Perfil"
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
    passwordForm: "[data-password-form]",
    passwordStatus: "[data-password-form-status]",
    accountDanger: "[data-account-danger]",
    teamList: "[data-team-list]",
    teamForm: "[data-team-form]",
    teamFormTitle: "[data-team-form-title]",
    teamStatus: "[data-team-form-status]",
    projectList: "[data-project-list]",
    projectForm: "[data-project-form]",
    projectFormTitle: "[data-project-form-title]",
    projectStatus: "[data-project-form-status]",
    projectStatusPreview: "[data-project-status-preview]",
    projectImagePreview: "[data-project-image-preview]",
    projectMemberOptions: "[data-project-member-options]",
    projectMemberSearchToggle: "[data-project-member-search-toggle]",
    projectMemberSearchWrap: "[data-project-member-search-wrap]",
    projectMemberSearchInput: "[data-project-member-search]",
    projectMemberSearchClear: "[data-project-member-search-clear]",
    projectResponsibleTeams: "[data-project-responsible-teams]",
    projectMemberSummary: "[data-project-member-summary]",
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
    applicationList: "[data-application-list]",
    applicationSearch: "[data-application-search]",
    applicationStatusFilter: "[data-application-status-filter]",
    contactSubmissionList: "[data-contact-submission-list]",
    contactSubmissionSearch: "[data-contact-submission-search]",
    contactSubmissionStatusFilter: "[data-contact-submission-status-filter]",
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

  function getActualRole() {
    return state.profile?.role || "member";
  }

  function isActualAdmin() {
    return getActualRole() === "admin";
  }

  function getCurrentRole() {
    return isActualAdmin() && state.viewAsRole && backofficeRoles[state.viewAsRole]
      ? state.viewAsRole
      : getActualRole();
  }

  function getRoleMeta(role) {
    return backofficeRoles[role] || backofficeRoles.member;
  }

  function getRoleLabel(role) {
    return getRoleMeta(role).label;
  }

  function canManageProjects(role = getCurrentRole()) {
    return ["admin", "projects_innovation_team", "team_leader_projects_innovation"].includes(role);
  }

  function canManageCommunication(role = getCurrentRole()) {
    return ["admin", "communication_team", "team_leader_communication"].includes(role);
  }

  function canManageContacts(role = getCurrentRole()) {
    return ["admin", "communication_team", "team_leader_communication", "team_leader_commercial"].includes(role);
  }

  function canDeleteProjects() {
    return isAdmin();
  }

  function canManageHr(role = getCurrentRole()) {
    return ["admin", "hr_team", "team_leader_hr"].includes(role);
  }

  function canManageTeam(role = getCurrentRole()) {
    return ["admin", "hr_team", "team_leader_hr"].includes(role);
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

  function canAccessView(view, role = getCurrentRole()) {
    if (view === "settings") {
      return isActualAdmin();
    }

    if (["dashboard", "todo", "profile"].includes(view)) {
      return true;
    }

    if (view === "documents") {
      return role === "admin" || teamLeaderRoles.has(role);
    }

    if (view === "team") {
      return canManageTeam(role);
    }

    if (view === "projects") {
      return canManageProjects(role) || teamLeaderRoles.has(role);
    }

    if (view === "contacts") {
      return canManageContacts(role);
    }

    if (view === "hr") {
      return canManageHr(role);
    }

    if (view === "communication") {
      return canManageCommunication(role);
    }

    return false;
  }

  function getDefaultView() {
    return "dashboard";
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

  function cleanText(value, maxLength = 500) {
    return String(value || "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .trim()
      .slice(0, maxLength);
  }

  function normalizeEmail(value) {
    const email = cleanText(value, 254).toLowerCase();
    if (email && !emailPattern.test(email)) {
      throw new Error("Confirma que o email é válido.");
    }

    return email;
  }

  function safeUrl(value, options = {}) {
    const clean = cleanText(value, options.maxLength || 800);
    if (!clean) {
      return "";
    }

    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(clean);
    if (options.allowRelative && !hasScheme && !clean.startsWith("//")) {
      return clean.slice(0, options.maxLength || 800);
    }

    if (!options.allowRelative && !hasScheme) {
      return "";
    }

    try {
      const url = new URL(clean, window.location.href);
      const allowedProtocols = options.allowedProtocols || ["http:", "https:"];
      if (!allowedProtocols.includes(url.protocol)) {
        return "";
      }

      if (options.linkedinOnly) {
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) {
          return "";
        }
      }

      return url.href.slice(0, options.maxLength || 800);
    } catch (error) {
      return "";
    }
  }

  function safeExternalUrl(value, options = {}) {
    return safeUrl(value, {
      ...options,
      allowedProtocols: options.allowHttp ? ["http:", "https:"] : ["https:"]
    });
  }

  function safeImageUrl(value) {
    return safeUrl(value, {
      allowRelative: true,
      allowedProtocols: ["http:", "https:", "blob:"],
      maxLength: 1000
    });
  }

  function ensureValidUrl(value, options = {}) {
    const original = cleanText(value, options.maxLength || 800);
    const normalized = options.image
      ? safeImageUrl(original)
      : safeExternalUrl(original, options);

    if (original && !normalized) {
      throw new Error(options.message || "Confirma que o link é válido e começa por https://.");
    }

    return normalized || null;
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

  function normalizeStructuredCopy(value, keyName = "") {
    if (typeof value === "string") {
      return normalizeProjectText(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => normalizeStructuredCopy(item, keyName));
    }

    if (value && typeof value === "object") {
      if (keyName === "translations") {
        return value;
      }

      return Object.fromEntries(
        Object.entries(value).map(([key, entryValue]) => [key, normalizeStructuredCopy(entryValue, key)])
      );
    }

    return value;
  }

  function getProjectTranslation(project, lang) {
    const translations = project?.details?.translations;
    if (!translations || typeof translations !== "object") {
      return {};
    }

    const copy = translations[lang];
    return copy && typeof copy === "object" ? copy : {};
  }

  function buildProjectDetails(existingDetails, englishCopy) {
    const details = existingDetails && typeof existingDetails === "object" && !Array.isArray(existingDetails)
      ? { ...existingDetails }
      : {};
    const translations = details.translations && typeof details.translations === "object" && !Array.isArray(details.translations)
      ? { ...details.translations }
      : {};

    const cleanEnglishCopy = Object.fromEntries(
      Object.entries(englishCopy).filter(([, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }

        return Boolean(value);
      })
    );

    if (Object.keys(cleanEnglishCopy).length) {
      translations.en = cleanEnglishCopy;
    } else {
      delete translations.en;
    }

    if (Object.keys(translations).length) {
      details.translations = translations;
    } else {
      delete details.translations;
    }

    return details;
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

  function createAccountClient() {
    const config = getConfig();
    if (!isConfigured(config)) {
      throw new Error("Configura o Supabase em supabase-config.js.");
    }

    if (!window.supabase?.createClient) {
      throw new Error("NÃ£o foi possÃ­vel carregar a biblioteca do Supabase.");
    }

    return window.supabase.createClient(config.url, config.publicKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
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

  function syncProjectStatusPreview(status) {
    const preview = $(selectors.projectStatusPreview);
    if (!preview) {
      return;
    }

    const normalizedStatus = ["draft", "in_review", "published", "archived"].includes(status)
      ? status
      : "draft";
    preview.dataset.status = normalizedStatus;
    preview.textContent = getProjectStatusLabel(normalizedStatus);
  }

  function projectFormSignature(form = $(selectors.projectForm)) {
    if (!form) {
      return "";
    }

    const values = Array.from(form.elements)
      .filter((field) => field.name && field.name !== "image")
      .map((field) => [field.name, field.type === "checkbox" ? field.checked : field.value]);
    return JSON.stringify({
      values,
      images: state.projectImageItems.map((item) => [item.type, item.url, item.file?.name || ""]),
      members: Array.from(state.projectMemberSelection).sort(),
      responsible: Array.from(state.projectResponsibleSelection).sort()
    });
  }

  function hasUnsavedProjectChanges() {
    const form = $(selectors.projectForm);
    return Boolean(form && !form.hidden && state.projectFormBaseline && projectFormSignature(form) !== state.projectFormBaseline);
  }

  function confirmProjectNavigation() {
    return !hasUnsavedProjectChanges() || window.confirm("Tens alterações por guardar neste projeto. Queres sair sem as guardar?");
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

  function formatDateTime(value) {
    if (!value) {
      return "Sem data";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function formatSubmissionStatus(value) {
    const labels = {
      new: "Novo",
      read: "Lido",
      archived: "Arquivado"
    };

    return labels[value] || value || "Sem estado";
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

  function isPermissionDeniedError(error) {
    return Boolean(
      error?.code === "42501"
      || /permission denied/i.test(error?.message || "")
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

  function createUserHeading(name, isOnline) {
    const heading = createElement("h3", "bo-name-line");
    const dot = createElement("span", `bo-online-dot${isOnline ? " is-online" : ""}`);
    dot.setAttribute("aria-hidden", "true");
    heading.appendChild(dot);
    heading.appendChild(createElement("span", null, name || "Sem nome"));
    if (isOnline) {
      heading.title = "Online agora";
    }
    return heading;
  }

  function isProfileOnline(profile) {
    if (!profile) {
      return false;
    }

    return Boolean(
      (profile.id && state.onlineUserIds.has(profile.id))
      || (profile.email && state.onlineEmails.has(profile.email.toLowerCase()))
    );
  }

  function isMemberOnline(member) {
    if (!member) {
      return false;
    }

    return Boolean(
      (member.user_id && state.onlineUserIds.has(member.user_id))
      || (member.email && state.onlineEmails.has(member.email.toLowerCase()))
    );
  }

  function renderPresenceViews() {
    renderCurrentUserSummary();
    renderPermissionManager();
    renderTeamList();
  }

  function showAuthView() {
    stopPresence();
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

    $all("[data-project-manager-only]").forEach((element) => {
      element.hidden = !canManageProjects();
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

    $(selectors.userRole).textContent = state.viewAsRole && isActualAdmin()
      ? `Administrador · A ver como ${getRoleLabel(getCurrentRole())}`
      : getRoleLabel(getCurrentRole());
  }

  function showAppView() {
    $(selectors.authView).hidden = true;
    $(selectors.appView).hidden = false;
    document.body.classList.toggle("is-member", !isAdmin());
    syncViewVisibility();
    renderCurrentUserSummary();
  }

  function syncPresenceState() {
    const presenceState = state.presenceChannel?.presenceState?.() || {};
    const onlineUserIds = new Set();
    const onlineEmails = new Set();

    Object.values(presenceState).flat().forEach((entry) => {
      if (entry?.user_id) {
        onlineUserIds.add(entry.user_id);
      }

      if (entry?.email) {
        onlineEmails.add(String(entry.email).toLowerCase());
      }
    });

    state.onlineUserIds = onlineUserIds;
    state.onlineEmails = onlineEmails;
    renderPresenceViews();
  }

  async function startPresence() {
    if (!state.client || !state.user || state.presenceChannel) {
      return;
    }

    const channel = state.client.channel("riseup-backoffice-presence", {
      config: {
        presence: {
          key: state.user.id
        }
      }
    });

    state.presenceChannel = channel;
    channel.on("presence", { event: "sync" }, syncPresenceState);
    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") {
        return;
      }

      await channel.track({
        user_id: state.user.id,
        email: state.user.email || state.profile?.email || "",
        name: getCurrentUserDisplayName(),
        online_at: new Date().toISOString()
      });
      syncPresenceState();
    });
  }

  async function stopPresence() {
    if (!state.presenceChannel) {
      state.onlineUserIds = new Set();
      state.onlineEmails = new Set();
      return;
    }

    const channel = state.presenceChannel;
    state.presenceChannel = null;
    state.onlineUserIds = new Set();
    state.onlineEmails = new Set();

    try {
      await channel.untrack();
      await state.client?.removeChannel(channel);
    } catch (error) {
      console.warn("BackOffice presence cleanup failed", error);
    }
  }

  function validateImageFile(file) {
    if (!file) {
      return;
    }

    if (!allowedImageMimeTypes.has(file.type)) {
      throw new Error("Usa apenas imagens JPG, PNG, WebP ou GIF.");
    }

    if (file.size > maxImageUploadBytes) {
      throw new Error("A imagem deve ter no máximo 8 MB.");
    }
  }

  async function optimizeImageFile(file, options = {}) {
    validateImageFile(file);

    if (file.type === "image/gif") {
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

    if (!canManageTeam() && !canManageProjects()) {
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

  async function loadJoinApplications() {
    state.applicationAccessMissing = false;

    if (!canManageHr()) {
      state.joinApplications = [];
      return;
    }

    const { data, error } = await state.client
      .from(table("joinApplications"))
      .select("id,name,email,phone_contact,course,study_year,motivation,linkedin,age,source_page,page_url,language,status,submitted_at")
      .order("submitted_at", { ascending: false });

    if (error && (isMissingRelationError(error) || isPermissionDeniedError(error))) {
      state.applicationAccessMissing = true;
      state.joinApplications = [];
      return;
    }

    if (error) {
      throw error;
    }

    state.joinApplications = data || [];
  }

  async function loadContactSubmissions() {
    state.contactAccessMissing = false;

    if (!canManageContacts()) {
      state.contactSubmissions = [];
      return;
    }

    const { data, error } = await state.client
      .from(table("contactSubmissions"))
      .select("id,name,email,message,source_page,page_url,language,status,submitted_at")
      .order("submitted_at", { ascending: false });

    if (error && (isMissingRelationError(error) || isPermissionDeniedError(error))) {
      state.contactAccessMissing = true;
      state.contactSubmissions = [];
      return;
    }

    if (error) {
      throw error;
    }

    state.contactSubmissions = data || [];
  }

  async function loadAuditLogs() {
    state.auditLogs = [];

    if (!isActualAdmin()) {
      return;
    }

    state.auditLogs = getLocalAuditLogs();

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
    await loadJoinApplications();
    await loadContactSubmissions();
    await loadAuditLogs();
    showAppView();
    renderAll();
    await startPresence();
    setGlobalStatus("");
    document.dispatchEvent(new CustomEvent("riseup:backoffice-ready"));
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
    renderApplicationList();
    renderContactSubmissionList();
    renderHrSection();
    renderViewAsSettings();
  }

  function renderViewAsSettings() {
    const options = $("[data-view-as-options]");
    const summary = $("[data-view-as-summary]");
    const badge = $("[data-view-as-badge]");
    const title = $("[data-view-as-title]");
    const access = $("[data-view-as-access]");
    const banner = $("[data-view-as-banner]");
    const bannerRole = $("[data-view-as-banner-role]");
    if (!options || !summary || !badge || !title || !access || !banner || !bannerRole) {
      return;
    }

    const activeRole = getCurrentRole();
    const meta = getRoleMeta(activeRole);
    badge.textContent = state.viewAsRole ? "Simulação ativa" : "Vista real";
    badge.classList.toggle("is-active", Boolean(state.viewAsRole));
    title.textContent = meta.label;
    summary.replaceChildren(createElement("p", null, meta.summary));

    access.replaceChildren();
    Object.entries(accessViewLabels).filter(([view]) => canAccessView(view, activeRole)).forEach(([, label]) => {
      const chip = createElement("span", "bo-role-access-chip", label);
      chip.prepend(createElement("i", null, "✓"));
      access.appendChild(chip);
    });

    options.replaceChildren();
    roleDisplayGroups.forEach((group) => {
      const section = createElement("section", "bo-role-option-group");
      const heading = createElement("div", "bo-role-option-group-head");
      heading.append(createElement("h4", null, group.label), createElement("span", null, group.hint));
      const grid = createElement("div", `bo-role-option-grid${group.roles.length === 1 ? " is-single" : ""}`);
      group.roles.forEach((role) => {
        const roleMeta = getRoleMeta(role);
        const selected = role === activeRole;
        const button = createElement("button", `bo-role-option${selected ? " is-selected" : ""}`);
        button.type = "button";
        button.dataset.viewAsOption = role;
        button.setAttribute("aria-pressed", selected ? "true" : "false");
        const copy = createElement("span", "bo-role-option-copy");
        copy.append(createElement("strong", null, roleMeta.label));
        const check = createElement("span", "bo-role-option-check", selected ? "✓" : "");
        button.append(check, copy);
        button.addEventListener("click", () => applyViewAsRole(role));
        grid.appendChild(button);
      });
      section.append(heading, grid);
      options.appendChild(section);
    });

    banner.hidden = !state.viewAsRole;
    bannerRole.textContent = `A ver como ${meta.label}`;
    $all("[data-reset-view-as]").forEach((button) => {
      button.disabled = !state.viewAsRole;
      if (button.closest(".bo-role-preview-panel")) {
        button.textContent = state.viewAsRole ? "Voltar à vista de Administrador" : "Vista de Administrador ativa";
      }
    });
  }

  function applyViewAsRole(role) {
    if (!isActualAdmin()) {
      return;
    }
    state.viewAsRole = role && role !== "admin" && backofficeRoles[role] && !backofficeRoles[role].legacy ? role : "";
    document.body.classList.toggle("is-member", !isAdmin());
    syncViewVisibility();
    renderAll();
    showSection("settings");
    document.dispatchEvent(new CustomEvent("riseup:view-as-changed", { detail: { role: getCurrentRole() } }));
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
    if (!list || !isActualAdmin()) {
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

  function findProfileForMember(member) {
    if (!member) {
      return null;
    }

    return state.userProfiles.find((profile) => (
      (member.user_id && profile.id === member.user_id)
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

      body.appendChild(createUserHeading(displayName, isProfileOnline(profile)));
      body.appendChild(createElement("p", null, profile.email || "Sem email associado"));
      body.appendChild(createElement("p", null, `${roleMeta.label} · ${roleMeta.summary}`));

      body.lastChild.textContent = `${roleMeta.label} · ${roleMeta.summary}`;

      body.lastChild.textContent = `${roleMeta.label} - ${roleMeta.summary}`;

      const actions = createElement("div", "bo-row-actions bo-permission-actions");
      const select = document.createElement("select");
      select.setAttribute("aria-label", `PermissÃ£o de ${displayName}`);

      select.setAttribute("aria-label", `Permiss\u00e3o de ${displayName}`);

      Object.entries(backofficeRoles).filter(([value, meta]) => !meta.legacy || value === profile.role).forEach(([value, meta]) => {
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
    const isNew = !member;
    const profile = findProfileForMember(member);
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
    setField(form, "account_role", profile?.role || "member");

    const newAccountFields = form.querySelectorAll("[data-new-account-field]");
    newAccountFields.forEach((field) => {
      field.hidden = !isNew;
      field.querySelectorAll("input, select, textarea").forEach((input) => {
        input.required = isNew;
        if (!isNew) {
          input.value = "";
        }
      });
    });

    const accountEmailHint = form.querySelector("[data-account-email-hint]");
    if (accountEmailHint) {
      accountEmailHint.hidden = !isNew;
    }

    if (form.elements.email) {
      form.elements.email.required = isNew;
      form.elements.email.readOnly = Boolean(options.allowAdminFields && member?.user_id);
    }

    if (options.allowAdminFields && form.elements.is_active) {
      setField(form, "is_active", member?.is_active ?? true);
    }
    if (options.allowAdminFields && form.elements.is_legend) {
      setField(form, "is_legend", member?.is_legend ?? false);
    }

    updateMemberPhotoPreview(form, { url: member?.photo_url || "" });
  }

  function renderProfileSection() {
    const form = $(selectors.profileForm);
    const passwordForm = $(selectors.passwordForm);
    const empty = $("[data-profile-empty]");
    if (!form || !empty) {
      return;
    }

    const member = getOwnTeamMember();
    if (!member) {
      form.hidden = true;
      if (passwordForm) {
        passwordForm.hidden = false;
      }
      $(selectors.accountDanger).hidden = false;
      empty.hidden = false;
      clearMemberPhotoPreview(form);
      empty.textContent = "Ainda não existe um perfil associado a esta conta. Confirma se o SQL de setup foi executado depois de criares o utilizador.";
      return;
    }

    empty.hidden = true;
    form.hidden = false;
    if (passwordForm) {
      passwordForm.hidden = false;
    }
    $(selectors.accountDanger).hidden = false;
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
      const message = canManageTeam()
        ? "Ainda não existem perfis. Usa o botão Novo membro para criar a primeira conta."
        : "O teu perfil ainda não foi gerado. Confirma se o SQL de setup foi executado depois de criares a conta.";
      list.appendChild(createElement("p", "bo-empty", message));
      return;
    }

    if (!visibleTeam.length) {
      list.appendChild(createElement("p", "bo-empty", "Nenhum perfil corresponde aos filtros ativos."));
      return;
    }

    const areas = [
      { id: "direction", label: "Direção" },
      { id: "communication", label: "Comunicação" },
      { id: "projects", label: "Projetos e Inovação" },
      { id: "commercial", label: "Comercial" },
      { id: "hr", label: "Recursos Humanos" },
      { id: "general", label: "Equipa geral" },
      { id: "legends", label: "Rise Up Legends" }
    ];

    const groupedTeam = new Map(areas.map((area) => [area.id, []]));
    visibleTeam.forEach((member) => groupedTeam.get(getTeamArea(member)).push(member));

    areas.forEach((area) => {
      const members = groupedTeam.get(area.id);
      if (!members.length) return;

      const group = createElement("section", "bo-team-area");
      const heading = createElement("div", "bo-team-area-heading");
      heading.append(
        createElement("h4", null, area.label),
        createElement("span", null, `${members.length} ${members.length === 1 ? "pessoa" : "pessoas"}`)
      );
      group.appendChild(heading);

      const membersList = createElement("div", "bo-team-member-list");
      members.sort((left, right) => (left.name || "").localeCompare(right.name || "", "pt"));
      members.forEach((member) => membersList.appendChild(createTeamMemberRow(member)));
      group.appendChild(membersList);
      list.appendChild(group);
    });
  }

  function getTeamArea(member) {
    if (member.is_legend) return "legends";
    const accountRole = findProfileForMember(member)?.role || "";
    if (accountRole === "admin") return "direction";
    if (accountRole.includes("communication")) return "communication";
    if (accountRole.includes("projects_innovation")) return "projects";
    if (accountRole.includes("commercial")) return "commercial";
    if (accountRole.includes("hr")) return "hr";
    return "general";
  }

  function createTeamMemberRow(member) {
    const row = createElement("article", "bo-team-member-row");
    const identity = createElement("div", "bo-team-member-identity");
    const avatar = createElement("div", "bo-team-member-avatar");

    if (member.photo_url) {
      const image = document.createElement("img");
      image.src = member.photo_url;
      image.alt = `Fotografia de ${member.name || "membro da equipa"}`;
      image.addEventListener("error", () => image.remove());
      avatar.appendChild(image);
    }
    avatar.appendChild(createElement("span", "bo-team-member-initials", getInitials(member.name)));

    const details = createElement("div", "bo-team-member-details");
    const name = createElement("strong", null, member.name || "Sem nome");
    if (isMemberOnline(member)) {
      const online = createElement("span", "bo-online-dot is-online");
      online.title = "Online agora";
      name.appendChild(online);
    }
    details.appendChild(name);
    if (member.email) details.appendChild(createElement("span", null, member.email));

    identity.append(avatar, details);
    const role = createElement("div", "bo-team-member-role");
    role.appendChild(createElement("span", null, member.role || "Sem cargo"));
    if (!member.is_active) role.appendChild(createElement("small", "bo-team-member-inactive", "Inativo"));

    const actions = createElement("div", "bo-team-member-actions");
    const edit = createElement("button", "bo-button bo-button-ghost", "Editar");
    edit.type = "button";
    edit.addEventListener("click", () => openTeamForm(member));
    actions.appendChild(edit);

    row.append(identity, role, actions);
    return row;
  }

  function getInitials(name) {
    return (name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
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

    visibleProjects.forEach((project) => list.appendChild(createProjectRow(project)));
  }

  function createProjectRow(project) {
    const row = createElement("article", "bo-project-row");
    const cover = createElement("div", "bo-project-row-cover");
    const coverUrl = safeImageUrl(getProjectImageUrls(project)[0]);
    if (coverUrl) {
      const image = createElement("img");
      image.src = coverUrl;
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("error", () => image.remove());
      cover.appendChild(image);
    }
    cover.appendChild(createElement("span", null, getInitials(project.title)));

    const body = createElement("div", "bo-project-row-copy");
    const heading = createElement("div", "bo-project-row-heading");
    heading.append(
      createElement("h3", null, project.title || "Sem título"),
      createElement("span", `bo-project-row-status is-${project.status || "draft"}`, getProjectStatusLabel(project.status))
    );
    body.appendChild(heading);
    body.appendChild(createElement("p", null, [project.client_name, project.category].filter(Boolean).join(" · ") || "Sem cliente ou categoria"));

    const meta = createElement("div", "bo-project-row-meta");
    const links = projectLinks(project.id);
    const responsibleCount = links.filter((link) => link.is_responsible).length;
    meta.appendChild(createElement("span", null, `${links.length} ${links.length === 1 ? "pessoa" : "pessoas"}`));
    if (responsibleCount) meta.appendChild(createElement("span", null, `${responsibleCount} ${responsibleCount === 1 ? "responsável" : "responsáveis"}`));
    if (project.deadline) meta.appendChild(createElement("span", null, `Prazo ${formatDate(project.deadline)}`));
    else if (project.project_date) meta.appendChild(createElement("span", null, formatDate(project.project_date)));
    body.appendChild(meta);

    const actions = createElement("div", "bo-project-row-actions");
    if (canManageProjects()) {
      const edit = createElement("button", "bo-button bo-button-ghost", "Abrir projeto");
      edit.type = "button";
      edit.addEventListener("click", () => openProjectForm(project));
      actions.appendChild(edit);
    }

    row.append(cover, body, actions);
    return row;
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

  function getFilteredApplications() {
    const query = normalizeSearchValue(state.applicationSearch);
    return state.joinApplications.filter((record) => {
      const searchable = normalizeSearchValue([
        record.name,
        record.email,
        record.phone_contact,
        record.course,
        record.study_year,
        record.motivation
      ].filter(Boolean).join(" "));
      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = state.applicationStatusFilter === "all" || record.status === state.applicationStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  function renderApplicationList() {
    const list = $(selectors.applicationList);
    if (!list) {
      return;
    }

    list.replaceChildren();
    const visibleApplications = getFilteredApplications();

    if (state.applicationAccessMissing) {
      list.appendChild(createElement("p", "bo-empty", "As candidaturas ainda n\u00e3o est\u00e3o acess\u00edveis. Executa o ficheiro supabase-submissions-access.sql no Supabase para ativar esta leitura."));
      return;
    }

    if (!state.joinApplications.length) {
      list.appendChild(createElement("p", "bo-empty", "Ainda n\u00e3o existem candidaturas submetidas pelo website."));
      return;
    }

    if (!visibleApplications.length) {
      list.appendChild(createElement("p", "bo-empty", "Nenhuma candidatura corresponde aos filtros ativos."));
      return;
    }

    visibleApplications.forEach((record) => {
      const row = createElement("article", "bo-list-row bo-submission-row");
      const body = createElement("div");
      body.appendChild(createElement("h3", null, record.name || "Sem nome"));
      body.appendChild(createElement("p", null, `${record.email || "Sem email"} - ${record.phone_contact || "Sem contacto"} - ${formatDateTime(record.submitted_at)}`));

      const courseParts = [record.course, record.study_year ? `${record.study_year}.\u00ba ano` : "", record.age ? `${record.age} anos` : ""].filter(Boolean);
      if (courseParts.length) {
        body.appendChild(createElement("p", null, courseParts.join(" - ")));
      }

      const linkedinUrl = safeExternalUrl(record.linkedin, { linkedinOnly: true, maxLength: 300 });
      if (linkedinUrl) {
        const linkLine = createElement("p");
        const link = createElement("a", null, "LinkedIn");
        link.href = linkedinUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        linkLine.append("Perfil: ", link);
        body.appendChild(linkLine);
      }

      if (record.motivation) {
        body.appendChild(createElement("p", null, record.motivation));
      }

      const actions = createElement("div", "bo-row-actions");
      actions.appendChild(createElement("span", "bo-pill", formatSubmissionStatus(record.status)));
      actions.appendChild(createElement("span", "bo-pill", (record.language || "PT").toUpperCase()));

      if (canManageHr()) {
        const remove = createElement("button", "bo-button bo-button-danger", "Apagar");
        remove.type = "button";
        remove.addEventListener("click", () => deleteJoinApplication(record));
        actions.appendChild(remove);
      }

      row.append(body, actions);
      list.appendChild(row);
    });
  }

  function getFilteredContactSubmissions() {
    const query = normalizeSearchValue(state.contactSearch);
    return state.contactSubmissions.filter((record) => {
      const searchable = normalizeSearchValue([
        record.name,
        record.email,
        record.message,
        record.source_page,
        record.page_url
      ].filter(Boolean).join(" "));
      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = state.contactStatusFilter === "all" || record.status === state.contactStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  function renderContactSubmissionList() {
    const list = $(selectors.contactSubmissionList);
    if (!list) {
      return;
    }

    list.replaceChildren();
    const visibleSubmissions = getFilteredContactSubmissions();

    if (state.contactAccessMissing) {
      list.appendChild(createElement("p", "bo-empty", "Os pedidos de contacto ainda n\u00e3o est\u00e3o acess\u00edveis. Executa o ficheiro supabase-submissions-access.sql no Supabase para ativar esta leitura."));
      return;
    }

    if (!state.contactSubmissions.length) {
      list.appendChild(createElement("p", "bo-empty", "Ainda n\u00e3o existem pedidos de contacto submetidos pelo website."));
      return;
    }

    if (!visibleSubmissions.length) {
      list.appendChild(createElement("p", "bo-empty", "Nenhum pedido corresponde aos filtros ativos."));
      return;
    }

    visibleSubmissions.forEach((record) => {
      const row = createElement("article", "bo-list-row bo-submission-row");
      const body = createElement("div");
      body.appendChild(createElement("h3", null, record.name || "Sem nome"));
      body.appendChild(createElement("p", null, `${record.email || "Sem email"} - ${formatDateTime(record.submitted_at)}`));

      if (record.message) {
        body.appendChild(createElement("p", null, record.message));
      }

      const pageUrl = safeExternalUrl(record.page_url, { allowHttp: true, maxLength: 500 });
      if (pageUrl) {
        const pageLine = createElement("p");
        const link = createElement("a", null, record.source_page || "P\u00e1gina de origem");
        link.href = pageUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        pageLine.append("Origem: ", link);
        body.appendChild(pageLine);
      }

      const actions = createElement("div", "bo-row-actions");
      actions.appendChild(createElement("span", "bo-pill", formatSubmissionStatus(record.status)));
      actions.appendChild(createElement("span", "bo-pill", (record.language || "PT").toUpperCase()));

      if (canManageContacts()) {
        const archived = record.status === "archived";
        const archive = createElement("button", "bo-button bo-button-ghost", archived ? "Restaurar" : "Arquivar");
        archive.type = "button";
        archive.addEventListener("click", () => updateContactSubmissionStatus(record, archived ? "read" : "archived"));

        const remove = createElement("button", "bo-button bo-button-danger", "Apagar");
        remove.type = "button";
        remove.addEventListener("click", () => deleteContactSubmission(record));
        actions.append(archive, remove);
      }

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
    if (preview.dataset.cropObjectUrl) {
      URL.revokeObjectURL(preview.dataset.cropObjectUrl);
      delete preview.dataset.cropObjectUrl;
    }
    preview.dataset.cropVersion = String((Number(preview.dataset.cropVersion) || 0) + 1);

    image.hidden = true;
    image.removeAttribute("src");
    image.removeAttribute("style");
    empty.hidden = false;
    delete form.photoCrop;
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

    if (file) {
      try {
        validateImageFile(file);
      } catch (error) {
        const status = form?.matches(selectors.teamForm) ? $(selectors.teamStatus) : $(selectors.profileStatus);
        setStatus(status, getErrorMessage(error), "error");
        return;
      }
    }

    const source = file ? URL.createObjectURL(file) : safeImageUrl(url);
    if (!source) {
      return;
    }

    if (file) {
      preview.dataset.objectUrl = source;
      form.photoCrop = { file, zoom: 1, x: 0, y: 0, dirty: true };
    }

    image.src = source;
    image.hidden = false;
    empty.hidden = true;
    caption.textContent = file
      ? "Usa “Editar foto de perfil” para ajustar o enquadramento antes de guardar."
      : "A preparar a fotografia para edição…";
    syncPhotoCropPreview(form);
    if (!file) enablePublishedPhotoCrop(form, source);
  }

  async function enablePublishedPhotoCrop(form, source) {
    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error("Não foi possível obter a fotografia.");
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) throw new Error("O ficheiro não é uma imagem válida.");
      form.photoCrop = { file: new File([blob], "fotografia-perfil.jpg", { type: blob.type }), zoom: 1, x: 0, y: 0, dirty: false };
      const caption = form.querySelector("[data-photo-preview-caption]");
      if (caption) caption.textContent = "Usa “Editar foto de perfil” para ajustar o enquadramento antes de guardar.";
      syncPhotoCropPreview(form);
    } catch (error) {
      const caption = form.querySelector("[data-photo-preview-caption]");
      if (caption) caption.textContent = "Fotografia atualmente associada ao perfil.";
    }
  }

  function syncPhotoCropPreview(form) {
    const crop = form?.photoCrop;
    const image = form?.querySelector("[data-photo-preview-image]");
    if (!image) return;
    if (!crop) return;
    renderPhotoCropPreview(form);
  }

  async function renderPhotoCropPreview(form) {
    const crop = form?.photoCrop;
    const preview = form?.querySelector("[data-photo-preview]");
    const image = form?.querySelector("[data-photo-preview-image]");
    if (!crop?.file || !preview || !image) return;

    const version = String((Number(preview.dataset.cropVersion) || 0) + 1);
    preview.dataset.cropVersion = version;
    try {
      const croppedFile = await createCroppedPhotoFile(form);
      if (preview.dataset.cropVersion !== version || !croppedFile) return;
      if (preview.dataset.cropObjectUrl) URL.revokeObjectURL(preview.dataset.cropObjectUrl);
      const url = URL.createObjectURL(croppedFile);
      preview.dataset.cropObjectUrl = url;
      image.src = url;
      image.removeAttribute("style");
    } catch (error) {
      // Mantém a imagem original visível caso o browser não consiga gerar a pré-visualização.
    }
  }

  function updatePhotoCrop(form, field, value) {
    if (!form?.photoCrop) return;
    form.photoCrop[field] = field === "zoom" ? Math.min(3, Math.max(1, Number(value))) : Math.min(1, Math.max(-1, Number(value)));
    form.photoCrop.dirty = true;
    const zoomControl = form.querySelector("[data-photo-zoom]");
    if (field === "zoom" && zoomControl) zoomControl.value = String(form.photoCrop.zoom);
    syncPhotoCropPreview(form);
  }

  function setPhotoCropEditor(form, open) {
    const preview = form?.querySelector("[data-photo-preview]");
    const controls = form?.querySelector("[data-photo-crop-controls]");
    if (!preview || !controls) return;
    preview.classList.toggle("is-photo-crop-editor-open", open);
    controls.hidden = !open;
    if (open) {
      const zoomControl = form.querySelector("[data-photo-zoom]");
      if (zoomControl && form.photoCrop) zoomControl.value = String(form.photoCrop.zoom);
      preview.querySelector(".bo-photo-preview-frame")?.focus?.();
    }
  }

  function closeProfilePhotoMenu(form) {
    const menu = form?.querySelector("[data-photo-menu]");
    const trigger = form?.querySelector("[data-photo-menu-trigger]");
    if (menu) menu.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }

  function closeAllPhotoMenus(exceptForm = null) {
    $all("[data-photo-menu]").forEach((menu) => {
      const form = menu.closest("form");
      if (form === exceptForm) return;
      menu.hidden = true;
      form?.querySelector("[data-photo-menu-trigger]")?.setAttribute("aria-expanded", "false");
    });
  }

  function getPhotoCropDialog() {
    return $("[data-photo-crop-dialog]");
  }

  function syncPhotoCropDialog(dialog) {
    const form = dialog?.photoCropForm;
    const crop = form?.photoCrop;
    const stage = dialog?.querySelector("[data-photo-crop-stage]");
    const image = dialog?.querySelector("[data-photo-crop-dialog-image]");
    const zoom = dialog?.querySelector("[data-photo-crop-dialog-zoom]");
    if (!crop?.file || !stage || !image || !image.naturalWidth) return;
    const size = stage.clientWidth;
    const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const width = image.naturalWidth * baseScale * crop.zoom;
    const height = image.naturalHeight * baseScale * crop.zoom;
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    image.style.left = `${(size - width) / 2 - crop.x * Math.max(0, width - size) / 2}px`;
    image.style.top = `${(size - height) / 2 - crop.y * Math.max(0, height - size) / 2}px`;
    if (zoom) zoom.value = String(crop.zoom);
  }

  function openPhotoCropDialog(form) {
    const dialog = getPhotoCropDialog();
    const crop = form?.photoCrop;
    const image = dialog?.querySelector("[data-photo-crop-dialog-image]");
    if (!dialog || !crop?.file || !image) return false;
    if (dialog.dataset.objectUrl) URL.revokeObjectURL(dialog.dataset.objectUrl);
    dialog.dataset.objectUrl = URL.createObjectURL(crop.file);
    dialog.photoCropForm = form;
    dialog.photoCropSnapshot = { zoom: crop.zoom, x: crop.x, y: crop.y, dirty: crop.dirty };
    image.onload = () => syncPhotoCropDialog(dialog);
    image.src = dialog.dataset.objectUrl;
    if (!dialog.open) dialog.showModal();
    return true;
  }

  function closePhotoCropDialog(discardChanges = false) {
    const dialog = getPhotoCropDialog();
    if (!dialog) return;
    if (discardChanges && dialog.photoCropForm?.photoCrop && dialog.photoCropSnapshot) {
      Object.assign(dialog.photoCropForm.photoCrop, dialog.photoCropSnapshot);
      syncPhotoCropPreview(dialog.photoCropForm);
    }
    if (dialog.dataset.objectUrl) URL.revokeObjectURL(dialog.dataset.objectUrl);
    delete dialog.dataset.objectUrl;
    delete dialog.photoCropForm;
    delete dialog.photoCropSnapshot;
    if (dialog.open) dialog.close();
  }

  function bindPhotoEditor(form, statusElement) {
    if (!form) return;
    form.elements.photo.addEventListener("change", (event) => {
      syncMemberPhotoPreview(event.currentTarget.form);
      openPhotoCropDialog(event.currentTarget.form);
    });
    form.querySelector("[data-photo-menu-trigger]")?.addEventListener("click", (event) => {
      const editorForm = event.currentTarget.form;
      const menu = editorForm.querySelector("[data-photo-menu]");
      const isOpen = !menu.hidden;
      closeAllPhotoMenus(editorForm);
      menu.hidden = isOpen;
      event.currentTarget.setAttribute("aria-expanded", String(!isOpen));
    });
    form.querySelector("[data-add-profile-photo]")?.addEventListener("click", (event) => {
      const editorForm = event.currentTarget.form;
      closeProfilePhotoMenu(editorForm);
      editorForm.elements.photo.value = "";
      editorForm.elements.photo.click();
    });
    form.querySelector("[data-edit-current-photo]")?.addEventListener("click", (event) => {
      const editorForm = event.currentTarget.form;
      closeProfilePhotoMenu(editorForm);
      if (!editorForm.photoCrop) {
        setStatus(statusElement, "A fotografia atual ainda está a ser preparada. Tenta novamente dentro de instantes.", "error");
        return;
      }
      openPhotoCropDialog(editorForm);
    });
    form.querySelector("[data-photo-zoom]")?.addEventListener("input", (event) => {
      updatePhotoCrop(event.currentTarget.form, "zoom", event.currentTarget.value);
    });
    form.querySelector("[data-reset-photo-crop]")?.addEventListener("click", (event) => {
      const editorForm = event.currentTarget.form;
      if (!editorForm.photoCrop) return;
      editorForm.photoCrop.x = 0;
      editorForm.photoCrop.y = 0;
      updatePhotoCrop(editorForm, "zoom", 1);
    });
  }

  function bindPhotoCropGestures() {
    $all(".bo-photo-preview-frame").forEach((frame) => {
      let start = null;
      frame.addEventListener("pointerdown", (event) => {
        const form = frame.closest("form");
        if (!form?.photoCrop) return;
        frame.setPointerCapture(event.pointerId);
        start = { x: event.clientX, y: event.clientY, cropX: form.photoCrop.x, cropY: form.photoCrop.y };
      });
      frame.addEventListener("pointermove", (event) => {
        if (!start) return;
        const form = frame.closest("form");
        const bounds = frame.getBoundingClientRect();
        updatePhotoCrop(form, "x", start.cropX - (event.clientX - start.x) / Math.max(bounds.width, 1) * 2);
        updatePhotoCrop(form, "y", start.cropY - (event.clientY - start.y) / Math.max(bounds.height, 1) * 2);
      });
      frame.addEventListener("pointerup", () => { start = null; });
      frame.addEventListener("pointercancel", () => { start = null; });
    });
  }

  async function createCroppedPhotoFile(form) {
    const crop = form?.photoCrop;
    if (!crop?.file) return form?.elements.photo?.files?.[0] || null;

    const bitmap = await createImageBitmap(crop.file);
    const size = 1024;
    const baseScale = Math.max(size / bitmap.width, size / bitmap.height);
    const scale = baseScale * crop.zoom;
    const width = bitmap.width * scale;
    const height = bitmap.height * scale;
    const overflowX = Math.max(0, width - size);
    const overflowY = Math.max(0, height - size);
    const x = (size - width) / 2 - crop.x * overflowX / 2;
    const y = (size - height) / 2 - crop.y * overflowY / 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    context.drawImage(bitmap, x, y, width, height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return crop.file;
    const name = `${sanitizeFileName(crop.file.name).replace(/\.[^.]+$/, "")}-perfil.jpg`;
    return new File([blob], name, { type: "image/jpeg" });
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
      form.hidden = false;
      $(selectors.teamFormTitle).textContent = "Novo membro";
      setStatus($(selectors.teamStatus), "");
      populateMemberForm(form, null, { allowAdminFields: true });
      const deleteButton = $("[data-delete-team-member]");
      if (deleteButton) {
        deleteButton.hidden = true;
      }
      setGlobalStatus("Preenche os dados para criar a conta e o perfil no BackOffice.");
      return;
    }

    form.hidden = false;
    $(selectors.teamFormTitle).textContent = "Editar membro";
    const deleteButton = $("[data-delete-team-member]");
    if (deleteButton) {
      deleteButton.hidden = false;
    }
    setStatus($(selectors.teamStatus), "");
    populateMemberForm(form, member, { allowAdminFields: true });

    setGlobalStatus("");
  }

  function closeTeamForm() {
    clearMemberPhotoPreview($(selectors.teamForm));
    $(selectors.teamForm).hidden = true;
  }

  async function refreshAccountCreationData() {
    await loadUserProfiles();
    await loadTeam();
  }

  function findTeamMemberByAccount(user, email) {
    const normalizedEmail = String(email || "").toLowerCase();
    return state.team.find((member) => (
      (user?.id && member.user_id === user.id)
      || (
        normalizedEmail
        && member.email
        && member.email.toLowerCase() === normalizedEmail
      )
    )) || null;
  }

  async function waitForCreatedTeamMember(user, email) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await refreshAccountCreationData();
      const member = findTeamMemberByAccount(user, email);
      if (member) {
        return member;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 450));
    }

    return null;
  }

  async function createTeamMemberAccount(form, statusElement) {
    requireAdmin();

    let email = "";
    try {
      email = normalizeEmail(form.elements.email.value);
    } catch (error) {
      setStatus(statusElement, getErrorMessage(error), "error");
      return null;
    }

    const password = form.elements.account_password.value;
    const accountRole = backofficeRoles[form.elements.account_role.value]
      ? form.elements.account_role.value
      : "member";

    if (!email || !password) {
      setStatus(statusElement, "Preenche o email e a palavra-passe inicial.", "error");
      return null;
    }

    if (password.length < minPasswordLength) {
      setStatus(statusElement, `A palavra-passe inicial deve ter pelo menos ${minPasswordLength} caracteres.`, "error");
      return null;
    }

    if (state.userProfiles.some((profile) => profile.email?.toLowerCase() === email.toLowerCase())) {
      setStatus(statusElement, "Já existe uma conta com esse email.", "error");
      return null;
    }

    try {
      setStatus(statusElement, "A criar conta...");
      const accountClient = createAccountClient();
      const { data, error } = await accountClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: form.elements.name.value.trim(),
            full_name: form.elements.name.value.trim(),
            team_role: form.elements.role.value.trim()
          }
        }
      });

      if (error) {
        throw error;
      }

      const member = await waitForCreatedTeamMember(data.user, email);
      if (!member) {
        throw new Error("A conta foi criada, mas o perfil ainda não apareceu. Confirma se executaste o supabase-setup.sql.");
      }

      const { error: profileError } = await state.client
        .from(table("userProfiles"))
        .update({ role: accountRole, email })
        .eq("id", data.user.id);

      if (profileError) {
        throw profileError;
      }

      const updated = await saveMemberForm({
        form,
        statusElement,
        memberId: member.id,
        allowAdminFields: true,
        successMessage: "Conta e perfil criados."
      });

      if (updated) {
        await loadUserProfiles();
        await recordAudit("Conta de BackOffice criada", "team_member", updated.name || email);
      }

      return updated;
    } catch (error) {
      setStatus(statusElement, getErrorMessage(error), "error");
      return null;
    }
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

    let payload;
    try {
      payload = {
        name: cleanText(form.elements.name.value, 120),
        role: allowAdminFields
          ? cleanText(form.elements.role.value, 120)
          : existing.role,
        description: cleanText(form.elements.description.value, 1200) || null,
        photo_url: ensureValidUrl(form.elements.photo_url.value, {
          image: true,
          message: "A fotografia associada não é um URL seguro."
        }),
        linkedin_url: ensureValidUrl(form.elements.linkedin_url.value, {
          linkedinOnly: true,
          maxLength: 300,
          message: "O LinkedIn deve ser um link https://linkedin.com válido."
        }),
        email: normalizeEmail(form.elements.email.value) || null,
        joined_month: safeNumber(form.elements.joined_month.value),
        joined_year: safeNumber(form.elements.joined_year.value)
      };
    } catch (error) {
      setStatus(statusElement, getErrorMessage(error), "error");
      return null;
    }

    if (!payload.name || !payload.role) {
      setStatus(statusElement, "Preenche o nome e o cargo.", "error");
      return null;
    }

    if (allowAdminFields && form.elements.is_active) {
      payload.user_id = existing.user_id || null;
      payload.is_active = form.elements.is_active.checked;
      payload.is_legend = form.elements.is_legend?.checked || false;
    }

    try {
      setStatus(statusElement, "A guardar perfil...");
      const photoFile = form.photoCrop?.dirty
        ? await createCroppedPhotoFile(form)
        : form.elements.photo.files?.[0] || null;
      if (photoFile) {
        const photoFolder = allowAdminFields ? `members/${existing.id}` : `members/${state.user.id}`;
        payload.photo_url = await uploadFile(photoFile, bucket("teamPhotos"), photoFolder);
      }

      const { error } = await state.client.from(table("teamMembers")).update(payload).eq("id", existing.id);
      if (error) {
        throw error;
      }

      const linkedProfile = findProfileForMember(existing);
      if (allowAdminFields && linkedProfile && form.elements.account_role) {
        const targetRole = backofficeRoles[form.elements.account_role.value]
          ? form.elements.account_role.value
          : "member";
        const adminCount = state.userProfiles.filter((entry) => entry.role === "admin").length;

        if (linkedProfile.id === state.user?.id && linkedProfile.role === "admin" && targetRole !== "admin" && adminCount <= 1) {
          throw new Error("Mantém pelo menos um administrador ativo antes de remover o teu acesso total.");
        }

        const { error: profileError } = await state.client
          .from(table("userProfiles"))
          .update({ role: targetRole, email: payload.email })
          .eq("id", linkedProfile.id);

        if (profileError) {
          throw profileError;
        }
      }

      await loadUserProfiles();
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

  async function savePasswordForm(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const status = $(selectors.passwordStatus);
    const newPassword = form.elements.new_password.value;
    const confirmPassword = form.elements.confirm_password.value;

    if (newPassword.length < minPasswordLength) {
      setStatus(status, `A nova palavra-passe deve ter pelo menos ${minPasswordLength} caracteres.`, "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus(status, "As palavras-passe não coincidem.", "error");
      return;
    }

    try {
      setStatus(status, "A alterar palavra-passe...");
      const { error } = await state.client.auth.updateUser({ password: newPassword });
      if (error) {
        throw error;
      }

      form.reset();
      await recordAudit("Palavra-passe alterada", "user_profile", getCurrentUserDisplayName() || state.user?.email);
      setStatus(status, "Palavra-passe alterada com sucesso.", "success");
    } catch (error) {
      setStatus(status, getErrorMessage(error), "error");
    }
  }

  async function saveTeamMember(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const status = $(selectors.teamStatus);

    if (!form.elements.id.value) {
      const created = await createTeamMemberAccount(form, status);
      if (created) {
        renderAll();
        openTeamForm(created);
      }
      return;
    }

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
    const clear = $(selectors.projectMemberSearchClear);

    if (toggle) {
      toggle.hidden = true;
    }

    if (wrap) {
      wrap.hidden = false;
    }

    if (input && input.value !== state.projectMemberSearch) {
      input.value = state.projectMemberSearch;
    }

    if (clear) {
      clear.hidden = !state.projectMemberSearch;
    }
  }

  function resetProjectMemberPicker(project) {
    const links = project?.id ? projectLinks(project.id) : [];
    state.projectMemberSelection = new Set(links.map((link) => link.team_member_id));
    const responsibleIds = links.filter((link) => link.is_responsible).map((link) => link.team_member_id);
    if (!responsibleIds.length && project?.responsible_id) responsibleIds.push(project.responsible_id);
    state.projectResponsibleSelection = new Set(responsibleIds);
    responsibleIds.forEach((memberId) => state.projectMemberSelection.add(memberId));
    state.projectMemberSearch = "";
    state.projectMemberSearchOpen = true;
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
    state.projectResponsibleSelection.delete(memberId);
  }

  async function deleteOwnAccount() {
    const dialog = $("[data-account-delete-dialog]");
    const status = dialog?.querySelector("[data-account-delete-status]");
    const button = dialog?.querySelector("[data-confirm-account-deletion]");
    if (!state.session?.access_token || !status) return;
    try {
      if (button) button.disabled = true;
      setStatus(status, "A apagar a conta…");
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${state.session.access_token}` }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível apagar a conta.");
      await state.client.auth.signOut();
      dialog.close();
      state.session = null;
      state.user = null;
      state.profile = null;
      state.team = [];
      showAuthView();
      setStatus($(selectors.loginStatus), "A conta foi apagada com sucesso.", "success");
    } catch (error) {
      setStatus(status, getErrorMessage(error), "error");
      if (button) button.disabled = false;
    }
  }

  function setProjectResponsibleSelection(memberId, checked) {
    if (!memberId) return;
    if (checked) {
      state.projectResponsibleSelection.add(memberId);
      state.projectMemberSelection.add(memberId);
    } else {
      state.projectResponsibleSelection.delete(memberId);
    }
  }

  function getProjectMemberTeam(member) {
    const profile = state.userProfiles.find((item) => item.id === member.user_id || (item.email && item.email === member.email));
    const role = normalizeSearchValue([profile?.role, member.role, member.area, member.position].filter(Boolean).join(" "));
    if (role.includes("communication") || role.includes("comunicacao")) return { key: "communication", label: "Comunicação" };
    if (role.includes("project") || role.includes("projeto") || role.includes("inovacao")) return { key: "projects", label: "Projetos e Inovação" };
    if (role.includes("human") || role.includes("recursos humanos") || role === "rh" || role.includes("_hr")) return { key: "hr", label: "Recursos Humanos" };
    if (role.includes("commercial") || role.includes("comercial")) return { key: "commercial", label: "Comercial" };
    return null;
  }

  function renderProjectResponsibleTeams() {
    const wrap = $(selectors.projectResponsibleTeams);
    if (!wrap) return;
    wrap.replaceChildren();
    const groups = new Map();
    state.team.forEach((member) => {
      const team = getProjectMemberTeam(member);
      if (!team) return;
      if (!groups.has(team.key)) groups.set(team.key, { ...team, members: [] });
      groups.get(team.key).members.push(member);
    });
    if (!groups.size) {
      wrap.appendChild(createElement("span", "bo-field-hint", "As equipas aparecem de acordo com o cargo de cada membro."));
      return;
    }
    groups.forEach((team) => {
      const allResponsible = team.members.every((member) => state.projectResponsibleSelection.has(member.id));
      const button = createElement("button", `bo-team-shortcut${allResponsible ? " is-active" : ""}`, `${allResponsible ? "✓" : "+"} ${team.label} · ${team.members.length}`);
      button.type = "button";
      button.setAttribute("aria-pressed", allResponsible ? "true" : "false");
      button.setAttribute("aria-label", `${allResponsible ? "Remover" : "Adicionar"} a equipa ${team.label} como responsável`);
      button.addEventListener("click", () => {
        team.members.forEach((member) => setProjectResponsibleSelection(member.id, !allResponsible));
        renderProjectMemberOptions();
      });
      wrap.appendChild(button);
    });
  }

  function renderProjectMemberOptions() {
    const wrap = $(selectors.projectMemberOptions);
    if (!wrap) {
      return;
    }

    updateProjectMemberSearchUI();
    wrap.replaceChildren();
    renderProjectResponsibleTeams();
    if (!state.team.length) {
      wrap.appendChild(createElement("p", "bo-empty", "Os perfis aparecem aqui depois de criares contas no Supabase Auth."));
      return;
    }

    const selected = state.projectMemberSelection instanceof Set ? state.projectMemberSelection : new Set();
    const responsible = state.projectResponsibleSelection instanceof Set ? state.projectResponsibleSelection : new Set();
    const summary = $(selectors.projectMemberSummary);
    if (summary) {
      summary.textContent = `${selected.size} na equipa · ${responsible.size} ${responsible.size === 1 ? "responsável" : "responsáveis"}`;
    }
    const query = normalizeSearchValue(state.projectMemberSearch);
    const visibleMembers = state.team
      .filter((member) => {
        const searchable = normalizeSearchValue([member.name, member.email, getProjectMemberTeam(member)?.label].filter(Boolean).join(" "));
        return !query || searchable.includes(query);
      })
      .sort((a, b) => {
        const responsibilityOrder = Number(responsible.has(b.id)) - Number(responsible.has(a.id));
        if (responsibilityOrder) return responsibilityOrder;
        const selectionOrder = Number(selected.has(b.id)) - Number(selected.has(a.id));
        return selectionOrder || String(a.name || a.email || "").localeCompare(String(b.name || b.email || ""), "pt");
      });

    if (!visibleMembers.length) {
      wrap.appendChild(createElement("p", "bo-empty", `Nenhuma pessoa encontrada para "${state.projectMemberSearch}".`));
      return;
    }

    visibleMembers.forEach((member) => {
      const card = createElement("article", `bo-project-member-card${selected.has(member.id) ? " is-associated" : ""}${responsible.has(member.id) ? " is-responsible" : ""}`);
      const identity = createElement("div", "bo-project-member-identity");
      const avatar = createElement("span", "bo-project-member-avatar", (member.name || member.email || "?").trim().charAt(0).toUpperCase());
      avatar.setAttribute("aria-hidden", "true");
      const identityCopy = createElement("div", "bo-project-member-copy");
      identityCopy.append(createElement("strong", null, member.name || member.email || "Sem nome"));
      if (member.email) identityCopy.append(createElement("small", null, member.email));
      const team = getProjectMemberTeam(member);
      if (team) identityCopy.append(createElement("span", "bo-project-member-team", team.label));
      identity.append(avatar, identityCopy);
      const controls = createElement("div", "bo-project-member-controls");
      const label = createElement("label", "bo-project-member-association");
      const input = createElement("input");
      input.type = "checkbox";
      input.name = "project_members";
      input.value = member.id;
      input.checked = selected.has(member.id);
      input.addEventListener("change", () => {
        setProjectMemberSelection(member.id, input.checked);
        renderProjectMemberOptions();
      });
      label.append(input, document.createTextNode("Na equipa"));
      const responsibleButton = createElement("button", `bo-responsible-toggle${responsible.has(member.id) ? " is-active" : ""}`, responsible.has(member.id) ? "★ Responsável" : "☆ Responsável");
      responsibleButton.type = "button";
      responsibleButton.setAttribute("aria-pressed", responsible.has(member.id) ? "true" : "false");
      responsibleButton.setAttribute("aria-label", `${responsible.has(member.id) ? "Retirar responsabilidade a" : "Definir como responsável:"} ${member.name || member.email || "membro"}`);
      responsibleButton.addEventListener("click", () => {
        setProjectResponsibleSelection(member.id, !responsible.has(member.id));
        renderProjectMemberOptions();
      });
      controls.append(label, responsibleButton);
      card.append(identity, controls);
      wrap.appendChild(card);
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
    state.projectImageItems = getProjectImageUrls(project).map((url) => safeImageUrl(url)).filter(Boolean).map((url, index) => ({
      id: `existing-${index}-${randomId()}`,
      type: "existing",
      url
    }));
    syncProjectCoverField();
  }

  function appendProjectImageFiles(files) {
    Array.from(files || []).forEach((file) => {
      try {
        validateImageFile(file);
      } catch (error) {
        setStatus($(selectors.projectStatus), getErrorMessage(error), "error");
        return;
      }

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
      const imageUrl = safeImageUrl(item.url);
      if (!imageUrl) {
        return;
      }

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
      img.src = imageUrl;
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
    const shouldMoveFocus = form.hidden;
    const maxPosition = state.projects.length + (isNew ? 1 : 0);

    form.reset();
    form.hidden = false;
    $(selectors.projectFormTitle).textContent = isNew ? "Criar projeto" : project?.title || "Editar projeto";
    setStatus($(selectors.projectStatus), "");

    setField(form, "id", project?.id || "");
    setField(form, "title", project?.title || "");
    setField(form, "client_name", project?.client_name || "");
    setField(form, "deadline", project?.deadline || "");
    setField(form, "category", project?.category || "");
    setField(form, "project_date", project?.project_date || "");
    setField(form, "status", project?.status || "draft");
    syncProjectStatusPreview(project?.status || "draft");
    setField(form, "description", project?.description || "");
    const englishCopy = getProjectTranslation(project, "en");
    setField(form, "title_en", englishCopy.title || "");
    setField(form, "category_en", englishCopy.category || "");
    setField(form, "description_en", englishCopy.description || "");
    setField(form, "tags_en", Array.isArray(englishCopy.tags) ? englishCopy.tags.join(", ") : "");
    setField(form, "external_link", project?.external_link || "");
    setField(form, "tags", Array.isArray(project?.tags) ? project.tags.join(", ") : "");
    form.elements.sort_order.min = "1";
    form.elements.sort_order.max = String(Math.max(maxPosition, 1));
    setField(form, "sort_order", project ? getProjectPosition(project.id) ?? 1 : 1);
    resetProjectImageItems(project);
    resetProjectMemberPicker(project);
    renderProjectMemberOptions();
    renderProjectImagePreview();
    state.projectFormBaseline = projectFormSignature(form);
    $("[data-preview-project]").hidden = isNew;
    $("[data-archive-project]").hidden = isNew || project?.status === "archived";
    $("[data-delete-project]").hidden = isNew || !canDeleteProjects();
    if (shouldMoveFocus) {
      window.requestAnimationFrame(() => {
        form.scrollIntoView({ block: "start" });
        const focusTarget = isNew ? form.elements.title : form.querySelector("[data-close-project-form]");
        focusTarget?.focus({ preventScroll: true });
      });
    }
  }

  function closeProjectForm(options = {}) {
    if (!options.force && !confirmProjectNavigation()) {
      return;
    }

    clearProjectImageState();
    resetProjectMemberPicker(null);
    renderProjectMemberOptions();
    $(selectors.projectForm).hidden = true;
    state.projectFormBaseline = "";
    $(selectors.projectSearch)?.focus();
  }

  async function saveProject(event) {
    event.preventDefault();
    requireProjectAccess();

    const form = event.currentTarget;
    const status = $(selectors.projectStatus);
    const id = form.elements.id.value || randomId();
    const existing = state.projects.find((project) => project.id === id);
    const titleField = form.querySelector('[name="title"]');
    const title = cleanText(titleField?.value || existing?.title || "", 160);

    if (!title) {
      setStatus(status, "Preenche o título do projeto antes de guardar.", "error");
      titleField?.focus();
      return;
    }

    const sortEntries = buildProjectSortEntries(id, form.elements.sort_order.value);
    const normalizedSortOrder = sortEntries.find((project) => project.id === id)?.sort_order || 1;
    const nextStatus = ["draft", "in_review", "published", "archived"].includes(form.elements.status.value)
      ? form.elements.status.value
      : "draft";

    let externalLink = null;
    try {
      externalLink = ensureValidUrl(form.elements.external_link.value, {
        maxLength: 500,
        message: "O link externo deve ser um URL https:// válido."
      });
    } catch (error) {
      setStatus(status, getErrorMessage(error), "error");
      return;
    }

    const payload = {
      title,
      client_name: cleanText(form.elements.client_name?.value, 180) || null,
      responsible_id: Array.from(state.projectResponsibleSelection)[0] || null,
      deadline: form.elements.deadline?.value || null,
      description: cleanText(form.elements.description.value, 3000) || null,
      project_date: form.elements.project_date.value || null,
      category: cleanText(form.elements.category.value, 120) || null,
      tags: splitTags(form.elements.tags.value),
      external_link: externalLink,
      status: nextStatus,
      sort_order: normalizedSortOrder,
      details: buildProjectDetails(existing?.details || {}, {
        title: cleanText(form.elements.title_en.value, 160),
        category: cleanText(form.elements.category_en.value, 120),
        description: cleanText(form.elements.description_en.value, 3000),
        tags: splitTags(form.elements.tags_en.value)
      }),
      slug: existing?.slug || slugify(title)
    };

    try {
      setStatus(status, "A guardar projeto...");
      const orderedImageUrls = [];
      for (const item of state.projectImageItems) {
        if (item.type === "new" && item.file) {
          orderedImageUrls.push(await uploadFile(item.file, bucket("projectImages"), `projects/${id}`));
        } else {
          const existingUrl = safeImageUrl(item.url);
          if (existingUrl) {
            orderedImageUrls.push(existingUrl);
          }
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

      const responsibleMembers = state.projectResponsibleSelection instanceof Set ? state.projectResponsibleSelection : new Set();
      responsibleMembers.forEach((memberId) => state.projectMemberSelection.add(memberId));
      const selectedMembers = Array.from(state.projectMemberSelection);
      const { error: deleteError } = await state.client.from(table("projectMembers")).delete().eq("project_id", id);
      if (deleteError) {
        throw deleteError;
      }

      if (selectedMembers.length) {
        const rows = selectedMembers.map((teamMemberId) => ({
          project_id: id,
          team_member_id: teamMemberId,
          is_responsible: responsibleMembers.has(teamMemberId)
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
      closeProjectForm({ force: true });
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

  async function deleteJoinApplication(record) {
    requireHrAccess();

    if (!record?.id || !window.confirm(`Apagar a candidatura de ${record.name || "esta pessoa"}? Esta a\u00e7\u00e3o remove o registo do Supabase.`)) {
      return;
    }

    try {
      setGlobalStatus("A apagar candidatura...");
      const { error } = await state.client
        .from(table("joinApplications"))
        .delete()
        .eq("id", record.id);

      if (error) {
        throw error;
      }

      await loadJoinApplications();
      await recordAudit("Candidatura apagada", "join_application", record.name || record.email || String(record.id));
      renderApplicationList();
      setGlobalStatus("Candidatura apagada.", "success");
    } catch (error) {
      setGlobalStatus(getErrorMessage(error), "error");
    }
  }

  function isLocalPreview() {
    return ["localhost", "127.0.0.1"].includes(window.location.hostname)
      && new URLSearchParams(window.location.search).get("preview") === "1";
  }

  async function updateContactSubmissionStatus(record, status) {
    if (!canManageContacts() || !record?.id || !["read", "archived"].includes(status)) {
      return;
    }

    const action = status === "archived" ? "arquivar" : "restaurar";
    try {
      setGlobalStatus(`A ${action} contacto...`);
      if (!isLocalPreview()) {
        const { error } = await state.client
          .from(table("contactSubmissions"))
          .update({ status })
          .eq("id", record.id);
        if (error) throw error;
        await loadContactSubmissions();
      } else {
        record.status = status;
      }

      await recordAudit(status === "archived" ? "Contacto arquivado" : "Contacto restaurado", "contact_submission", record.name || record.email || String(record.id));
      renderContactSubmissionList();
      setGlobalStatus(status === "archived" ? "Contacto arquivado." : "Contacto restaurado.", "success");
    } catch (error) {
      setGlobalStatus(getErrorMessage(error), "error");
    }
  }

  async function deleteContactSubmission(record) {
    if (!canManageContacts() || !record?.id || !window.confirm(`Apagar o contacto de ${record.name || record.email || "esta pessoa"}? Esta ação é permanente e remove o registo do Supabase.`)) {
      return;
    }

    try {
      setGlobalStatus("A apagar contacto...");
      if (!isLocalPreview()) {
        const { error } = await state.client
          .from(table("contactSubmissions"))
          .delete()
          .eq("id", record.id);
        if (error) throw error;
        await loadContactSubmissions();
      } else {
        state.contactSubmissions = state.contactSubmissions.filter((item) => item.id !== record.id);
      }

      await recordAudit("Contacto apagado", "contact_submission", record.name || record.email || String(record.id));
      renderContactSubmissionList();
      setGlobalStatus("Contacto apagado.", "success");
    } catch (error) {
      setGlobalStatus(getErrorMessage(error), "error");
    }
  }

  function showHrView(view) {
    state.activeHrView = ["guide", "evaluation", "applications"].includes(view) ? view : "guide";

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
      todo: "To-Do",
      communication: "Comunicação",
      documents: "Documentos",
      contacts: "Contactos",
      hr: "Recursos Humanos",
      settings: "Definições"
    };
    $(selectors.pageTitle).textContent = titles[view] || "BackOffice";
  }

  function bindEvents() {
    window.addEventListener("beforeunload", (event) => {
      if (!hasUnsavedProjectChanges()) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    });

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
      await stopPresence();
      await state.client.auth.signOut();
      state.session = null;
      state.user = null;
      state.profile = null;
      state.onlineUserIds = new Set();
      state.onlineEmails = new Set();
      state.userProfiles = [];
      state.team = [];
      state.projects = [];
      state.projectMembers = [];
      state.interviewEvaluations = [];
      state.joinApplications = [];
      state.contactSubmissions = [];
      state.projectMemberSelection = new Set();
      state.projectResponsibleSelection = new Set();
      state.projectMemberSearch = "";
      state.projectMemberSearchOpen = false;
      state.projectSearch = "";
      state.projectStatusFilter = "all";
      state.teamSearch = "";
      state.teamStatusFilter = "all";
      state.hrSearch = "";
      state.hrDecisionFilter = "all";
      state.applicationSearch = "";
      state.applicationStatusFilter = "all";
      state.contactSearch = "";
      state.contactStatusFilter = "all";
      state.applicationAccessMissing = false;
      state.contactAccessMissing = false;
      state.hrSetupMissing = false;
      state.viewAsRole = "";
      state.activeHrView = "guide";
      showAuthView();
    });

    $all("[data-view-button]").forEach((button) => {
      button.addEventListener("click", () => showSection(button.dataset.viewButton));
    });
    $all("[data-reset-view-as]").forEach((button) => button.addEventListener("click", () => applyViewAsRole("admin")));

    const newTeamMemberButton = $("[data-new-team-member]");
    if (newTeamMemberButton) {
      newTeamMemberButton.addEventListener("click", () => openTeamForm(null));
    }
    $(selectors.profileForm).addEventListener("submit", saveProfileForm);
    $(selectors.passwordForm)?.addEventListener("submit", savePasswordForm);
    const accountDeleteDialog = $("[data-account-delete-dialog]");
    $("[data-request-account-deletion]")?.addEventListener("click", () => accountDeleteDialog?.showModal());
    accountDeleteDialog?.querySelector("[data-cancel-account-deletion]")?.addEventListener("click", () => accountDeleteDialog.close());
    accountDeleteDialog?.querySelector("[data-confirm-account-deletion]")?.addEventListener("click", deleteOwnAccount);
    const profileForm = $(selectors.profileForm);
    bindPhotoEditor(profileForm, $(selectors.profileStatus));
    $("[data-close-team-form]").addEventListener("click", closeTeamForm);
    $(selectors.teamForm).addEventListener("submit", saveTeamMember);
    bindPhotoEditor($(selectors.teamForm), $(selectors.teamStatus));
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".bo-profile-photo-actions")) closeAllPhotoMenus();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAllPhotoMenus();
    });
    const photoCropDialog = getPhotoCropDialog();
    photoCropDialog?.querySelector("[data-photo-crop-dialog-zoom]")?.addEventListener("input", (event) => {
      const dialog = getPhotoCropDialog();
      updatePhotoCrop(dialog?.photoCropForm, "zoom", event.currentTarget.value);
      syncPhotoCropDialog(dialog);
    });
    photoCropDialog?.querySelector("[data-photo-crop-stage]")?.addEventListener("pointerdown", (event) => {
      const dialog = getPhotoCropDialog();
      const crop = dialog?.photoCropForm?.photoCrop;
      if (!crop) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dialog.photoCropPointer = { x: event.clientX, y: event.clientY, cropX: crop.x, cropY: crop.y };
    });
    photoCropDialog?.querySelector("[data-photo-crop-stage]")?.addEventListener("pointermove", (event) => {
      const dialog = getPhotoCropDialog();
      const start = dialog?.photoCropPointer;
      if (!start) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      updatePhotoCrop(dialog.photoCropForm, "x", start.cropX - (event.clientX - start.x) / Math.max(bounds.width, 1) * 2);
      updatePhotoCrop(dialog.photoCropForm, "y", start.cropY - (event.clientY - start.y) / Math.max(bounds.height, 1) * 2);
      syncPhotoCropDialog(dialog);
    });
    photoCropDialog?.querySelector("[data-photo-crop-stage]")?.addEventListener("pointerup", () => { if (photoCropDialog) delete photoCropDialog.photoCropPointer; });
    photoCropDialog?.addEventListener("cancel", (event) => { event.preventDefault(); closePhotoCropDialog(true); });
    photoCropDialog?.querySelector("[data-close-photo-crop-dialog]")?.addEventListener("click", () => closePhotoCropDialog(true));
    photoCropDialog?.querySelector("[data-confirm-photo-crop]")?.addEventListener("click", () => {
      const form = photoCropDialog?.photoCropForm;
      if (form?.photoCrop) {
        form.photoCrop.dirty = true;
        syncPhotoCropPreview(form);
        const status = form.matches(selectors.teamForm) ? $(selectors.teamStatus) : $(selectors.profileStatus);
        setStatus(status, "Fotografia pronta. Guarda o perfil para aplicar a alteração.", "success");
      }
      closePhotoCropDialog();
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
    $(selectors.projectForm).elements.status.addEventListener("change", (event) => {
      syncProjectStatusPreview(event.currentTarget.value);
    });
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
    $(selectors.projectMemberSearchToggle)?.addEventListener("click", () => {
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
    $(selectors.applicationSearch)?.addEventListener("input", (event) => {
      state.applicationSearch = event.currentTarget.value;
      renderApplicationList();
    });
    $(selectors.applicationStatusFilter)?.addEventListener("change", (event) => {
      state.applicationStatusFilter = event.currentTarget.value;
      renderApplicationList();
    });
    $(selectors.contactSubmissionSearch)?.addEventListener("input", (event) => {
      state.contactSearch = event.currentTarget.value;
      renderContactSubmissionList();
    });
    $(selectors.contactSubmissionStatusFilter)?.addEventListener("change", (event) => {
      state.contactStatusFilter = event.currentTarget.value;
      renderContactSubmissionList();
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

    const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname)
      && new URLSearchParams(window.location.search).get("preview") === "1";

    if (isLocalPreview) {
      const userId = "00000000-0000-4000-8000-000000000001";
      state.user = { id: userId, email: "membro@riseupmaia.pt" };
      state.profile = { id: userId, email: "membro@riseupmaia.pt", role: "admin" };
      state.team = [
        { id: "member-1", user_id: userId, name: "Rita Martins", role: "Coordenação", email: "membro@riseupmaia.pt", is_active: true, joined_month: 9, joined_year: 2024 },
        { id: "member-2", user_id: "00000000-0000-4000-8000-000000000002", name: "João Silva", role: "Team Leader - Projetos e Inovação", email: "joao@riseupmaia.pt", is_active: true },
        { id: "member-3", user_id: "00000000-0000-4000-8000-000000000003", name: "Marta Costa", role: "Comunicação", email: "marta@riseupmaia.pt", is_active: true },
        { id: "member-4", user_id: "00000000-0000-4000-8000-000000000004", name: "Tiago Ferreira", role: "Comunicação", email: "tiago@riseupmaia.pt", is_active: true }
      ];
      state.projects = [
        { id: "project-1", title: "ChallANJE 2026", status: "in_review", client_name: "ANJE", deadline: "2026-09-30", sort_order: 1 },
        { id: "project-2", title: "Literacia Financeira", status: "published", client_name: "Universidade da Maia", deadline: "2026-10-18", sort_order: 2 }
      ];
      state.projectMembers = [{ project_id: "project-1", team_member_id: "member-1", is_responsible: true }];
      state.contactSubmissions = [{ id: "contact-preview-1", name: "Contacto de demonstração", email: "contacto@example.com", message: "Gostaria de receber mais informações sobre a Rise Up.", source_page: "contact", page_url: "https://riseupmaia.pt/contactos", language: "pt", status: "new", submitted_at: new Date().toISOString() }];
      state.auditLogs = [];
      showAppView();
      renderAll();
      showSection("dashboard");
      document.dispatchEvent(new CustomEvent("riseup:backoffice-ready"));
      return;
    }

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
