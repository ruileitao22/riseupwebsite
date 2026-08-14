(function () {
  if (window.RISEUP_CUSTOM_SELECTS?.refresh) {
    window.RISEUP_CUSTOM_SELECTS.refresh();
    return;
  }

  const instances = new WeakMap();
  let openInstance = null;
  let sequence = 0;
  let refreshQueued = false;
  let positionQueued = false;

  function optionLabel(option) {
    return option?.label || option?.textContent?.trim() || "Selecionar";
  }

  function close(instance, { focus = false } = {}) {
    if (!instance) return;
    instance.open = false;
    instance.panel.hidden = true;
    instance.wrapper.classList.remove("is-open", "opens-up");
    instance.trigger.setAttribute("aria-expanded", "false");
    instance.trigger.removeAttribute("aria-activedescendant");
    if (openInstance === instance) openInstance = null;
    if (focus) instance.trigger.focus();
  }

  function closeOpenSelect() {
    if (openInstance) close(openInstance);
  }

  function keepOpenSelectPositioned(event) {
    if (!openInstance) return;
    if (event?.target === openInstance.panel || openInstance.panel.contains(event?.target)) return;
    if (positionQueued) return;
    positionQueued = true;
    window.requestAnimationFrame(() => {
      positionQueued = false;
      if (openInstance?.open) positionPanel(openInstance);
    });
  }

  function setActive(instance, index, { scroll = true } = {}) {
    const options = Array.from(instance.panel.querySelectorAll("[data-bo-select-option]"));
    if (!options.length) {
      instance.activeIndex = -1;
      return;
    }
    let next = Math.max(0, Math.min(index, options.length - 1));
    const direction = next >= instance.activeIndex ? 1 : -1;
    while (options[next]?.disabled && next >= 0 && next < options.length) next += direction;
    if (!options[next] || options[next].disabled) return;
    instance.activeIndex = next;
    options.forEach((option, optionIndex) => {
      const active = optionIndex === next;
      option.classList.toggle("is-active", active);
      const nativeOption = instance.select.options[Number(option.dataset.boSelectOption)];
      option.setAttribute("aria-selected", nativeOption?.selected ? "true" : "false");
    });
    instance.trigger.setAttribute("aria-activedescendant", options[next].id);
    if (scroll) options[next].scrollIntoView({ block: "nearest" });
  }

  function positionPanel(instance) {
    const rect = instance.trigger.getBoundingClientRect();
    const gap = 6;
    const viewportGap = 12;
    const width = Math.min(Math.max(rect.width, 180), window.innerWidth - viewportGap * 2);
    instance.panel.style.width = `${width}px`;
    instance.panel.style.left = `${Math.max(viewportGap, Math.min(rect.left, window.innerWidth - width - viewportGap))}px`;
    instance.panel.style.top = `${rect.bottom + gap}px`;
    instance.panel.hidden = false;
    const panelHeight = instance.panel.getBoundingClientRect().height;
    const opensUp = rect.bottom + gap + panelHeight > window.innerHeight - viewportGap && rect.top > panelHeight + gap;
    instance.wrapper.classList.toggle("opens-up", opensUp);
    instance.panel.style.top = `${opensUp ? Math.max(viewportGap, rect.top - panelHeight - gap) : rect.bottom + gap}px`;
  }

  function open(instance) {
    if (instance.select.disabled) return;
    if (openInstance && openInstance !== instance) close(openInstance);
    render(instance);
    instance.open = true;
    instance.wrapper.classList.add("is-open");
    instance.trigger.setAttribute("aria-expanded", "true");
    openInstance = instance;
    positionPanel(instance);
    const selectedIndex = Array.from(instance.select.options).findIndex((option) => option.selected && !option.disabled);
    setActive(instance, selectedIndex >= 0 ? selectedIndex : 0, { scroll: false });
  }

  function selectOption(instance, optionIndex) {
    const option = instance.select.options[optionIndex];
    if (!option || option.disabled) return;
    if (instance.multiple) {
      option.selected = !option.selected;
      sync(instance);
      setActive(instance, optionIndex, { scroll: false });
      instance.select.dispatchEvent(new Event("input", { bubbles: true }));
      instance.select.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    const changed = instance.select.value !== option.value;
    instance.select.value = option.value;
    sync(instance);
    close(instance, { focus: true });
    if (changed) {
      instance.select.dispatchEvent(new Event("input", { bubbles: true }));
      instance.select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function createOption(instance, option) {
    const optionIndex = Array.from(instance.select.options).indexOf(option);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bo-select-option";
    button.id = `${instance.id}-option-${optionIndex}`;
    button.dataset.boSelectOption = String(optionIndex);
    button.setAttribute("role", "option");
    button.disabled = option.disabled;
    const label = document.createElement("span");
    label.textContent = optionLabel(option);
    const check = document.createElement("span");
    check.className = "bo-select-check";
    check.textContent = "✓";
    check.setAttribute("aria-hidden", "true");
    button.append(label, check);
    button.addEventListener("pointerdown", (event) => event.preventDefault());
    button.addEventListener("mouseenter", () => setActive(instance, optionIndex, { scroll: false }));
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectOption(instance, optionIndex);
    });
    return button;
  }

  function render(instance) {
    const fragment = document.createDocumentFragment();
    Array.from(instance.select.children).forEach((child) => {
      if (child.tagName === "OPTGROUP") {
        const group = document.createElement("div");
        group.className = "bo-select-group";
        group.textContent = child.label;
        fragment.appendChild(group);
        Array.from(child.children).forEach((option) => fragment.appendChild(createOption(instance, option)));
      } else if (child.tagName === "OPTION") {
        fragment.appendChild(createOption(instance, child));
      }
    });
    instance.panel.replaceChildren(fragment);
    sync(instance);
  }

  function sync(instance) {
    const selected = instance.select.selectedOptions[0] || instance.select.options[0];
    const selectedOptions = Array.from(instance.select.selectedOptions);
    instance.triggerText.textContent = instance.multiple
      ? selectedOptions.length > 2
        ? `${selectedOptions.length} pessoas selecionadas`
        : selectedOptions.map(optionLabel).join(", ") || "Selecionar responsáveis"
      : optionLabel(selected);
    instance.trigger.disabled = instance.select.disabled;
    instance.wrapper.classList.toggle("is-disabled", instance.select.disabled);
    instance.wrapper.classList.toggle("has-placeholder", instance.multiple ? !selectedOptions.length : !instance.select.value);
    Array.from(instance.panel.querySelectorAll("[data-bo-select-option]")).forEach((button) => {
      const option = instance.select.options[Number(button.dataset.boSelectOption)];
      const selectedOption = Boolean(option?.selected);
      button.classList.toggle("is-selected", selectedOption);
      button.setAttribute("aria-selected", selectedOption ? "true" : "false");
      button.disabled = Boolean(option?.disabled);
    });
  }

  function normalizeTypeahead(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-PT")
      .trim();
  }

  function handleTypeahead(instance, event) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1 || /\s/.test(event.key)) return false;
    event.preventDefault();
    if (!instance.open) open(instance);
    const options = Array.from(instance.panel.querySelectorAll("[data-bo-select-option]"));
    if (!options.length) return true;

    const now = Date.now();
    const key = normalizeTypeahead(event.key);
    const continuing = now - instance.typeaheadAt < 750;
    const previous = continuing ? instance.typeaheadBuffer : "";
    const repeatedInitial = previous && [...previous].every((character) => character === key);
    const searchTerm = repeatedInitial ? key : `${previous}${key}`;
    const startIndex = repeatedInitial ? instance.activeIndex + 1 : 0;
    const indexes = Array.from({ length: options.length }, (_, offset) => (startIndex + offset) % options.length);
    let match = indexes.find((index) => {
      if (options[index].disabled) return false;
      const nativeOption = instance.select.options[Number(options[index].dataset.boSelectOption)];
      return normalizeTypeahead(optionLabel(nativeOption)).startsWith(searchTerm);
    });

    if (match === undefined && searchTerm.length > 1) {
      match = indexes.find((index) => {
        if (options[index].disabled) return false;
        const nativeOption = instance.select.options[Number(options[index].dataset.boSelectOption)];
        return normalizeTypeahead(optionLabel(nativeOption)).startsWith(key);
      });
      instance.typeaheadBuffer = key;
    } else {
      instance.typeaheadBuffer = searchTerm;
    }
    instance.typeaheadAt = now;
    if (match !== undefined) setActive(instance, match);
    return true;
  }

  function handleKeydown(instance, event) {
    if (handleTypeahead(instance, event)) return;
    if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key) && !instance.open) {
      event.preventDefault();
      open(instance);
      if (event.key === "ArrowUp") setActive(instance, instance.select.options.length - 1);
      return;
    }
    if (!instance.open) return;
    const options = Array.from(instance.panel.querySelectorAll("[data-bo-select-option]"));
    if (event.key === "Escape") {
      event.preventDefault();
      close(instance, { focus: true });
    } else if (event.key === "Tab") {
      close(instance);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive(instance, instance.activeIndex + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(instance, event.key === "Home" ? 0 : options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const active = options[instance.activeIndex];
      if (active) selectOption(instance, Number(active.dataset.boSelectOption));
    }
  }

  function enhance(select) {
    if (!(select instanceof HTMLSelectElement) || select.dataset.boSelectEnhanced === "true") return;
    select.dataset.boSelectEnhanced = "true";
    sequence += 1;
    const id = `bo-select-${sequence}`;
    const wrapper = document.createElement("span");
    wrapper.className = "bo-select";
    wrapper.classList.toggle("is-multiple", select.multiple);
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "bo-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", `${id}-listbox`);
    const triggerText = document.createElement("span");
    triggerText.className = "bo-select-value";
    const arrow = document.createElement("span");
    arrow.className = "bo-select-arrow";
    arrow.setAttribute("aria-hidden", "true");
    trigger.append(triggerText, arrow);
    const panel = document.createElement("span");
    panel.className = "bo-select-panel";
    panel.id = `${id}-listbox`;
    panel.setAttribute("role", "listbox");
    if (select.multiple) panel.setAttribute("aria-multiselectable", "true");
    panel.hidden = true;

    select.parentNode.insertBefore(wrapper, select);
    wrapper.append(select, trigger, panel);
    select.classList.add("bo-select-native");
    select.tabIndex = -1;
    const instance = { id, select, wrapper, trigger, triggerText, panel, activeIndex: -1, open: false, multiple: select.multiple, typeaheadBuffer: "", typeaheadAt: 0 };
    instances.set(select, instance);
    render(instance);

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (instance.open) close(instance);
      else open(instance);
    });
    trigger.addEventListener("keydown", (event) => handleKeydown(instance, event));
    select.addEventListener("input", () => sync(instance));
    select.addEventListener("change", () => sync(instance));
    select.addEventListener("focus", () => trigger.focus());
    select.addEventListener("invalid", (event) => {
      event.preventDefault();
      wrapper.classList.add("is-invalid");
      trigger.focus();
    });
    new MutationObserver(() => {
      render(instance);
      if (instance.open) positionPanel(instance);
    }).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "label"] });
    select.form?.addEventListener("reset", () => window.setTimeout(() => sync(instance), 0));
  }

  function refresh() {
    document.querySelectorAll("select").forEach(enhance);
  }

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    queueMicrotask(() => {
      refreshQueued = false;
      refresh();
    });
  }

  document.addEventListener("pointerdown", (event) => {
    if (openInstance && !openInstance.wrapper.contains(event.target)) close(openInstance);
  });
  window.addEventListener("resize", closeOpenSelect, { passive: true });
  window.addEventListener("scroll", keepOpenSelectPositioned, { passive: true, capture: true });
  new MutationObserver(queueRefresh).observe(document.body, { childList: true, subtree: true });

  window.RISEUP_CUSTOM_SELECTS = Object.freeze({ refresh, close: closeOpenSelect });
  refresh();
})();
