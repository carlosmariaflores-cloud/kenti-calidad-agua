/* =====================================================================
   Núcleo: lectura de valores, unidades, evaluación contra normas,
   CCME WQI, iones y derivados, controles.
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const okNum = x => typeof x === "number" && isFinite(x);
const uid = () => Math.random().toString(36).slice(2, 10);
const clone = o => JSON.parse(JSON.stringify(o));
const sum = a => a.reduce((t, x) => t + (okNum(x) ? x : 0), 0);
const normTxt = s => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/μ/g, "µ").replace(/[º˚]/g, "°").replace(/\s+/g, " ").trim();
function fmtN(x, d = 2){
  if (!okNum(x)) return "—";
  return x.toLocaleString(LOC, {minimumFractionDigits: d, maximumFractionDigits: d});
}
// Número con cifras significativas razonables para mostrar concentraciones de órdenes muy distintos.
function fmtV(x, dmin){
  if (!okNum(x)) return "—";
  if (x === 0) return "0";
  const a = Math.abs(x);
  let d = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 2 : a >= 1 ? 2 : Math.min(8, Math.ceil(-Math.log10(a)) + 2);
  if (dmin != null) d = Math.max(0, Math.min(d, 8));
  let s = x.toLocaleString(LOC, {minimumFractionDigits: 0, maximumFractionDigits: d});
  return s;
}

/* ---------- Números: coma o punto decimal ---------- */
// modo: "coma" (1.234,5) o "punto" (1,234.5). Devuelve null si no es un número.
function parseNum(t, modo){
  let s = String(t ?? "").trim().replace(/\s+/g, "").replace(/[−–]/g, "-");
  if (!s) return null;
  s = s.replace(/[×x]10\^?(-?\d+)$/i, "e$1");
  if (modo === "coma"){ s = s.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."); }
  else { if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, ""); else s = s.replace(",", "."); }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
  const x = Number(s);
  return isFinite(x) ? x : null;
}
// Decide el separador decimal de una columna mirando todos sus valores.
function modoDecimal(vals){
  let coma = 0, punto = 0;
  for (const v of vals){
    const s = String(v ?? "").trim().replace(/^[<>≤≥]=?\s*/, "");
    if (/^-?\d+,\d+([eE][-+]?\d+)?$/.test(s) || /^-?\d{1,3}(\.\d{3})+,\d+$/.test(s)) coma++;
    else if (/^-?\d*\.\d+([eE][-+]?\d+)?$/.test(s) && !/^-?\d{1,3}\.\d{3}$/.test(s)) punto++;
  }
  return coma > punto ? "coma" : coma === 0 && punto === 0 ? (state?.cfg?.decimal === "punto" ? "punto" : "coma") : "punto";
}

/* ---------- Un valor tal como lo informa el laboratorio ----------
   q: num · lt (<LD) · gt (>x) · nd (no detectado, sin LD) · abs (ausencia) · pres (presencia) · na (sin dato) · err */
const NA_RE = /^(|-|—|–|\/|s\/?d|sd|n\/?a|na|nr|n\/?r|n\.?m\.?|no (realizado|medido|analizado|determinado)|not (measured|analy[sz]ed|determined|tested)|sin dato|no data|\*|\?)$/i;
const ND_RE = /^(n\.?d\.?|no detectable|no detectado|not detect(ed|able)|non[- ]?detect|nd|<\s*l\.?[dcq]\.?|<\s*lod|<\s*loq|<\s*m?dl|<\s*rl|bld|bdl|< ?ld)$/i;
function parseVal(raw, modo){
  const t = String(raw ?? "").trim();
  if (NA_RE.test(t)) return {q: "na"};
  const n = normTxt(t);
  if (ND_RE.test(n)) return {q: "nd"};
  if (/^(ausen(cia|te)|aus\.?|negativ[oa]|no se detecta|absen(t|ce)|negative|0 ?\/ ?100)$/.test(n)) return {q: "abs", x: 0};
  if (/^(presen(cia|te|t|ce)|pres\.?|positiv[oae])$/.test(n)) return {q: "pres"};
  let m = /^(<|≤|<=|menor( a| que)?|less than)\s*(.+)$/.exec(n);
  if (m){ const x = parseNum(m[3], modo); return x == null ? {q: "err"} : {q: "lt", ld: x}; }
  m = /^(>|≥|>=|mayor( a| que)?|greater than|more than)\s*(.+)$/.exec(n);
  if (m){ const x = parseNum(m[3], modo); return x == null ? {q: "err"} : {q: "gt", x}; }
  const x = parseNum(t, modo);
  return x == null ? {q: "err"} : {q: "num", x};
}
// ¿El texto «1.500» se leyó como mil quinientos o como uno coma cinco? Sólo avisa.
const ambiguoMiles = (raw, modo) => /^\d{1,3}\.\d{3}$/.test(String(raw ?? "").trim()) || (modo === "punto" && /^\d{1,3},\d{3}$/.test(String(raw ?? "").trim()));

/* ---------- Unidades ---------- */
function findUnit(p, label){ const L = unitsOf(p); return L.find(u => u[0] === label) || null; }
function guessUnit(p, txt){
  const t = normTxt(txt).replace(/[()\[\]]/g, "").replace(/\s*((como|as)\s*)?(n-|p-)?(n|p|caco3|no3|no2|nh4|nh3|po4)(-n|-p)?\s*[-+]*$/, "").trim();
  if (!t) return null;
  for (const u of unitsOf(p)) if (u[3] && new RegExp(u[3], "i").test(t)) return u[0];
  return null;
}
/* Pasa x (en la unidad y forma de la columna) a la unidad canónica del parámetro.
   ctx: {rho (g/mL), rhoSup (se supuso 1), sdt (mg/L), temp (°C)}. Devuelve {v, notas}. */
function toCanon(p, x, unitLabel, form, ctx){
  const u = findUnit(p, unitLabel) || unitsOf(p)[0], notas = [];
  if (!okNum(x)) return {v: null, notas};
  const [lab, kind, f, , g] = u;
  const formF = p.forms ? (p.forms[form || p.fc] ?? 1) : 1;
  let v;
  const rho = () => { if (ctx.rho == null){ notas.push("dens"); return 1; } return ctx.rho; };
  switch (kind){
    case "v": v = x * f * formF; break;
    case "m": v = x * f * formF * rho(); break;
    case "M": if (!p.mm) return {v: null, notas: ["sinMM"]}; v = x * f * p.mm; break;
    case "b": {
      if (!p.mm) return {v: null, notas: ["sinMM"]};
      const r = rho(); let ww = 1;
      if (ctx.sdt != null) ww = Math.max(0, 1 - ctx.sdt / (r * 1e6)); else notas.push("sdtMolal");
      v = x * f * p.mm * r * ww; break;
    }
    case "E": if (!p.mm || !p.z) return {v: null, notas: ["sinZ"]}; v = x * f * p.mm / p.z; break;
    case "r": v = x === 0 ? null : f / x; break;
    case "a": v = x * f + g; break;
    default: v = x * f;
  }
  return {v, notas};
}
// De la unidad canónica a cualquier unidad (para mostrar y para el conversor).
function fromCanon(p, v, unitLabel, form, ctx = {}){
  const u = findUnit(p, unitLabel) || unitsOf(p)[0];
  if (!okNum(v)) return null;
  const [, kind, f, , g] = u, formF = p.forms ? (p.forms[form || p.fc] ?? 1) : 1;
  const rho = ctx.rho ?? 1;
  switch (kind){
    case "v": return v / (f * formF);
    case "m": return v / (f * formF * rho);
    case "M": return p.mm ? v / (f * p.mm) : null;
    case "b": { if (!p.mm) return null; const ww = ctx.sdt != null ? Math.max(1e-9, 1 - ctx.sdt / (rho * 1e6)) : 1; return v / (f * p.mm * rho * ww); }
    case "E": return p.mm && p.z ? v / (f * p.mm / p.z) : null;
    case "r": return v === 0 ? null : f / v;
    case "a": return (v - g) / f;
    default: return v / f;
  }
}
// Unidad y forma con que se muestra un parámetro: la de su primera columna, o la canónica.
function dispOf(pid){
  const c = state.cols.find(c => c.p === pid);
  const p = P[pid];
  return {u: c?.u || canonUnit(p), f: c?.f || p?.fc || ""};
}
const formTxt = (p, f) => p.forms && f ? `${tx("como", "as")} ${f === "NH3" ? "NH₃" : f.replace("NO3", "NO₃⁻").replace("NO2", "NO₂⁻").replace("NH4", "NH₄⁺").replace("PO4", "PO₄³⁻")}` : "";
const unitTxt = (p, u, f) => `${uL(u)}${formTxt(p, f) ? " " + formTxt(p, f) : ""}`;

/* ---------- Constantes químicas, desde las masas molares ---------- */
const M_CACO3 = 100.087;
const EQW = k => P[k].mm / P[k].z;                 // peso equivalente (g/eq = mg/meq)
const NO3_N = () => P.no3.forms.N, NO2_N = () => P.no2.forms.N;
const A_CACO3 = k => (M_CACO3 / 2) / EQW(k);      // mg/L del ión → mg/L como CaCO₃ (vía meq/L)
/* ---------- Estado ---------- */
function defaultCfg(){
  return {uso: "consumo", activas: {caa982: true, who2022: true, ue2020: true, epa: true, d831_t1: true, d831_t2: true, d831_t5: true, fao29: true, d831_t6: true, ccme_ganado: true, anzg_ganado: true},
    ganado: "bovino_carne", jpClase: "A", jpInd: "1", wqiNorma: "caa982", alfa: 2.0, decimal: DEC_UI,
    propia: {nombre: "", uso: "industrial", cita: "", lim: {}}};
}
let state = {v: 1, proyecto: {nombre: "", cliente: "", campania: ""}, sitios: [], cols: [], muestras: [], cfg: defaultCfg()};
function newSitio(codigo = ""){ return {id: uid(), codigo, nombre: "", tipo: "", lat: "", lon: "", alt: "", tAire: "", claseJp: ""}; }
function newMuestra(){ return {id: uid(), sitio: "", fecha: "", hora: "", lab: "", obs: "", v: {}}; }
function newCol(p, h = "", u = "", f = ""){
  const par = P[p];
  return {id: uid(), p: p || "", h, u: u || (par ? canonUnit(par) : ""), f: f || (par?.fc || ""), frac: "total", comp25: false, ld: ""};
}
const sitioDe = m => state.sitios.find(s => s.codigo && s.codigo === String(m.sitio || "").trim()) || null;
const muestraLabel = m => [m.sitio || tx("sin sitio", "no site"), m.fecha ? fechaCorta(m.fecha) : "", m.lab].filter(Boolean).join(" · ");
function fechaCorta(iso){ const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? (EN ? `${m[1]}-${m[2]}-${m[3]}` : `${m[3]}/${m[2]}/${m[1]}`) : (iso || ""); }

/* Norma activa por id (la propia vive en la configuración). */
function normaPropia(){
  const c = state.cfg.propia;
  const nom = c.nombre && c.nombre !== "Norma propia" ? c.nombre : tx("Norma propia", "Custom standard");
  return {id: "propia", uso: c.uso || "industrial", marco: tx("Propia", "Custom"), escala: tx("Del proyecto o del cliente", "Project or client"), tipo: tx("Definida por el usuario", "User-defined"),
    nombre: nom, corto: nom, cita: c.cita || tx("Valores cargados por el usuario.", "Values entered by the user."), ambito: tx("Límites definidos en «Normas y criterios».", "Limits defined in “Standards and criteria”."),
    lim: Object.fromEntries(Object.entries(c.lim || {}).map(([k, o]) => [k, {min: numOrNull(o.min), max: numOrNull(o.max), f: o.f || undefined, propia: true}]).filter(([, o]) => o.min != null || o.max != null))};
}
const numOrNull = v => { const x = parseNum(v, DEC_UI); return x == null ? null : x; };
const allNormas = () => [...NORMAS, normaPropia()];
const normaById = id => id === "propia" ? normaPropia() : N[id];

/* ---------- Valores de una muestra en unidades canónicas ---------- */
let COLMODO = {};                          // id de columna → "coma" | "punto"
function prepColumnas(){
  COLMODO = {};
  for (const c of state.cols){
    const vals = state.muestras.map(m => m.v[c.id]);
    COLMODO[c.id] = state.cfg.decimal === "auto" ? modoDecimal(vals) : state.cfg.decimal;
  }
}
const ORDEN_CTX = ["dens", "temp", "sdt"];
function valoresMuestra(m){
  const out = {}, ctx = {rho: null, sdt: null, temp: null};
  const cols = state.cols.filter(c => c.p && P[c.p]);
  const orden = [...cols].sort((a, b) => (ORDEN_CTX.indexOf(a.p) + 1 || 99) - (ORDEN_CTX.indexOf(b.p) + 1 || 99));
  for (const c of orden){
    const p = P[c.p], raw = m.v[c.id], modo = COLMODO[c.id] || "coma";
    const pv = parseVal(raw, modo);
    if (pv.q === "na") continue;
    const r = {q: pv.q, raw, col: c, notas: [], x: null, ld: null, gt: null};
    if (pv.q === "err"){ r.err = true; }
    else {
      const conv = x => { const t = toCanon(p, x, c.u, c.f, ctx); t.notas.forEach(n => r.notas.includes(n) || r.notas.push(n)); return t.v; };
      if (pv.q === "num" || pv.q === "abs") r.x = conv(pv.x);
      if (pv.q === "lt") r.ld = conv(pv.ld);
      if (pv.q === "gt") r.gt = conv(pv.x);
      if (pv.q === "nd" && String(c.ld || "").trim()){ const l = parseVal(c.ld, modo); const lx = l.q === "lt" ? l.ld : l.x; if (okNum(lx)){ r.ld = conv(lx); r.q = "lt"; r.ldCol = true; } }
      if (c.p === "ce" && c.comp25 && okNum(r.x)){
        if (ctx.temp == null) r.notas.push("sinTempComp");
        else { r.x = r.x / (1 + (state.cfg.alfa || 2) / 100 * (ctx.temp - 25)); r.comp = true; }
      }
      if (ambiguoMiles(raw, modo)) r.ambiguo = true;
    }
    if (c.p === "dens" && okNum(r.x)) ctx.rho = r.x;
    if (c.p === "temp" && okNum(r.x)) ctx.temp = r.x;
    if (c.p === "sdt" && okNum(r.x)) ctx.sdt = r.x;
    // Una columna por parámetro para evaluar: primero la fracción total, después la primera con dato.
    const prev = out[c.p];
    if (!prev || (prev.col.frac !== "total" && c.frac === "total") || (prev.q === "err" && r.q !== "err")){ if (prev) r.otras = [...(prev.otras || []), prev]; out[c.p] = r; }
    else (prev.otras = prev.otras || []).push(r);
  }
  // Derivados que la norma usa como parámetro: dureza y RAS, si no se midieron.
  const x = k => okNum(out[k]?.x) ? out[k].x : null;
  if (!out.dureza && x("ca") != null && x("mg") != null) out.dureza = {q: "num", x: A_CACO3("ca") * x("ca") + A_CACO3("mg") * x("mg"), calc: true, notas: [], col: null};
  if (!out.sar && x("na") != null && x("ca") != null && x("mg") != null){
    const ca = x("ca") / EQW("ca"), mg = x("mg") / EQW("mg"), na = x("na") / EQW("na");
    if (ca + mg > 0) out.sar = {q: "num", x: na / Math.sqrt((ca + mg) / 2), calc: true, notas: [], col: null};
  }
  return {vals: out, ctx};
}
// Contexto de la muestra para los límites condicionales.
function ctxLimites(m, vals){
  const s = sitioDe(m), x = k => okNum(vals[k]?.x) ? vals[k].x : null;
  return {dureza: x("dureza"), durezaCalc: !!vals.dureza?.calc, ph: x("ph"), ca: x("ca"), cod: x("cod"),
    tAire: s ? numOrNull(s.tAire) : null, ganado: state.cfg.ganado,
    jpClase: (s && s.claseJp) || state.cfg.jpClase || "A", jpInd: state.cfg.jpInd || "1"};
}

/* ---------- Límite de una norma para un parámetro y una muestra ---------- */
function resolverLimite(norma, pid, ctx){
  let spec = norma.lim[pid];
  if (spec == null) return null;
  if (typeof spec === "number") spec = {max: spec};
  let r = {...spec};
  if (spec.fn && LIM_FN[spec.fn]) Object.assign(r, LIM_FN[spec.fn](spec, ctx));
  const p = P[pid], k = p.forms ? (p.forms[r.f || p.fc] ?? 1) : 1;
  r.t = r.t || "salud";
  r.k = k;                                    // factor de la forma de la norma a la canónica
  r.cMax = r.max != null ? r.max * k : null;
  r.cMin = r.min != null ? r.min * k : null;
  r.cGr = r.grados ? r.grados.map(g => g * k) : null;
  return r;
}
const limTxt = (norma, pid, L) => {
  if (!L) return "—";
  const p = P[pid], u = norma.lim[pid] && typeof norma.lim[pid] === "object" && norma.lim[pid].propia ? dispOf(pid).u : canonUnit(p);
  const f = L.f || p.fc, fm = p.forms ? ` ${formTxt(p, f)}` : "";
  const un = unitLabelShort(p);
  if (L.grados) return `${fmtV(L.grados[0])} / ${fmtV(L.grados[1])} ${un}${fm}`;
  if (L.min != null && L.max != null) return `${fmtV(L.min)}–${fmtV(L.max)} ${un}${fm}`;
  if (L.min != null) return `≥ ${fmtV(L.min)} ${un}${fm}`;
  return `${L.max === 0 ? tx("Ausencia", "Absence") : "≤ " + fmtV(L.max) + " " + un + fm}`;
};
const unitLabelShort = p => p.fam === "ph" ? "" : p.fam === "adim" ? "" : uL(canonUnit(p));

/* ---------- Juicio de un valor contra un límite ----------
   st: ok · exc · g1 (restricción ligera a moderada) · g2 (severa) · nc (no concluyente) · sd (sin dato) */
function juzgar(val, L){
  if (!val || val.q === "na") return {st: "sd"};
  if (val.q === "err") return {st: "nc", motivo: tx("Valor ilegible.", "Unreadable value.")};
  const max = L.cMax, min = L.cMin, gr = L.cGr;
  if (val.q === "pres"){
    if (max === 0) return {st: "exc", motivo: tx("Presencia.", "Presence.")};
    return {st: "nc", motivo: tx("Presencia sin recuento.", "Presence without a count.")};
  }
  if (val.q === "nd") return {st: "nc", motivo: tx("No detectado, sin límite de detección informado.", "Not detected, no detection limit reported.")};
  if (val.q === "lt"){
    const ld = val.ld;
    if (!okNum(ld)) return {st: "nc", motivo: tx("Sin límite de detección.", "No detection limit.")};
    if (gr){ return ld <= gr[0] ? {st: "ok"} : {st: "nc", motivo: tx(`El límite de detección (${fmtV(ld)}) supera el umbral.`, `The detection limit (${fmtV(ld)}) exceeds the threshold.`)}; }
    if (min != null && ld <= min) return {st: "exc", motivo: tx("Por debajo del mínimo (menor que el LD).", "Below the minimum (less than the DL).")};
    if (min != null) return {st: "nc", motivo: tx("Menor que el LD, y el LD es mayor que el mínimo.", "Less than the DL, and the DL is above the minimum.")};
    if (max != null && ld > max) return {st: "nc", motivo: tx(`LD (${fmtV(ld)}) mayor que el límite (${fmtV(max)}): no se puede saber si cumple.`, `DL (${fmtV(ld)}) above the limit (${fmtV(max)}): compliance cannot be determined.`)};
    return {st: "ok", ld: true};
  }
  if (val.q === "gt"){
    const g = val.gt;
    if (gr) return g >= gr[1] ? {st: "g2"} : g >= gr[0] ? {st: "nc", motivo: tx("Informado como «mayor que» dentro del rango.", "Reported as “greater than” within the range.")} : {st: "nc"};
    if (max != null && g >= max) return {st: "exc", exc: g / (max || 1) - 1, motivo: tx("Mayor que el máximo medible.", "Greater than the maximum measurable.")};
    return {st: "nc", motivo: tx("Informado como «mayor que»: no se sabe cuánto.", "Reported as “greater than”: the actual value is unknown.")};
  }
  const x = val.x;
  if (!okNum(x)) return {st: "nc", motivo: tx("Sin valor.", "No value.")};
  if (gr){
    if (x < gr[0]) return {st: "ok"};
    if (x <= gr[1]) return {st: "g1", exc: gr[0] > 0 ? x / gr[0] - 1 : null};
    return {st: "g2", exc: gr[0] > 0 ? x / gr[0] - 1 : null};
  }
  if (max != null && x > max) return {st: "exc", exc: max > 0 ? x / max - 1 : null};
  if (min != null && x < min) return {st: "exc", exc: x > 0 ? min / x - 1 : null, bajo: true};
  return {st: "ok"};
}

/* ---------- Evaluación de una muestra contra una norma ---------- */
const CLAVE_USO = EN ? {
  consumo: [["as", "arsenic"], ["no3", "nitrate"], ["f", "fluoride"], ["ecoli", "E. coli"]],
  fuente: [["as", "arsenic"], ["no3", "nitrate"]],
  acuatica: [["ph", "pH"], ["dureza", "hardness (conditions several metals)"]],
  riego: [["ce", "conductivity"], ["sar", "SAR (sodium, calcium and magnesium)"], ["b", "boron"]],
  ganado: [["sdt", "total dissolved solids"], ["so4", "sulfate"], ["no3", "nitrate"], ["as", "arsenic"], ["f", "fluoride"]],
  ambiental: [["dbo", "BOD₅"], ["od", "dissolved oxygen"], ["ph", "pH"]],
  industrial: [],
} : {
  consumo: [["as", "arsénico"], ["no3", "nitrato"], ["f", "fluoruro"], ["ecoli", "E. coli"]],
  fuente: [["as", "arsénico"], ["no3", "nitrato"]],
  acuatica: [["ph", "pH"], ["dureza", "dureza (condiciona varios metales)"]],
  riego: [["ce", "conductividad"], ["sar", "RAS (sodio, calcio y magnesio)"], ["b", "boro"]],
  ganado: [["sdt", "sólidos disueltos totales"], ["so4", "sulfato"], ["no3", "nitrato"], ["as", "arsénico"], ["f", "fluoruro"]],
  ambiental: [["dbo", "DBO₅"], ["od", "oxígeno disuelto"], ["ph", "pH"]],
  industrial: [],
};
const NO_SALUD = new Set(["estetico", "secundario", "indicador", "operativo"]);
function valorSuma(vals){
  // CCME: nitrato + nitrito como N; se devuelve en la forma canónica del nitrato.
  const a = vals.no3, b = vals.no2;
  const aN = okNum(a?.x) ? a.x / NO3_N() : a?.q === "lt" || a?.q === "abs" ? 0 : null;
  const bN = okNum(b?.x) ? b.x / NO2_N() : b?.q === "lt" || b?.q === "abs" ? 0 : null;
  if (aN == null && bN == null) return null;
  const nota = [b ? null : tx("Sin nitrito: se evalúa sólo el nitrato.", "No nitrite: only nitrate is assessed."), a ? null : tx("Sin nitrato: se evalúa sólo el nitrito.", "No nitrate: only nitrite is assessed."), (a?.q === "lt" || b?.q === "lt") ? tx("Lo informado como menor que el LD cuenta como cero en la suma.", "Values reported as below the DL count as zero in the sum.") : null].filter(Boolean).join(" ");
  return {q: "num", x: ((aN || 0) + (bN || 0)) * NO3_N(), suma: true, nota, notas: []};
}
function evaluar(m, norma, pre){
  const {vals} = pre || valoresMuestra(m);
  const ctx = ctxLimites(m, vals);
  const filas = [], faltan = [], cond = [];
  let total = 0;
  for (const pid of Object.keys(norma.lim)){
    if (!P[pid]) continue;
    const L = resolverLimite(norma, pid, ctx);
    if (!L || (L.max == null && L.min == null && !L.grados)) continue;
    if (!L.opc) total++;
    let val = vals[pid];
    if (L.suma) val = valorSuma(vals);
    const j = juzgar(val, L);
    if (j.st === "sd"){ if (!L.opc) faltan.push(pid); continue; }
    if (L.falta) cond.push({pid, txt: L.cond});
    filas.push({pid, val, L, ...j});
  }
  const cuenta = s => filas.filter(f => f.st === s).length;
  const exc = filas.filter(f => f.st === "exc" || f.st === "g2"), excSalud = exc.filter(f => !NO_SALUD.has(f.L.t));
  const res = {norma, m, filas, faltan, cond, total, medidos: filas.length, n: {ok: cuenta("ok"), exc: cuenta("exc"), g1: cuenta("g1"), g2: cuenta("g2"), nc: cuenta("nc")}};
  const nom = f => P[f.pid].n;
  if (!filas.length) res.ver = {cls: "sd", txt: tx("Sin datos para esta norma", "No data for this standard")};
  else if (excSalud.length) res.ver = {cls: "exc", txt: `${tx("No cumple", "Does not comply")}: ${excSalud.map(nom).join(", ")}`};
  else if (res.n.g2) res.ver = {cls: "exc", txt: `${tx("Restricción severa", "Severe restriction")}: ${filas.filter(f => f.st === "g2").map(nom).join(", ")}`};
  else if (exc.length) res.ver = {cls: "warn", txt: `${tx("Supera valores no sanitarios", "Exceeds non-health values")}: ${exc.map(nom).join(", ")}`};
  else if (res.n.g1) res.ver = {cls: "warn", txt: `${tx("Restricción ligera a moderada", "Slight to moderate restriction")}: ${filas.filter(f => f.st === "g1").map(nom).join(", ")}`};
  else if (faltan.length || res.n.nc) res.ver = {cls: "parcial", txt: tx("Cumple en lo medido", "Complies for measured parameters")};
  else res.ver = {cls: "ok", txt: tx("Cumple", "Complies")};
  res.salv = salvedades(res, vals);
  return res;
}
function salvedades(res, vals){
  const out = [], {norma} = res;
  if (res.faltan.length) out.push(tx(`Se evaluaron ${res.medidos} de los ${res.total} parámetros que fija la norma. No se midieron: ${res.faltan.map(k => P[k].n).join(", ")}.`, `${res.medidos} of the ${res.total} parameters set by the standard were assessed. Not measured: ${res.faltan.map(k => P[k].n).join(", ")}.`));
  const clave = (CLAVE_USO[norma.uso] || []).filter(([k]) => norma.lim[k] && res.faltan.includes(k));
  if (clave.length) out.push(tx(`Faltan parámetros decisivos para este uso: ${clave.map(c => c[1]).join(", ")}. Sin ellos el diagnóstico puede cambiar.`, `Key parameters for this use are missing: ${clave.map(c => c[1]).join(", ")}. Without them the diagnosis may change.`));
  if ((norma.uso === "consumo") && !["ecoli", "colt"].some(k => vals[k])) out.push(tx("Sin análisis microbiológico: no se puede afirmar la aptitud para consumo aunque los químicos cumplan.", "No microbiological analysis: fitness for drinking cannot be stated even if the chemical parameters comply."));
  const nc = res.filas.filter(f => f.st === "nc");
  if (nc.length) out.push(`${tx("No concluyentes", "Inconclusive")}: ${nc.map(f => `${P[f.pid].n} (${f.motivo || tx("sin valor comparable", "no comparable value")})`).join("; ")}.`);
  for (const c of res.cond) out.push(`${P[c.pid].n}: ${c.txt}`);
  const calc = res.filas.filter(f => f.val?.calc);
  if (calc.length) out.push(tx(`${calc.map(f => P[f.pid].n).join(" y ")} ${calc.length > 1 ? "se calcularon" : "se calculó"} a partir de los iones (no se midió directamente).`, `${calc.map(f => P[f.pid].n).join(" and ")} ${calc.length > 1 ? "were" : "was"} calculated from the ions (not measured directly).`));
  const dens = res.filas.filter(f => f.val?.notas?.includes("dens"));
  if (dens.length) out.push(tx(`Sin densidad de la muestra: para pasar ${dens.map(f => P[f.pid].n).join(", ")} de ppm, mg/kg o mol/kg a mg/L se asumió 1 g/mL.`, `No sample density: 1 g/mL was assumed to convert ${dens.map(f => P[f.pid].n).join(", ")} from ppm, mg/kg or mol/kg to mg/L.`));
  const suma = res.filas.find(f => f.val?.suma && f.val.nota);
  if (suma) out.push(suma.val.nota);
  if (norma.espejo) out.push(tx(`Valores idénticos a los de ${N[norma.espejo].corto}; se informa por separado para citar el marco que corresponde.`, `Values identical to ${N[norma.espejo].corto}; reported separately so that the applicable framework is cited.`));
  return out;
}

/* ---------- CCME WQI ---------- */
function wqi(norma, muestras, pres){
  const vars = new Map();                              // pid → {tests, fallas, exc}
  let tests = 0, fallas = 0, sumExc = 0, excluidos = [];
  for (const m of muestras){
    const r = evaluar(m, norma, pres?.get(m.id));
    for (const f of r.filas){
      if (f.st === "nc"){ excluidos.push(`${P[f.pid].n} ${tx("en", "in")} ${muestraLabel(m)}`); continue; }
      if (f.L.cMax === 0 || (f.L.cGr && f.L.cGr[0] === 0)){ continue; }   // objetivo cero: sin excursión posible
      const v = vars.get(f.pid) || {tests: 0, fallas: 0};
      v.tests++; tests++;
      const falla = f.st === "exc" || f.st === "g1" || f.st === "g2";
      if (falla){ v.fallas++; fallas++; sumExc += okNum(f.exc) ? f.exc : 0; }
      vars.set(f.pid, v);
    }
  }
  const nv = vars.size, fv = [...vars.values()].filter(v => v.fallas).length;
  if (!nv || !tests) return {nv: 0, tests: 0, wqi: null, excluidos};
  const F1 = fv / nv * 100, F2 = fallas / tests * 100, nse = sumExc / tests, F3 = nse / (0.01 * nse + 0.01);
  const val = 100 - Math.sqrt(F1 ** 2 + F2 ** 2 + F3 ** 2) / 1.732;
  const q = Math.max(0, Math.min(100, val));
  return {nv, tests, fv, fallas, F1, F2, F3, nse, wqi: q, clase: WQI_CLASES.find(c => Math.round(q) >= c.min), vars, excluidos, nMuestras: muestras.length};
}

/* ---------- Iones y derivados ---------- */
const CAT_K = ["ca", "mg", "na", "k"], AN_K = ["cl", "so4", "hco3", "co3", "no3"];
function derivados(m, pre){
  const {vals, ctx} = pre || valoresMuestra(m);
  const x = k => okNum(vals[k]?.x) ? vals[k].x : (vals[k]?.q === "lt" || vals[k]?.q === "abs") ? 0 : null;
  const d = {notas: []};
  // meq/L
  d.cat = Object.fromEntries(CAT_K.map(k => [k, x(k) == null ? null : x(k) / EQW(k)]));
  d.an = Object.fromEntries(AN_K.map(k => [k, x(k) == null ? null : x(k) / EQW(k)]));
  if (d.an.hco3 == null && x("alc") != null){ d.an.hco3 = x("alc") / (M_CACO3 / 2) - (d.an.co3 || 0); d.hco3Alc = true; }
  const faltaCat = ["ca", "mg", "na"].filter(k => d.cat[k] == null), faltaAn = ["cl", "so4", "hco3"].filter(k => d.an[k] == null);
  if (!faltaCat.length && !faltaAn.length){
    d.sc = sum(Object.values(d.cat)); d.sa = sum(Object.values(d.an));
    d.bal = (d.sc - d.sa) / (d.sc + d.sa) * 100;
    const dif = Math.abs(d.sc - d.sa);
    d.balOk = d.sa <= 3 ? dif <= 0.2 : d.sa <= 10 ? Math.abs(d.bal) <= 2 : Math.abs(d.bal) <= 5;
    d.balCrit = EN ? (d.sa <= 3 ? "± 0.2 meq/L (anion sum ≤ 3 meq/L)" : d.sa <= 10 ? "± 2% (anions 3–10 meq/L)" : "± 5% (anions > 10 meq/L)") : (d.sa <= 3 ? "± 0,2 meq/L (suma de aniones ≤ 3 meq/L)" : d.sa <= 10 ? "± 2 % (aniones 3–10 meq/L)" : "± 5 % (aniones > 10 meq/L)");
    if (d.cat.k == null) d.notas.push(tx("Sin potasio: el balance puede quedar corto de cationes.", "No potassium: the balance may be short of cations."));
    if (d.hco3Alc) d.notas.push(tx("Bicarbonato estimado desde la alcalinidad total.", "Bicarbonate estimated from total alkalinity."));
    // Facies: catión y anión dominantes (% de meq)
    const dom = (o, nom) => { const t = sum(Object.values(o)); const [k, v] = Object.entries(o).filter(e => e[1] != null).sort((a, b) => b[1] - a[1])[0] || []; return k ? {k, pct: v / t * 100, nom: nom[k]} : null; };
    d.facCat = dom(d.cat, EN ? {ca: "calcium", mg: "magnesium", na: "sodium", k: "potassium"} : {ca: "cálcica", mg: "magnésica", na: "sódica", k: "potásica"});
    d.facAn = dom({cl: d.an.cl, so4: d.an.so4, hco3: sum([d.an.hco3, d.an.co3])}, EN ? {cl: "chloride", so4: "sulfate", hco3: "bicarbonate"} : {cl: "Clorurada", so4: "Sulfatada", hco3: "Bicarbonatada"});
    d.facies = d.facCat && d.facAn ? (EN ? `${d.facCat.nom[0].toUpperCase() + d.facCat.nom.slice(1)} ${d.facAn.nom}` : `${d.facAn.nom} ${d.facCat.nom}`) : null;
  } else d.faltaBal = [...faltaCat, ...faltaAn].map(k => P[k].n);
  // Dureza
  if (x("ca") != null && x("mg") != null) d.durCalc = A_CACO3("ca") * x("ca") + A_CACO3("mg") * x("mg");
  const durMed = vals.dureza && !vals.dureza.calc ? x("dureza") : null;
  if (durMed != null && d.durCalc != null) d.durDif = (durMed - d.durCalc) / d.durCalc * 100;
  d.durMed = durMed;
  // RAS
  if (d.cat.na != null && d.cat.ca != null && d.cat.mg != null && d.cat.ca + d.cat.mg > 0) d.sar = d.cat.na / Math.sqrt((d.cat.ca + d.cat.mg) / 2);
  else if (okNum(vals.sar?.x)) d.sar = vals.sar.x;
  const ce = x("ce"); d.ce = ce;
  if (ce != null){
    d.claseC = ce < 250 ? "C1" : ce < 750 ? "C2" : ce < 2250 ? "C3" : "C4";
    if (d.sar != null){
      const L = Math.log10(Math.max(ce, 100));
      const s1 = 18.87 - 4.44 * L, s2 = 31.31 - 6.66 * L, s3 = 43.75 - 8.87 * L;
      d.claseS = d.sar <= s1 ? "S1" : d.sar <= s2 ? "S2" : d.sar <= s3 ? "S3" : "S4";
      // FAO: infiltración según RAS y CE (dS/m)
      const ec = ce / 1000, T = [[3, .7, .2], [6, 1.2, .3], [12, 1.9, .5], [20, 2.9, 1.3], [40, 5.0, 2.9]];
      const row = T.find(r => d.sar <= r[0]);
      d.infil = row ? (ec > row[1] ? tx("Sin restricción", "None") : ec >= row[2] ? tx("Ligera a moderada", "Slight to moderate") : tx("Severa", "Severe")) : tx("Fuera de la tabla (RAS > 40)", "Outside the table (SAR > 40)");
    }
  }
  // Relaciones de control (APHA 1030 E)
  const sdt = x("sdt"); d.sdt = sdt;
  if (sdt != null && ce) d.sdtCe = sdt / ce;
  if (["na", "k", "ca", "mg", "cl", "so4"].every(k => x(k) != null) && (x("alc") != null || x("hco3") != null)){
    const alk = x("alc") != null ? x("alc") : x("hco3") * A_CACO3("hco3") + (x("co3") || 0) * A_CACO3("co3");
    d.sdtCalc = 0.6 * alk + x("na") + x("k") + x("ca") + x("mg") + x("cl") + x("so4") + (x("sio2") || 0) + (x("no3") || 0) / NO3_N() + (x("f") || 0);
    if (sdt != null) d.sdtRel = sdt / d.sdtCalc;
  }
  if (ce && d.sa != null) d.ceRel = 100 * d.sa / ce;
  // Langelier y Ryznar
  const ph = x("ph");
  if (ph != null && x("ca") != null && (x("alc") != null || x("hco3") != null)){
    let tds = sdt, t = x("temp");
    if (tds == null && ce != null){ tds = ce * 0.65; d.lsiNota = tx("SDT estimado como 0,65 × CE.", "TDS estimated as 0.65 × EC."); }
    if (t == null){ t = 25; d.lsiNota = (d.lsiNota ? d.lsiNota + " " : "") + tx("Sin temperatura: se usó 25 °C.", "No temperature: 25 °C was used."); }
    if (tds != null){
      const alk = x("alc") != null ? x("alc") : x("hco3") * A_CACO3("hco3") + (x("co3") || 0) * A_CACO3("co3");
      const caH = x("ca") * A_CACO3("ca");
      if (alk > 0 && caH > 0){
        const A = (Math.log10(tds) - 1) / 10, B = -13.12 * Math.log10(t + 273.15) + 34.55, C = Math.log10(caH) - 0.4, D = Math.log10(alk);
        d.phs = 9.3 + A + B - (C + D); d.lsi = ph - d.phs; d.rsi = 2 * d.phs - ph;
        d.lsiTxt = d.lsi > 0.5 ? tx("Incrustante", "Scale-forming") : d.lsi > 0.2 ? tx("Levemente incrustante", "Slightly scale-forming") : d.lsi >= -0.2 ? tx("En equilibrio", "Balanced") : d.lsi >= -0.5 ? tx("Levemente corrosiva", "Slightly corrosive") : tx("Corrosiva (agresiva)", "Corrosive (aggressive)");
        d.rsiTxt = d.rsi < 5.5 ? tx("Muy incrustante", "Heavy scale") : d.rsi < 6.2 ? tx("Incrustante", "Scale-forming") : d.rsi <= 6.8 ? tx("Poco incrustante ni corrosiva", "Little scale or corrosion") : d.rsi <= 8.5 ? tx("Corrosiva", "Corrosive") : tx("Muy corrosiva", "Heavy corrosion");
        if (tds > 10000) d.lsiNota = (d.lsiNota ? d.lsiNota + " " : "") + tx("Con más de 10 g/L de sales el índice de Langelier pierde validez.", "Above 10 g/L of salts the Langelier index loses validity.");
      }
    }
  }
  // Nitrato + nitrito (OMS y UE)
  const no3 = x("no3"), no2 = x("no2");
  if (no3 != null || no2 != null) d.nn = (no3 || 0) / 50 + (no2 || 0) / 3, d.nnFalta = no3 == null ? tx("nitrato", "nitrate") : no2 == null ? tx("nitrito", "nitrite") : null;
  return d;
}

/* ---------- Controles ---------- */
const SEV = {error: 0, aviso: 1, info: 2};
function controles(){
  const out = [], add = (sev, donde, msg, ref) => out.push({sev, donde, msg, ref});
  prepColumnas();
  state.cols.forEach(c => {
    if (!c.p) add("aviso", tx(`Columna «${c.h || "sin nombre"}»`, `Column “${c.h || "unnamed"}”`), tx("No tiene parámetro asignado: no entra en el análisis. Asignalo en el encabezado de la tabla o quitala.", "No parameter assigned: it is left out of the analysis. Assign one in the table header or remove it."), {tab: "datos"});
  });
  const dup = new Map();
  state.muestras.forEach((m, i) => {
    const w = `${tx("Muestra", "Sample")} ${i + 1} · ${muestraLabel(m)}`, ref = {tab: "datos", m: m.id};
    if (!String(m.sitio || "").trim()) add("aviso", w, tx("Sin sitio.", "No site."), ref);
    if (!m.fecha) add("info", w, tx("Sin fecha.", "No date."), ref);
    const k = [m.sitio, m.fecha, m.hora, m.lab].join("|");
    if (dup.has(k)) add("aviso", w, tx(`Misma identificación que la muestra ${dup.get(k) + 1}.`, `Same identification as sample ${dup.get(k) + 1}.`), ref); else dup.set(k, i);
    const pre = valoresMuestra(m), {vals} = pre;
    for (const [pid, v] of Object.entries(vals)){
      const p = P[pid];
      for (const r of [v, ...(v.otras || [])]){
        if (!r.col) continue;
        if (r.err) add("error", w, tx(`${p.n}: «${r.raw}» no es un valor que Kenti pueda leer.`, `${p.n}: “${r.raw}” is not a value Kenti can read.`), ref);
        if (okNum(r.x) && r.x < 0 && !p.neg && pid !== "temp") add("error", w, `${p.n}: ${tx("valor negativo.", "negative value.")}`, ref);
        if (okNum(r.x) && r.x > p.plaus) add("aviso", w, tx(`${p.n}: ${fmtV(r.x)} ${canonUnit(p)} es un valor muy alto. ¿Está bien la unidad de la columna (${r.col.u})?`, `${p.n}: ${fmtV(r.x)} ${uL(canonUnit(p))} is a very high value. Is the column unit (${uL(r.col.u)}) right?`), ref);
        if (r.ambiguo) add("info", w, tx(`${p.n}: «${r.raw}» se leyó como ${fmtV(fromCanon(p, r.x, r.col.u, r.col.f))} (separador decimal: ${COLMODO[r.col.id] === "coma" ? "coma" : "punto"}). Verificar.`, `${p.n}: “${r.raw}” was read as ${fmtV(fromCanon(p, r.x, r.col.u, r.col.f))} (decimal separator: ${COLMODO[r.col.id] === "coma" ? "comma" : "point"}). Please check.`), ref);
        if (r.notas.includes("sinTempComp")) add("aviso", w, tx("Conductividad marcada para compensar a 25 °C, pero la muestra no tiene temperatura: quedó sin compensar.", "Conductivity marked for compensation to 25 °C, but the sample has no temperature: left uncompensated."), ref);
        if (r.notas.includes("sinMM") || r.notas.includes("sinZ")) add("error", w, tx(`${p.n}: la unidad ${r.col.u} necesita masa molar o carga, y este parámetro no la tiene.`, `${p.n}: the unit ${uL(r.col.u)} needs a molar mass or charge, which this parameter does not have.`), ref);
      }
      if (pid === "ph" && okNum(v.x) && (v.x < 0 || v.x > 14)) add("error", w, `pH ${fmtN(v.x, 2)}: ${tx("fuera de 0–14.", "outside 0–14.")}`, ref);
      else if (pid === "ph" && okNum(v.x) && (v.x < 3 || v.x > 11)) add("aviso", w, `pH ${fmtN(v.x, 2)}: ${tx("muy extremo para agua natural.", "very extreme for natural water.")}`, ref);
      const dis = [v, ...(v.otras || [])].find(r => r.col?.frac === "disuelta" && okNum(r.x)), tot = [v, ...(v.otras || [])].find(r => r.col?.frac === "total" && okNum(r.x));
      if (dis && tot && dis.x > tot.x * 1.1) add("aviso", w, `${p.n}: ${tx("la fracción disuelta supera a la total en más de 10 %.", "the dissolved fraction exceeds the total by more than 10%.")}`, ref);
    }
    const dens = Object.values(vals).some(v => v.notas?.includes("dens"));
    const sal = (okNum(vals.sdt?.x) && vals.sdt.x > 10000) || (okNum(vals.ce?.x) && vals.ce.x > 15000);
    if (dens && sal) add("aviso", w, tx("Agua salina sin densidad: los valores en ppm, mg/kg o mol/kg se pasaron a mg/L con 1 g/mL. En salmueras la diferencia puede superar el 10 %. Cargá la densidad.", "Saline water without density: values in ppm, mg/kg or mol/kg were converted to mg/L with 1 g/mL. In brines the difference can exceed 10%. Enter the density."), ref);
    else if (dens) add("info", w, tx("Sin densidad: ppm, mg/kg o mol/kg se pasaron a mg/L con 1 g/mL (válido en agua dulce).", "No density: ppm, mg/kg or mol/kg were converted to mg/L with 1 g/mL (valid for fresh water)."), ref);
    const no3 = vals.no3?.x, no2 = vals.no2?.x;
    if (okNum(no3) && okNum(no2) && no2 / NO2_N() > no3 / NO3_N()) add("info", w, tx("Hay más nitrógeno como nitrito que como nitrato: poco habitual en agua oxigenada. Revisar.", "More nitrogen as nitrite than as nitrate: unusual in oxygenated water. Please check."), ref);
    const d = derivados(m, pre);
    if (d.bal != null && !d.balOk) add("aviso", w, tx(`Balance iónico ${fmtN(d.bal, 1)} % (criterio ${d.balCrit}). Puede faltar un ión o haber un error de análisis o de unidades.`, `Ion balance ${fmtN(d.bal, 1)}% (criterion ${d.balCrit}). An ion may be missing, or there may be an analytical or unit error.`), ref);
    if (d.durDif != null && Math.abs(d.durDif) > 10) add("aviso", w, tx(`La dureza medida difiere ${fmtN(d.durDif, 0)} % de la calculada con Ca y Mg.`, `Measured hardness differs by ${fmtN(d.durDif, 0)}% from that calculated from Ca and Mg.`), ref);
    if (d.sdtCe != null && d.ce < 50000 && (d.sdtCe < 0.55 || d.sdtCe > 0.75)) add("aviso", w, tx(`SDT/CE = ${fmtN(d.sdtCe, 2)}: lo habitual es 0,55–0,75. Revisar unidades de la conductividad o de los sólidos.`, `TDS/EC = ${fmtN(d.sdtCe, 2)}: the usual range is 0.55–0.75. Check the units of conductivity or solids.`), ref);
    if (d.sdtRel != null && (d.sdtRel < 1 || d.sdtRel > 1.2)) add("info", w, tx(`SDT medido / SDT calculado = ${fmtN(d.sdtRel, 2)} (APHA espera 1,0–1,2).`, `Measured TDS / calculated TDS = ${fmtN(d.sdtRel, 2)} (APHA expects 1.0–1.2).`), ref);
    if (d.ceRel != null && d.ce < 5000 && (d.ceRel < 0.9 || d.ceRel > 1.1)) add("info", w, tx(`100 × aniones / CE = ${fmtN(d.ceRel, 2)} (APHA espera 0,9–1,1 en agua dulce).`, `100 × anions / EC = ${fmtN(d.ceRel, 2)} (APHA expects 0.9–1.1 in fresh water).`), ref);
  });
  return out.sort((a, b) => SEV[a.sev] - SEV[b.sev]);
}
