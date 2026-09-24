/* =====================================================================
   Importar tablas: pegadas desde Excel o leídas de un .xlsx.
   Reconoce muestras en filas (una columna por parámetro) o el formato de
   los informes de laboratorio (parámetros en filas y muestras en columnas),
   con fila o columna de unidades y de límite de detección.
   ===================================================================== */
const PARAM_RE = PARAMS.map(p => [p, new RegExp(p.m, "i")]);
const META = {
  sitio: /^(sitio|punto( de (muestreo|monitoreo|toma))?|estaci[oó]n|lugar|site|station|sampling (point|site|location)|location|pozo|well|ubicaci[oó]n|punto)\b/,
  muestra: /^(muestra|id( de)? muestra|c[oó]digo( de)? muestra|sample( id| code| no\.?)?)\b/,
  fecha: /^(fecha|date|dia|d[ií]a de muestreo|sampling date)\b/,
  hora: /^(hora|time)\b/,
  lab: /^(protocolo|n[°º]? ?(de )?(lab|protocolo|informe)|id lab|c[oó]digo lab|informe|laboratorio|n[°º] muestra lab|lab(oratory)? (id|no\.?|code|sample)|report( no\.?)?)/,
  obs: /^(observaciones|obs\.?|notas?|comentarios?|remarks|notes|comments?)\b/,
};
const SKIP_RE = /(nivel|valor)(es)? gu[ií]a|l[ií]mite (permitido|m[aá]ximo|admisible|legal)|norma|^caa\b|art[ií]culo|^ley\b|^dto|decreto|^oms\b|^who\b|referencia|^vmp|^lmp|guideline|(permissible|maximum|legal|regulatory) limit|^mcl\b|^smcl\b|regulation|^reference/;
const UNIT_HDR = /^(unidad(es)?|unid\.?|u\.?|units?)$/;
const LD_HDR = /^(l\.?d\.?|l\.?c\.?|l\.?q\.?|lod|loq|m?dl|rl|pql|l[ií]mite de (detecci[oó]n|cuantificaci[oó]n)|(method )?detection limit|reporting limit|quantitation limit)$/;
const METODO_HDR = /(m[eé]todo|t[eé]cnica|method|norma de ensayo|incertidumbre)/;

function matchParam(txt){
  const t = normTxt(txt).replace(/^[\d.\-)\s]+(?=[a-z])/, "");
  if (!t || SKIP_RE.test(t)) return null;
  for (const [p, re] of PARAM_RE) if (re.test(t)) return p;
  // «Total iron», «Dissolved lead»: se prueba sin el calificativo inicial.
  const t2 = t.replace(/^(total|dissolved|diss\.?|disuelto|soluble)\s+/, "");
  if (t2 !== t) for (const [p, re] of PARAM_RE) if (re.test(t2)) return p;
  return null;
}
function matchMeta(txt){
  const t = normTxt(txt);
  for (const [k, re] of Object.entries(META)) if (re.test(t)) return k;
  return null;
}
// Unidad, forma y fracción que declara un encabezado.
function leerEncabezado(p, txt, unitTxt){
  const t = normTxt(txt);
  let u = null, f = "";
  const cands = [unitTxt, ...(t.match(/[(\[]([^)\]]+)[)\]]/g) || []).map(s => s.slice(1, -1)), t.replace(new RegExp(p.m, "i"), " ").replace(/\b(total|disuelt[oa]|solubles?|como .*)$/, "").trim(), t.split(/\s+/).slice(-1)[0]];
  for (const c of cands){ if (c == null) continue; const g = guessUnit(p, c); if (g){ u = g; break; } }
  if (p.forms){
    const all = normTxt([txt, unitTxt].join(" "));
    if (/(como|as) n\b|\bn-n[oh]|n[oh][234]?-n\b|\(n\)|nitr[oó]geno (de |como )?(nitrat|nitrit|amon)|n-no|n amoniacal/.test(all)) f = "N";
    else if (/(como|as) p\b|\bp-po4|po4-p|\(p\)/.test(all)) f = "P";
    else if (/(como|as) nh3|nh3\b/.test(all) && p.id === "nh4") f = "NH3";
    else f = p.fc;
  }
  const frac = p.g === "metal" && /disuelt|soluble|filtrad/.test(t) ? "disuelta" : "total";
  return {u, f, frac};
}
function isUnitRow(cells){
  const ne = cells.filter(c => String(c ?? "").trim());
  if (ne.length < 2) return false;
  const u = ne.filter(c => /^[(\[]?\s*(mg|µg|ug|ng|g|meq|mmol|µmol|mol|ppm|ppb|µs|us|ms|ds|ntu|unt|fnu|ufc|nmp|cfu|mpn|°c|°f|upH|u\.?\s?ph|ph units|s\.?u\.?$|unid|pt|%|mv|ohm|ω|k?ω)/i.test(String(c).trim()));
  return u.length >= ne.length * 0.5;
}
// Fecha en texto (dd/mm/aaaa, aaaa-mm-dd o número de serie de Excel) → aaaa-mm-dd
function leerFecha(v){
  v = String(v ?? "").trim(); if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const x = parseNum(v, DEC_UI);
  if (x != null && x > 20000 && x < 80000) return new Date(Math.round((Math.floor(x) - 25569) * 86400e3)).toISOString().slice(0, 10);
  const m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/.exec(v);
  if (m){ const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; }
  return v;
}
function leerHora(v){
  v = String(v ?? "").trim(); const x = parseNum(v, "coma");
  if (x != null && x > 0 && x < 1){ const m = Math.round(x * 1440); return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }
  const m = /^(\d{1,2})[:.h](\d{2})/.exec(v); return m ? `${m[1].padStart(2, "0")}:${m[2]}` : v;
}

/* Analiza una grilla de texto y devuelve {cols, muestras, notas} sin tocar el estado. */
function analizarTabla(rows){
  rows = Array.from(rows, r => Array.from(r || [], c => String(c ?? "").trim()));
  while (rows.length && !rows[rows.length - 1].some(Boolean)) rows.pop();
  const notas = [];
  const W = Math.max(0, ...rows.map(r => r.length));
  // ¿Parámetros en una fila (muestras en filas) o en una columna (informe de laboratorio)?
  let bestRow = -1, bestRowN = 0;
  for (let r = 0; r < Math.min(rows.length, 20); r++){
    const n = rows[r].filter(c => matchParam(c)).length;
    if (n > bestRowN){ bestRowN = n; bestRow = r; }
  }
  let bestCol = -1, bestColN = 0;
  for (let c = 0; c < Math.min(W, 5); c++){
    const n = rows.filter(r => matchParam(r[c])).length;
    if (n > bestColN){ bestColN = n; bestCol = c; }
  }
  if (Math.max(bestRowN, bestColN) === 0) throw new Error(tx("No se reconoció ningún parámetro en los encabezados. Revisá que la tabla tenga una fila (o columna) con los nombres de los parámetros.", "No parameter was recognised in the headers. Check that the table has a row (or column) with the parameter names."));
  return bestColN > bestRowN ? analizarTraspuesta(rows, bestCol, notas) : analizarAncha(rows, bestRow, notas);
}
function analizarAncha(rows, hr, notas){
  const head = rows[hr];
  let unitRow = null, first = hr + 1;
  if (rows[hr + 1] && isUnitRow(rows[hr + 1])){ unitRow = rows[hr + 1]; first = hr + 2; }
  const cols = [], meta = {};
  head.forEach((h, c) => {
    if (!h && !(unitRow?.[c])) return;
    const mk = matchMeta(h);
    if (mk && !(mk in meta)){ meta[mk] = c; return; }
    const p = matchParam(h);
    if (!p && SKIP_RE.test(normTxt(h))) return;
    if (!p){ cols.push({c, col: newCol("", h)}); return; }
    const e = leerEncabezado(p, h, unitRow?.[c]);
    const col = newCol(p.id, h + (unitRow?.[c] ? ` (${unitRow[c]})` : ""), e.u || canonUnit(p), e.f);
    col.frac = e.frac; if (!e.u && unitsOf(p).length > 1) col.uSup = true;
    cols.push({c, col});
  });
  if (!("sitio" in meta) && "muestra" in meta){ meta.sitio = meta.muestra; delete meta.muestra; }
  const muestras = [];
  let ldRow = null;
  for (let r = first; r < rows.length; r++){
    const row = rows[r]; if (!row.some(Boolean)) continue;
    const lead = normTxt(row[0] || row.find(Boolean));
    if (LD_HDR.test(lead)){ ldRow = row; continue; }
    if (SKIP_RE.test(lead) || /^(promedio|media|m[aá]ximo|m[ií]nimo|desv|total|average|mean|maximum|minimum)\b/.test(lead)) continue;
    const m = newMuestra();
    m.sitio = meta.sitio != null ? row[meta.sitio] : "";
    m.fecha = meta.fecha != null ? leerFecha(row[meta.fecha]) : "";
    m.hora = meta.hora != null ? leerHora(row[meta.hora]) : "";
    m.lab = meta.muestra != null ? row[meta.muestra] : meta.lab != null ? row[meta.lab] : "";
    m.obs = meta.obs != null ? row[meta.obs] : "";
    cols.forEach(({c, col}) => { if (row[c] !== "" && row[c] != null) m.v[col.id] = row[c]; });
    muestras.push(m);
  }
  if (ldRow) cols.forEach(({c, col}) => { if (ldRow[c]) col.ld = ldRow[c]; });
  if (meta.sitio == null) notas.push(tx("No se encontró una columna de sitio: las muestras quedaron sin sitio.", "No site column was found: samples have no site."));
  if (unitRow) notas.push(tx("Se leyó la fila de unidades debajo de los encabezados.", "The row of units below the headers was read."));
  return {cols: cols.map(x => x.col), muestras, notas, formato: tx("Muestras en filas", "Samples in rows")};
}
function analizarTraspuesta(rows, pc, notas){
  // Fila de encabezado: la última fila no vacía antes del primer parámetro.
  const r0 = rows.findIndex(r => matchParam(r[pc]));
  let hr = -1; for (let r = r0 - 1; r >= 0; r--) if (rows[r].some(Boolean) && !matchMeta(rows[r][pc])){ hr = r; break; }
  const head = hr >= 0 ? rows[hr] : [];
  const W = Math.max(...rows.map(r => r.length));
  let uc = -1, ldc = -1; const skip = new Set([pc]);
  for (let c = 0; c < W; c++){
    if (c === pc) continue;
    const h = normTxt(head[c]);
    if (UNIT_HDR.test(h) || (uc < 0 && c === pc + 1 && isUnitRow(rows.slice(r0, r0 + 12).map(r => r[c])))){ uc = c; skip.add(c); continue; }
    if (LD_HDR.test(h)){ ldc = c; skip.add(c); continue; }
    if (METODO_HDR.test(h) || SKIP_RE.test(h)) { skip.add(c); continue; }
    if (c < pc) skip.add(c);
  }
  const sampleCols = [];
  for (let c = pc + 1; c < W; c++) if (!skip.has(c) && rows.some((r, i) => i >= r0 && r[c])) sampleCols.push(c);
  // Filas de metadatos (sitio, fecha…) en cualquier parte, identificadas por la primera celda.
  const metaRows = {};
  rows.forEach((r, i) => { const k = matchMeta(r[pc]) || (pc > 0 ? matchMeta(r[0]) : null); if (k && !(k in metaRows)) metaRows[k] = i; });
  const muestras = sampleCols.map(c => {
    const m = newMuestra();
    const id = head[c] || "";
    m.sitio = metaRows.sitio != null ? rows[metaRows.sitio][c] : id;
    m.lab = (metaRows.muestra != null ? rows[metaRows.muestra][c] : metaRows.lab != null ? rows[metaRows.lab][c] : (metaRows.sitio != null ? id : "")) || "";
    m.fecha = metaRows.fecha != null ? leerFecha(rows[metaRows.fecha][c]) : "";
    m.hora = metaRows.hora != null ? leerHora(rows[metaRows.hora][c]) : "";
    m.obs = metaRows.obs != null ? rows[metaRows.obs][c] : "";
    return {c, m};
  });
  const cols = [];
  for (let r = r0; r < rows.length; r++){
    const row = rows[r], name = row[pc]; if (!name) continue;
    if (matchMeta(name)) continue;
    const p = matchParam(name);
    if (!p && SKIP_RE.test(normTxt(name))) continue;
    if (!sampleCols.some(c => row[c])) continue;
    let col;
    if (!p) col = newCol("", name);
    else { const e = leerEncabezado(p, name, uc >= 0 ? row[uc] : ""); col = newCol(p.id, name + (uc >= 0 && row[uc] ? ` (${row[uc]})` : ""), e.u || canonUnit(p), e.f); col.frac = e.frac; if (!e.u && unitsOf(p).length > 1) col.uSup = true; }
    if (ldc >= 0 && row[ldc]) col.ld = row[ldc];
    cols.push(col);
    muestras.forEach(({c, m}) => { if (row[c]) m.v[col.id] = row[c]; });
  }
  notas.push(tx("Formato de informe de laboratorio: parámetros en filas y muestras en columnas.", "Laboratory report layout: parameters in rows and samples in columns."));
  if (uc >= 0) notas.push(tx("Se leyó la columna de unidades.", "The unit column was read.")); if (ldc >= 0) notas.push(tx("Se leyó la columna de límite de detección.", "The detection limit column was read."));
  return {cols, muestras: muestras.map(x => x.m), notas, formato: tx("Informe de laboratorio (traspuesto)", "Laboratory report (transposed)")};
}

/* Incorpora el resultado al estado: «agregar» junta columnas iguales; «reemplazar» empieza de cero. */
function incorporar(res, modo){
  if (modo === "reemplazar"){ state.cols = []; state.muestras = []; }
  const mapa = {};
  for (const c of res.cols){
    const igual = c.p ? state.cols.find(x => x.p === c.p && x.frac === c.frac && x.u === c.u && x.f === c.f && !mapa[x.id + "_usado"]) : null;
    if (igual && !Object.values(mapa).includes(igual.id)){ mapa[c.id] = igual.id; if (c.ld && !igual.ld) igual.ld = c.ld; }
    else { state.cols.push(c); mapa[c.id] = c.id; }
  }
  for (const m of res.muestras){
    const v = {}; for (const [k, x] of Object.entries(m.v)) v[mapa[k]] = x;
    m.v = v; state.muestras.push(m);
  }
  asegurarSitios();
}
function asegurarSitios(){
  const codes = [...new Set(state.muestras.map(m => String(m.sitio || "").trim()).filter(Boolean))];
  for (const c of codes) if (!state.sitios.some(s => s.codigo === c)) state.sitios.push(newSitio(c));
}
const textoAGrilla = txt => txt.replace(/\r/g, "").replace(/\n+$/, "").split("\n").map(l => l.split("\t"));
