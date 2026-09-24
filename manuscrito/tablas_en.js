// Tables and figure captions, English version.
const es = require("./tablas_es.js");
const t1 = es.tablas[0], t2 = es.tablas[1], t3 = es.tablas[2];
const marco = {"Argentina": "Argentina", "Internacional (OMS)": "International (WHO)", "Unión Europea": "European Union", "Estados Unidos": "United States",
  "Internacional (FAO)": "International (FAO)", "Canadá": "Canada", "Australia y Nueva Zelanda": "Australia and New Zealand", "Japón": "Japan"};
const norma = {
  "Código Alimentario Argentino, art. 982 [4]": "Argentine Food Code, Art. 982 [4]",
  "Guías de la OMS, 4.ª ed. con adendas (2022) [1]": "WHO Guidelines, 4th ed. with addenda (2022) [1]",
  "Directiva (UE) 2020/2184 [2]": "Directive (EU) 2020/2184 [2]",
  "EPA, reglamentos primario y secundario [3]": "EPA primary and secondary regulations [3]",
  "Dto. 831/93, anexo II, tabla 1 [5]": "Decree 831/93, Annex II, Table 1 [5]",
  "Dto. 831/93, anexo II, tabla 2 [5]": "Decree 831/93, Annex II, Table 2 [5]",
  "Dto. 831/93, anexo II, tabla 5 [5]": "Decree 831/93, Annex II, Table 5 [5]",
  "FAO, Riego y Drenaje 29 [12]": "FAO Irrigation and Drainage Paper 29 [12]",
  "Dto. 831/93, anexo II, tabla 6 [5]": "Decree 831/93, Annex II, Table 6 [5]",
  "CCME, agua para ganado [10]": "CCME, livestock water [10]",
  "ANZECC/ARMCANZ 2000 (ANZG) [11]": "ANZECC/ARMCANZ 2000 (ANZG) [11]",
  "Normas de agua potable (水質基準) [7]": "Drinking water quality standards (水質基準) [7]",
  "Estándares ambientales, salud humana [8]": "Environmental quality standards, human health [8]",
  "Estándares ambientales, ríos por clase [8]": "Environmental quality standards, rivers by class [8]",
  "Estándares ambientales, biota acuática [8]": "Environmental quality standards, aquatic biota [8]",
  "Clases de río para agua industrial [8]": "River classes for industrial water [8]",
  "Norma de agua para riego de arroz [9]": "Paddy rice irrigation water standard [9]",
};
const uso = {"Consumo humano": "Drinking water", "Fuente para potabilizar": "Source for drinking water", "Vida acuática": "Aquatic life", "Riego": "Irrigation",
  "Bebida de ganado": "Livestock water", "Cuerpo de agua": "Water body", "Uso industrial": "Industrial use"};
const tipo = {"Obligatoria (agua de red)": "Mandatory (supply)", "Guía": "Guideline", "Obligatoria": "Mandatory", "Obligatoria (MCL); secundarios, guía": "Mandatory (MCL); secondary, guideline",
  "Nivel guía legal": "Legal guideline level", "Guía técnica": "Technical guideline", "Estándar ambiental": "Environmental standard"};
const tr = (m, x) => { if (!(x in m)) throw new Error("Sin traducción: " + x); return m[x]; };
const num = x => String(x).replace(/(\d),(\d)/g, "$1.$2");
const param = {"Arsénico": "Arsenic", "Boro": "Boron", "Cadmio": "Cadmium", "Cobre": "Copper", "Cromo total": "Total chromium", "Fluoruro": "Fluoride", "Manganeso": "Manganese",
  "Mercurio": "Mercury", "Nitrato (como NO₃⁻)": "Nitrate (as NO₃⁻)", "Nitrito (como NO₂⁻)": "Nitrite (as NO₂⁻)", "Plomo": "Lead", "Selenio": "Selenium", "Uranio": "Uranium",
  "Cloruro": "Chloride", "Sulfato": "Sulfate", "Sólidos disueltos totales": "Total dissolved solids", "pH (unidades)": "pH (units)"};

module.exports = {
  archivo: "Flores_Kenti_Water_Quality_JWET_manuscript.docx",
  tablas: [
    {...t1,
      titulo: "**Table 1.** Frameworks included in the guideline value database of Kenti Water Quality 0.2. No.: number of guideline values loaded. Tables 1, 2, 5 and 6 of Annex IV of Law 24.585 [6] repeat the values of Decree 831/93 and were loaded as four separate frameworks (not shown). The full database is given in Table S1.",
      encabezado: ["Source", "Framework", "Use", "Type", "No."],
      filas: t1.filas.map(f => [tr(marco, f[0]), tr(norma, f[1]), tr(uso, f[2]), tr(tipo, f[3]), f[4]])},
    {...t2,
      titulo: "**Table 2.** Verification of the Kenti Water Quality calculations against an independent implementation in Python and NumPy, with 1000 simulated cases per procedure (seed 20260923).",
      encabezado: ["Procedure", "Cases", "Maximum difference"],
      filas: [
        ["Conversion to mg/L from 20 concentration units (N and P forms, density, molality)", "1000", "4.1 × 10⁻¹⁶ (relative)"],
        ["Decision against the limit (maximum, minimum, range, FAO degrees; <DL, >x, presence)", "1000", "1000 of 1000 agree"],
        ["CCME water quality index (F₁, F₂, F₃ and index)", "999ᵃ", "2.8 × 10⁻¹⁴"],
        ["Ion balance, SAR, calculated hardness, Langelier and Ryznar indices", "1000", "2.5 × 10⁻¹⁵ (relative)"],
      ],
      notas: ["ᵃ In one case no variable had results; both implementations returned an empty index."]},
    {...t3,
      titulo: "**Table 3.** Drinking water limits in the frameworks included (mg/L, except pH). All values are expressed in the same chemical form to make them comparable. The last column is the Argentine guideline value for sources to be treated conventionally for drinking.",
      encabezado: ["Parameter", "Argentine Food Code Art. 982", "WHO", "EU", "EPA", "Japan", "Decree 831/93 T1"],
      filas: t3.filas.map(f => [tr(param, f[0]), ...f.slice(1).map(num)]),
      notas: ["ᵃ Acceptability, indicator or secondary value (not health-based). ᵇ Action level. ᶜ To be halved from 2036. ᵈ Depending on the mean annual temperature of the site. ᵉ Set as N by the framework (10 and 1 mg/L; 0.04 mg/L for nitrite in Japan). ᶠ Limit for the sum of nitrate and nitrite."]},
  ],
  figuras: [
    {archivo: "figura1_en.png", ancho_cm: 16, leyenda: "**Fig. 1.** Workflow of Kenti Water Quality. Steps 4 and 5 (shaded) depend on the guideline value database and the decision rules; the others, on reading and converting the data."},
    {archivo: "figura2_en.png", ancho_cm: 16, leyenda: "**Fig. 2.** Assessment of six simulated samples (P: wells; V: saline springs; R: river upstream and downstream) against the 17 distinct frameworks of the database, computed with Kenti Water Quality 0.2. a) Verdict of each sample against each framework; all frameworks were applied to all samples to show the contrast, although in a report only those corresponding to the use of each point are chosen. b) Mean proportion of the parameters set by each framework that could be assessed with the 30 measured parameters."},
    {archivo: "figura3_en.png", ancho_cm: 9, leyenda: "**Fig. 3.** Sensitivity of the CCME water quality index to the subset of variables included, for 12 simulated sampling events of a well with the objectives of the Argentine Food Code. Solid line: mean of 500 random subsets of each size; band: 2.5th and 97.5th percentiles; dashed line: index with all 16 variables. Colour bands are the index categories."},
  ],
};
