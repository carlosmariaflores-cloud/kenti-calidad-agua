/* =========================== Guardado =========================== */
let appInfo = null, saveT = null, dirty = false;
const LS_KEY = "kenti-calidad-agua-v1";
function touch(){
  dirty = true; $("#save-state").textContent = tx("Guardando…", "Saving…");
  clearTimeout(saveT); saveT = setTimeout(save, 600);
}
async function save(){
  const body = JSON.stringify(state);
  if (appInfo){
    try {
      const r = await fetch("/api/datos", {method: "PUT", headers: {"Content-Type": "application/json", "X-Kenti": "1"}, body});
      if (!r.ok) throw new Error(await r.text());
      dirty = false; $("#save-state").textContent = tx("Guardado en ", "Saved to ") + appInfo.archivo; return;
    } catch(e){ $("#save-state").textContent = tx("No se pudo guardar: ", "Could not save: ") + e.message; return; }
  }
  try { localStorage.setItem(LS_KEY, body); dirty = false; $("#save-state").textContent = tx("Guardado en este navegador", "Saved in this browser"); }
  catch(e){ $("#save-state").textContent = tx("Sin guardado: abrí Kenti desde su ejecutable para que los datos queden en un archivo.", "Not saved: open Kenti from its executable so that data are kept in a file."); }
}
function validState(s){ return s && typeof s === "object" && Array.isArray(s.muestras) && Array.isArray(s.cols); }
function upgrade(s){
  s.cfg = Object.assign(defaultCfg(), s.cfg || {});
  s.cfg.activas = Object.assign(defaultCfg().activas, s.cfg.activas || {});
  s.cfg.propia = Object.assign(defaultCfg().propia, s.cfg.propia || {});
  s.proyecto = Object.assign({nombre: "", cliente: "", campania: ""}, s.proyecto || {});
  s.sitios = (s.sitios || []).map(x => Object.assign(newSitio(), x));
  s.cols = s.cols.map(c => Object.assign(newCol(c.p), c));
  s.muestras = s.muestras.map(m => Object.assign(newMuestra(), m, {v: m.v || {}}));
  return s;
}

/* =========================== Tooltip / toast =========================== */
function showTip(html, ev){
  const t = $("#tip"); t.innerHTML = html; t.hidden = false;
  const r = t.getBoundingClientRect();
  let x = ev.clientX + 14, y = ev.clientY + 14;
  if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
  if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
  t.style.left = Math.max(8, x) + "px"; t.style.top = Math.max(8, y) + "px";
}
const hideTip = () => { $("#tip").hidden = true; };
// Cualquier elemento con data-tip muestra su texto al pasar el cursor.
document.addEventListener("mouseover", ev => { const el = ev.target.closest?.("[data-tip]"); if (el) showTip(el.dataset.tip, ev); });
document.addEventListener("mousemove", ev => { const el = ev.target.closest?.("[data-tip]"); if (el) showTip(el.dataset.tip, ev); else if (!$("#tip").hidden && !ev.target.closest?.(".hit")) hideTip(); });
let toastT;
function toast(msg, undo){
  const el = $("#toast");
  el.innerHTML = `<span>${esc(msg)}</span>` + (undo ? `<button type="button">${tx("Deshacer", "Undo")}</button>` : "");
  el.hidden = false;
  if (undo) el.querySelector("button").onclick = () => { undo(); el.hidden = true; };
  clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, undo ? 9000 : 4000);
}
function snapshotUndo(){ const snap = JSON.stringify(state); return () => { state = upgrade(JSON.parse(snap)); touch(); renderPanel(); }; }
const tipAttr = html => html ? ` data-tip="${esc(html)}"` : "";

/* =========================== Pestañas =========================== */
let panel = "datos", PRE = new Map(), CTL = [];
function recalcular(){
  prepColumnas();
  PRE = new Map(state.muestras.map(m => [m.id, valoresMuestra(m)]));
  CTL = controles();
  const e = CTL.filter(i => i.sev === "error").length, w = CTL.filter(i => i.sev === "aviso").length, b = $("#ctl-badge");
  b.hidden = !(e || w); b.textContent = e || w; b.className = "badge" + (e ? " err" : ""); b.title = tx(`${e} errores, ${w} avisos`, `${e} errors, ${w} warnings`);
}
function setPanel(p){
  panel = p;
  $$(".tab").forEach(t => t.setAttribute("aria-selected", t.dataset.p === p ? "true" : "false"));
  $$(".panel").forEach(s => s.hidden = s.id !== "p-" + p);
  renderPanel();
}
function renderPanel(){
  recalcular();
  ({datos: renderDatos, eval: renderEval, ica: renderIca, iones: renderIones, conv: renderConv, ctl: renderCtl, normas: renderNormas})[panel]();
}

/* =========================== Estados y veredictos =========================== */
const ST = EN ? {ok: ["Complies", "ok"], exc: ["Exceeds", "exc"], g1: ["Slight to moderate", "warn"], g2: ["Severe", "exc"], nc: ["Inconclusive", "nc"], sd: ["No data", "sd"]}
  : {ok: ["Cumple", "ok"], exc: ["Supera", "exc"], g1: ["Ligera a moderada", "warn"], g2: ["Severa", "exc"], nc: ["No concluyente", "nc"], sd: ["Sin dato", "sd"]};
const chip = (st, txt) => `<span class="st ${ST[st]?.[1] || st}">${esc(txt || ST[st]?.[0] || st)}</span>`;
const verChip = v => `<span class="ver ${v.cls}">${esc(v.txt.replace(/:.*/, ""))}</span>`;
// Valor de una muestra en la unidad con que se muestra el parámetro.
function valTxt(pid, val, ctx){
  if (!val) return "";
  const p = P[pid], d = dispOf(pid), conv = x => fmtV(fromCanon(p, x, d.u, d.f, ctx || {}));
  const pfx = val.calc ? `<span class="calc" title="${tx("Calculado con los iones", "Calculated from the ions")}">calc.</span> ` : "";
  switch (val.q){
    case "num": return pfx + conv(val.x);
    case "abs": return tx("Ausencia", "Absence");
    case "pres": return tx("Presencia", "Presence");
    case "lt": return okNum(val.ld) ? `&lt; ${conv(val.ld)}` : "ND";
    case "gt": return `&gt; ${conv(val.gt)}`;
    case "nd": return "ND";
    case "err": return `<span class="bad">${esc(val.raw)}</span>`;
  }
  return "";
}
// Límite de la norma en la unidad de la columna (el original va en el tooltip).
function limDisp(norma, pid, L, ctx){
  const p = P[pid], d = dispOf(pid), conv = x => fmtV(fromCanon(p, x, d.u, d.f, ctx || {}));
  if (!L) return "—";
  if (L.cGr) return `${conv(L.cGr[0])} / ${conv(L.cGr[1])}`;
  if (L.cMin != null && L.cMax != null) return `${conv(L.cMin)}–${conv(L.cMax)}`;
  if (L.cMin != null) return `≥ ${conv(L.cMin)}`;
  return L.cMax === 0 ? tx("Ausencia", "Absence") : `≤ ${conv(L.cMax)}`;
}
function limTip(norma, pid, L, j){
  const parts = [`<b>${esc(norma.corto)}</b> · ${esc(limTxt(norma, pid, L))}`, T[L.t] ? `${tx("Tipo", "Type")}: ${T[L.t]}` : ""];
  if (L.cond) parts.push(esc(L.cond));
  if (L.nota) parts.push(esc(L.nota));
  if (j?.motivo) parts.push(esc(j.motivo));
  if (j && okNum(j.exc) && (j.st === "exc" || j.st === "g2" || j.st === "g1")) parts.push(tx(`${fmtN(j.exc + 1, 1)} veces el ${j.bajo ? "mínimo (por debajo)" : "límite"}.`, `${fmtN(j.exc + 1, 1)} times the ${j.bajo ? "minimum (below)" : "limit"}.`));
  return parts.filter(Boolean).join("<br>");
}

/* =========================== 1 · Datos =========================== */
const TIPOS_SITIO = ["Río o arroyo", "Lago o laguna", "Vega o bofedal", "Vertiente", "Pozo (subterránea)", "Salmuera", "Red de distribución", "Efluente", "Otro"];
const TIPOS_SITIO_EN = {"Río o arroyo": "River or stream", "Lago o laguna": "Lake or pond", "Vega o bofedal": "High-Andean wetland (vega, bofedal)", "Vertiente": "Spring", "Pozo (subterránea)": "Well (groundwater)", "Salmuera": "Brine", "Red de distribución": "Distribution network", "Efluente": "Effluent", "Otro": "Other"};
const tipoSitioL = t => EN ? (TIPOS_SITIO_EN[t] || t) : t;
function paramOptions(sel){
  return `<option value="">${tx("— sin asignar —", "— unassigned —")}</option>` + GRUPOS.map(([g, gl]) => `<optgroup label="${esc(gl)}">${PARAMS.filter(p => p.g === g).map(p => `<option value="${p.id}"${p.id === sel ? " selected" : ""}>${esc(p.n)}</option>`).join("")}</optgroup>`).join("") + `<option value="__quitar">${tx("✕ Quitar columna", "✕ Remove column")}</option>`;
}
function renderDatos(){
  const p = $("#p-datos"), pr = state.proyecto;
  p.innerHTML = `<div class="panel-head"><div><h2>${tx("Datos", "Data")}</h2>
    <p>${tx("Una fila por muestra y una columna por parámetro. Ningún parámetro es obligatorio: Kenti evalúa lo que haya y dice qué faltó. Cada columna declara su unidad; se convierte sola al comparar.", "One row per sample and one column per parameter. No parameter is mandatory: Kenti assesses whatever is there and states what is missing. Each column declares its unit, which is converted automatically for the comparison.")}</p></div>
    <div class="actions"><button class="btn primary" id="d-pegar" type="button">${tx("Pegar tabla…", "Paste table…")}</button><button class="btn" id="d-cargar" type="button">${tx("Cargar Excel…", "Load Excel…")}</button>
    <button class="btn" id="d-planilla" type="button">${tx("Descargar planilla", "Download template")}</button><button class="btn" id="d-ejemplo" type="button">${tx("Tabla de ejemplo", "Example table")}</button>${state.muestras.length || state.cols.length ? `<button class="btn ghost danger" id="d-vaciar" type="button">${tx("Borrar tabla", "Clear table")}</button>` : ""}</div></div>
  ${state.ejemplo ? `<div class="note"><span>${tx("<b>Tabla de ejemplo.</b> Datos ficticios de tres puntos de la Puna para recorrer el programa. Borrala antes de cargar los tuyos, o pegá tu tabla con «Reemplazar todo».", "<b>Example table.</b> Fictitious data from three points in the Puna to explore the program. Clear it before loading your own, or paste your table with “Replace all”.")}</span><button type="button" id="d-vaciar2">${tx("Borrar tabla", "Clear table")}</button></div>` : ""}
  <div class="fsec"><div class="fgrid">
    <label class="fld">${tx("Proyecto", "Project")}<input data-pr="nombre" value="${esc(pr.nombre)}" placeholder="${tx("Monitoreo Salar…", "Salt flat monitoring…")}"></label>
    <label class="fld">${tx("Cliente", "Client")}<input data-pr="cliente" value="${esc(pr.cliente)}"></label>
    <label class="fld">${tx("Campaña", "Survey")}<input data-pr="campania" value="${esc(pr.campania)}" placeholder="${tx("Campaña 2, junio 2026", "Survey 2, June 2026")}"></label>
  </div></div>
  ${state.cols.length || state.muestras.length ? "" : `<div class="empty"><p><b>${tx("Para empezar, pegá la tabla del laboratorio.", "To start, paste the laboratory table.")}</b></p>
    <p class="hint">${tx("Sirve con las muestras en filas o con el formato de informe (parámetros en filas y muestras en columnas), con las unidades en el encabezado, en una fila o en una columna aparte. Valores como «&lt;0,005», «ND», «s/d», «Ausencia» o «&gt;2400» se leen tal cual.", "It works with samples in rows or with the report layout (parameters in rows and samples in columns), with units in the header, in a row or in a separate column. Values such as “&lt;0.005”, “ND”, “n/a”, “Absent” or “&gt;2400” are read as they are.")}</p>
    <div class="actions" style="justify-content:center"><button class="btn primary" id="d-pegar2" type="button">${tx("Pegar tabla…", "Paste table…")}</button><button class="btn" id="d-ejemplo2" type="button">${tx("Ver con una tabla de ejemplo", "Try an example table")}</button></div></div>`}
  <div class="card"${state.cols.length || state.muestras.length ? "" : " hidden"}><div class="card-head"><div><h3>${tx("Muestras", "Samples")}</h3>
    <div class="sub">${tx("Encabezado: parámetro, unidad, forma (nitrato como NO₃⁻ o como N) y fracción (total o disuelta). La conductividad de campo puede compensarse a 25 °C.", "Header: parameter, unit, form (nitrate as NO₃⁻ or as N) and fraction (total or dissolved). Field conductivity can be compensated to 25 °C.")}</div></div>
    <div class="actions"><select id="d-addp" class="mini-sel"><option value="">${tx("+ Agregar parámetro…", "+ Add parameter…")}</option>${GRUPOS.map(([g, gl]) => `<optgroup label="${esc(gl)}">${PARAMS.filter(q => q.g === g).map(q => `<option value="${q.id}">${esc(q.n)}</option>`).join("")}</optgroup>`).join("")}</select></div></div>
    <div class="sheet" id="g-muestras"></div>
    <p class="hint" style="margin-top:8px">${tx("Pegá desde Excel sobre cualquier celda: se llena hacia la derecha y hacia abajo. Si lo que pegás trae encabezados, se abre el asistente de importación.", "Paste from Excel onto any cell: it fills to the right and downwards. If what you paste has headers, the import assistant opens.")}</p></div>
  <div class="card"${state.sitios.length ? "" : " hidden"}><div class="card-head"><div><h3>${tx("Sitios", "Sites")}</h3>
    <div class="sub">${tx("Se crean solos con los códigos de las muestras. La temperatura media anual del aire define el límite de fluoruro del CAA; la clase de río, los estándares japoneses.", "Created automatically from the sample codes. The mean annual air temperature sets the CAA fluoride limit; the river class, the Japanese standards.")}</div></div></div>
    <div class="sheet" id="g-sitios"></div></div>`;
  $$("[data-pr]", p).forEach(i => i.oninput = () => { pr[i.dataset.pr] = i.value; touch(); });
  $("#d-pegar").onclick = () => abrirImport();
  if ($("#d-pegar2")) $("#d-pegar2").onclick = () => abrirImport();
  $("#d-cargar").onclick = () => $("#file-xlsx").click();
  $("#d-planilla").onclick = async () => saveBlob(await planillaCarga(), tx("Planilla de carga - Kenti Calidad de Agua", "Data entry template - Kenti Water Quality"));
  const borrar = () => {
    const u = snapshotUndo(), n = state.muestras.length;
    const usados = new Set(state.muestras.map(m => m.sitio));
    state.cols = []; state.muestras = []; state.ejemplo = false;
    state.sitios = state.sitios.filter(s => !usados.has(s.codigo) && (s.nombre || s.tAire));
    touch(); renderPanel(); toast(tx(`Se borró la tabla (${n} muestras).`, `Table cleared (${n} samples).`), u);
  };
  if ($("#d-vaciar")) $("#d-vaciar").onclick = borrar;
  if ($("#d-vaciar2")) $("#d-vaciar2").onclick = borrar;
  const ejemplo = () => {
    if (state.muestras.length && !state.ejemplo && !confirm(tx("La tabla de ejemplo reemplaza las muestras cargadas. Se puede deshacer. ¿Seguir?", "The example table replaces the loaded samples. This can be undone. Continue?"))) return;
    const u = snapshotUndo();
    incorporar(analizarTabla(textoAGrilla(EN ? EJEMPLO_TSV.replace(/(\d),(\d)/g, "$1.$2") : EJEMPLO_TSV)), "reemplazar");
    for (const [cod, nom, tipo, alt, t] of EJEMPLO_SITIOS){ const s = state.sitios.find(x => x.codigo === cod); if (s) Object.assign(s, {nombre: nom, tipo, alt, tAire: t}); }
    state.proyecto = Object.assign({}, state.proyecto, {nombre: state.proyecto.nombre || tx("Ejemplo · monitoreo de agua en la Puna", "Example · water monitoring in the Puna"), campania: state.proyecto.campania || tx("Campaña de ejemplo", "Example survey")});
    state.ejemplo = true; touch(); renderPanel(); toast(tx("Se cargó la tabla de ejemplo.", "The example table was loaded."), u);
  };
  $("#d-ejemplo").onclick = ejemplo;
  if ($("#d-ejemplo2")) $("#d-ejemplo2").onclick = ejemplo;
  $("#d-addp").onchange = ev => { const id = ev.target.value; if (!id) return; state.cols.push(newCol(id, P[id].n)); touch(); renderPanel(); };
  if (state.cols.length || state.muestras.length) gridMuestras($("#g-muestras"));
  if (state.sitios.length) gridSitios($("#g-sitios"));
}
const META_COLS = [["sitio", tx("Sitio", "Site"), 90], ["fecha", tx("Fecha", "Date"), 128], ["hora", tx("Hora", "Time"), 80], ["lab", tx("ID lab.", "Lab ID"), 90]];
function gridMuestras(host){
  const cols = state.cols;
  const colHead = c => {
    const p = P[c.p];
    const us = p ? unitsOf(p).map(u => `<option value="${esc(u[0])}"${u[0] === c.u ? " selected" : ""}>${esc(uL(u[0]))}</option>`).join("") : "";
    const fs = p?.forms ? `<select data-cf="f" data-id="${c.id}" title="${tx("Forma en que se expresa", "Form in which it is expressed")}">${Object.keys(p.forms).map(f => `<option value="${f}"${f === c.f ? " selected" : ""}>${tx("como ", "as ") + f}</option>`).join("")}</select>` : "";
    const fr = p && p.g === "metal" ? `<select data-cf="frac" data-id="${c.id}" title="${tx("Fracción", "Fraction")}"><option value="total"${c.frac === "total" ? " selected" : ""}>total</option><option value="disuelta"${c.frac === "disuelta" ? " selected" : ""}>${tx("disuelta", "dissolved")}</option></select>` : "";
    const comp = c.p === "ce" ? `<label class="cmp" title="${tx("La conductividad se midió sin compensar: Kenti la lleva a 25 °C con la temperatura de la muestra", "Conductivity was measured uncompensated: Kenti brings it to 25 °C using the sample temperature")}"><input type="checkbox" data-cf="comp25" data-id="${c.id}"${c.comp25 ? " checked" : ""}> ${tx("a 25 °C", "to 25 °C")}</label>` : "";
    const ld = p && !["temp", "ph", "ce", "orp", "dens", "odsat"].includes(c.p) ? `<input data-cf="ld" data-id="${c.id}" value="${esc(c.ld)}" placeholder="${tx("LD", "DL")}" title="${tx("Límite de detección para los «ND» sin valor", "Detection limit for “ND” values without a number")}">` : "";
    return `<th class="pc${c.p ? "" : " unmapped"}" title="${esc(c.h || "")}"><select data-cf="p" data-id="${c.id}">${paramOptions(c.p)}</select>
      ${p ? `<div class="ctl-row"><select data-cf="u" data-id="${c.id}"${c.uSup ? ` class="sup" title="${tx("El encabezado no traía unidad: se asumió esta", "The header had no unit: this one was assumed")}"` : ""}>${us}</select>${fs}${fr}</div><div class="ctl-row">${ld}${comp}</div>` : `<div class="hint">${esc(c.h || "")}</div>`}</th>`;
  };
  const tr = (m, i, isNew) => `<tr data-i="${i}"${isNew ? ' class="new"' : ""}><td class="st-c"></td>${META_COLS.map(([k, , w]) => `<td style="min-width:${w}px"><input data-k="${k}" value="${esc(m[k])}"${k === "fecha" ? ' type="date"' : k === "hora" ? ' type="time"' : ""}></td>`).join("")}${cols.map(c => `<td><input class="n" data-c="${c.id}" value="${esc(m.v[c.id])}" autocomplete="off"></td>`).join("")}<td style="min-width:160px"><input data-k="obs" value="${esc(m.obs)}"></td><td class="del">${isNew ? "" : `<button type="button" title="${tx("Quitar muestra", "Remove sample")}" aria-label="${tx("Quitar muestra", "Remove sample")}">×</button>`}</td></tr>`;
  const draw = () => {
    host.innerHTML = `<table class="rg wq"><thead><tr><th></th>${META_COLS.map(([, l, w]) => `<th style="min-width:${w}px">${l}</th>`).join("")}${cols.map(colHead).join("")}<th>${tx("Observaciones", "Remarks")}</th><th></th></tr></thead>
      <tbody>${state.muestras.map((m, i) => tr(m, i, false)).join("")}${tr(newMuestra(), state.muestras.length, true)}</tbody></table>`;
    marcar();
  };
  const marcar = () => {
    $$("tbody tr", host).forEach(t => {
      const m = state.muestras[+t.dataset.i]; if (!m) return;
      $$("input[data-c]", t).forEach(inp => {
        const pv = parseVal(inp.value, COLMODO[inp.dataset.c] || "coma");
        inp.classList.toggle("bad", pv.q === "err"); inp.classList.toggle("cens", ["lt", "gt", "nd"].includes(pv.q));
      });
      const iss = CTL.filter(x => x.ref?.m === m.id), worst = iss.length ? iss.reduce((w, x) => SEV[x.sev] < SEV[w] ? x.sev : w, "info") : "";
      const st = t.querySelector(".st-c");
      st.innerHTML = worst ? `<span class="dot ${worst}"${tipAttr(iss.map(x => `${x.sev === "error" ? "Error" : x.sev === "aviso" ? tx("Aviso", "Warning") : tx("Nota", "Note")}: ${esc(x.msg)}`).join("<br>"))}></span>` : "";
    });
  };
  draw();
  let rT;
  const later = () => { clearTimeout(rT); rT = setTimeout(() => { recalcular(); marcar(); }, 400); };
  host.oninput = ev => {
    const el = ev.target, trEl = el.closest("tr");
    if (el.dataset.cf) return;
    const i = +trEl.dataset.i;
    if (i >= state.muestras.length){ state.muestras.push(newMuestra()); trEl.classList.remove("new"); trEl.querySelector(".del").innerHTML = `<button type="button" title="${tx("Quitar muestra", "Remove sample")}">×</button>`; trEl.insertAdjacentHTML("afterend", tr(newMuestra(), state.muestras.length, true)); }
    const m = state.muestras[i];
    if (el.dataset.k) m[el.dataset.k] = el.value; else if (el.dataset.c) m.v[el.dataset.c] = el.value;
    if (el.dataset.k === "sitio") asegurarSitios();
    state.ejemplo = false; touch(); later();
  };
  host.onchange = ev => {
    const el = ev.target, k = el.dataset.cf; if (!k) return;
    const c = state.cols.find(x => x.id === el.dataset.id);
    if (k === "p"){
      if (el.value === "__quitar"){ const u = snapshotUndo(); state.cols = state.cols.filter(x => x !== c); state.muestras.forEach(m => delete m.v[c.id]); touch(); renderPanel(); toast(tx(`Se quitó la columna ${c.h || ""}`, `Column ${c.h || ""} removed`), u); return; }
      c.p = el.value; const p = P[c.p];
      if (p){ const e = leerEncabezado(p, c.h || "", ""); c.u = e.u || canonUnit(p); c.f = e.f || p.fc || ""; c.uSup = !e.u; }
      touch(); renderPanel(); return;
    }
    if (k === "comp25") c.comp25 = el.checked; else c[k] = el.value;
    if (k === "u") { c.uSup = false; el.classList.remove("sup"); }
    touch(); later();
  };
  host.onclick = ev => {
    const b = ev.target.closest(".del button"); if (!b) return;
    const i = +b.closest("tr").dataset.i, u = snapshotUndo();
    state.muestras.splice(i, 1); touch(); recalcular(); draw(); toast(tx("Se quitó la muestra ", "Sample removed: ") + (i + 1), u);
  };
  host.onkeydown = ev => {
    const el = ev.target; if (!(el.dataset.c || el.dataset.k) || ev.key !== "Enter") return;
    const sel = el.dataset.c ? `[data-c="${el.dataset.c}"]` : `[data-k="${el.dataset.k}"]`;
    const nx = el.closest("tr").nextElementSibling?.querySelector(sel); if (nx){ ev.preventDefault(); nx.focus(); }
  };
  host.onpaste = ev => {
    const el = ev.target; if (!(el.dataset.c || el.dataset.k)) return;
    const txt = ev.clipboardData.getData("text/plain"); if (!/[\t\n]/.test(txt.trim())) return;
    ev.preventDefault();
    const grid = textoAGrilla(txt);
    const heads = Math.max(grid[0].filter(c => matchParam(c)).length, grid.filter(r => matchParam(r[0])).length);
    if (heads >= 2){ abrirImport(txt); return; }
    const order = [...META_COLS.map(([k]) => ({k})), ...state.cols.map(c => ({c: c.id})), {k: "obs"}];
    const i0 = +el.closest("tr").dataset.i, c0 = order.findIndex(o => el.dataset.c ? o.c === el.dataset.c : o.k === el.dataset.k);
    const u = snapshotUndo();
    grid.forEach((cells, di) => {
      while (state.muestras.length <= i0 + di) state.muestras.push(newMuestra());
      const m = state.muestras[i0 + di];
      cells.forEach((v, dj) => { const o = order[c0 + dj]; if (!o) return; if (o.c) m.v[o.c] = v.trim(); else m[o.k] = o.k === "fecha" ? leerFecha(v) : o.k === "hora" ? leerHora(v) : v.trim(); });
    });
    asegurarSitios(); touch(); renderPanel(); toast(tx(`Se pegaron ${grid.length} filas`, `${grid.length} rows pasted`), u);
  };
}
function gridSitios(host){
  const F = EN ? [["codigo", "Code", 90], ["nombre", "Name", 180], ["tipo", "Type", 150], ["lat", "Latitude", 100], ["lon", "Longitude", 100], ["alt", "Elevation (m a.s.l.)", 90], ["tAire", "Mean annual air T (°C)", 110], ["claseJp", "River class (Japan)", 90]]
    : [["codigo", "Código", 90], ["nombre", "Nombre", 180], ["tipo", "Tipo", 150], ["lat", "Latitud", 100], ["lon", "Longitud", 100], ["alt", "Altitud (m s.n.m.)", 90], ["tAire", "T media anual del aire (°C)", 110], ["claseJp", "Clase de río (Japón)", 90]];
  host.innerHTML = `<table class="rg"><thead><tr>${F.map(([, l, w]) => `<th style="min-width:${w}px">${l}</th>`).join("")}<th></th></tr></thead><tbody>
    ${state.sitios.map((s, i) => `<tr data-i="${i}">${F.map(([k]) => `<td>${k === "tipo" ? `<select data-s="tipo"><option value=""></option>${TIPOS_SITIO.map(t => `<option value="${t}"${t === s.tipo ? " selected" : ""}>${tipoSitioL(t)}</option>`).join("")}</select>` : k === "claseJp" ? `<select data-s="claseJp"><option value="">${tx("(general)", "(default)")}</option>${Object.keys(JP_RIO).map(t => `<option${t === s.claseJp ? " selected" : ""}>${t}</option>`).join("")}</select>` : `<input data-s="${k}" value="${esc(s[k])}"${["lat", "lon", "alt", "tAire"].includes(k) ? ' class="n" inputmode="decimal"' : ""}>`}</td>`).join("")}
    <td class="del">${state.muestras.some(m => m.sitio === s.codigo) ? "" : `<button type="button" title="${tx("Quitar sitio", "Remove site")}">×</button>`}</td></tr>`).join("")}</tbody></table>`;
  host.oninput = host.onchange = ev => {
    const el = ev.target; if (!el.dataset.s) return;
    const s = state.sitios[+el.closest("tr").dataset.i], k = el.dataset.s;
    if (k === "codigo"){ const old = s.codigo; state.muestras.forEach(m => { if (m.sitio === old) m.sitio = el.value; }); }
    s[k] = el.value; touch();
  };
  host.onclick = ev => { const b = ev.target.closest(".del button"); if (!b) return; state.sitios.splice(+b.closest("tr").dataset.i, 1); touch(); renderPanel(); };
}

/* ---------- Asistente de importación ---------- */
let IMP = null;
function abrirImport(texto){
  const dlg = $("#dlg");
  IMP = {texto: texto || "", hojas: null, hoja: 0, res: null, err: null};
  dlg.innerHTML = `<div class="dlg-box" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
    <div class="dlg-head"><h3 id="dlg-t">${tx("Importar tabla", "Import table")}</h3><button class="btn ghost" data-x type="button" aria-label="${tx("Cerrar", "Close")}">✕</button></div>
    <div id="imp-src"></div><div id="imp-prev"></div>
    <div class="dlg-foot"><span class="hint" id="imp-hint"></span><div class="actions"><button class="btn" data-x type="button">${tx("Cancelar", "Cancel")}</button>
    ${state.muestras.length ? `<button class="btn" id="imp-rep" type="button" disabled>${tx("Reemplazar todo", "Replace all")}</button>` : ""}<button class="btn primary" id="imp-add" type="button" disabled>${state.muestras.length ? tx("Agregar a lo cargado", "Add to loaded data") : tx("Importar", "Import")}</button></div></div></div>`;
  dlg.hidden = false;
  $$("[data-x]", dlg).forEach(b => b.onclick = cerrarImport);
  dlg.onclick = ev => { if (ev.target === dlg) cerrarImport(); };
  $("#imp-add").onclick = () => aplicarImport("agregar");
  if ($("#imp-rep")) $("#imp-rep").onclick = () => aplicarImport("reemplazar");
  dibujarImportSrc();
}
function cerrarImport(){ $("#dlg").hidden = true; $("#dlg").innerHTML = ""; IMP = null; }
function dibujarImportSrc(){
  const src = $("#imp-src");
  if (IMP.hojas){
    src.innerHTML = `<label class="fld" style="max-width:360px">${tx("Hoja del libro", "Worksheet")}<select id="imp-hoja">${IMP.hojas.map((h, i) => `<option value="${i}"${i === IMP.hoja ? " selected" : ""}>${esc(h.name)} (${h.rows.length} ${tx("filas", "rows")})</option>`).join("")}</select></label>`;
    $("#imp-hoja").onchange = ev => { IMP.hoja = +ev.target.value; analizarImport(); };
  } else {
    src.innerHTML = `<textarea id="imp-txt" class="paste" placeholder="${tx("Copiá la tabla en Excel (Ctrl+C) y pegala acá (Ctrl+V)", "Copy the table in Excel (Ctrl+C) and paste it here (Ctrl+V)")}">${esc(IMP.texto)}</textarea>`;
    $("#imp-txt").oninput = ev => { IMP.texto = ev.target.value; analizarImport(); };
    setTimeout(() => $("#imp-txt")?.focus(), 0);
  }
  analizarImport();
}
function analizarImport(){
  const rows = IMP.hojas ? IMP.hojas[IMP.hoja].rows : IMP.texto.trim() ? textoAGrilla(IMP.texto) : null;
  const prev = $("#imp-prev");
  IMP.res = null;
  if (!rows){ prev.innerHTML = ""; setImpBtns(false); return; }
  try { IMP.res = analizarTabla(rows); }
  catch(e){ prev.innerHTML = `<div class="note">${esc(e.message)}</div>`; setImpBtns(false); return; }
  const r = IMP.res, rec = r.cols.filter(c => c.p), no = r.cols.filter(c => !c.p), sup = rec.filter(c => c.uSup);
  prev.innerHTML = `<div class="imp-sum"><div><b>${r.muestras.length}</b> ${tx("muestras", "samples")}</div><div><b>${rec.length}</b> ${tx("parámetros reconocidos", "parameters recognised")}</div>${no.length ? `<div><b>${no.length}</b> ${tx("columnas sin reconocer", "unrecognised columns")}</div>` : ""}<div class="muted">${esc(r.formato)}</div></div>
    <div class="imp-cols">${rec.map(c => `<span class="pchip"${tipAttr(`${tx("Encabezado", "Header")}: ${esc(c.h)}`)}>${esc(P[c.p].n)} <small>${esc(unitTxt(P[c.p], c.u, P[c.p].forms ? c.f : ""))}${c.frac === "disuelta" ? tx(" · disuelto", " · dissolved") : ""}${c.uSup ? tx(" · unidad supuesta", " · assumed unit") : ""}</small></span>`).join("")}
    ${no.map(c => `<span class="pchip no">${esc(c.h)} <small>${tx("sin reconocer", "unrecognised")}</small></span>`).join("")}</div>
    ${r.notas.length ? `<ul class="imp-notas">${r.notas.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
    ${sup.length ? `<p class="note">${tx(`Sin unidad en el encabezado: ${sup.map(c => P[c.p].n).join(", ")}. Se asumió la unidad habitual; revisala en la tabla antes de evaluar.`, `No unit in the header: ${sup.map(c => P[c.p].n).join(", ")}. The usual unit was assumed; check it in the table before assessing.`)}</p>` : ""}
    ${no.length ? `<p class="hint">${tx("Las columnas sin reconocer se importan igual; en la tabla se les asigna el parámetro o se quitan.", "Unrecognised columns are imported anyway; in the table you can assign them a parameter or remove them.")}</p>` : ""}`;
  setImpBtns(r.muestras.length > 0);
}
function setImpBtns(on){ $("#imp-add").disabled = !on; if ($("#imp-rep")) $("#imp-rep").disabled = !on; }
function aplicarImport(modo){
  if (!IMP?.res) return;
  const u = snapshotUndo(), n = IMP.res.muestras.length;
  incorporar(IMP.res, modo); if (modo === "reemplazar") state.ejemplo = false; cerrarImport(); touch(); setPanel("datos");
  toast(EN ? `${modo === "reemplazar" ? "Table replaced with" : "Imported"} ${n} samples.` : `Se ${modo === "reemplazar" ? "reemplazó la tabla con" : "importaron"} ${n} muestras.`, u);
}
async function importarArchivo(f){
  try {
    const hojas = (await readXlsx(await f.arrayBuffer())).filter(h => h.rows.some(r => r.some(Boolean)));
    if (!hojas.length) throw new Error(tx("El libro no tiene hojas con datos.", "The workbook has no sheets with data."));
    abrirImport();
    IMP.hojas = hojas;
    const score = h => { try { const r = analizarTabla(h.rows); return r.cols.filter(c => c.p).length * 10 + r.muestras.length; } catch(e){ return -1; } };
    IMP.hoja = hojas.map(score).reduce((b, s, i, a) => s > a[b] ? i : b, 0);
    dibujarImportSrc();
  } catch(e){ toast(tx("No se pudo leer el archivo: ", "Could not read the file: ") + e.message); }
}

/* =========================== 2 · Evaluación normativa =========================== */
let evVista = "muestra", evMuestra = null, evNorma = null;
const normasDeUso = uso => allNormas().filter(n => n.uso === uso && (n.id !== "propia" || Object.keys(n.lim).length));
const activasDeUso = uso => normasDeUso(uso).filter(n => state.cfg.activas[n.id] !== false);
function renderEval(){
  const p = $("#p-eval"), c = state.cfg;
  const usos = USOS.map(u => `<button type="button" data-uso="${u.id}" aria-pressed="${c.uso === u.id}">${esc(u.l)}</button>`).join("");
  const todas = normasDeUso(c.uso), act = activasDeUso(c.uso);
  const U = USOS.find(u => u.id === c.uso);
  let body = "";
  if (!state.muestras.length) body = `<div class="empty"><p>${tx("Todavía no hay muestras. Cargalas en la pestaña 1.", "There are no samples yet. Load them on tab 1.")}</p></div>`;
  else if (!todas.length) body = industrialInfo();
  else if (!act.length) body = `<div class="empty"><p>${tx("Elegí al menos una norma.", "Choose at least one standard.")}</p></div>`;
  p.innerHTML = `<div class="panel-head"><div><h2>${tx("Evaluación normativa", "Regulatory assessment")}</h2><p>${tx("Cada muestra contra las normas del uso elegido. Un parámetro que no se midió no se inventa: queda como faltante y se dice en las salvedades.", "Each sample against the standards for the chosen use. A parameter that was not measured is never invented: it is listed as missing and stated in the caveats.")}</p></div></div>
  <div class="seg wrap-seg" id="ev-uso">${usos}</div>
  <p class="hint" style="margin:-8px 0 0">${esc(U.d)}</p>
  ${todas.length ? `<div class="norm-chips">${todas.map(n => `<label class="nchip${state.cfg.activas[n.id] !== false ? " on" : ""}"${tipAttr(`${esc(n.nombre)}<br>${esc(n.escala)} · ${esc(n.tipo)}<br>${esc(n.ambito)}`)}><input type="checkbox" data-n="${n.id}"${state.cfg.activas[n.id] !== false ? " checked" : ""}> <b>${esc(n.corto)}</b> <span class="esc">${esc(n.escala)}</span></label>`).join("")}</div>` : ""}
  ${c.uso === "ambiental" ? `<label class="fld inline">${tx("Clase de río (Japón)", "River class (Japan)")} <select id="ev-jpc">${Object.keys(JP_RIO).map(k => `<option${k === c.jpClase ? " selected" : ""}>${k}</option>`).join("")}</select> <span class="hint">${esc(JP_USO[c.jpClase] || "")}. ${tx("Un sitio puede tener su propia clase en «Sitios».", "A site can have its own class under “Sites”.")}</span></label>` : ""}
  ${c.uso === "industrial" ? `<p class="note"><span>${tx("No hay un nivel guía legal general para el agua de proceso: depende del equipo y del tratamiento. Japón es el único marco cargado que fija la calidad del río apta para captar agua industrial. Langelier y Ryznar están en «Iones y derivados»; los límites de un proceso se cargan como norma propia.", "There is no general legal guideline value for process water: it depends on the equipment and the treatment. Japan is the only framework loaded that sets the river quality suitable for abstracting industrial water. Langelier and Ryznar are under “Ions and derived”; the limits of a process are entered as a custom standard.")}</span></p>
    <label class="fld inline">${tx("Agua industrial (Japón)", "Industrial water (Japan)")} <select id="ev-jpi">${(EN ? [["1", "Class 1 · ordinary sedimentation (river C)"], ["2", "Class 2 · chemical treatment (river D)"], ["3", "Class 3 · special treatment (river E)"]] : [["1", "Clase 1 · sedimentación común (río C)"], ["2", "Clase 2 · con reactivos (río D)"], ["3", "Clase 3 · tratamiento especial (río E)"]]).map(([k, l]) => `<option value="${k}"${k === c.jpInd ? " selected" : ""}>${l}</option>`).join("")}</select></label>` : ""}
  ${c.uso === "ganado" ? `<label class="fld inline">${tx("Especie", "Species")} <select id="ev-gan">${GANADO.map(g => `<option value="${g.id}"${g.id === c.ganado ? " selected" : ""}>${g.l}</option>`).join("")}</select> <span class="hint">${tx("cambia los límites de cobre y de sólidos disueltos", "changes the copper and dissolved solids limits")}</span></label>` : ""}
  ${body || `<div id="ev-res"></div><div id="ev-det"></div>`}`;
  $$("#ev-uso button").forEach(b => b.onclick = () => { c.uso = b.dataset.uso; touch(); renderEval(); });
  $$("[data-n]", p).forEach(i => i.onchange = () => { c.activas[i.dataset.n] = i.checked; touch(); renderEval(); });
  if ($("#ev-jpc")) $("#ev-jpc").onchange = ev => { c.jpClase = ev.target.value; touch(); renderEval(); };
  if ($("#ev-jpi")) $("#ev-jpi").onchange = ev => { c.jpInd = ev.target.value; touch(); renderEval(); };
  if ($("#ev-gan")) $("#ev-gan").onchange = ev => { c.ganado = ev.target.value; touch(); renderEval(); };
  if (body) return;
  // Resumen: muestras × normas
  const R = new Map(state.muestras.map(m => [m.id, new Map(act.map(n => [n.id, evaluar(m, n, PRE.get(m.id))]))]));
  if (!state.muestras.some(m => m.id === evMuestra)) evMuestra = state.muestras[0].id;
  if (!act.some(n => n.id === evNorma)) evNorma = act[0].id;
  $("#ev-res").innerHTML = `<div class="card"><div class="card-head"><div><h3>${tx("Resumen", "Summary")}</h3><div class="sub">${tx("Veredicto por muestra y norma, con los parámetros evaluados sobre los que fija la norma. Clic en una celda para ver el detalle.", "Verdict per sample and standard, with the parameters assessed out of those set by the standard. Click a cell for details.")}</div></div></div>
    <div class="scroll-x"><table class="res sumt"><thead><tr><th>${tx("Muestra", "Sample")}</th>${act.map(n => `<th${tipAttr(esc(n.nombre))}>${esc(n.corto)}</th>`).join("")}</tr></thead><tbody>
    ${state.muestras.map(m => `<tr><td><span class="code">${esc(muestraLabel(m))}</span></td>${act.map(n => { const r = R.get(m.id).get(n.id); return `<td class="clk" data-m="${m.id}" data-nn="${n.id}"${tipAttr(esc(r.ver.txt))}>${verChip(r.ver)} <small class="muted">${r.medidos}/${r.total}</small></td>`; }).join("")}</tr>`).join("")}
    </tbody></table></div>
    <p class="hint leyenda">${EN ? `${verChip({cls: "ok", txt: "Complies"})} with all parameters of the standard · ${verChip({cls: "parcial", txt: "Complies for measured parameters"})} complies, but parameters are missing or inconclusive · ${verChip({cls: "warn", txt: "Acceptability"})} exceeds only non-health values or slight restriction · ${verChip({cls: "exc", txt: "Does not comply"})} exceeds a health value or severe restriction`
      : `${verChip({cls: "ok", txt: "Cumple"})} con todos los parámetros de la norma · ${verChip({cls: "parcial", txt: "Cumple en lo medido"})} cumple, pero faltan parámetros o hay no concluyentes · ${verChip({cls: "warn", txt: "Aceptabilidad"})} supera sólo valores no sanitarios o restricción ligera · ${verChip({cls: "exc", txt: "No cumple"})} supera un valor de salud o de restricción severa`}</p></div>`;
  $$("#ev-res td.clk").forEach(td => td.onclick = () => { evMuestra = td.dataset.m; evNorma = td.dataset.nn; dibujarDetalle(act, R); $("#ev-det").scrollIntoView({behavior: "smooth", block: "start"}); });
  dibujarDetalle(act, R);
}
function industrialInfo(){
  if (EN) return `<div class="card"><div class="card-head"><div><h3>There is no general legal guideline value for industrial use</h3></div></div>
    <p>The quality an industry needs depends on the process: boiler, cooling, washing or process water have different requirements, set by the equipment manufacturer or the process itself. That is why Kenti does not invent a generic table.</p>
    <p>What it does offer for this use:</p>
    <ul><li>The <b>Langelier</b> and <b>Ryznar</b> indices (scale-forming or corrosive tendency), on the “Ions and derived” tab.</li>
    <li>A <b>custom standard</b> with the client’s or the process limits, under “Standards and criteria”. If you set it for industrial use, it appears here and enters the WQI.</li></ul>
    <div class="actions"><button class="btn" type="button" onclick="setPanel('iones')">See Langelier and Ryznar</button><button class="btn" type="button" onclick="setPanel('normas')">Enter custom standard</button></div></div>`;
  return `<div class="card"><div class="card-head"><div><h3>No hay un nivel guía legal general para uso industrial</h3></div></div>
    <p>La calidad que necesita una industria depende del proceso: agua de caldera, de enfriamiento, de lavado o de proceso tienen exigencias distintas, y las fija el fabricante del equipo o el propio proceso. Por eso Kenti no inventa una tabla genérica.</p>
    <p>Lo que sí ofrece para este uso:</p>
    <ul><li>Los índices de <b>Langelier</b> y de <b>Ryznar</b> (tendencia incrustante o corrosiva), en la pestaña «Iones y derivados».</li>
    <li>Una <b>norma propia</b> con los límites del cliente o del proceso, en «Normas y criterios». Si la marcás para uso industrial, aparece acá y entra en el ICA.</li></ul>
    <div class="actions"><button class="btn" type="button" onclick="setPanel('iones')">Ver Langelier y Ryznar</button><button class="btn" type="button" onclick="setPanel('normas')">Cargar norma propia</button></div></div>`;
}
function dibujarDetalle(act, R){
  const host = $("#ev-det"), m = state.muestras.find(x => x.id === evMuestra), pre = PRE.get(m.id);
  const vista = `<div class="seg" id="ev-vista"><button type="button" data-v="muestra" aria-pressed="${evVista === "muestra"}">${tx("Por muestra", "By sample")}</button><button type="button" data-v="norma" aria-pressed="${evVista === "norma"}">${tx("Por norma", "By standard")}</button></div>`;
  if (evVista === "muestra"){
    const res = act.map(n => R.get(m.id).get(n.id));
    const pids = PARAMS.map(q => q.id).filter(pid => act.some(n => n.lim[pid] != null) || pre.vals[pid]);
    const fila = pid => {
      const q = P[pid], v = pre.vals[pid], d = dispOf(pid);
      const cells = res.map(r => {
        const f = r.filas.find(x => x.pid === pid), spec = r.norma.lim[pid];
        if (spec == null) return `<td class="nl"></td>`;
        if (!f){ const L = resolverLimite(r.norma, pid, ctxLimites(m, pre.vals)); return `<td class="lim sd"${tipAttr(L ? limTip(r.norma, pid, L) : "")}><span class="lv">${L ? limDisp(r.norma, pid, L, pre.ctx) : "—"}</span>${chip("sd")}</td>`; }
        return `<td class="lim ${f.st}"${tipAttr(limTip(r.norma, pid, f.L, f))}><span class="lv">${limDisp(r.norma, pid, f.L, pre.ctx)}</span>${chip(f.st)}</td>`;
      }).join("");
      const vs = v?.suma ? "" : valTxt(pid, v, pre.ctx);
      return `<tr><td>${esc(q.n)}${v?.col?.frac === "disuelta" ? ` <small class="muted">${tx("disuelto", "dissolved")}</small>` : ""}</td><td class="u">${esc(unitTxt(q, d.u, q.forms ? d.f : ""))}</td><td class="val">${vs || '<span class="muted">—</span>'}</td>${cells}</tr>`;
    };
    const grupos = GRUPOS.map(([g, gl]) => { const ids = pids.filter(pid => P[pid].g === g); return ids.length ? `<tr class="grp"><td colspan="${3 + res.length}">${esc(gl)}</td></tr>` + ids.map(fila).join("") : ""; }).join("");
    host.innerHTML = `<div class="card"><div class="card-head"><div><h3>${tx("Detalle", "Detail")}</h3><div class="sub">${tx("Límites llevados a la unidad de cada columna. Pasá el cursor por una celda para ver el valor original de la norma, la condición aplicada y las notas.", "Limits converted to the unit of each column. Hover over a cell to see the original value of the standard, the condition applied and the notes.")}</div></div>
      <div class="actions">${vista}<select id="ev-m" class="mini-sel">${state.muestras.map(x => `<option value="${x.id}"${x.id === m.id ? " selected" : ""}>${esc(muestraLabel(x))}</option>`).join("")}</select></div></div>
      <div class="scroll-x"><table class="res evt"><thead><tr><th>${tx("Parámetro", "Parameter")}</th><th>${tx("Unidad", "Unit")}</th><th>${tx("Valor", "Value")}</th>${res.map(r => `<th${tipAttr(esc(r.norma.nombre))}>${esc(r.norma.corto)}<br>${verChip(r.ver)}</th>`).join("")}</tr></thead><tbody>${grupos}</tbody></table></div></div>
      <div class="two">${res.map(r => cardSalvedades(r)).join("")}</div>
      <div class="card"><div class="card-head"><div><h3>${tx("Texto para el informe", "Text for the report")}</h3><div class="sub">${tx("Borrador de la sección de resultados para esta muestra. Copialo y ajustalo.", "Draft of the results section for this sample. Copy it and adjust it.")}</div></div><div class="actions"><button class="btn" id="ev-copy" type="button">${tx("Copiar", "Copy")}</button></div></div>
      <div class="informe" id="ev-txt">${textoInforme(m, res).map(t => `<p>${esc(t)}</p>`).join("")}</div></div>`;
    $("#ev-m").onchange = ev => { evMuestra = ev.target.value; dibujarDetalle(act, R); };
    $("#ev-copy").onclick = () => { navigator.clipboard?.writeText($("#ev-txt").innerText).then(() => toast(tx("Texto copiado.", "Text copied.")), () => toast(tx("No se pudo copiar: seleccionalo a mano.", "Could not copy: select it manually."))); };
  } else {
    const n = act.find(x => x.id === evNorma);
    const rs = state.muestras.map(x => R.get(x.id).get(n.id));
    const pids = Object.keys(n.lim).filter(pid => P[pid]);
    host.innerHTML = `<div class="card"><div class="card-head"><div><h3>${esc(n.nombre)}</h3><div class="sub">${esc(n.escala)} · ${esc(n.tipo)}. ${esc(n.ambito)}</div></div>
      <div class="actions">${vista}<select id="ev-n" class="mini-sel">${act.map(x => `<option value="${x.id}"${x.id === n.id ? " selected" : ""}>${esc(x.corto)}</option>`).join("")}</select></div></div>
      <div class="scroll-x"><table class="res evt mat"><thead><tr><th>${tx("Parámetro", "Parameter")}</th><th>${tx("Límite", "Limit")}</th>${state.muestras.map(x => `<th>${esc(muestraLabel(x))}</th>`).join("")}</tr></thead><tbody>
      ${pids.map(pid => {
        const L0 = resolverLimite(n, pid, {ganado: state.cfg.ganado});
        return `<tr><td>${esc(P[pid].n)}</td><td class="u"${tipAttr(esc(L0?.nota || L0?.cond || ""))}>${esc(limTxt(n, pid, L0))}</td>${rs.map(r => {
          const f = r.filas.find(x => x.pid === pid), pre2 = PRE.get(r.m.id);
          if (!f) return `<td class="cell sd"><span class="muted">—</span></td>`;
          return `<td class="cell ${f.st}"${tipAttr(limTip(n, pid, f.L, f))}>${f.val?.suma ? fmtV(f.val.x / NO3_N()) + " N" : valTxt(pid, f.val, pre2.ctx)}</td>`;
        }).join("")}</tr>`;
      }).join("")}</tbody>
      <tfoot><tr><td colspan="2">${tx("Veredicto", "Verdict")}</td>${rs.map(r => `<td${tipAttr(esc(r.ver.txt))}>${verChip(r.ver)}</td>`).join("")}</tr><tr><td colspan="2">${tx("Evaluados / de la norma", "Assessed / in standard")}</td>${rs.map(r => `<td>${r.medidos}/${r.total}</td>`).join("")}</tr></tfoot></table></div>
      <p class="hint">${EN ? `Values in the unit of each column. <span class="cell exc sw"></span> exceeds · <span class="cell g1 sw"></span> slight to moderate restriction · <span class="cell nc sw"></span> inconclusive · <span class="cell ok sw"></span> complies.` : `Valores en la unidad de cada columna. <span class="cell exc sw"></span> supera · <span class="cell g1 sw"></span> restricción ligera a moderada · <span class="cell nc sw"></span> no concluyente · <span class="cell ok sw"></span> cumple.`}</p></div>`;
    $("#ev-n").onchange = ev => { evNorma = ev.target.value; dibujarDetalle(act, R); };
  }
  $$("#ev-vista button").forEach(b => b.onclick = () => { evVista = b.dataset.v; dibujarDetalle(act, R); });
}
function cardSalvedades(r){
  const exc = r.filas.filter(f => ["exc", "g1", "g2"].includes(f.st));
  return `<div class="card salv"><div class="card-head"><div><h3>${esc(r.norma.corto)} ${verChip(r.ver)}</h3><div class="sub">${esc(r.norma.escala)} · ${esc(r.norma.tipo)}</div></div></div>
    ${exc.length ? `<p><b>${tx("Supera", "Exceeds")}:</b> ${exc.map(f => `${esc(P[f.pid].n)}${okNum(f.exc) ? ` (${fmtN(f.exc + 1, 1)}×)` : ""}${NO_SALUD.has(f.L.t) ? ` <small class="muted">${esc(T[f.L.t])}</small>` : ""}`).join(", ")}.</p>` : ""}
    ${r.salv.length ? `<ul>${r.salv.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : `<p class="muted">${tx("Sin salvedades: se midieron todos los parámetros de la norma.", "No caveats: all parameters of the standard were measured.")}</p>`}
    <p class="cita">${esc(r.norma.cita)}</p></div>`;
}
function textoInforme(m, res){
  const out = [], s = sitioDe(m), pre = PRE.get(m.id);
  const id = EN ? `Sample ${m.sitio || "without site"}${s?.nombre ? ` (${s.nombre})` : ""}${m.fecha ? `, collected on ${fechaCorta(m.fecha)},` : ""}` : `La muestra ${m.sitio || "sin sitio"}${s?.nombre ? ` (${s.nombre})` : ""}${m.fecha ? `, tomada el ${fechaCorta(m.fecha)}` : ""}`;
  const usoL = USOS.find(u => u.id === state.cfg.uso).l.toLowerCase();
  const vfmt = f => { const d = dispOf(f.pid), q = P[f.pid]; return `${fmtV(fromCanon(q, f.val.x, d.u, d.f, pre.ctx))} ${unitTxt(q, d.u, q.forms ? d.f : "")}`; };
  const lfmt = f => { const d = dispOf(f.pid), q = P[f.pid], L = f.L; const v = L.cGr ? L.cGr[1] : L.cMax != null ? L.cMax : L.cMin; return L.cMax === 0 ? tx("ausencia", "absence") : `${fmtV(fromCanon(q, v, d.u, d.f, pre.ctx))} ${unitTxt(q, d.u, q.forms ? d.f : "")}`; };
  for (const r of res){
    const exc = r.filas.filter(f => f.st === "exc" || f.st === "g2");
    const nm = EN ? `${r.norma.nombre} (scale: ${r.norma.escala})` : `${r.norma.nombre} (escala: ${r.norma.escala})`;
    const low = k => /^\p{Lu}\p{Ll}/u.test(P[k].n) && !/^Escherichia|^Pseudomonas/.test(P[k].n) ? P[k].n.toLowerCase() : P[k].n;
    if (EN){
      if (!r.filas.length){ out.push(`${id} has no measured parameters included in ${nm}.`); continue; }
      if (exc.length) out.push(`${id} exceeds, for ${usoL}, the values of ${nm} for ${exc.map(f => `${low(f.pid)} (${okNum(f.val?.x) ? vfmt(f) : "presence"}; ${f.bajo ? "minimum" : "limit"} ${lfmt(f)}${NO_SALUD.has(f.L.t) ? `, ${T[f.L.t].toLowerCase()} value` : ""})`).join(", ")}.`);
      else out.push(`${id} complies with ${nm} for the ${r.medidos} parameters assessed.`);
      if (r.faltan.length) out.push(`The assessment against ${r.norma.corto} is partial: ${r.faltan.map(low).join(", ")} ${r.faltan.length > 1 ? "were" : "was"} not measured.`);
      const nc = r.filas.filter(f => f.st === "nc");
      if (nc.length) out.push(`For ${nc.map(f => low(f.pid)).join(", ")} the result is inconclusive with respect to ${r.norma.corto}: the reported detection limit is above the value of the standard.`);
      continue;
    }
    if (!r.filas.length){ out.push(`${id} no tiene parámetros medidos que figuren en ${nm}.`); continue; }
    if (exc.length) out.push(`${id} supera, para ${usoL}, los valores de ${nm} en ${exc.map(f => `${low(f.pid)} (${okNum(f.val?.x) ? vfmt(f) : "presencia"}; ${f.bajo ? "mínimo" : "límite"} ${lfmt(f)}${NO_SALUD.has(f.L.t) ? `, valor ${T[f.L.t].toLowerCase()}` : ""})`).join(", ")}.`);
    else out.push(`${id} cumple, en los ${r.medidos} parámetros evaluados, con ${nm}.`);
    if (r.faltan.length) out.push(`La evaluación contra ${r.norma.corto} es parcial: no se midieron ${r.faltan.map(low).join(", ")}.`);
    const nc = r.filas.filter(f => f.st === "nc");
    if (nc.length) out.push(`Para ${nc.map(f => low(f.pid)).join(", ")} el resultado no es concluyente respecto de ${r.norma.corto}: el límite de detección informado es mayor que el valor de la norma.`);
  }
  return out;
}

/* =========================== 3 · ICA (CCME WQI) =========================== */
function renderIca(){
  const p = $("#p-ica"), c = state.cfg;
  const normas = allNormas().filter(n => Object.keys(n.lim).length);
  if (!normas.some(n => n.id === c.wqiNorma)) c.wqiNorma = "caa982";
  const n = normaById(c.wqiNorma);
  p.innerHTML = `<div class="panel-head"><div><h2>${tx("Índice de calidad de agua (CCME WQI)", "Water quality index (CCME WQI)")}</h2>
    <p>${tx("Resume en un número de 0 a 100 cuántas variables fallan (F1), cuántas veces fallan (F2) y por cuánto (F3), contra los objetivos de la norma elegida. Usa los parámetros que haya: no exige un conjunto fijo.", "Summarises in a number from 0 to 100 how many variables fail (F1), how often they fail (F2) and by how much (F3), against the objectives of the chosen standard. It uses whatever parameters are available: no fixed set is required.")}</p></div>
    <label class="fld inline">${tx("Objetivos de", "Objectives from")} <select id="ica-n">${USOS.map(u => { const ns = normas.filter(x => x.uso === u.id); return ns.length ? `<optgroup label="${esc(u.l)}">${ns.map(x => `<option value="${x.id}"${x.id === n.id ? " selected" : ""}>${esc(x.corto)}</option>`).join("")}</optgroup>` : ""; }).join("")}</select></label></div>
  <div id="ica-body"></div>`;
  $("#ica-n").onchange = ev => { c.wqiNorma = ev.target.value; touch(); renderIca(); };
  const body = $("#ica-body");
  if (!state.muestras.length){ body.innerHTML = `<div class="empty"><p>${tx("Sin muestras.", "No samples.")}</p></div>`; return; }
  const porSitio = new Map();
  state.muestras.forEach(m => { const k = m.sitio || tx("sin sitio", "no site"); if (!porSitio.has(k)) porSitio.set(k, []); porSitio.get(k).push(m); });
  const filas = [...porSitio.entries()].map(([s, ms]) => ({s, ms, w: wqi(n, ms, PRE)}));
  const tot = wqi(n, state.muestras, PRE);
  const sets = new Set(filas.filter(f => f.w.vars).map(f => [...f.w.vars.keys()].sort().join(",")));
  const avisos = [];
  if (sets.size > 1) avisos.push(tx("Los sitios no tienen el mismo conjunto de variables: el índice de cada uno se calculó con lo que se midió ahí, y la comparación entre sitios es sólo aproximada.", "Sites do not share the same set of variables: each index was computed with what was measured there, and comparison between sites is only approximate."));
  if (filas.some(f => f.w.nv && f.w.nv < 4)) avisos.push(tx("Hay sitios con menos de 4 variables: el CCME recomienda al menos 4 variables y 4 muestreos.", "Some sites have fewer than 4 variables: the CCME recommends at least 4 variables and 4 sampling events."));
  if (filas.some(f => f.ms.length < 4)) avisos.push(tx("Con menos de 4 muestreos por sitio, F1 y F2 se parecen y el índice es poco estable. Con una sola muestra el índice describe esa fecha, no el sitio.", "With fewer than 4 sampling events per site, F1 and F2 are similar and the index is unstable. With a single sample the index describes that date, not the site."));
  if (Object.values(n.lim).some(l => typeof l === "object" && l.max === 0)) avisos.push(tx("Los microbiológicos (objetivo = ausencia) quedan fuera del índice: con objetivo cero no se puede calcular la amplitud F3. Se informan en la evaluación normativa.", "Microbiological parameters (objective = absence) are excluded from the index: with a zero objective the amplitude F3 cannot be computed. They are reported in the regulatory assessment."));
  const exc = [...new Set(filas.flatMap(f => f.w.excluidos))];
  if (exc.length) avisos.push(tx(`Quedaron fuera ${exc.length} resultados no concluyentes (LD mayor que el objetivo o valores ilegibles).`, `${exc.length} inconclusive results were excluded (DL above the objective or unreadable values).`));
  const cc = w => w.clase ? `<span class="cls ${w.clase.col}">${w.clase.l}</span>` : "—";
  body.innerHTML = `<div class="card"><div class="scroll-x"><table class="res"><thead><tr>${(EN ? ["Site", "Samples", "Variables", "Results", "F1 %", "F2 %", "F3", "WQI", "Category", "Failing variables"] : ["Sitio", "Muestras", "Variables", "Resultados", "F1 %", "F2 %", "F3", "ICA", "Categoría", "Variables que fallan"]).map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>
    ${filas.map(({s, ms, w}) => `<tr><td><span class="code">${esc(s)}</span></td><td>${ms.length}</td><td>${w.nv || 0}</td><td>${w.tests || 0}</td><td>${fmtN(w.F1, 1)}</td><td>${fmtN(w.F2, 1)}</td><td>${fmtN(w.F3, 1)}</td><td><b>${w.wqi == null ? "—" : fmtN(w.wqi, 0)}</b></td><td>${cc(w)}</td><td class="wrapc">${w.vars ? [...w.vars.entries()].filter(([, v]) => v.fallas).map(([k, v]) => `${esc(P[k].n)} (${v.fallas}/${v.tests})`).join(", ") || "—" : "—"}</td></tr>`).join("")}
    ${filas.length > 1 ? `<tr class="tot"><td>${tx("Todas las muestras", "All samples")}</td><td>${state.muestras.length}</td><td>${tot.nv || 0}</td><td>${tot.tests || 0}</td><td>${fmtN(tot.F1, 1)}</td><td>${fmtN(tot.F2, 1)}</td><td>${fmtN(tot.F3, 1)}</td><td><b>${tot.wqi == null ? "—" : fmtN(tot.wqi, 0)}</b></td><td>${cc(tot)}</td><td></td></tr>` : ""}
    </tbody></table></div>
    <div class="chart" id="ica-ch"></div>
    ${avisos.length ? `<ul class="avisos">${avisos.map(a => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}</div>
  <div class="two"><div class="card"><div class="card-head"><div><h3>${tx("Categorías", "Categories")}</h3></div></div><table class="res compact"><tbody>${WQI_CLASES.map((k, i) => `<tr><td><span class="cls ${k.col}">${k.l}</span></td><td>${i === 0 ? "95–100" : `${k.min}–${WQI_CLASES[i - 1].min - 1}`}</td><td class="wrapc">${esc(k.d)}</td></tr>`).join("")}</tbody></table></div>
  <div class="card"><div class="card-head"><div><h3>${tx("Cálculo", "Calculation")}</h3></div></div>
    ${EN ? `<p class="formula">WQI = 100 − √(F1² + F2² + F3²) / 1.732</p>
    <ul class="small"><li>F1: % of variables that failed at least once.</li><li>F2: % of results that failed.</li>
    <li>F3 = nse / (0.01·nse + 0.01), with nse = sum of excursions / total results. Excursion = value/objective − 1 (or objective/value − 1 for minima).</li>
    <li>Objectives are the ${esc(n.corto)} limits for each sample, including those depending on hardness, pH or species. For FAO the slight-restriction threshold is used.</li></ul>`
    : `<p class="formula">ICA = 100 − √(F1² + F2² + F3²) / 1,732</p>
    <ul class="small"><li>F1: % de variables que fallaron al menos una vez.</li><li>F2: % de resultados que fallaron.</li>
    <li>F3 = nse / (0,01·nse + 0,01), con nse = suma de excursiones / total de resultados. Excursión = valor/objetivo − 1 (o objetivo/valor − 1 para mínimos).</li>
    <li>Los objetivos son los límites de ${esc(n.corto)} para cada muestra, incluidos los que dependen de la dureza, el pH o la especie. En FAO se usa el umbral de restricción ligera.</li></ul>`}
    <p class="cita">${esc(WQI_CITA)}</p></div></div>`;
  dibujarBarrasIca($("#ica-ch"), filas.filter(f => f.w.wqi != null));
}
function dibujarBarrasIca(host, filas){
  if (!filas.length){ host.innerHTML = ""; return; }
  const W = Math.max(360, host.clientWidth || 800), rowH = 28, m = {l: 120, r: 40, t: 22, b: 26}, H = m.t + m.b + filas.length * rowH;
  const x = v => m.l + v / 100 * (W - m.l - m.r);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${tx("ICA por sitio", "WQI by site")}">`;
  const bands = [[0, 45, "rojo"], [45, 65, "naranja"], [65, 80, "amarillo"], [80, 95, "verde"], [95, 100, "azul"]];
  bands.forEach(([a, b, c]) => s += `<rect x="${x(a)}" y="${m.t - 6}" width="${x(b) - x(a)}" height="${H - m.t - m.b + 6}" class="band-${c}"/>`);
  [0, 45, 65, 80, 95, 100].forEach(v => s += `<text x="${x(v)}" y="${H - 8}" text-anchor="middle" class="axl">${v}</text>`);
  filas.forEach((f, i) => {
    const y = m.t + i * rowH;
    s += `<text x="${m.l - 8}" y="${y + rowH / 2 + 4}" text-anchor="end" class="axl strong">${esc(f.s)}</text>`;
    s += `<rect x="${x(0)}" y="${y + 6}" width="${Math.max(2, x(f.w.wqi) - x(0))}" height="${rowH - 12}" rx="3" class="icabar"/>`;
    s += `<text x="${x(f.w.wqi) + 6}" y="${y + rowH / 2 + 4}" class="axl strong">${fmtN(f.w.wqi, 0)}</text>`;
  });
  host.innerHTML = s + `</svg>`;
}

/* =========================== 4 · Iones y derivados =========================== */
function renderIones(){
  const p = $("#p-iones");
  const D = state.muestras.map(m => ({m, d: derivados(m, PRE.get(m.id))}));
  const f1 = (x, d = 1) => fmtN(x, d);
  p.innerHTML = `<div class="panel-head"><div><h2>${tx("Iones y derivados", "Ions and derived")}</h2><p>${tx("Cálculos que se hacen con lo que haya: balance iónico, facies, dureza, RAS, clases de riego y tendencia incrustante o corrosiva. Donde falta un dato, la celda queda vacía y la nota dice cuál.", "Calculations made with whatever is available: ion balance, facies, hardness, SAR, irrigation classes and scale-forming or corrosive tendency. Where a datum is missing, the cell is left empty and the note says which.")}</p></div></div>
  ${!state.muestras.length ? `<div class="empty"><p>${tx("Sin muestras.", "No samples.")}</p></div>` : `
  <div class="card"><div class="card-head"><div><h3>${tx("Balance iónico y consistencia (APHA 1030 E)", "Ion balance and consistency (APHA 1030 E)")}</h3><div class="sub">${tx("Sumas en meq/L. Hace falta Ca, Mg, Na, Cl, SO₄ y bicarbonato (o alcalinidad).", "Sums in meq/L. Requires Ca, Mg, Na, Cl, SO₄ and bicarbonate (or alkalinity).")}</div></div></div>
    <div class="scroll-x"><table class="res"><thead><tr>${(EN ? ["Sample", "Σ cations", "Σ anions", "Balance %", "Criterion", "Facies", "Calc. hardness", "Meas. hardness", "TDS/EC", "TDS meas./calc.", "100·Σan/EC"] : ["Muestra", "Σ cationes", "Σ aniones", "Balance %", "Criterio", "Facies", "Dureza calc.", "Dureza med.", "SDT/CE", "SDT med./calc.", "100·Σan/CE"]).map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>
    ${D.map(({m, d}) => `<tr><td><span class="code">${esc(muestraLabel(m))}</span></td>
      ${d.bal != null ? `<td>${f1(d.sc, 2)}</td><td>${f1(d.sa, 2)}</td><td>${f1(d.bal, 1)}</td><td>${d.balOk ? chip("ok", tx("Aceptable", "Acceptable")) : chip("exc", tx("Fuera", "Outside"))} <small class="muted">${esc(d.balCrit)}</small></td><td>${esc(d.facies || "—")}</td>` : `<td colspan="5" class="muted">${tx("Falta", "Missing")} ${esc(d.faltaBal.join(", "))}</td>`}
      <td>${f1(d.durCalc, 0)}</td><td>${f1(d.durMed, 0)}${d.durDif != null ? ` <small class="muted">(${d.durDif > 0 ? "+" : ""}${f1(d.durDif, 0)} %)</small>` : ""}</td>
      <td>${f1(d.sdtCe, 2)}</td><td>${f1(d.sdtRel, 2)}</td><td>${f1(d.ceRel, 2)}</td></tr>${d.notas.length ? `<tr class="nota"><td></td><td colspan="10">${esc(d.notas.join(" "))}</td></tr>` : ""}`).join("")}
    </tbody></table></div>
    <p class="hint">${tx("Criterios: balance ± 0,2 meq/L con aniones ≤ 3 meq/L, ± 2 % hasta 10 meq/L y ± 5 % por encima; SDT/CE habitual 0,55–0,75; SDT medido/calculado 1,0–1,2; 100·Σaniones/CE 0,9–1,1 (sólo agua dulce).", "Criteria: balance ± 0.2 meq/L with anions ≤ 3 meq/L, ± 2% up to 10 meq/L and ± 5% above; usual TDS/EC 0.55–0.75; measured/calculated TDS 1.0–1.2; 100·Σanions/EC 0.9–1.1 (fresh water only).")}</p></div>
  <div class="two">
  <div class="card"><div class="card-head"><div><h3>${tx("Riego", "Irrigation")}</h3><div class="sub">${tx("Riverside (USSL, 1954) y FAO 29 (infiltración según RAS y CE).", "Riverside (USSL, 1954) and FAO 29 (infiltration by SAR and EC).")}</div></div></div>
    <div class="scroll-x"><table class="res"><thead><tr><th>${tx("Muestra", "Sample")}</th><th>${tx("CE", "EC")} µS/cm</th><th>${tx("RAS", "SAR")}</th><th>Riverside</th><th>${tx("Infiltración FAO", "FAO infiltration")}</th></tr></thead><tbody>
    ${D.map(({m, d}) => `<tr><td><span class="code">${esc(muestraLabel(m))}</span></td><td>${f1(d.ce, 0)}</td><td>${f1(d.sar, 2)}</td><td>${d.claseC ? `<b>${d.claseC}${d.claseS ? "-" + d.claseS : ""}</b>` : "—"}</td><td>${esc(d.infil || "—")}</td></tr>`).join("")}</tbody></table></div>
    <div class="chart" id="rv-ch"></div>
    <p class="hint">${tx("C1–C4: peligro de salinidad bajo, medio, alto y muy alto. S1–S4: peligro de sodio bajo, medio, alto y muy alto. Límites S según las rectas del diagrama de Richards (1954).", "C1–C4: low, medium, high and very high salinity hazard. S1–S4: low, medium, high and very high sodium hazard. S limits from the lines of the Richards (1954) diagram.")}</p></div>
  <div class="card"><div class="card-head"><div><h3>${tx("Uso industrial: Langelier y Ryznar", "Industrial use: Langelier and Ryznar")}</h3><div class="sub">${tx("Tendencia a incrustar o corroer. Necesita pH, calcio, alcalinidad (o bicarbonato), SDT (o CE) y temperatura.", "Tendency to form scale or corrode. Requires pH, calcium, alkalinity (or bicarbonate), TDS (or EC) and temperature.")}</div></div></div>
    <div class="scroll-x"><table class="res"><thead><tr><th>${tx("Muestra", "Sample")}</th><th>pHs</th><th>LSI</th><th></th><th>RSI</th><th></th></tr></thead><tbody>
    ${D.map(({m, d}) => `<tr><td><span class="code">${esc(muestraLabel(m))}</span></td>${d.lsi != null ? `<td>${f1(d.phs, 2)}</td><td><b>${f1(d.lsi, 2)}</b></td><td class="wrapc">${esc(d.lsiTxt)}</td><td>${f1(d.rsi, 2)}</td><td class="wrapc">${esc(d.rsiTxt)}</td>` : `<td colspan="5" class="muted">${tx("Faltan datos", "Missing data")}</td>`}</tr>${d.lsiNota ? `<tr class="nota"><td></td><td colspan="5">${esc(d.lsiNota)}</td></tr>` : ""}`).join("")}</tbody></table></div>
    <p class="hint">${tx("pHs = 9,3 + A + B − (C + D); LSI = pH − pHs; RSI = 2·pHs − pH. El CAA pide que el pH del agua de red esté dentro de pHs ± 0,2, es decir |LSI| ≤ 0,2.", "pHs = 9.3 + A + B − (C + D); LSI = pH − pHs; RSI = 2·pHs − pH. The CAA requires supply water pH within pHs ± 0.2, that is, |LSI| ≤ 0.2.")}</p></div>
  </div>
  <div class="card"><div class="card-head"><div><h3>${tx("Nitrato y nitrito juntos (OMS y UE)", "Nitrate and nitrite together (WHO and EU)")}</h3><div class="sub">${tx("[NO₃⁻]/50 + [NO₂⁻]/3 ≤ 1, con ambos en mg/L como ión.", "[NO₃⁻]/50 + [NO₂⁻]/3 ≤ 1, both in mg/L as the ion.")}</div></div></div>
    <div class="scroll-x"><table class="res compact"><thead><tr><th>${tx("Muestra", "Sample")}</th><th>${tx("Suma de cocientes", "Sum of ratios")}</th><th></th></tr></thead><tbody>
    ${D.map(({m, d}) => `<tr><td><span class="code">${esc(muestraLabel(m))}</span></td><td>${f1(d.nn, 2)}</td><td>${d.nn == null ? "" : d.nn <= 1 ? chip("ok") : chip("exc")} ${d.nnFalta ? `<small class="muted">${tx("sin", "no")} ${d.nnFalta}</small>` : ""}</td></tr>`).join("")}</tbody></table></div></div>`}`;
  if (state.muestras.length) dibujarRiverside($("#rv-ch"), D.filter(x => x.d.ce && x.d.sar != null));
}
function dibujarRiverside(host, D){
  if (!D.length){ host.innerHTML = `<p class="hint">${tx("Sin muestras con CE y RAS.", "No samples with EC and SAR.")}</p>`; return; }
  const W = Math.max(320, host.clientWidth || 460), H = 280, m = {l: 44, r: 12, t: 12, b: 36};
  const lx = v => m.l + (Math.log10(v) - 2) / (Math.log10(10000) - 2) * (W - m.l - m.r);
  const maxS = Math.max(32, ...D.map(x => x.d.sar)), y = v => m.t + (1 - v / maxS) * (H - m.t - m.b);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${tx("Diagrama de Riverside", "Riverside diagram")}">`;
  [250, 750, 2250].forEach(v => s += `<line x1="${lx(v)}" x2="${lx(v)}" y1="${m.t}" y2="${H - m.b}" class="gridl"/>`);
  [[18.87, 4.44], [31.31, 6.66], [43.75, 8.87]].forEach(([a, b]) => { const pts = [100, 10000].map(v => `${lx(v)},${y(Math.max(0, a - b * Math.log10(v)))}`); s += `<polyline points="${pts.join(" ")}" class="gridl strong"/>`; });
  [["C1", 100, 250], ["C2", 250, 750], ["C3", 750, 2250], ["C4", 2250, 10000]].forEach(([l, a, b]) => s += `<text x="${(lx(a) + lx(b)) / 2}" y="${H - m.b + 14}" text-anchor="middle" class="axl strong">${l}</text>`);
  [100, 1000, 10000].forEach(v => s += `<text x="${lx(v)}" y="${H - 4}" text-anchor="middle" class="axl">${fmtN(v, 0)}</text>`);
  for (let v = 0; v <= maxS; v += 10) s += `<text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end" class="axl">${v}</text>`;
  s += `<text x="12" y="${m.t + (H - m.t - m.b) / 2}" transform="rotate(-90 12 ${m.t + (H - m.t - m.b) / 2})" text-anchor="middle" class="axl strong">${tx("RAS", "SAR")}</text>`;
  D.forEach(({m: mu, d}) => s += `<circle cx="${lx(Math.min(10000, Math.max(100, d.ce)))}" cy="${y(Math.min(maxS, d.sar))}" r="5" class="pt"${tipAttr(`${esc(muestraLabel(mu))}<br>${tx("CE", "EC")} ${fmtN(d.ce, 0)} µS/cm · ${tx("RAS", "SAR")} ${fmtN(d.sar, 2)} · ${d.claseC}-${d.claseS}`)}/>`);
  host.innerHTML = s + `<text x="${W - m.r}" y="${H - m.b - 4}" text-anchor="end" class="axl">${tx("CE", "EC")} µS/cm (log)</text></svg>`;
}

/* =========================== 5 · Conversor =========================== */
let CV = {p: "no3", x: "10", u: "mg/L", f: "N", rho: "", sdt: "", t: "", alfa: ""};
function renderConv(){
  const p = $("#p-conv"), q = P[CV.p];
  if (!findUnit(q, CV.u)) CV.u = canonUnit(q);
  if (q.forms && !(CV.f in q.forms)) CV.f = q.fc;
  const x = parseNum(CV.x, DEC_UI), rho = numOrNull(CV.rho), sdt = numOrNull(CV.sdt);
  const ctx = {rho: rho ?? null, sdt: sdt ?? null};
  const r = okNum(x) ? toCanon(q, x, CV.u, CV.f, ctx) : {v: null, notas: []};
  let canon = r.v;
  const tC = numOrNull(CV.t);
  if (q.id === "ce" && okNum(canon) && tC != null) canon = canon / (1 + (numOrNull(CV.alfa) ?? state.cfg.alfa) / 100 * (tC - 25));
  const out = [];
  if (okNum(canon)){
    for (const u of unitsOf(q)){
      const forms = q.forms && ["v", "m"].includes(u[1]) ? Object.keys(q.forms) : [null];
      for (const f of forms){ const v = fromCanon(q, canon, u[0], f || q.fc, {rho: rho ?? 1, sdt}); if (okNum(v)) out.push([uL(u[0]) + (f ? ` ${formTxt(q, f)}` : ""), v, u[1]]); }
    }
  }
  const kinds = new Set(unitsOf(q).map(u => u[1]));
  p.innerHTML = `<div class="panel-head"><div><h2>${tx("Conversor de unidades", "Unit converter")}</h2><p>${tx("Para pasar un valor suelto entre unidades de laboratorio y de equipos de campo. Las columnas de la tabla usan las mismas conversiones.", "To convert a single value between laboratory and field-meter units. The table columns use the same conversions.")}</p></div></div>
  <div class="card conv"><div class="fgrid">
    <label class="fld">${tx("Parámetro", "Parameter")}<select id="cv-p">${GRUPOS.map(([g, gl]) => `<optgroup label="${esc(gl)}">${PARAMS.filter(x => x.g === g && unitsOf(x).length > 1).map(x => `<option value="${x.id}"${x.id === q.id ? " selected" : ""}>${esc(x.n)}</option>`).join("")}</optgroup>`).join("")}</select></label>
    <label class="fld">${tx("Valor", "Value")}<input id="cv-x" value="${esc(CV.x)}" inputmode="decimal"></label>
    <label class="fld">${tx("Unidad", "Unit")}<select id="cv-u">${unitsOf(q).map(u => `<option value="${esc(u[0])}"${u[0] === CV.u ? " selected" : ""}>${esc(uL(u[0]))}</option>`).join("")}</select></label>
    ${q.forms ? `<label class="fld">${tx("Expresado", "Expressed")}<select id="cv-f">${Object.keys(q.forms).map(f => `<option value="${f}"${f === CV.f ? " selected" : ""}>${esc(formTxt(q, f))}</option>`).join("")}</select></label>` : ""}
    ${kinds.has("m") || kinds.has("b") ? `<label class="fld">${tx("Densidad de la muestra", "Sample density")} <span class="u">(g/mL)</span><input id="cv-rho" value="${esc(CV.rho)}" placeholder="${tx("1 si se deja vacío", "1 if left empty")}" inputmode="decimal"></label>
    <label class="fld">${tx("SDT", "TDS")} <span class="u">(${tx("mg/L, para molal", "mg/L, for molal")})</span><input id="cv-sdt" value="${esc(CV.sdt)}" placeholder="${tx("opcional", "optional")}" inputmode="decimal"></label>` : ""}
    ${q.id === "ce" ? `<label class="fld">${tx("Temperatura de medición", "Measurement temperature")} <span class="u">(${tx("°C, para compensar a 25 °C", "°C, to compensate to 25 °C")})</span><input id="cv-t" value="${esc(CV.t)}" placeholder="${tx("vacío: ya compensada", "empty: already compensated")}" inputmode="decimal"></label>
    <label class="fld">${tx("Coeficiente", "Coefficient")} <span class="u">(%/°C)</span><input id="cv-a" value="${esc(CV.alfa)}" placeholder="${fmtN(state.cfg.alfa, 2)}" inputmode="decimal"></label>` : ""}
  </div>
  ${okNum(canon) ? `<div class="conv-out">${out.map(([l, v, k]) => `<div class="cv"><span class="l">${esc(l)}</span><span class="v">${fmtV(v)}</span></div>`).join("")}</div>` : `<p class="muted">${tx("Escribí un valor.", "Enter a value.")}</p>`}
  <ul class="small">${(EN ? [
    q.mm ? `Molar mass used: ${fmtN(q.mm, 3)} g/mol${q.z ? `; charge ${q.z} (equivalent weight ${fmtN(q.mm / q.z, 3)} g)` : ""}.` : "",
    (kinds.has("m") || kinds.has("b")) ? "ppm and mg/kg are mass per mass of solution: they equal mg/L only if density is 1 g/mL. In brines (1.1–1.25 g/mL) the difference is 10 to 25%." : "",
    kinds.has("b") ? "Molal (mol/kg) is per kilogram of water, not of solution: converting it to mg/L needs density and dissolved solids. Without TDS it is treated as molar." : "",
    q.id === "ce" ? "Resistivity is the inverse of conductivity: 1 MΩ·cm = 1 µS/cm. Linear compensation to 25 °C uses EC₂₅ = EC_t / (1 + α(t − 25)); most meters use α between 1.9 and 2.1%/°C." : "",
    q.id === "temp" ? "°F = °C × 9/5 + 32; K = °C + 273.15." : "",
    q.fam === "caco3" ? "Hardness degrees: 1 °f = 10 mg/L as CaCO₃; 1 °dH = 17.85; 1 °e (Clark) = 14.25; 1 gpg = 17.12. 1 meq/L = 50.04 mg/L as CaCO₃." : "",
    q.micro ? "CFU and MPN are not the same measure, but standards treat them alike. 1 CFU/mL = 100 CFU/100 mL." : "",
  ] : [
    q.mm ? `Masa molar usada: ${fmtN(q.mm, 3)} g/mol${q.z ? `; carga ${q.z} (equivalente ${fmtN(q.mm / q.z, 3)} g)` : ""}.` : "",
    (kinds.has("m") || kinds.has("b")) ? "ppm y mg/kg son masa por masa de solución: igualan a mg/L sólo si la densidad es 1 g/mL. En salmueras (1,1–1,25 g/mL) la diferencia es de 10 a 25 %." : "",
    kinds.has("b") ? "Molal (mol/kg) es por kilo de agua, no de solución: para pasarlo a mg/L hace falta la densidad y los sólidos disueltos. Sin SDT se trata como molar." : "",
    q.id === "ce" ? "La resistividad es la inversa de la conductividad: 1 MΩ·cm = 1 µS/cm. La compensación lineal a 25 °C usa CE₂₅ = CE_t / (1 + α(t − 25)); la mayoría de los equipos usa α entre 1,9 y 2,1 %/°C." : "",
    q.id === "temp" ? "°F = °C × 9/5 + 32; K = °C + 273,15." : "",
    q.fam === "caco3" ? "Grados de dureza: 1 °f = 10 mg/L CaCO₃; 1 °dH = 17,85; 1 °e (Clark) = 14,25; 1 gpg = 17,12. 1 meq/L = 50,04 mg/L CaCO₃." : "",
    q.micro ? "UFC y NMP no son la misma medida, pero las normas los tratan igual. 1 UFC/mL = 100 UFC/100 mL." : "",
  ]).filter(Boolean).map(t => `<li>${esc(t)}</li>`).join("")}${r.notas.includes("dens") ? `<li><b>${tx("Se asumió densidad 1 g/mL.", "Density of 1 g/mL was assumed.")}</b></li>` : ""}</ul></div>`;
  const on = (id, k, rer = true) => { const el = $("#" + id); if (el) el.oninput = el.onchange = ev => { CV[k] = ev.target.value; if (rer) { const pos = ev.target.selectionStart; renderConv(); const n = $("#" + id); if (n && n.setSelectionRange && pos != null){ n.focus(); try { n.setSelectionRange(pos, pos); } catch(e){} } } }; };
  on("cv-p", "p"); on("cv-x", "x"); on("cv-u", "u"); on("cv-f", "f"); on("cv-rho", "rho"); on("cv-sdt", "sdt"); on("cv-t", "t"); on("cv-a", "alfa");
}

/* =========================== 6 · Controles =========================== */
let ctlFilter = "todos";
function renderCtl(){
  const p = $("#p-ctl"), all = CTL, c = s => all.filter(i => i.sev === s).length;
  const shown = ctlFilter === "todos" ? all : all.filter(i => i.sev === ctlFilter);
  p.innerHTML = `<div class="panel-head"><div><h2>${tx("Controles", "Checks")}</h2><p>${tx("Lo que conviene revisar antes de informar. Kenti avisa, no corrige: los datos quedan como se cargaron.", "What should be reviewed before reporting. Kenti warns, it does not correct: data stay as they were entered.")}</p></div>
    <div class="seg" id="ctl-seg">${[["todos", `${tx("Todos", "All")} (${all.length})`], ["error", `${tx("Errores", "Errors")} (${c("error")})`], ["aviso", `${tx("Avisos", "Warnings")} (${c("aviso")})`], ["info", `${tx("Notas", "Notes")} (${c("info")})`]].map(([id, l]) => `<button type="button" data-f="${id}" aria-pressed="${ctlFilter === id}">${l}</button>`).join("")}</div></div>
  ${shown.length ? `<div class="card"><table class="iss"><thead><tr><th></th><th>${tx("Dónde", "Where")}</th><th>${tx("Qué", "What")}</th></tr></thead><tbody>${shown.map(i => `<tr><td><span class="dot ${i.sev}"></span></td><td class="w">${esc(i.donde)}</td><td>${esc(i.msg)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty"><p>${all.length ? tx("Nada en esta categoría.", "Nothing in this category.") : tx("Sin observaciones.", "No remarks.")}</p></div>`}`;
  $$("#ctl-seg button").forEach(b => b.onclick = () => { ctlFilter = b.dataset.f; renderCtl(); });
}

/* =========================== 7 · Normas y criterios =========================== */
function renderNormas(){
  const p = $("#p-normas"), c = state.cfg, pr = c.propia;
  const cols = allNormas().filter(n => Object.keys(n.lim).length);
  const pids = PARAMS.map(q => q.id).filter(pid => cols.some(n => n.lim[pid] != null));
  p.innerHTML = `<div class="panel-head"><div><h2>${tx("Normas y criterios", "Standards and criteria")}</h2><p>${tx("Los niveles guía que usa Kenti, con su escala (nacional, regional, internacional), su tipo y su cita. Valores en mg/L salvo que se indique; la forma del nitrato, nitrito y amonio va con cada valor.", "The guideline values Kenti uses, with their scale (national, regional, international), type and citation. Values in mg/L unless stated; the form of nitrate, nitrite and ammonium is given with each value.")}</p></div></div>
  <div class="two">
    <div class="card"><div class="card-head"><div><h3>${tx("Lectura de los datos", "Data reading")}</h3></div></div>
      <label class="fld" style="max-width:320px">${tx("Separador decimal de las tablas", "Decimal separator in tables")}<select id="cf-dec"><option value="coma"${c.decimal === "coma" ? " selected" : ""}>${tx("Coma (0,005 · 1.500)", "Comma (0,005 · 1.500)")}</option><option value="punto"${c.decimal === "punto" ? " selected" : ""}>${tx("Punto (0.005 · 1,500)", "Point (0.005 · 1,500)")}</option><option value="auto"${c.decimal === "auto" ? " selected" : ""}>${tx("Detectar por columna", "Detect per column")}</option></select></label>
      <label class="fld" style="max-width:320px;margin-top:10px">${tx("Coeficiente de compensación de la CE", "EC compensation coefficient")} <span class="u">(%/°C)</span><input id="cf-alfa" value="${esc(EN ? String(c.alfa) : String(c.alfa).replace(".", ","))}" inputmode="decimal"></label></div>
    <div class="card"><div class="card-head"><div><h3>${tx("Norma propia", "Custom standard")}</h3><div class="sub">${tx("Límites del cliente, del proceso o de una norma provincial que Kenti no trae. En la unidad canónica de cada parámetro.", "Limits from the client, the process or a provincial or local standard that Kenti does not include. In the canonical unit of each parameter.")}</div></div></div>
      <div class="fgrid"><label class="fld">${tx("Nombre", "Name")}<input id="pr-n" value="${esc(pr.nombre)}" placeholder="${tx("Norma propia", "Custom standard")}"></label>
      <label class="fld">${tx("Uso", "Use")}<select id="pr-u">${USOS.map(u => `<option value="${u.id}"${u.id === pr.uso ? " selected" : ""}>${esc(u.l)}</option>`).join("")}</select></label>
      <label class="fld wide">${tx("Cita", "Citation")}<input id="pr-c" value="${esc(pr.cita)}" placeholder="${tx("Resolución, norma o especificación del cliente", "Resolution, standard or client specification")}"></label></div>
      <div class="sheet" style="max-height:320px;margin-top:10px"><table class="rg"><thead><tr><th>${tx("Parámetro", "Parameter")}</th><th>${tx("Unidad", "Unit")}</th><th>${tx("Mínimo", "Minimum")}</th><th>${tx("Máximo", "Maximum")}</th></tr></thead><tbody>
      ${PARAMS.filter(q => !q.micro || true).map(q => { const l = pr.lim[q.id] || {}; return `<tr><td style="padding:6px 8px">${esc(q.n)}</td><td style="padding:6px 8px" class="muted">${esc(unitTxt(q, canonUnit(q), q.fc || ""))}</td><td><input class="n" data-pl="${q.id}" data-k="min" value="${esc(l.min || "")}"></td><td><input class="n" data-pl="${q.id}" data-k="max" value="${esc(l.max || "")}"></td></tr>`; }).join("")}
      </tbody></table></div></div>
  </div>
  <div class="card"><div class="card-head"><div><h3>${tx("Niveles guía", "Guideline values")}</h3><div class="sub">${tx("Pasá el cursor por un valor para ver su nota. «f(…)» indica que el valor depende de la muestra o del sitio.", "Hover over a value to see its note. “f(…)” means the value depends on the sample or the site.")}</div></div></div>
    <div class="sheet" style="max-height:70vh"><table class="res normt"><thead><tr><th class="stick">${tx("Parámetro", "Parameter")}</th>${cols.map(n => `<th${tipAttr(esc(n.nombre))}>${esc(n.corto)}<br><small class="muted">${esc(USOS.find(u => u.id === n.uso).l)}</small></th>`).join("")}</tr></thead><tbody>
    ${pids.map(pid => `<tr><td class="stick">${esc(P[pid].n)}</td>${cols.map(n => { const s = n.lim[pid]; if (s == null) return "<td></td>"; const o = typeof s === "number" ? {max: s} : s; const txt = o.fn ? `f(${o.fn === "dur831" ? tx("dureza", "hardness") : o.fn === "al831" ? tx("pH, Ca, COD", "pH, Ca, DOC") : o.fn === "fcaa" ? "temp." : o.fn === "jpRio" || o.fn === "jpInd" ? tx("clase", "class") : tx("especie", "species")})` : limTxt(n, pid, resolverLimite(n, pid, {ganado: c.ganado})); return `<td${tipAttr(esc([o.nota, T[o.t || "salud"]].filter(Boolean).join(" · ")))}>${esc(txt)}</td>`; }).join("")}</tr>`).join("")}
    </tbody></table></div></div>
  <div class="card"><div class="card-head"><div><h3>${tx("Fuentes", "Sources")}</h3></div></div>
    <table class="iss"><thead><tr><th>${tx("Norma", "Standard")}</th><th>${tx("Escala", "Scale")}</th><th>${tx("Tipo", "Type")}</th><th>${tx("Cita y alcance", "Citation and scope")}</th></tr></thead><tbody>
    ${cols.map(n => `<tr><td class="w"><b>${esc(n.corto)}</b></td><td class="w">${esc(n.escala)}</td><td>${esc(n.tipo)}</td><td>${esc(n.cita)}<br><span class="muted">${esc(n.ambito)}</span></td></tr>`).join("")}
    <tr><td class="w"><b>CCME WQI</b></td><td class="w">${tx("Nacional · Canadá", "National · Canada")}</td><td>${tx("Índice", "Index")}</td><td>${esc(WQI_CITA)}</td></tr>
    <tr><td class="w"><b>Riverside</b></td><td class="w">${tx("Internacional", "International")}</td><td>${tx("Clasificación", "Classification")}</td><td>Richards, L. A. (ed.). 1954. Diagnosis and improvement of saline and alkali soils. USDA Agriculture Handbook 60, Washington.</td></tr>
    <tr><td class="w"><b>APHA 1030 E</b></td><td class="w">${tx("Internacional", "International")}</td><td>${tx("Control de calidad", "Quality control")}</td><td>APHA, AWWA y WEF. Standard Methods for the Examination of Water and Wastewater, 1030 E: Checking analyses' correctness.</td></tr>
    </tbody></table></div>`;
  $("#cf-dec").onchange = ev => { c.decimal = ev.target.value; touch(); recalcular(); };
  $("#cf-alfa").oninput = ev => { const x = numOrNull(ev.target.value); if (x != null){ c.alfa = x; touch(); } };
  $("#pr-n").oninput = ev => { pr.nombre = ev.target.value; touch(); };
  $("#pr-u").onchange = ev => { pr.uso = ev.target.value; touch(); };
  $("#pr-c").oninput = ev => { pr.cita = ev.target.value; touch(); };
  $$("[data-pl]", p).forEach(i => i.oninput = () => { const o = pr.lim[i.dataset.pl] = pr.lim[i.dataset.pl] || {}; o[i.dataset.k] = i.value; if (!o.min && !o.max) delete pr.lim[i.dataset.pl]; touch(); });
}
