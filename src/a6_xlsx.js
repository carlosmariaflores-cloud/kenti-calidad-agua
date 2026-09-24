/* =========================== Excel: planilla de carga y resultados =========================== */
function xStyles(){
  const st = new XStyles();
  return {st,
    title: st.xf({font: {b: 1, sz: 14}}), sub: st.xf({font: {sz: 9, color: "FF465040"}, wrap: 1, v: "top"}),
    th: st.xf({font: {b: 1, sz: 10}, fill: "FFEAEEE5", border: "bottom", wrap: 1, v: "bottom"}),
    head: st.xf({font: {b: 1, sz: 9}, border: "all", fill: "FFEAEEE5", wrap: 1, align: "center", v: "center"}),
    unit: st.xf({font: {sz: 9, color: "FF465040"}, border: "all", fill: "FFF4F6F1", align: "center"}),
    cell: st.xf({font: {sz: 10}, border: "all", num: "@"}),
    txt: st.xf({font: {sz: 10}, wrap: 1, v: "top"}), b: st.xf({font: {b: 1, sz: 10}}),
    num: st.xf({font: {sz: 10}, num: "0.0###"}), num2: st.xf({font: {sz: 10}, num: "0.00"}), int: st.xf({font: {sz: 10}, num: "0"}),
    ok: st.xf({font: {sz: 10, color: "FF2B5A12"}, fill: "FFE2ECD5"}),
    exc: st.xf({font: {b: 1, sz: 10, color: "FF8A2A12"}, fill: "FFF6D8CF"}),
    warn: st.xf({font: {sz: 10, color: "FF6B4C05"}, fill: "FFF6EFDC"}),
    nc: st.xf({font: {i: 1, sz: 10, color: "FF6B4C05"}}),
    sd: st.xf({font: {sz: 10, color: "FF768070"}}),
  };
}
const ST_X = {ok: "ok", exc: "exc", g1: "warn", g2: "exc", nc: "nc", sd: "sd", parcial: "warn", warn: "warn"};
const hs = (S, sh, r, vals, freezeCols = 1) => { vals.forEach((v, c) => { sh.set(r, c, v, S.th); sh.widths[c] = Math.max(sh.widths[c] || 8, Math.min(40, String(v).length + 3)); }); sh.freeze = [r + 1, freezeCols]; };

/* Planilla para cargar: encabezados con unidad, que el importador reconoce tal cual. */
async function planillaCarga(){
  const S = xStyles(), sheets = [];
  const base = ["temp", "ph", "ce", "sdt", "od", "turb", "ca", "mg", "na", "k", "cl", "so4", "hco3", "co3", "alc", "dureza", "no3", "no2", "nh4", "f", "as", "b", "fe", "mn", "li", "al", "cd", "cr", "cu", "pb", "hg", "ni", "se", "u", "zn", "colt", "ecoli"];
  const usados = state.cols.filter(c => c.p).map(c => c.p);
  const ids = [...new Set([...base, ...usados])];
  const h = new XSheet(tx("Muestras", "Samples")); sheets.push(h);
  const meta = EN ? ["Site", "Date", "Time", "Laboratory ID"] : ["Sitio", "Fecha", "Hora", "ID laboratorio"];
  h.set(0, 0, tx("Kenti Calidad de Agua · planilla de carga", "Kenti Water Quality · data entry template"), S.title);
  h.set(1, 0, tx("Una fila por muestra. Ningún parámetro es obligatorio: dejá vacío lo que no se midió. Valores como <0,005, ND, s/d, Ausencia o >2400 se leen tal cual. La fila 5 trae la unidad; si tu laboratorio informa en otra (µg/L, meq/L, mS/cm, ppm, mmol/L…), cambiala ahí.", "One row per sample. No parameter is mandatory: leave empty what was not measured. Values such as <0.005, ND, n/a, Absent or >2400 are read as they are. Row 5 holds the unit; if your laboratory reports in another (µg/L, meq/L, mS/cm, ppm, mmol/L…), change it there."), S.sub);
  h.merge(1, 0, 1, 12); h.heights[1] = 42;
  meta.forEach((l, c) => { h.set(3, c, l, S.head); h.set(4, c, "", S.unit); h.widths[c] = c === 0 ? 14 : 12; });
  ids.forEach((id, i) => {
    const q = P[id], c = meta.length + i, f = q.forms ? q.fc : "";
    h.set(3, c, q.n + (f ? ` (${tx("como", "as")} ${f})` : ""), S.head);
    h.set(4, c, uL(canonUnit(q)), S.unit); h.widths[c] = 12;
  });
  h.set(3, meta.length + ids.length, tx("Observaciones", "Remarks"), S.head); h.widths[meta.length + ids.length] = 30;
  h.heights[3] = 42; h.freeze = [5, 1];
  for (let r = 5; r < 45; r++) for (let c = 0; c <= meta.length + ids.length; c++) h.set(r, c, "", S.cell);
  const s = new XSheet(tx("Sitios", "Sites"), {portrait: true}); sheets.push(s);
  hs(S, s, 0, EN ? ["Code", "Name", "Type", "Latitude", "Longitude", "Elevation (m a.s.l.)", "Mean annual air T (°C)", "River class (Japan)"] : ["Código", "Nombre", "Tipo", "Latitud", "Longitud", "Altitud (m s.n.m.)", "T media anual del aire (°C)", "Clase de río (Japón)"]);
  state.sitios.forEach((x, i) => s.row(i + 1, 0, [x.codigo, x.nombre, tipoSitioL(x.tipo), x.lat, x.lon, x.alt, x.tAire, x.claseJp]));
  s.list("C2:C200", TIPOS_SITIO.map(tipoSitioL));
  const u = new XSheet(tx("Unidades aceptadas", "Accepted units"), {portrait: true}); sheets.push(u); u.widths = {0: 34, 1: 90};
  hs(S, u, 0, EN ? ["Parameter", "Units Kenti converts"] : ["Parámetro", "Unidades que Kenti convierte"]);
  PARAMS.forEach((q, i) => u.row(i + 1, 0, [q.n, unitsOf(q).map(x => uL(x[0])).join(" · ") + (q.forms ? ` — ${tx("forma", "form")}: ${Object.keys(q.forms).map(f => tx("como ", "as ") + f).join(tx(" o ", " or "))}` : "")]));
  return workbookBlob(sheets, S.st, tx("Planilla de carga · Kenti Calidad de Agua", "Data entry template · Kenti Water Quality"));
}

async function exportXlsx(){
  recalcular();
  const S = xStyles(), sheets = [], ms = state.muestras;
  const cols = state.cols.filter(c => c.p);
  // Datos tal como se cargaron
  const d = new XSheet(tx("Datos", "Data")); sheets.push(d);
  hs(S, d, 0, [...META_COLS.map(x => x[1]), ...state.cols.map(c => c.p ? P[c.p].n + (c.frac === "disuelta" ? tx(" (disuelto)", " (dissolved)") : "") : `${c.h} ${tx("(sin asignar)", "(unassigned)")}`), tx("Observaciones", "Remarks")]);
  state.cols.forEach((c, i) => d.set(1, 4 + i, c.p ? unitTxt(P[c.p], c.u, P[c.p].forms ? c.f : "") + (c.comp25 ? tx(" · comp. 25 °C", " · comp. to 25 °C") : "") : "", S.unit));
  d.freeze = [2, 1];
  ms.forEach((m, i) => d.row(i + 2, 0, [m.sitio, fechaCorta(m.fecha), m.hora, m.lab, ...state.cols.map(c => { const v = m.v[c.id] ?? ""; const x = parseVal(v, COLMODO[c.id]); return x.q === "num" ? x.x : v; }), m.obs]));
  // Valores en la unidad canónica
  const cn = new XSheet(tx("Datos convertidos", "Converted data")); sheets.push(cn);
  const pids = PARAMS.map(q => q.id).filter(pid => ms.some(m => PRE.get(m.id).vals[pid]));
  hs(S, cn, 0, [tx("Muestra", "Sample"), ...pids.map(pid => `${P[pid].n} (${unitTxt(P[pid], canonUnit(P[pid]), P[pid].fc || "")})`)]);
  ms.forEach((m, i) => {
    const {vals} = PRE.get(m.id);
    cn.row(i + 1, 0, [muestraLabel(m), ...pids.map(pid => { const v = vals[pid]; if (!v) return ""; if (okNum(v.x)) return v.x; if (v.q === "lt") return okNum(v.ld) ? `<${fmtV(v.ld)}` : "ND"; if (v.q === "gt") return `>${fmtV(v.gt)}`; return v.q === "pres" ? tx("Presencia", "Presence") : v.q === "nd" ? "ND" : String(v.raw ?? ""); })], [0, ...pids.map(() => S.num)]);
  });
  cn.set(ms.length + 2, 0, tx("Valores en la unidad canónica de cada parámetro, después de convertir unidades, formas y densidad. Dureza y RAS se calculan con los iones cuando no se midieron.", "Values in the canonical unit of each parameter, after converting units, forms and density. Hardness and SAR are calculated from the ions when not measured."), S.txt);
  // Resumen por muestra y norma, y evaluación detallada
  const rs = new XSheet(tx("Resumen por norma", "Summary by standard")); sheets.push(rs);
  hs(S, rs, 0, EN ? ["Sample", "Use", "Standard", "Scale", "Verdict", "Assessed", "In standard", "Exceeds", "Inconclusive", "Not measured", "Caveats"] : ["Muestra", "Uso", "Norma", "Escala", "Veredicto", "Evaluados", "De la norma", "Supera", "No concluyentes", "No medidos", "Salvedades"]);
  rs.widths[10] = 90;
  const ev = new XSheet(tx("Evaluación", "Assessment")); sheets.push(ev);
  hs(S, ev, 0, EN ? ["Sample", "Use", "Standard", "Parameter", "Value", "Unit", "Limit (in the unit of the value)", "Limit as in the standard", "Type", "Status", "Times the limit", "Condition or note"] : ["Muestra", "Uso", "Norma", "Parámetro", "Valor", "Unidad", "Límite (en la unidad del valor)", "Límite según la norma", "Tipo", "Estado", "Veces el límite", "Condición o nota"]);
  ev.widths[11] = 70;
  let r1 = 1, r2 = 1;
  const activas = allNormas().filter(n => state.cfg.activas[n.id] !== false && Object.keys(n.lim).length);
  for (const m of ms){
    const pre = PRE.get(m.id);
    for (const n of activas){
      const r = evaluar(m, n, pre), uso = USOS.find(u => u.id === n.uso).l;
      const exc = r.filas.filter(f => ["exc", "g1", "g2"].includes(f.st)).map(f => P[f.pid].n);
      rs.row(r1++, 0, [muestraLabel(m), uso, n.corto, n.escala, r.ver.txt, r.medidos, r.total, exc.join(", "), r.filas.filter(f => f.st === "nc").map(f => P[f.pid].n).join(", "), r.faltan.map(k => P[k].n).join(", "), r.salv.join(" | ")],
        [0, 0, 0, 0, S[ST_X[r.ver.cls]] || 0, S.int, S.int, 0, 0, S.txt, S.txt]);
      for (const f of r.filas){
        const q = P[f.pid], du = dispOf(f.pid), conv = x => okNum(x) ? fromCanon(q, x, du.u, du.f, pre.ctx) : null;
        const v = f.val?.suma ? f.val.x / NO3_N() : okNum(f.val?.x) ? conv(f.val.x) : null;
        const vt = v != null ? v : f.val?.q === "lt" ? `<${fmtV(conv(f.val.ld))}` : f.val?.q === "gt" ? `>${fmtV(conv(f.val.gt))}` : f.val?.q === "pres" ? tx("Presencia", "Presence") : "ND";
        ev.row(r2++, 0, [muestraLabel(m), uso, n.corto, q.n + (f.val?.suma ? tx(" + nitrito (como N)", " + nitrite (as N)") : ""), vt, f.val?.suma ? tx("mg/L como N", "mg/L as N") : unitTxt(q, du.u, q.forms ? du.f : ""), f.val?.suma ? limTxt(n, f.pid, f.L) : limDisp(n, f.pid, f.L, pre.ctx), limTxt(n, f.pid, f.L), T[f.L.t] || "", ST[f.st][0], okNum(f.exc) && f.st !== "ok" ? f.exc + 1 : "", [f.L.cond, f.motivo, f.L.nota].filter(Boolean).join(" ")],
          [0, 0, 0, 0, S.num, 0, 0, 0, 0, S[ST_X[f.st]], S.num2, S.txt]);
      }
    }
  }
  // ICA
  const ic = new XSheet(tx("ICA (CCME WQI)", "CCME WQI")); sheets.push(ic);
  hs(S, ic, 0, EN ? ["Standard (objectives)", "Site", "Samples", "Variables", "Results", "F1 %", "F2 %", "F3", "WQI", "Category", "Failing variables"] : ["Norma (objetivos)", "Sitio", "Muestras", "Variables", "Resultados", "F1 %", "F2 %", "F3", "ICA", "Categoría", "Variables que fallan"]);
  let r3 = 1;
  for (const n of activas){
    const groups = new Map(); ms.forEach(m => { const k = m.sitio || tx("sin sitio", "no site"); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(m); });
    for (const [s, list] of groups){
      const w = wqi(n, list, PRE); if (!w.nv) continue;
      ic.row(r3++, 0, [n.corto, s, list.length, w.nv, w.tests, w.F1, w.F2, w.F3, w.wqi, w.clase?.l || "", [...w.vars.entries()].filter(([, v]) => v.fallas).map(([k, v]) => `${P[k].n} (${v.fallas}/${v.tests})`).join(", ")], [0, 0, S.int, S.int, S.int, S.num2, S.num2, S.num2, S.num2, 0, 0]);
    }
  }
  ic.set(r3 + 1, 0, tx("ICA = 100 − √(F1² + F2² + F3²)/1,732. Objetivos: los límites de cada norma para cada muestra. Los microbiológicos (objetivo = ausencia) y los no concluyentes quedan fuera. ", "WQI = 100 − √(F1² + F2² + F3²)/1.732. Objectives: the limits of each standard for each sample. Microbiological parameters (objective = absence) and inconclusive results are excluded. ") + WQI_CITA, S.txt); ic.merge(r3 + 1, 0, r3 + 1, 10); ic.heights[r3 + 1] = 44;
  // Iones y derivados
  const io = new XSheet(tx("Iones y derivados", "Ions and derived")); sheets.push(io);
  hs(S, io, 0, EN ? ["Sample", "Σ cations (meq/L)", "Σ anions (meq/L)", "Balance %", "Balance acceptable", "Facies", "Calc. hardness (mg/L as CaCO3)", "Measured hardness", "SAR", "Riverside", "FAO infiltration", "TDS/EC", "TDS meas./calc.", "100·Σan/EC", "pHs", "LSI", "Tendency (LSI)", "RSI", "Tendency (RSI)", "NO3/50 + NO2/3", "Notes"] : ["Muestra", "Σ cationes (meq/L)", "Σ aniones (meq/L)", "Balance %", "Balance aceptable", "Facies", "Dureza calc. (mg/L CaCO3)", "Dureza medida", "RAS", "Riverside", "Infiltración FAO", "SDT/CE", "SDT med./calc.", "100·Σan/CE", "pHs", "LSI", "Tendencia (LSI)", "RSI", "Tendencia (RSI)", "NO3/50 + NO2/3", "Notas"]);
  ms.forEach((m, i) => { const x = derivados(m, PRE.get(m.id)); io.row(i + 1, 0, [muestraLabel(m), x.sc ?? "", x.sa ?? "", x.bal ?? "", x.bal == null ? `${tx("Falta", "Missing")} ${x.faltaBal.join(", ")}` : x.balOk ? tx("Sí", "Yes") : "No", x.facies || "", x.durCalc ?? "", x.durMed ?? "", x.sar ?? "", x.claseC ? x.claseC + (x.claseS ? "-" + x.claseS : "") : "", x.infil || "", x.sdtCe ?? "", x.sdtRel ?? "", x.ceRel ?? "", x.phs ?? "", x.lsi ?? "", x.lsiTxt || "", x.rsi ?? "", x.rsiTxt || "", x.nn ?? "", [...x.notas, x.lsiNota].filter(Boolean).join(" ")],
    [0, S.num2, S.num2, S.num2, 0, 0, S.int, S.int, S.num2, 0, 0, S.num2, S.num2, S.num2, S.num2, S.num2, 0, S.num2, 0, S.num2, S.txt]); });
  // Controles
  const ct = new XSheet(tx("Controles", "Checks")); sheets.push(ct);
  hs(S, ct, 0, EN ? ["Type", "Where", "What"] : ["Tipo", "Dónde", "Qué"]); ct.widths[2] = 120;
  CTL.forEach((i, k) => ct.row(k + 1, 0, [i.sev === "error" ? "Error" : i.sev === "aviso" ? tx("Aviso", "Warning") : tx("Nota", "Note"), i.donde, i.msg]));
  // Normas usadas
  const nr = new XSheet(tx("Normas", "Standards")); sheets.push(nr);
  const todas = allNormas().filter(n => Object.keys(n.lim).length), pp = PARAMS.map(q => q.id).filter(pid => todas.some(n => n.lim[pid] != null));
  hs(S, nr, 0, [tx("Parámetro", "Parameter"), ...todas.map(n => n.corto)]);
  pp.forEach((pid, i) => nr.row(i + 1, 0, [P[pid].n, ...todas.map(n => { const s = n.lim[pid]; if (s == null) return ""; const o = typeof s === "number" ? {max: s} : s; return o.fn ? (EN ? `depends on ${o.fn === "dur831" ? "hardness" : o.fn === "al831" ? "pH, Ca and DOC" : o.fn === "fcaa" ? "mean annual temperature" : o.fn === "jpRio" || o.fn === "jpInd" ? "river class" : "species"}` : `depende de ${o.fn === "dur831" ? "la dureza" : o.fn === "al831" ? "pH, Ca y COD" : o.fn === "fcaa" ? "la temperatura media anual" : o.fn === "jpRio" || o.fn === "jpInd" ? "la clase de río" : "la especie"}`) : limTxt(n, pid, resolverLimite(n, pid, {ganado: state.cfg.ganado})); })]));
  let r4 = pp.length + 2;
  nr.set(r4++, 0, tx("Fuentes", "Sources"), S.b);
  for (const n of todas){ nr.row(r4, 0, [n.corto, `${n.escala} · ${n.tipo}. ${n.cita} ${n.ambito}`], [S.b, S.txt]); nr.merge(r4, 1, r4, Math.min(12, todas.length)); nr.heights[r4] = 30; r4++; }
  nr.row(r4++, 0, [tx("Especie de ganado", "Livestock species"), ganadoLabel(state.cfg.ganado)], [S.b, 0]);
  nr.row(r4++, 0, [tx("Clase de río (Japón)", "River class (Japan)"), tx(`${state.cfg.jpClase} (los sitios con clase propia usan la suya)`, `${state.cfg.jpClase} (sites with their own class use it)`)], [S.b, 0]);
  nr.row(r4++, 0, [tx("Agua industrial (Japón)", "Industrial water (Japan)"), `${tx("Clase", "Class")} ${state.cfg.jpInd}`], [S.b, 0]);
  return workbookBlob(sheets, S.st, tx("Kenti Calidad de Agua · resultados", "Kenti Water Quality · results"));
}
async function saveBlob(blob, name){
  if (appInfo){
    try {
      const r = await fetch("/api/exportar?nombre=" + encodeURIComponent(name), {method: "POST", headers: {"X-Kenti": "1", "Content-Type": "application/octet-stream"}, body: blob});
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json(), el = $("#toast");
      el.innerHTML = `<span>${tx(`Se guardó «${esc(j.nombre)}» en la carpeta de datos.`, `“${esc(j.nombre)}” was saved in the data folder.`)}</span><button type="button" data-m="abrir">${tx("Abrir", "Open")}</button><button type="button" data-m="carpeta">${tx("Ver carpeta", "Show folder")}</button>`; el.hidden = false;
      $$("button", el).forEach(b => b.onclick = () => { fetch("/api/abrir-exportacion", {method: "POST", headers: {"X-Kenti": "1", "Content-Type": "application/json"}, body: JSON.stringify({nombre: j.nombre, modo: b.dataset.m})}).catch(() => {}); el.hidden = true; });
      clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 12000);
      return;
    } catch(e){ toast(tx("No se pudo guardar el archivo: ", "Could not save the file: ") + e.message); return; }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name + ".xlsx"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* =========================== Arranque =========================== */
// Textos fijos de agua.html: cada elemento con data-en lleva su versión en inglés.
function aplicarIdiomaEstatico(){
  document.documentElement.lang = LANG;
  $$("[data-lang]").forEach(b => { b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)); b.onclick = () => setLang(b.dataset.lang); });
  if (!EN) return;
  $$("[data-en]").forEach(el => el.innerHTML = el.dataset.en);
  $$("[data-en-title]").forEach(el => el.title = el.dataset.enTitle);
  document.title = "Kenti Water Quality";
}
function fechaHoy(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
async function init(){
  try { const r = await fetch("/api/info", {cache: "no-store"}); if (r.ok){ const j = await r.json(); if (j.app === "kenti-calidad-agua") appInfo = j; } } catch(e){}
  let loaded = null;
  if (appInfo){ try { const r = await fetch("/api/datos", {cache: "no-store"}); if (r.status === 200) loaded = await r.json(); } catch(e){} }
  else { try { const s = localStorage.getItem(LS_KEY); if (s) loaded = JSON.parse(s); } catch(e){} }
  if (validState(loaded)) state = upgrade(loaded);
  if (appInfo){
    $("#btn-folder").hidden = false;
    $("#btn-folder").onclick = () => fetch("/api/abrir-carpeta", {method: "POST", headers: {"X-Kenti": "1"}}).catch(() => {});
    setInterval(() => fetch("/api/ping", {cache: "no-store"}).catch(() => {}), 20000);
    $("#save-state").textContent = tx("Datos en ", "Data in ") + appInfo.archivo;
  }
  aplicarIdiomaEstatico();
  $$(".tab").forEach(t => t.onclick = () => setPanel(t.dataset.p));
  $("#file-xlsx").onchange = ev => { const f = ev.target.files[0]; ev.target.value = ""; if (f) importarArchivo(f); };
  $("#btn-export").onclick = async () => {
    if (!state.muestras.length){ toast(tx("No hay muestras para exportar.", "There are no samples to export.")); return; }
    saveBlob(await exportXlsx(), tx("Kenti Calidad de Agua ", "Kenti Water Quality ") + fechaHoy());
  };
  addEventListener("keydown", ev => { if (ev.key === "Escape" && !$("#dlg").hidden) cerrarImport(); });
  addEventListener("dragover", ev => { if ([...(ev.dataTransfer?.items || [])].some(i => i.kind === "file")) ev.preventDefault(); });
  addEventListener("drop", ev => { const f = [...ev.dataTransfer.files].find(x => /\.xlsx$/i.test(x.name)); if (f){ ev.preventDefault(); importarArchivo(f); } });
  addEventListener("beforeunload", () => { if (dirty) save(); });
  setPanel(state.muestras.length ? "eval" : "datos");
}
init();
