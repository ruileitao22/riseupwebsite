(function () {
  const defaultTables = {
    teamMembers: "team_members",
    projects: "projects",
    projectMembers: "project_members"
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

  function getConfig() {
    const source = window.RISEUP_SUPABASE || {};
    const publicKey = source.publicKey || source.anonKey || source.publishableKey || source.key || "";

    return {
      url: typeof source.url === "string" ? source.url.replace(/\/+$/, "") : "",
      publicKey,
      tables: { ...defaultTables, ...(source.tables || {}) }
    };
  }

  function isConfigured(config) {
    return Boolean(config.url && config.publicKey && !/COLOCA_AQUI|YOUR_|SUPABASE_/i.test(config.publicKey));
  }

  async function readError(response) {
    const text = await response.text();
    if (!text) {
      return `HTTP ${response.status}`;
    }

    try {
      const parsed = JSON.parse(text);
      return parsed.message || parsed.error || text;
    } catch (error) {
      return text;
    }
  }

  async function supabaseSelect(tableKey, params) {
    const config = getConfig();
    if (!isConfigured(config)) {
      throw new Error("O Supabase não está configurado.");
    }

    const table = config.tables[tableKey] || tableKey;
    const query = new URLSearchParams(params);
    const response = await fetch(`${config.url}/rest/v1/${encodeURIComponent(table)}?${query}`, {
      headers: {
        apikey: config.publicKey,
        Authorization: `Bearer ${config.publicKey}`
      }
    });

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    return response.json();
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

  function createMemberLinkIcon(type) {
    const icon = createElement("span", "public-member-link-icon");
    icon.setAttribute("aria-hidden", "true");

    if (type === "linkedin") {
      icon.innerHTML = `
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M6.94 8.5A1.56 1.56 0 1 1 6.94 5.38a1.56 1.56 0 0 1 0 3.12Zm-1.33 1.72H8.3V18.5H5.61Zm4.45 0h2.59v1.13h.04c.36-.65 1.24-1.33 2.55-1.33 2.73 0 3.24 1.8 3.24 4.14v4.34h-2.7v-3.85c0-.92-.02-2.1-1.28-2.1-1.28 0-1.47 1-1.47 2.03v3.92h-2.7Z"/>
        </svg>
      `;
      return icon;
    }

    if (type === "email") {
      icon.innerHTML = `
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M4 6.75A1.75 1.75 0 0 1 5.75 5h12.5A1.75 1.75 0 0 1 20 6.75v10.5A1.75 1.75 0 0 1 18.25 19H5.75A1.75 1.75 0 0 1 4 17.25Zm1.6.09 6.05 4.76a.56.56 0 0 0 .7 0l6.05-4.76a.25.25 0 0 0-.15-.44H5.75a.25.25 0 0 0-.15.44Zm12.8 1.78-5.2 4.1a1.96 1.96 0 0 1-2.4 0l-5.2-4.1v8.63c0 .19.16.35.35.35h12.5c.19 0 .35-.16.35-.35Z"/>
        </svg>
      `;
    }

    return icon;
  }

  function appendText(parent, tag, className, text) {
    if (!text) {
      return null;
    }

    const element = createElement(tag, className, text);
    parent.appendChild(element);
    return element;
  }

  function safeUrl(value, allowRelative) {
    if (!value) {
      return "";
    }

    if (allowRelative && !/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      return value;
    }

    try {
      const url = new URL(value, window.location.href);
      if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:") {
        return url.href;
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function getImageUrls(project) {
    const urls = [];

    if (Array.isArray(project.image_urls)) {
      urls.push(...project.image_urls);
    } else if (typeof project.image_urls === "string") {
      try {
        const parsed = JSON.parse(project.image_urls);
        if (Array.isArray(parsed)) {
          urls.push(...parsed);
        }
      } catch (error) {
        urls.push(project.image_urls);
      }
    }

    if (project.image_url) {
      urls.unshift(project.image_url);
    }

    return [...new Set(urls.map((url) => safeUrl(url, true)).filter(Boolean))];
  }

  function formatDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(document.documentElement.lang || "pt-PT", {
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function formatJoined(month, year) {
    if (!month && !year) {
      return "";
    }

    if (month && year) {
      const date = new Date(Number(year), Number(month) - 1, 1);
      if (!Number.isNaN(date.getTime())) {
        return `Na Rise Up desde ${new Intl.DateTimeFormat(document.documentElement.lang || "pt-PT", {
          month: "long",
          year: "numeric"
        }).format(date)}`;
      }
    }

    return `Na Rise Up desde ${year || month}`;
  }

  function parseDetails(details) {
    if (!details) {
      return {};
    }

    if (typeof details === "object") {
      return normalizeStructuredCopy(details);
    }

    try {
      return normalizeStructuredCopy(JSON.parse(details));
    } catch (error) {
      return {};
    }
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
      title: normalizeProjectText(project.title),
      category: normalizeProjectText(project.category),
      description: normalizeProjectText(project.description),
      tags: Array.isArray(project.tags)
        ? project.tags.map((tag) => normalizeProjectTag(tag))
        : typeof project.tags === "string"
          ? project.tags
            .split(",")
            .map((tag) => normalizeProjectTag(tag))
            .join(", ")
          : project.tags,
      details: normalizeStructuredCopy(project.details)
    };
  }

  function getTags(project) {
    if (Array.isArray(project.tags)) {
      return project.tags.map((tag) => String(tag).trim()).filter(Boolean);
    }

    if (typeof project.tags === "string") {
      return project.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    return [];
  }

  function setMeta(name, content) {
    if (!content) {
      return;
    }

    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", name);
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", content);
  }

  function updateProjectsSeo(projects) {
    const keywords = [...new Set(projects.flatMap((project) => [
      project.title,
      project.category,
      ...getTags(project)
    ].filter(Boolean)))];

    setMeta("keywords", keywords.join(", "));

    const graph = projects.map((project) => {
      const imageUrls = getImageUrls(project).map((url) => new URL(url, window.location.href).href);

      return {
        "@type": "CreativeWork",
        "@id": `${window.location.origin || "https://riseupmaia.pt"}/projetos.html#${project.slug || project.id}`,
        name: project.title,
        description: project.description || undefined,
        keywords: getTags(project).join(", ") || undefined,
        datePublished: project.project_date || undefined,
        genre: project.category || undefined,
        image: imageUrls.length ? imageUrls : undefined,
        url: project.external_link || `${window.location.origin || "https://riseupmaia.pt"}/projetos.html`
      };
    });

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${window.location.origin || "https://riseupmaia.pt"}/projetos.html#projects`,
      name: "Projetos Rise Up",
      hasPart: graph
    };

    let script = document.querySelector("#riseup-projects-jsonld");
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "riseup-projects-jsonld";
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(jsonLd);
  }

  function renderEmpty(container, message) {
    container.replaceChildren();
    const empty = createElement("article", "surface-card public-empty reveal is-visible");
    appendText(empty, "p", null, message);
    container.appendChild(empty);
  }

  async function initTeamPage() {
    const list = document.querySelector("[data-team-list]");
    if (!list) {
      return;
    }

    try {
      const [members, projects, links] = await Promise.all([
        supabaseSelect("teamMembers", {
          select: "id,name,role,description,photo_url,linkedin_url,email,joined_month,joined_year,is_active",
          is_active: "eq.true",
          order: "name.asc"
        }),
        supabaseSelect("projects", {
          select: "id,title,slug,category,project_date,status",
          status: "eq.published",
          order: "sort_order.asc,project_date.desc"
        }),
        supabaseSelect("projectMembers", {
          select: "project_id,team_member_id"
        })
      ]);

      const normalizedProjects = projects.map((project) => normalizeProjectRecord(project));

      if (!members.length) {
        renderEmpty(list, "Os perfis da equipa ainda estão a ser preparados.");
        return;
      }

      const projectsById = new Map(normalizedProjects.map((project) => [project.id, project]));
      const projectsByMember = links.reduce((map, link) => {
        const project = projectsById.get(link.project_id);
        if (!project) {
          return map;
        }

        const current = map.get(link.team_member_id) || [];
        current.push(project);
        map.set(link.team_member_id, current);
        return map;
      }, new Map());

      list.replaceChildren();
      members.forEach((member) => {
        const card = createElement("article", "member-card public-member-card reveal is-visible");
        const photoWrap = createElement("figure", "public-member-photo");

        if (member.photo_url) {
          const img = createElement("img");
          img.src = safeUrl(member.photo_url, true);
          img.alt = member.name || "Membro Rise Up";
          img.loading = "lazy";
          photoWrap.appendChild(img);
        } else {
          photoWrap.appendChild(createElement("span", null, (member.name || "RU").slice(0, 2).toUpperCase()));
        }

        const body = createElement("div", "member-meta");
        appendText(body, "h3", "member-name", member.name);
        appendText(body, "span", "member-role", member.role);
        appendText(body, "p", "member-copy", member.description);
        appendText(body, "p", "public-member-joined", formatJoined(member.joined_month, member.joined_year));

        const linksWrap = createElement("div", "public-member-links");
        const linkedinUrl = safeUrl(member.linkedin_url);
        if (linkedinUrl) {
          const linkedin = createElement("a", null, "LinkedIn");
          linkedin.href = linkedinUrl;
          linkedin.target = "_blank";
          linkedin.rel = "noreferrer";
          linkedin.prepend(createMemberLinkIcon("linkedin"));
          linksWrap.appendChild(linkedin);
        }

        if (member.email) {
          const email = createElement("a", null, "Email");
          email.href = `mailto:${member.email}`;
          email.prepend(createMemberLinkIcon("email"));
          linksWrap.appendChild(email);
        }

        if (linksWrap.children.length) {
          body.appendChild(linksWrap);
        }

        const memberProjects = projectsByMember.get(member.id) || [];
        if (memberProjects.length) {
          const projectsBlock = createElement("div", "public-member-projects");
          appendText(projectsBlock, "strong", null, "Projetos");
          const projectList = createElement("ul");
          memberProjects.forEach((project) => {
            appendText(projectList, "li", null, project.title);
          });
          projectsBlock.appendChild(projectList);
          body.appendChild(projectsBlock);
        }

        card.append(photoWrap, body);
        list.appendChild(card);
      });
    } catch (error) {
      console.warn("Rise Up team data fallback:", error);
      renderEmpty(list, "Não foi possível carregar os perfis da equipa neste momento.");
    }
  }

  function renderProject(project) {
    const article = createElement("article", "project-entry surface-card reveal is-visible");
    const gallery = createElement("div", "project-gallery");
    gallery.setAttribute("aria-label", `Galeria ${project.title}`);
    const urls = getImageUrls(project);

    if (urls.length) {
      urls.forEach((url) => {
        const figure = createElement("figure", "project-gallery-item");
        const img = createElement("img");
        img.src = url;
        img.alt = project.title || "Projeto Rise Up";
        img.loading = "lazy";
        figure.appendChild(img);
        gallery.appendChild(figure);
      });
    } else {
      const figure = createElement("figure", "project-gallery-item public-project-placeholder");
      figure.appendChild(createElement("span", null, "Rise Up"));
      gallery.appendChild(figure);
    }

    const content = createElement("div", "project-content");
    appendText(content, "span", "status-chip", project.category || "Projeto");
    appendText(content, "h2", null, project.title);

    const metaParts = [formatDate(project.project_date), project.category].filter(Boolean);
    appendText(content, "p", "project-meta", metaParts.join(" | "));

    const tags = getTags(project);
    if (tags.length) {
      const tagList = createElement("ul", "public-project-tags");
      tags.forEach((tag) => appendText(tagList, "li", null, tag));
      content.appendChild(tagList);
    }

    String(project.description || "")
      .split(/\n+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => appendText(content, "p", null, part));

    const details = parseDetails(project.details);
    appendText(content, "p", "project-meta", details.meta);

    if (Array.isArray(details.points) && details.points.length) {
      const points = createElement("ul", "project-points");
      details.points.forEach((point) => appendText(points, "li", null, point));
      content.appendChild(points);
    }

    appendText(content, "p", "project-brands", details.brands);
    appendText(content, "p", "project-result", details.result);

    const externalLink = safeUrl(project.external_link);
    if (externalLink) {
      const link = createElement("a", "button button-secondary public-project-link", "Abrir projeto");
      link.href = externalLink;
      link.target = "_blank";
      link.rel = "noreferrer";
      content.appendChild(link);
    }

    article.append(gallery, content);
    return article;
  }

  async function initProjectsPage() {
    const list = document.querySelector("[data-project-list]");
    if (!list) {
      return;
    }

    try {
      const projects = await supabaseSelect("projects", {
        select: "id,title,description,image_url,image_urls,project_date,category,tags,external_link,status,details,sort_order",
        status: "eq.published",
        order: "sort_order.asc,project_date.desc"
      });

      const normalizedProjects = projects.map((project) => normalizeProjectRecord(project));

      if (!normalizedProjects.length) {
        renderEmpty(list, "Ainda não existem projetos publicados.");
        return;
      }

      list.replaceChildren(...normalizedProjects.map(renderProject));
      updateProjectsSeo(normalizedProjects);

      if (typeof window.initProjectCarousels === "function") {
        window.initProjectCarousels();
      }
    } catch (error) {
      console.warn("Rise Up projects data fallback:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTeamPage();
    initProjectsPage();
  });
})();
