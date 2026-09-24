// Corre las funciones de Kenti Calidad de Agua (sin interfaz) para las figuras y tablas del artículo.
// Uso: node experimentos.js  →  escribe resultados_ejemplo.json y resultados_sensibilidad.json
const fs = require("fs"), vm = require("vm"), path = require("path");
const SRC = path.join(__dirname, "..", "src"), DAT = path.join(__dirname, "..", "datos");
const ctx = {console, Math, JSON};
vm.createContext(ctx);
for (const f of ["a0_i18n.js", "a1_datos.js", "a1b_datos_en.js", "a2_nucleo.js", "a4_import.js"]) vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), ctx, {filename: f});
ctx.__ej = fs.readFileSync(path.join(DAT, "ejemplo_puna.tsv"), "utf8");
ctx.__serie = fs.readFileSync(path.join(DAT, "serie_pozo.tsv"), "utf8");
const r = JSON.parse(vm.runInContext(`(() => {
  const nuevo = () => { state = {v: 1, proyecto: {}, sitios: [], cols: [], muestras: [], cfg: defaultCfg()}; state.cfg.decimal = "coma"; };
  // 1. Ejemplo: cada muestra contra cada norma (sin los espejos de la Ley 24.585)
  nuevo();
  const res = analizarTabla(textoAGrilla(__ej));
  incorporar(res, "reemplazar");
  prepColumnas();
  const normas = NORMAS.filter(n => !n.espejo);
  const ej = {columnas: res.cols.map(c => [c.p, c.u, c.f]), normas: normas.map(n => ({id: n.id, corto: n.corto, uso: n.uso, escala: n.escala})), muestras: []};
  for (const m of state.muestras){
    ej.muestras.push({sitio: m.sitio, eval: normas.map(n => { const e = evaluar(m, n); return {id: n.id, cls: e.ver.cls, txt: e.ver.txt, medidos: e.medidos, total: e.total, exc: e.filas.filter(f => ["exc", "g2"].includes(f.st)).map(f => f.pid), faltan: e.faltan}; })});
  }
  ej.controles = controles().map(c => [c.sev, c.donde, c.msg]);
  // 2. Sensibilidad del ICA al subconjunto de variables (12 muestreos de un pozo, objetivos del CAA)
  nuevo();
  incorporar(analizarTabla(textoAGrilla(__serie)), "reemplazar");
  prepColumnas();
  const todas = state.cols.slice();
  const conObjetivo = todas.filter(c => N.caa982.lim[c.p] != null && !["colt", "ecoli"].includes(c.p) && c.p !== "dureza");
  state.cols = conObjetivo;
  const completo = wqi(N.caa982, state.muestras);
  let semilla = 20260923;
  const azar = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
  const sens = {completo: {wqi: completo.wqi, nv: completo.nv, vars: [...completo.vars.keys()]}, porK: []};
  for (let k = 3; k < conObjetivo.length; k++){
    const vals = [];
    for (let rep = 0; rep < 500; rep++){
      const idx = conObjetivo.map((c, i) => [azar(), c]).sort((a, b) => a[0] - b[0]).slice(0, k).map(x => x[1]);
      state.cols = idx;
      const w = wqi(N.caa982, state.muestras);
      vals.push(w.wqi);
    }
    sens.porK.push({k, vals});
  }
  state.cols = todas;
  return JSON.stringify({ej, sens});
})()`, ctx));
fs.writeFileSync(path.join(__dirname, "resultados_ejemplo.json"), JSON.stringify(r.ej, null, 1));
fs.writeFileSync(path.join(__dirname, "resultados_sensibilidad.json"), JSON.stringify(r.sens));
console.log("ICA completo:", r.sens.completo.wqi.toFixed(1), "con", r.sens.completo.nv, "variables:", r.sens.completo.vars.join(", "));
for (const m of r.ej.muestras) console.log(m.sitio, m.eval.map(e => e.id + "=" + e.cls + "(" + e.medidos + "/" + e.total + ")").join(" "));
