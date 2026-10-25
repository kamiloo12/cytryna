const $ = (sel) => document.querySelector(sel);
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c != null) node.append(c instanceof Node ? c : document.createTextNode(c));
  }
  return node;
};

let config = null;
let current = null;
let pollTimer = null;
const sceneValues = [];

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Błąd ${res.status}`);
  return data;
}

const inch = (v) => `${(+v).toFixed(3).replace(/\.?0+$/, "")}"`;
const cm = (v) => `${(v * 2.54).toFixed(2)} cm`;

function specsList(s) {
  const rows = [
    ["Format", s.trim.label],
    ["Liczba stron", s.page_count_ok
      ? `${s.page_count} (${s.image_count} kolorowanek + ${s.image_count} pustych + 4 strony wstępne)`
      : el("span", { class: "warn" }, `${s.page_count} – KDP wymaga 24–828 stron`)],
    ["Spad (bleed)", s.bleed],
    ["Marginesy", `zewn./góra/dół ${inch(s.margins.outside)}, wewn. (grzbiet) ${inch(s.margins.inside)} (min. KDP ${inch(s.margins.kdp_min_inside)})`],
    ["Obszar grafiki", `${inch(s.live_area.width)} × ${inch(s.live_area.height)} @ ${s.dpi} DPI`],
    ["Grubość grzbietu", `${inch(s.spine_width)} (${cm(s.spine_width)}) – papier ${s.paper === "white" ? "biały" : "kremowy"}`],
    ["Tekst na grzbiecie", s.spine_text ? "tak" : "nie (KDP: wymaga ponad 79 stron)"],
    ["Okładka (z grzbietem i spadami)", `${inch(s.cover.width)} × ${inch(s.cover.height)}`],
  ];
  return el("dl", {}, rows.map(([k, v]) => [el("dt", {}, k), el("dd", {}, v)]));
}

// ---------- New project form ----------

function renderScenes() {
  const count = Math.max(0, Math.min(+$("#count").value || 0, config.max_images));
  const list = $("#scenes");
  list.replaceChildren();
  for (let i = 0; i < count; i++) {
    const ta = el("textarea", {
      rows: 1,
      placeholder: `Scena ${i + 1}, np. dinozaur gra w piłkę na plaży`,
      oninput: (e) => { sceneValues[i] = e.target.value; },
    });
    ta.value = sceneValues[i] || "";
    list.append(el("li", {}, ta));
  }
}

let specsTimer = null;
function updateSpecs() {
  clearTimeout(specsTimer);
  specsTimer = setTimeout(async () => {
    const trim = config.formats.find((f) => f.id === $("#format").value);
    $("#format-note").textContent = trim ? trim.note : "";
    const count = +$("#count").value || config.min_images;
    $("#count-note").textContent =
      `Min. ${config.min_images} (KDP wymaga min. ${config.min_pages} stron), maks. ${config.max_images}. Każdy obrazek = 2 strony.`;
    try {
      const s = await api(`/api/specs?format=${encodeURIComponent($("#format").value)}&count=${count}&paper=${$("#paper").value}`);
      $("#specs").replaceChildren(el("strong", {}, "Parametry KDP"), specsList(s));
    } catch (e) {
      $("#specs").textContent = e.message;
    }
  }, 150);
}

async function submitForm(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const count = +form.get("count");
  const body = {
    format: form.get("format"),
    paper: form.get("paper"),
    title: form.get("title"),
    subtitle: form.get("subtitle"),
    author: form.get("author"),
    age: form.get("age"),
    theme: form.get("theme"),
    count,
    description: form.get("description"),
    with_cover: $("#with_cover").checked,
    scenes: Array.from({ length: count }, (_, i) => sceneValues[i] || ""),
  };
  $("#form-error").textContent = "";
  $("#create-btn").disabled = true;
  try {
    const project = await api("/api/projects", { method: "POST", body });
    sceneValues.length = 0;
    e.target.reset();
    initForm();
    location.hash = project.id;
  } catch (err) {
    $("#form-error").textContent = err.message;
  } finally {
    $("#create-btn").disabled = false;
  }
}

function initForm() {
  $("#format").value = config.formats[0].id;
  $("#age").value = config.default_age;
  $("#count").min = config.min_images;
  $("#count").max = config.max_images;
  $("#count").value = Math.max(20, config.min_images);
  renderScenes();
  updateSpecs();
}

// ---------- Project view ----------

const fileUrl = (pid, name, v, download) =>
  `/api/projects/${pid}/files/${name}?v=${v}${download ? "&download=1" : ""}`;

function stateBox(item, what) {
  if (item.status === "done" && item.file) {
    return el("img", { src: fileUrl(current.id, item.file, item.version), alt: what, loading: "lazy" });
  }
  if (item.status === "error") {
    return el("div", { class: "state err" }, "Błąd: ", item.error || "nieznany");
  }
  if (item.status === "skipped") return el("div", { class: "state" }, "Bez okładki");
  return el("div", { class: "state" }, el("div", { class: "spinner" }),
    item.status === "generating" ? "Generowanie…" : "W kolejce…");
}

function pageCard(item) {
  const busy = item.status === "pending" || item.status === "generating";
  const ta = el("textarea", { rows: 2, placeholder: "Opis sceny (puste = wg tematu)" });
  ta.value = item.scene;
  return el("div", { class: "card" },
    el("div", { class: "thumb" }, stateBox(item, `Strona ${item.index + 1}`)),
    el("div", { class: "body" },
      el("div", { class: "row" },
        el("strong", {}, `Obrazek ${item.index + 1}`),
        el("small", {}, `str. ${5 + item.index * 2}`)),
      ta,
      el("button", {
        class: "btn small", disabled: busy,
        onclick: async (e) => {
          e.target.disabled = true;
          try {
            showProject(await api(`/api/projects/${current.id}/images/${item.index}/regenerate`,
              { method: "POST", body: { scene: ta.value } }));
          } catch (err) { alert(err.message); e.target.disabled = false; }
        },
      }, "Generuj ponownie"),
    ));
}

function coverCard(cover) {
  const busy = cover.status === "pending" || cover.status === "generating";
  return el("div", { class: "card cover-card" },
    el("div", { class: "thumb" }, stateBox(cover, "Okładka")),
    el("div", { class: "body" },
      el("button", {
        class: "btn small", disabled: busy,
        onclick: async () => {
          try {
            showProject(await api(`/api/projects/${current.id}/cover/regenerate`, { method: "POST" }));
          } catch (err) { alert(err.message); }
        },
      }, cover.status === "skipped" ? "Generuj okładkę" : "Generuj ponownie")));
}

function showProject(p) {
  current = p;
  $("#view-new").classList.add("hidden");
  $("#view-project").classList.remove("hidden");
  $("#p-title").textContent = p.title;
  const age = config.ages.find((a) => a.id === p.age);
  $("#p-meta").textContent = `${p.specs.trim.label} · ${p.theme} · ${age ? age.label : ""} · generator: ${p.provider}`;

  const done = p.images.filter((i) => i.status === "done").length;
  const errors = p.images.filter((i) => i.status === "error").length;
  $("#p-bar").style.width = `${(100 * done) / p.images.length}%`;
  let msg = `Gotowe obrazki: ${done} / ${p.images.length}`;
  if (errors) msg += ` · błędy: ${errors} (popraw opis i wygeneruj ponownie)`;
  const b = p.build;
  if (b.status === "building") msg += " · budowanie PDF…";
  if (b.status === "error") msg += ` · błąd budowania: ${b.error}`;
  if (b.status === "stale") msg += " · obrazki zmienione od ostatniego PDF – zbuduj ponownie";
  $("#p-progress").textContent = msg;

  const coverBusy = p.with_cover && p.cover.status !== "done" && p.cover.status !== "error";
  $("#build-btn").disabled = done !== p.images.length || b.status === "building" || coverBusy;
  $("#build-btn").textContent = b.status === "building" ? "Budowanie…" :
    (b.status === "done" || b.status === "stale") ? "Zbuduj ponownie" : "Zbuduj manuskrypt PDF";

  const dl = $("#downloads");
  dl.replaceChildren();
  if (b.status === "done" || b.status === "stale") {
    const v = Math.round(b.built_at || 0);
    dl.append(el("a", { class: "btn primary", href: fileUrl(p.id, b.interior, v, true) }, "⬇ Manuskrypt (wnętrze) PDF"));
    if (b.cover) dl.append(el("a", { class: "btn primary", href: fileUrl(p.id, b.cover, v, true) }, "⬇ Okładka PDF"));
    dl.append(el("a", { class: "btn", href: fileUrl(p.id, b.interior, v), target: "_blank" }, "Podgląd PDF"));
  }

  const checklist = el("div", {},
    el("strong", {}, "Ustawienia przy publikacji w KDP"),
    specsList(p.specs),
    el("p", { class: "hint" },
      "W KDP wybierz: Ink and paper type – Black & white interior with ",
      p.paper === "white" ? "white" : "cream",
      " paper · Trim size – ", p.specs.trim.label.split(" (")[0],
      " · Bleed settings – No Bleed · Paperback cover finish – Matte lub Glossy. ",
      "Pole na kod kreskowy (tył okładki, prawy dolny róg) jest zostawione puste."));
  $("#p-specs").replaceChildren(checklist);

  $("#cover-card").replaceChildren(coverCard(p.cover));

  const active = document.activeElement;
  const editing = active && active.tagName === "TEXTAREA" && $("#gallery").contains(active);
  if (!editing) $("#gallery").replaceChildren(...p.images.map(pageCard));

  highlightList();
  const working = p.images.some((i) => i.status === "pending" || i.status === "generating")
    || ["pending", "generating"].includes(p.cover.status) || b.status === "building";
  clearTimeout(pollTimer);
  if (working) pollTimer = setTimeout(() => refresh(p.id), 2500);
}

async function refresh(pid) {
  try {
    const p = await api(`/api/projects/${pid}`);
    if (location.hash.slice(1) === pid) showProject(p);
  } catch (e) {
    console.error(e);
    pollTimer = setTimeout(() => refresh(pid), 5000);
  }
  loadList();
}

async function build() {
  $("#build-btn").disabled = true;
  try {
    showProject(await api(`/api/projects/${current.id}/build`, { method: "POST" }));
  } catch (e) {
    alert(e.message);
    $("#build-btn").disabled = false;
  }
}

// ---------- Navigation ----------

async function loadList() {
  const items = await api("/api/projects");
  $("#project-list").replaceChildren(...items.map((p) => el("li", {},
    el("a", { href: `#${p.id}`, "data-id": p.id },
      p.title, el("small", {}, `${p.format}" · ${p.image_count} obrazków`)))));
  highlightList();
}

function highlightList() {
  const id = location.hash.slice(1);
  document.querySelectorAll("#project-list a").forEach((a) =>
    a.classList.toggle("active", a.dataset.id === id));
}

async function route() {
  clearTimeout(pollTimer);
  const id = location.hash.slice(1);
  if (!id) {
    current = null;
    $("#view-project").classList.add("hidden");
    $("#view-new").classList.remove("hidden");
    highlightList();
    return;
  }
  try {
    showProject(await api(`/api/projects/${id}`));
  } catch (e) {
    location.hash = "";
  }
}

async function init() {
  config = await api("/api/config");
  const badge = $("#provider-badge");
  if (config.provider === "openai") {
    badge.textContent = `Generator: OpenAI (${config.model})`;
    badge.classList.add("live");
  } else if (config.provider === "demo") {
    badge.textContent = "Tryb DEMO – ustaw OPENAI_API_KEY, aby generować prawdziwe grafiki";
    badge.classList.add("demo");
  } else {
    badge.textContent = config.provider_error;
  }

  $("#format").replaceChildren(...config.formats.map((f) => el("option", { value: f.id }, f.label)));
  $("#age").replaceChildren(...config.ages.map((a) => el("option", { value: a.id }, a.label)));
  initForm();

  $("#count").addEventListener("input", () => { renderScenes(); updateSpecs(); });
  $("#format").addEventListener("change", updateSpecs);
  $("#paper").addEventListener("change", updateSpecs);
  $("#new-form").addEventListener("submit", submitForm);
  $("#build-btn").addEventListener("click", build);
  $("#new-btn").addEventListener("click", () => { location.hash = ""; });
  $("#home-link").addEventListener("click", (e) => { e.preventDefault(); location.hash = ""; });

  $("#paste-btn").addEventListener("click", () => {
    $("#paste-text").value = sceneValues.filter(Boolean).join("\n");
    $("#paste-dialog").showModal();
  });
  $("#paste-dialog").addEventListener("close", () => {
    if ($("#paste-dialog").returnValue !== "ok") return;
    const lines = $("#paste-text").value.split("\n")
      .map((l) => l.replace(/^\s*(\d+[.)]|[-*•])\s*/, "").trim()).filter(Boolean);
    sceneValues.length = 0;
    sceneValues.push(...lines);
    if ($("#paste-count").checked && lines.length) {
      $("#count").value = Math.max(lines.length, config.min_images);
    }
    renderScenes();
    updateSpecs();
  });

  window.addEventListener("hashchange", route);
  await loadList();
  route();
}

init();
