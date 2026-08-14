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

  const projectEnglishFallbacks = {
    deeplearn25: {
      category: "International Conference",
      description: "Participation in logistics coordination and media production at one of Europe’s leading academic AI conferences.",
      tags: ["media", "logistics", "artificial intelligence"],
      details: {
        meta: "Date: July 2025 | Role: communications team",
        points: [
          "Support with participant accreditation and session management.",
          "Capture and editing of audiovisual content from talks, networking and the hackathon.",
          "Documentation and promotion of the event’s main moments.",
          "Production of videos used in a Porto Canal TV segment about DeepLearn."
        ]
      }
    },
    "hoje-2025": {
      title: "HOJE - National Exhibition of Young Entrepreneurs 2025",
      category: "Hackathon",
      description: "Participation in the organization and management of HOJE 2025, part of the National Exhibition of Young Entrepreneurs by Fundação da Juventude.",
      tags: ["hackathon", "entrepreneurship", "Fundação da Juventude"],
      details: {
        meta: "Date: June 3 and 4, 2025 | Location: Alfândega do Porto",
        points: [
          "Planning and logistics for the hackathon.",
          "Communication management, including invitations to mentors and speakers.",
          "Continuous follow-up and support for participating teams.",
          "Coordination of final presentations and material delivery."
        ],
        result: "Highlight: presentation of the Move Verde project, winner of two awards."
      }
    },
    "protocolo-aiesec": {
      title: "Partnership protocol with AIESEC",
      category: "Strategic Partnership",
      description: "Establishment of a partnership with AIESEC to promote personal development, youth leadership, networking and international opportunities.\nCo-organization of the event \"Transforma o teu futuro\", held on April 29, 2025 with workshops, talks and interactive activities for students from several fields.",
      tags: ["partnership", "leadership", "networking"],
      details: { meta: "Period: March 2025 - present" }
    },
    "qual-o-valor-das-coisas": {
      title: "What is the value of things? - Financial Literacy Workshops",
      category: "Training",
      description: "Development and delivery of financial literacy workshops for university students, with practical content and an interactive educational approach.",
      tags: ["financial literacy", "training", "students"],
      details: {
        meta: "Period: September 2024 to January 2025",
        points: [
          "Creation of content about budgeting, saving, investing and taxes.",
          "Team leadership in activity preparation and logistics planning.",
          "Adaptation of complex topics into clear and applicable formats.",
          "Promotion of a collaborative and participatory environment among students."
        ]
      }
    },
    "challanje-2024": {
      title: "Organization of the ChallANJE 2024 event",
      category: "Organization",
      description: "Planning and execution of the event in collaboration between Rise Up and ANJE, focused on operational coordination, multimedia content capture and real-time digital communication.",
      tags: ["event", "organization", "communication"],
      details: {
        meta: "Period: September 2024 to November 2024 | Location: Leixões Cruise Terminal",
        brands: "Featured companies: Porsche, Super Bock Group, Pedaços de Cacau, RFM and Bosch."
      }
    },
    "hoje-2024": {
      title: "HOJE - Young Entrepreneurs HackathON 2024",
      category: "Event",
      description: "First edition of Fundação da Juventude’s initiative, part of the National Exhibition of Young Entrepreneurs 2024.",
      tags: ["hackathon", "event", "entrepreneurship"],
      details: {
        meta: "Date: May 27, 2024 (9:00-20:00) | Location: Alfândega do Porto Congress Centre",
        points: [
          "Connection between young talent and leading brands in Portugal.",
          "Generation of new perspectives and ideas applicable to real challenges.",
          "Development of viable solutions in an intensive work context.",
          "Strengthening brand visibility and valuing young talent."
        ],
        brands: "Participating brands: Fruut, Super Bock, Ambar, Capgemini and Artnetic.",
        result: "Scale: approximately 100 participants."
      }
    },
    "tedx-figueiro-dos-vinhos": {
      title: "TEDx Figueiró dos Vinhos",
      category: "Multimedia Production",
      description: "Responsibility for audiovisual coverage and post-production of the event, focused on editorial quality and compliance with TEDx standards.",
      tags: ["video", "photography", "post-production"],
      details: {
        meta: "Date: May 2024",
        points: [
          "Video capture of talks, behind the scenes and audience interaction.",
          "Photographic coverage for communication and archive.",
          "Creation of short-form content for social media.",
          "Editing of full talks for publication on the official TEDx YouTube channel."
        ]
      }
    },
    "challanje-2023": {
      category: "Creativity Marathon",
      tags: ["creativity", "communication", "operations"],
      details: {
        points: [
          "Participation in the 4th edition, with 150 students and 6 companies.",
          "Development of the event communication plan.",
          "Operational management with a team of 30 young volunteers.",
          "Resolution of last-minute challenges and unforeseen issues."
        ]
      }
    }
  };

  let publicProjects = [];

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

    const lang = document.documentElement.lang === "en" ? "en" : "pt";
    const prefix = lang === "en" ? "At Rise Up since" : "Na Rise Up desde";
    const locale = lang === "en" ? "en-GB" : "pt-PT";

    if (month && year) {
      const date = new Date(Number(year), Number(month) - 1, 1);
      if (!Number.isNaN(date.getTime())) {
        return `${prefix} ${new Intl.DateTimeFormat(locale, {
          month: "long",
          year: "numeric"
        }).format(date)}`;
      }
    }

    return `${prefix} ${year || month}`;
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

  function getCurrentLanguage() {
    return document.documentElement.lang === "en" ? "en" : "pt";
  }

  function getProjectTranslation(project, lang) {
    const translations = project?.details?.translations;
    if (!translations || typeof translations !== "object") {
      return {};
    }

    const copy = translations[lang];
    return copy && typeof copy === "object" ? copy : {};
  }

  function getProjectFallback(project, lang) {
    return lang === "en" ? projectEnglishFallbacks[project.slug] || {} : {};
  }

  function localizeProject(project, lang) {
    if (lang !== "en") {
      return project;
    }

    const fallback = getProjectFallback(project, lang);
    const translation = getProjectTranslation(project, lang);
    const details = {
      ...(project.details || {}),
      ...(fallback.details || {}),
      ...(translation.details || {})
    };

    return {
      ...project,
      title: translation.title || fallback.title || project.title,
      category: translation.category || fallback.category || project.category,
      description: translation.description || fallback.description || project.description,
      tags: translation.tags || fallback.tags || project.tags,
      details
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
          select: "id,name,role,description,photo_url,linkedin_url,email,joined_month,joined_year,is_active,is_legend",
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
      const orderedMembers = [...members].sort((left, right) => Number(left.is_legend) - Number(right.is_legend) || (left.name || "").localeCompare(right.name || "", "pt"));
      orderedMembers.forEach((member, index) => {
        if (member.is_legend && (index === 0 || !orderedMembers[index - 1].is_legend)) {
          const heading = createElement("div", "public-team-group-heading");
          appendText(heading, "span", "eyebrow", "Rise Up Legends");
          appendText(heading, "h2", null, "Legado que continua a inspirar");
          list.appendChild(heading);
        }
        const card = createElement("article", "member-card public-member-card reveal is-visible");
        card.tabIndex = 0;
        card.setAttribute("aria-label", `Ver descrição de ${member.name || "membro Rise Up"}`);
        const cardInner = createElement("div", "public-member-card-inner");
        const front = createElement("div", "public-member-card-face public-member-card-front");
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

        const frontMeta = createElement("div", "member-meta");
        appendText(frontMeta, "h3", "member-name", member.name);
        appendText(frontMeta, "span", "member-role", member.role);

        const back = createElement("div", "public-member-card-face public-member-card-back");
        const body = createElement("div", "public-member-card-back-content");
        appendText(body, "span", "public-member-card-kicker", member.role || "Rise Up");
        appendText(body, "h3", "member-name", member.name);
        appendText(body, "p", "member-copy", member.description || "Sem descrição disponível.");
        const joined = appendText(body, "p", "public-member-joined", formatJoined(member.joined_month, member.joined_year));
        if (joined) {
          joined.dataset.joinedMonth = member.joined_month || "";
          joined.dataset.joinedYear = member.joined_year || "";
        }

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
          appendText(projectsBlock, "strong", null, document.documentElement.lang === "en" ? "Projects" : "Projetos");
          const projectList = createElement("ul");
          memberProjects.forEach((project) => {
            appendText(projectList, "li", null, project.title);
          });
          projectsBlock.appendChild(projectList);
          body.appendChild(projectsBlock);
        }

        front.append(photoWrap, frontMeta);
        back.appendChild(body);
        cardInner.append(front, back);
        card.appendChild(cardInner);
        list.appendChild(card);
      });

      document.addEventListener("riseup:languagechange", () => {
        list.querySelectorAll(".public-member-joined").forEach((element) => {
          element.textContent = formatJoined(element.dataset.joinedMonth, element.dataset.joinedYear);
        });

        list.querySelectorAll(".public-member-projects strong").forEach((element) => {
          element.textContent = document.documentElement.lang === "en" ? "Projects" : "Projetos";
        });
      });
    } catch (error) {
      console.warn("Rise Up team data fallback:", error);
      renderEmpty(list, "Não foi possível carregar os perfis da equipa neste momento.");
    }
  }

  function renderProject(project) {
    const lang = getCurrentLanguage();
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
      const link = createElement("a", "button button-secondary public-project-link", lang === "en" ? "Open project" : "Abrir projeto");
      link.href = externalLink;
      link.target = "_blank";
      link.rel = "noreferrer";
      content.appendChild(link);
    }

    article.append(gallery, content);
    return article;
  }

  async function initLegendsPage() {
    const list = document.querySelector("[data-legends-list]");
    if (!list) return;

    try {
      const legends = await supabaseSelect("teamMembers", {
        select: "id,name,role,description,photo_url,linkedin_url,email,joined_month,joined_year,is_legend",
        is_active: "eq.true",
        is_legend: "eq.true",
        order: "name.asc"
      });
      if (!legends.length) {
        renderEmpty(list, "Os Rise Up Legends serão apresentados aqui em breve.");
        return;
      }

      list.replaceChildren();
      legends.forEach((member) => {
        const card = createElement("article", "member-card public-member-card reveal is-visible");
        card.tabIndex = 0;
        card.setAttribute("aria-label", `Ver descrição de ${member.name || "Rise Up Legend"}`);
        const cardInner = createElement("div", "public-member-card-inner");
        const front = createElement("div", "public-member-card-face public-member-card-front");
        const photo = createElement("figure", "public-member-photo");
        if (member.photo_url) {
          const image = createElement("img");
          image.src = safeUrl(member.photo_url, true);
          image.alt = member.name || "Rise Up Legend";
          image.loading = "lazy";
          photo.appendChild(image);
        } else {
          photo.appendChild(createElement("span", null, (member.name || "RU").slice(0, 2).toUpperCase()));
        }
        const frontMeta = createElement("div", "member-meta");
        appendText(frontMeta, "h3", "member-name", member.name);
        appendText(frontMeta, "span", "member-role", member.role);

        const back = createElement("div", "public-member-card-face public-member-card-back");
        const body = createElement("div", "public-member-card-back-content");
        appendText(body, "span", "public-member-card-kicker", member.role || "Rise Up");
        appendText(body, "h3", "member-name", member.name);
        appendText(body, "p", "member-copy", member.description || "Sem descrição disponível.");
        const linkedin = safeUrl(member.linkedin_url);
        if (linkedin) {
          const links = createElement("div", "public-member-links");
          const link = createElement("a", null, "LinkedIn");
          link.href = linkedin;
          link.target = "_blank";
          link.rel = "noreferrer";
          links.appendChild(link);
          body.appendChild(links);
        }
        front.append(photo, frontMeta);
        back.appendChild(body);
        cardInner.append(front, back);
        card.appendChild(cardInner);
        list.appendChild(card);
      });
    } catch (error) {
      console.warn("Rise Up Legends data fallback:", error);
      renderEmpty(list, "Não foi possível carregar os Rise Up Legends neste momento.");
    }
  }

  async function initProjectsPage() {
    const list = document.querySelector("[data-project-list]");
    if (!list) {
      return;
    }

    const renderProjects = () => {
      const localizedProjects = publicProjects.map((project) => localizeProject(project, getCurrentLanguage()));
      list.replaceChildren(...localizedProjects.map(renderProject));
      updateProjectsSeo(localizedProjects);

      if (typeof window.initProjectCarousels === "function") {
        window.initProjectCarousels();
      }
    };

    try {
      const projects = await supabaseSelect("projects", {
        select: "id,slug,title,description,image_url,image_urls,project_date,category,tags,external_link,status,details,sort_order",
        status: "eq.published",
        order: "sort_order.asc,project_date.desc"
      });

      const normalizedProjects = projects.map((project) => normalizeProjectRecord(project));

      if (!normalizedProjects.length) {
        renderEmpty(list, "Ainda não existem projetos publicados.");
        return;
      }

      publicProjects = normalizedProjects;
      renderProjects();
      document.addEventListener("riseup:languagechange", renderProjects);
    } catch (error) {
      console.warn("Rise Up projects data fallback:", error);
    }
  }

  const initPublicData = () => {
    initTeamPage();
    initLegendsPage();
    initProjectsPage();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPublicData, { once: true });
  } else {
    initPublicData();
  }
})();
