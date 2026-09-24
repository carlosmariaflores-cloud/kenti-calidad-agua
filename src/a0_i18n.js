"use strict";
/* =====================================================================
   Idioma de la interfaz: español o inglés.
   Se elige con el botón ES / EN del encabezado y se recuerda en este
   equipo. Al cambiarlo la página se recarga: los datos no cambian, sólo
   los textos, los nombres de parámetros y normas y el formato de números.
   ===================================================================== */
const LANG_KEY = "kenti-idioma";
const LANG = (() => {
  if (typeof KENTI_LANG !== "undefined") return KENTI_LANG;      // guiones sin navegador (verificación, exportación)
  try { const s = localStorage.getItem(LANG_KEY); if (s === "es" || s === "en") return s; } catch(e){}
  return /^es\b/i.test((typeof navigator !== "undefined" && navigator.language) || "es") ? "es" : "en";
})();
const EN = LANG === "en";
const tx = (es, en) => EN ? en : es;            // texto en el idioma activo
const LOC = EN ? "en-US" : "es-AR";             // formato de números
const DEC_UI = EN ? "punto" : "coma";           // separador decimal de lo que se escribe en la interfaz
function setLang(l){
  if (l === LANG) return;
  try { localStorage.setItem(LANG_KEY, l); } catch(e){}
  if (typeof dirty !== "undefined" && dirty && typeof save === "function") save().finally(() => location.reload());
  else location.reload();
}
// Unidades: la etiqueta interna (la que se guarda) es la española; ésta es la que se muestra.
const UNIT_EN = {
  "UFC/100 mL": "CFU/100 mL", "NMP/100 mL": "MPN/100 mL", "UFC/mL": "CFU/mL", "NMP/mL": "MPN/mL", "UFC/L": "CFU/L", "NMP/L": "MPN/L",
  "unid. pH": "pH units", "% (m/v)": "% (w/v)", "% (m/m)": "% (w/w)",
  "°f (grado francés)": "°f (French degree)", "°dH (grado alemán)": "°dH (German degree)", "°e (grado inglés)": "°e (English degree)",
  "Ω·cm (resistividad)": "Ω·cm (resistivity)", "kΩ·cm (resistividad)": "kΩ·cm (resistivity)", "MΩ·cm (resistividad)": "MΩ·cm (resistivity)", "Ω·m (resistividad)": "Ω·m (resistivity)",
  "mg/L CaCO₃": "mg/L as CaCO₃",
};
const uL = u => EN ? (UNIT_EN[u] || u) : u;
