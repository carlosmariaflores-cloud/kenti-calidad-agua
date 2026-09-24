// Ejecuta las funciones de cálculo de Kenti Calidad de Agua (sin interfaz) sobre los casos
// que genera verificar.py y devuelve los resultados en JSON. Uso: node kenti_calc.js casos.json > kenti.json
const fs = require("fs"), vm = require("vm"), path = require("path");
const SRC = path.join(__dirname, "..", "src");
const ctx = {console, Math, JSON, Number, String, Object, Array, Set, Map, isFinite, parseFloat, RegExp};
vm.createContext(ctx);
for (const f of ["a0_i18n.js", "a1_datos.js", "a1b_datos_en.js", "a2_nucleo.js"]) vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), ctx, {filename: f});
const casos = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
ctx.__casos = casos;
const out = vm.runInContext(`(() => {
  const res = {conv: [], juicio: [], wqi: [], iones: []};
  // 1. Conversión de unidades a la unidad canónica
  for (const c of __casos.conv){
    const r = toCanon(P[c.p], c.x, c.u, c.f, {rho: c.rho, sdt: c.sdt, temp: null});
    res.conv.push(r.v);
  }
  // 2. Juicio de un valor (incluidos censurados) contra un límite
  for (const c of __casos.juicio){
    const L = {cMax: c.max, cMin: c.min, cGr: c.gr};
    res.juicio.push(juzgar(c.val, L).st);
  }
  // 3. CCME WQI sobre una norma propia y muestras sintéticas
  for (const c of __casos.wqi){
    state = {v: 1, proyecto: {}, sitios: [], cfg: defaultCfg(), cols: [], muestras: []};
    state.cfg.decimal = "punto";
    state.cfg.propia = {nombre: "prueba", uso: "industrial", cita: "", lim: c.lim};
    state.cols = c.params.map(p => ({id: "c_" + p, p, h: p, u: canonUnit(P[p]), f: P[p].fc || "", frac: "total", comp25: false, ld: ""}));
    state.muestras = c.muestras.map((m, i) => ({id: "m" + i, sitio: "S", fecha: "", hora: "", lab: "", obs: "", v: Object.fromEntries(Object.entries(m).map(([p, x]) => ["c_" + p, String(x)]))}));
    prepColumnas();
    const w = wqi(normaPropia(), state.muestras);
    res.wqi.push(w.wqi == null ? null : {wqi: w.wqi, F1: w.F1, F2: w.F2, F3: w.F3});
  }
  // 4. Iones: balance, RAS, dureza calculada, Langelier
  for (const c of __casos.iones){
    state = {v: 1, proyecto: {}, sitios: [], cfg: defaultCfg(), cols: [], muestras: []};
    state.cfg.decimal = "punto";
    const ps = Object.keys(c);
    state.cols = ps.map(p => ({id: "c_" + p, p, h: p, u: canonUnit(P[p]), f: P[p].fc || "", frac: "total", comp25: false, ld: ""}));
    state.muestras = [{id: "m", sitio: "S", v: Object.fromEntries(ps.map(p => ["c_" + p, String(c[p])]))}];
    prepColumnas();
    const d = derivados(state.muestras[0]);
    res.iones.push({bal: d.bal, sar: d.sar, dur: d.durCalc, lsi: d.lsi, rsi: d.rsi});
  }
  return JSON.stringify(res);
})()`, ctx);
process.stdout.write(out);
