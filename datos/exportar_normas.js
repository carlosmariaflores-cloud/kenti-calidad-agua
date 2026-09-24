// Exporta la base de niveles guía de Kenti a datos/niveles_guia.csv (tabla suplementaria S1).
const fs = require("fs"), vm = require("vm"), path = require("path");
const c = {console, Math, JSON}; vm.createContext(c);
for (const f of ["a0_i18n.js", "a1_datos.js", "a1b_datos_en.js", "a2_nucleo.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "src", f), "utf8"), c);
const rows = vm.runInContext(`(() => {
  const COND = s => ({
    dur831: () => "Según dureza: " + s.v.join(" / ") + " mg/L para 0–60, 60–120, 120–180 y >180 mg/L CaCO3",
    al831: () => "0,005 o 0,1 mg/L según pH, Ca y COD", fcaa: () => "Según temperatura media anual: de 1,7 a 0,8 mg/L",
    cuCCME: () => "Por especie: ovinos 0,5; bovinos 1; porcinos y aves 5", cuANZG: () => "Por especie: ovinos 0,4; bovinos 1; porcinos y aves 5",
    sdtANZG: () => "Por especie: de 2000 a 5000 mg/L", jpRio: () => "Según clase de río AA–E", jpInd: () => "Según clase de agua industrial 1–3",
  })[s.fn]?.() || "";
  const out = [["norma_id", "norma", "escala", "tipo", "uso", "parametro_id", "parametro", "minimo", "maximo", "umbral_ligero", "umbral_severo", "unidad", "expresado_como", "tipo_de_valor", "condicion", "nota", "cita"]];
  for (const n of NORMAS) for (const [pid, s0] of Object.entries(n.lim)){
    const p = P[pid], s = typeof s0 === "number" ? {max: s0} : s0;
    out.push([n.id, n.nombre, n.escala, n.tipo, n.uso, pid, p.n, s.min ?? "", s.max ?? "", s.grados ? s.grados[0] : "", s.grados ? s.grados[1] : "",
      canonUnit(p), p.forms ? (s.f || p.fc) : "", s.t || (s.grados ? "grado" : "salud"), s.fn ? COND(s) : "", (s.nota || "") + (s.suma ? " (suma nitrato + nitrito)" : ""), n.cita]);
  }
  return out;
})()`, c);
const csv = rows.map(r => r.map(x => { x = String(x); return /[",\n;]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }).join(",")).join("\n");
fs.writeFileSync(path.join(__dirname, "niveles_guia.csv"), "﻿" + csv + "\n");
console.log(rows.length - 1, "valores guía de", new Set(rows.slice(1).map(r => r[0])).size, "normas");
