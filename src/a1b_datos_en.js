/* =====================================================================
   Datos de referencia en inglés y nombres en inglés para reconocer
   encabezados. Los nombres alternativos se agregan siempre (una tabla en
   inglés se puede pegar con la interfaz en español); los textos se
   reemplazan sólo con la interfaz en inglés.
   ===================================================================== */
const ALIAS_EN = {
  temp: "temperature|^water temp", ce: "conductivity|specific conductance|^spc\\b", sdt: "dissolved solids|filterable residue",
  sst: "suspended solids", dens: "density|specific gravity", od: "dissolved oxygen(?!.*%)|^do\\b(?!.*%)", odsat: "(oxygen|^do\\b).*(%|sat)",
  turb: "turbidity", color: "^colou?r\\b", ca: "^calcium", mg: "^magnesium", na: "^sodium(?! adsorp)", k: "^potassium",
  cl: "^chlorides?", so4: "^sul(f|ph)ates?", hco3: "^bicarbonates?", co3: "^carbonates?", alc: "alkalinity", dureza: "hardness",
  sio2: "^silica", sar: "sodium adsorption", no3: "nitrates?", no2: "nitrites?", nh4: "ammoni(um|a)", nt: "^total nitrogen|nitrogen,? total(?! kjeldahl)",
  pt: "^total phosphorus|phosphorus,? total", po4: "phosphates?", dbo: "^bod|biochemical oxygen", codmn: "permanganate",
  cot: "total organic carbon", cod: "dissolved organic carbon", al: "^alumin(i)?um", sb: "^antimony", as: "^arsenic", ba: "^barium",
  be: "^beryllium", b: "^boron", cd: "^cadmium", zn: "^zinc", co: "^cobalt", cu: "^copper", cr6: "hexavalent chromium|chromium ?\\(?vi\\)?",
  cr: "^chromium|total chromium", fe: "^iron", li: "^lithium", mn: "^manganese", hg: "^mercury", mo: "^molybdenum", ni: "^nickel", ag: "^silver",
  pb: "^lead\\b", se: "^selenium", sr: "^strontium", tl: "^thallium", u: "^uranium", v: "^vanadium", f: "^fluorides?",
  cn: "cyanide", bro3: "bromate", clres: "(free|residual|total) chlorine|chlorine,? (free|residual)",
  colt: "total coliforms?|coliforms?,? total", colf: "(fecal|faecal|thermotolerant) coliforms?|thermotolerant|^f(a)?ecal coli", meso: "heterotrophic|plate count|^hpc\\b",
};
for (const [id, re] of Object.entries(ALIAS_EN)) P[id].m = P[id].m + "|" + re;
// «COD» es carbono orgánico disuelto en español y demanda química de oxígeno en inglés.
if (EN){
  P.cod.m = P.cod.m.replace("|^cod\\b", "");
  P.dqo.m = P.dqo.m + "|^cod\\b(?! ?-? ?mn)|chemical oxygen demand";
}

if (EN){
  const GR = {campo: "Field and general physicochemical", iones: "Major ions", nutri: "Nutrients and organic matter", metal: "Metals and metalloids", otros: "Other inorganics", micro: "Microbiological"};
  GRUPOS.forEach(g => g[1] = GR[g[0]]);
  const PN = {temp: "Water temperature", ph: "pH", ce: "Electrical conductivity", sdt: "Total dissolved solids", sst: "Total suspended solids", dens: "Density",
    od: "Dissolved oxygen", odsat: "Dissolved oxygen (% saturation)", turb: "Turbidity", color: "Colour", orp: "Redox potential (ORP)",
    ca: "Calcium", mg: "Magnesium", na: "Sodium", k: "Potassium", cl: "Chloride", so4: "Sulfate", hco3: "Bicarbonate", co3: "Carbonate",
    alc: "Total alkalinity", dureza: "Total hardness", sio2: "Silica", sar: "SAR (sodium adsorption ratio)",
    no3: "Nitrate", no2: "Nitrite", nh4: "Ammonium", nt: "Total nitrogen", pt: "Total phosphorus", po4: "Phosphate", dbo: "BOD₅",
    codmn: "Permanganate COD (COD-Mn)", dqo: "COD", cod: "Dissolved organic carbon", cot: "Total organic carbon",
    al: "Aluminium", sb: "Antimony", as: "Arsenic", ba: "Barium", be: "Beryllium", b: "Boron", cd: "Cadmium", zn: "Zinc", co: "Cobalt", cu: "Copper",
    cr6: "Hexavalent chromium", cr: "Total chromium", fe: "Iron", li: "Lithium", mn: "Manganese", hg: "Mercury", mo: "Molybdenum", ni: "Nickel",
    ag: "Silver", pb: "Lead", se: "Selenium", sr: "Strontium", tl: "Thallium", u: "Uranium", v: "Vanadium",
    f: "Fluoride", cn: "Cyanide", bro3: "Bromate", pfas: "PFOS + PFOA (sum)", clres: "Residual chlorine",
    colt: "Total coliforms", colf: "Thermotolerant (faecal) coliforms", ecoli: "Escherichia coli", pseud: "Pseudomonas aeruginosa", meso: "Heterotrophic plate count"};
  PARAMS.forEach(p => p.n = PN[p.id] || p.n);
  const US = {
    consumo: ["Drinking water", "Treated drinking water or water for direct consumption."],
    fuente: ["Source for drinking water", "Raw water to be treated conventionally for drinking."],
    acuatica: ["Aquatic life", "Protection of biota in fresh surface water."],
    ambiental: ["Water body (environmental standard)", "Environmental quality standards for the river or lake: human health and use classes."],
    riego: ["Irrigation", "Suitability for crop irrigation."],
    ganado: ["Livestock water", "Drinking water for farm animals."],
    industrial: ["Industrial use", "There are no general legal guideline values for process water. Japan sets river classes suitable for industrial use."],
  };
  USOS.forEach(u => { [u.l, u.d] = US[u.id]; });
  Object.assign(T, {salud: "Health", estetico: "Acceptability", indicador: "Indicator", secundario: "Secondary (not mandatory)", accion: "Action level", operativo: "Operational", guia: "Guideline level", grado: "Degree of restriction"});
  const GA = {bovino_carne: "Beef cattle", bovino_leche: "Dairy cattle", ovino: "Sheep", caprino: "Goats", camelido: "Camelids (llamas, vicuñas)", equino: "Horses", porcino: "Pigs", aves: "Poultry"};
  GANADO.forEach(g => g.l = GA[g.id]);
  Object.assign(JP_USO, {AA: "drinking water 1 and nature conservation", A: "drinking water 2, fisheries 1 and bathing", B: "drinking water 3 and fisheries 2", C: "fisheries 3 and industrial 1", D: "industrial 2 and irrigation", E: "industrial 3 and environmental conservation"});
  const WC = {Excelente: ["Excellent", "Virtually no threat or impairment; very close to natural conditions."], Buena: ["Good", "Only a minor degree of threat or impairment; rarely departs from desirable levels."],
    Regular: ["Fair", "Usually protected but occasionally threatened or impaired."], Marginal: ["Marginal", "Frequently threatened or impaired."], Pobre: ["Poor", "Almost always threatened or impaired; far from desirable levels."]};
  WQI_CLASES.forEach(c => { [c.l, c.d] = WC[c.l]; });

  const NM = {
    caa982: {escala: "National · Argentina", tipo: "Mandatory for supply water", nombre: "Argentine Food Code (CAA), Art. 982", corto: "CAA Art. 982",
      cita: "Código Alimentario Argentino (Law 18.284), Chapter XII, Article 982, as amended by Joint Resolution SCS–SAByDR 33/2023.", ambito: "Public supply and household drinking water."},
    who2022: {escala: "International · WHO", tipo: "International guideline (not mandatory)", nombre: "WHO · Guidelines for drinking-water quality, 4th ed. with 1st and 2nd addenda (2022)", corto: "WHO 2022",
      cita: "WHO. 2022. Guidelines for drinking-water quality: fourth edition incorporating the first and second addenda. World Health Organization, Geneva. Table A3.3 and chapter 10.",
      ambito: "Drinking water. Health-based values; acceptability values (taste, appearance) are listed separately."},
    ue2020: {escala: "Regional · European Union", tipo: "Mandatory in the EU", nombre: "Directive (EU) 2020/2184, Annex I (parts A, B and C)", corto: "EU 2020/2184",
      cita: "Directive (EU) 2020/2184 of the European Parliament and of the Council of 16 December 2020 on the quality of water intended for human consumption. OJ L 435, 23.12.2020. Annex I.",
      ambito: "Water intended for human consumption. Part B: chemical parameters; part C: indicator parameters."},
    epa: {escala: "Federal · United States", tipo: "Mandatory in the US (MCL); secondary standards not mandatory", nombre: "US EPA · National Primary and Secondary Drinking Water Regulations", corto: "US EPA",
      cita: "US EPA. National Primary Drinking Water Regulations (40 CFR 141) and National Secondary Drinking Water Regulations (40 CFR 143).",
      ambito: "US public water systems. MCL: maximum contaminant level; secondary: aesthetic."},
    d831_t1: {escala: "National · Argentina", tipo: "Guideline level (Law 24.051)", nombre: "Law 24.051 · Decree 831/93, Annex II, Table 1", corto: "Dec. 831/93 T1",
      cita: "Decree 831/93, regulating Law 24.051 on Hazardous Waste, Annex II, Table 1: Water quality guideline levels for sources of drinking water with conventional treatment.",
      ambito: "Quality of the SOURCE to be treated conventionally for drinking. Not the water that is drunk."},
    l24585_t1: {escala: "National · Argentina (mining)", tipo: "Guideline level (Law 24.585)", nombre: "Law 24.585 (Mining Code), Annex IV, Table 1", corto: "Law 24.585 T1",
      cita: "Law 24.585 on Environmental Protection for Mining Activities (Mining Code), Annex IV, Table 1: sources of drinking water with conventional treatment.",
      ambito: "Same scope and values as Table 1 of Decree 831/93, for mining activities."},
    d831_t2: {escala: "National · Argentina", tipo: "Guideline level (Law 24.051)", nombre: "Law 24.051 · Decree 831/93, Annex II, Table 2", corto: "Dec. 831/93 T2",
      cita: "Decree 831/93, Annex II, Table 2: Water quality guideline levels for the protection of aquatic life. Fresh surface water.", ambito: "Protection of aquatic life in fresh surface water."},
    l24585_t2: {escala: "National · Argentina (mining)", tipo: "Guideline level (Law 24.585)", nombre: "Law 24.585 (Mining Code), Annex IV, Table 2", corto: "Law 24.585 T2",
      cita: "Law 24.585, Annex IV, Table 2: protection of aquatic life, fresh surface water.", ambito: "Same scope and values as Table 2 of Decree 831/93, for mining activities."},
    d831_t5: {escala: "National · Argentina", tipo: "Guideline level (Law 24.051)", nombre: "Law 24.051 · Decree 831/93, Annex II, Table 5", corto: "Dec. 831/93 T5",
      cita: "Decree 831/93, Annex II, Table 5: Water quality guideline levels for irrigation.", ambito: "Irrigation water. Metals and metalloids only: salinity and sodium are assessed with FAO and Riverside."},
    l24585_t5: {escala: "National · Argentina (mining)", tipo: "Guideline level (Law 24.585)", nombre: "Law 24.585 (Mining Code), Annex IV, Table 5", corto: "Law 24.585 T5",
      cita: "Law 24.585, Annex IV, Table 5: irrigation.", ambito: "Same scope and values as Table 5 of Decree 831/93."},
    fao29: {escala: "International · FAO", tipo: "Technical guideline (degrees of restriction)", nombre: "FAO · Ayers and Westcot, Water quality for agriculture (FAO Irrigation and Drainage Paper 29 Rev. 1)", corto: "FAO 29",
      cita: "Ayers, R. S. and D. W. Westcot. 1985. Water quality for agriculture. FAO Irrigation and Drainage Paper 29 Rev. 1. FAO, Rome. Table 1.",
      ambito: "Suitability for irrigation in three degrees: none, slight to moderate, severe. Chloride and sodium for surface irrigation."},
    d831_t6: {escala: "National · Argentina", tipo: "Guideline level (Law 24.051)", nombre: "Law 24.051 · Decree 831/93, Annex II, Table 6", corto: "Dec. 831/93 T6",
      cita: "Decree 831/93, Annex II, Table 6: Water quality guideline levels for livestock watering.", ambito: "Livestock drinking water. Metals, metalloids and fluoride only: no nitrate, sulfate or salinity."},
    l24585_t6: {escala: "National · Argentina (mining)", tipo: "Guideline level (Law 24.585)", nombre: "Law 24.585 (Mining Code), Annex IV, Table 6", corto: "Law 24.585 T6",
      cita: "Law 24.585, Annex IV, Table 6: livestock watering.", ambito: "Same scope and values as Table 6 of Decree 831/93."},
    ccme_ganado: {escala: "National · Canada", tipo: "Guideline (not mandatory)", nombre: "CCME · Canadian Water Quality Guidelines for the Protection of Agricultural Water Uses: livestock water", corto: "CCME livestock",
      cita: "Canadian Council of Ministers of the Environment. Canadian Environmental Quality Guidelines: Water Quality Guidelines for the Protection of Agricultural Water Uses — Livestock water (CCREM 1987 and updates).", ambito: "Livestock drinking water."},
    anzg_ganado: {escala: "National · Australia and New Zealand", tipo: "Guideline (not mandatory)", nombre: "ANZECC and ARMCANZ (2000), current in ANZG (2018): livestock drinking water", corto: "ANZG livestock",
      cita: "ANZECC and ARMCANZ. 2000. Australian and New Zealand Guidelines for Fresh and Marine Water Quality, ch. 4.3 Livestock drinking water quality (Tables 4.3.1 and 4.3.2), current in ANZG 2018. A draft update exists (2023).",
      ambito: "Livestock drinking water. Values are triggers for further investigation, not toxicity limits."},
    jp_suido: {escala: "National · Japan", tipo: "Mandatory for supply water", nombre: "Japan · Drinking water quality standards (水質基準, 52 items)", corto: "Japan drinking",
      cita: "Ministry of the Environment, Japan. 水質基準に関する省令 (Ministerial ordinance on drinking water quality standards, Water Supply Act, Art. 4), 52-item table in force from 1 April 2026. Drinking water administration moved from MHLW to the Ministry of the Environment in April 2024.",
      ambito: "Supply water. Kenti includes the inorganic, general and microbiological items; not volatile organics or disinfection by-products, except bromate."},
    jp_eqs_salud: {escala: "National · Japan", tipo: "Environmental standard (management target)", nombre: "Japan · Environmental quality standards for water, protection of human health (環境基準・健康項目)", corto: "Japan EQS health",
      cita: "Ministry of the Environment, Japan. 水質汚濁に係る環境基準 (Environment Agency Notification 59, 1971, as amended), Annex 1. Cadmium revised in 2011; hexavalent chromium 0.02 mg/L since 1 April 2022.",
      ambito: "Public waters (rivers, lakes, sea). Assessed as annual mean, except total cyanide, assessed by the maximum."},
    jp_rio: {escala: "National · Japan", tipo: "Environmental standard by river class", nombre: "Japan · Environmental quality standards for rivers, conservation of the living environment (環境基準・生活環境項目, classes AA to E)", corto: "Japan rivers (class)",
      cita: "Ministry of the Environment, Japan. 水質汚濁に係る環境基準, Annex 2, Table ア (rivers). E. coli replaced total coliforms from 1 April 2022.",
      ambito: "Each river has a class assigned by use (AA: drinking water 1 and conservation; A: drinking 2, fisheries 1, bathing; B: drinking 3, fisheries 2; C: fisheries 3, industrial 1; D: industrial 2 and irrigation; E: industrial 3). Chosen on this tab."},
    jp_biota: {escala: "National · Japan", tipo: "Environmental standard (aquatic biota)", nombre: "Japan · Environmental standard for the conservation of aquatic organisms in rivers (Table イ)", corto: "Japan biota",
      cita: "Ministry of the Environment, Japan. 水質汚濁に係る環境基準, Annex 2, Table イ (rivers): total zinc 0.03 mg/L in all biota classes; nonylphenol and LAS are not in Kenti.",
      ambito: "Protection of aquatic organisms in rivers. Assessed as annual mean."},
    jp_ind: {escala: "National · Japan", tipo: "Environmental standard by river class (industrial use)", nombre: "Japan · River classes suitable for industrial water (classes C, D and E of the environmental standard)", corto: "Japan industrial",
      cita: "Ministry of the Environment, Japan. 水質汚濁に係る環境基準, Annex 2, Table ア: industrial water class 1 (ordinary sedimentation) in class C rivers; class 2 (chemical treatment) in class D; class 3 (special treatment) in class E.",
      ambito: "Not a process water specification but the river quality considered suitable for abstracting industrial water with each degree of treatment."},
    jp_riego: {escala: "National · Japan", tipo: "Technical guideline (not mandatory)", nombre: "Japan · Agricultural (paddy rice) water standard (農業（水稲）用水基準)", corto: "Japan paddy irrigation",
      cita: "Agriculture, Forestry and Fisheries Research Council of Japan (農林水産技術会議), 4 October 1971. Reference standard for paddy rice irrigation water.",
      ambito: "Intended for flooded rice; for other crops, use FAO 29."},
  };
  NORMAS.forEach(n => Object.assign(n, NM[n.id]));

  // Notas de los valores guía (el mismo texto puede estar en varias normas).
  const NOTA = {
    "Aluminio residual.": "Residual aluminium.",
    "Para regiones con alto contenido natural de arsénico, el CAA previó un plazo de adecuación desde 0,05 mg/l, prorrogado hasta completar los estudios de hidroarsenicismo. Verificar la situación de la jurisdicción.": "For regions with naturally high arsenic, the CAA set a transition period starting from 0.05 mg/L, extended until hydroarsenicism studies are completed. Check the situation in each jurisdiction.",
    "2,4 mg/l desde la Res. Conj. 33/2023 (antes 0,5 mg/l).": "2.4 mg/L since Joint Resolution 33/2023 (previously 0.5 mg/L).",
    "El límite depende de la temperatura media y máxima del año del lugar (tabla del art. 982): de 1,7 mg/l (10–12 °C) a 0,8 mg/l (26,3–32,6 °C). Se carga por sitio.": "The limit depends on the site’s annual mean and maximum temperature (table in Art. 982): from 1.7 mg/L (10–12 °C) to 0.8 mg/L (26.3–32.6 °C). Entered per site.",
    "La Res. Conj. 33/2023 admite hasta 0,4 mg/l en zonas con alto contenido natural de manganeso.": "Joint Resolution 33/2023 allows up to 0.4 mg/L in areas with naturally high manganese.",
    "Mínimo exigible en agua de red desinfectada con cloro; no corresponde en agua sin tratar.": "Minimum required in chlorinated supply water; not applicable to untreated water.",
    "Ausencia en 100 ml.": "Absent in 100 mL.", "Hasta 500 UFC/ml.": "Up to 500 CFU/mL.",
    "Provisional: se fijó por lo que se puede medir y tratar, no sólo por salud.": "Provisional: set on what can be measured and treated, not on health alone.",
    "Cromo total.": "Total chromium.", "Por debajo de este valor puede manchar ropa y sanitarios.": "Below this value it may stain laundry and sanitary ware.",
    "Considerar el volumen consumido y el aporte de otras fuentes.": "Consider the volume consumed and intake from other sources.",
    "Provisional (analítica y tratamiento).": "Provisional (analytical and treatment achievability).",
    "Provisional. Manganeso total; también afecta color y gusto.": "Provisional. Total manganese; also affects colour and taste.",
    "Para mercurio inorgánico.": "For inorganic mercury.", "Provisional.": "Provisional.", "No detectable en 100 ml.": "Not detectable in 100 mL.",
    "Por encima de unos 1.000 mg/l el agua se vuelve cada vez menos aceptable al gusto (cap. 10). No es un valor de salud.": "Above about 1000 mg/L water becomes increasingly unpalatable (ch. 10). Not a health-based value.",
    "Umbral de gusto aproximado: 200–300 mg/l (cap. 10).": "Approximate taste threshold: 200–300 mg/L (ch. 10).",
    "Umbral de gusto aproximado: 250–1.000 mg/l según el catión (cap. 10).": "Approximate taste threshold: 250–1000 mg/L depending on the cation (ch. 10).",
    "Umbral de gusto aproximado (cap. 10).": "Approximate taste threshold (ch. 10).",
    "Gusto y manchas desde unos 0,3 mg/l (cap. 10).": "Taste and staining from about 0.3 mg/L (ch. 10).",
    "25 µg/l desde el 12/01/2036; hasta entonces, 50 µg/l.": "25 µg/L from 12 January 2036; 50 µg/L until then.",
    "5 µg/l desde el 12/01/2036; hasta entonces, 10 µg/l.": "5 µg/L from 12 January 2036; 10 µg/L until then.",
    "Además: [nitrato]/50 + [nitrito]/3 ≤ 1 (ver «Iones y derivados»).": "Also: [nitrate]/50 + [nitrite]/3 ≤ 1 (see “Ions and derived”).",
    "0,10 mg/l a la salida de la planta.": "0.10 mg/L at the treatment plant outlet.",
    "30 µg/l en zonas con geología que lo justifique.": "30 µg/L where local geology justifies it.",
    "0 en 100 ml.": "0 in 100 mL.", "A 20 °C.": "At 20 °C.",
    "Nivel de acción (tratamiento). El nivel secundario es 1,0 mg/l.": "Action level (treatment). The secondary level is 1.0 mg/L.",
    "Como cianuro libre.": "As free cyanide.", "El nivel secundario es 2,0 mg/l.": "The secondary level is 2.0 mg/L.",
    "Nivel de acción. La regla LCRI (2024) lo baja a 0,010 mg/l desde noviembre de 2027.": "Action level. The LCRI rule (2024) lowers it to 0.010 mg/L from November 2027.",
    "Mercurio inorgánico.": "Inorganic mercury.", "Rango secundario 0,05–0,2 mg/l.": "Secondary range 0.05–0.2 mg/L.",
    "El decreto no aclara la forma; el valor es el de la EPA (fuente A de la tabla), expresado como N.": "The decree does not state the form; the value is the EPA value (source A of the table), expressed as N.",
    "El decreto no aclara la forma; el valor es el de la EPA (fuente B), expresado como N.": "The decree does not state the form; the value is the EPA value (source B), expressed as N.",
    "5 µg/l con pH < 6,5, Ca²⁺ < 4 mg/l y COD < 2 mg/l; 100 µg/l con pH ≥ 6,5, Ca²⁺ ≥ 4 mg/l y COD ≥ 2 mg/l (nota 2 de la tabla 2).": "5 µg/L with pH < 6.5, Ca²⁺ < 4 mg/L and DOC < 2 mg/L; 100 µg/L with pH ≥ 6.5, Ca²⁺ ≥ 4 mg/L and DOC ≥ 2 mg/L (note 2 of Table 2).",
    "«Amonio (total)» 1.370 µg/l. El decreto no aclara la forma; se compara como NH₄⁺.": "“Ammonium (total)” 1370 µg/L. The decree does not state the form; compared as NH₄⁺.",
    "Como cianuro libre. Si el laboratorio informó cianuro total, la comparación es conservadora.": "As free cyanide. If the laboratory reported total cyanide, the comparison is conservative.",
    "2 µg/l para protección de la vida acuática incluido fito y zooplancton; 20 µg/l sólo para peces (nota 7).": "2 µg/L to protect aquatic life including phyto- and zooplankton; 20 µg/L for fish only (note 7).",
    "Depende de la dureza (mg/l CaCO₃): 0–60, 60–120, 120–180 y > 180 (notas de la tabla 2).": "Depends on hardness (mg/L as CaCO₃): 0–60, 60–120, 120–180 and > 180 (notes of Table 2).",
    "Valor impreso en el decreto: 50 µg/l. La fuente que cita (CCREM 1987) fija 50 mg/l para ganado, mil veces más: probable error de transcripción. Kenti compara con el valor impreso.": "Value printed in the decree: 50 µg/L. The source it cites (CCREM 1987) sets 50 mg/L for livestock, a thousand times higher: probable transcription error. Kenti compares against the printed value.",
    "Salinidad: < 0,7 dS/m sin restricción; 0,7–3,0 ligera a moderada; > 3,0 severa.": "Salinity: < 0.7 dS/m no restriction; 0.7–3.0 slight to moderate; > 3.0 severe.",
    "Toxicidad por sodio en riego superficial (RAS). La infiltración (RAS con CE) va en «Iones y derivados».": "Sodium toxicity in surface irrigation (SAR). Infiltration (SAR with EC) is under “Ions and derived”.",
    "4 y 10 meq/l, riego superficial. En aspersión: > 3 meq/l (106 mg/l) ya restringe.": "4 and 10 meq/L, surface irrigation. With sprinklers, > 3 meq/L (106 mg/L) already restricts use.",
    "Nitrógeno como nitrato (NO₃-N); afecta cultivos sensibles.": "Nitrate nitrogen (NO₃-N); affects sensitive crops.",
    "1,5 y 8,5 meq/l; sólo aspersión sobre follaje.": "1.5 and 8.5 meq/L; overhead sprinkling only.", "Rango normal.": "Normal range.",
    "Por especie: ovinos 0,5; bovinos 1; porcinos y aves 5 mg/l.": "By species: sheep 0.5; cattle 1; pigs and poultry 5 mg/L.",
    "1–2 mg/l; el menor si el alimento también aporta flúor.": "1–2 mg/L; the lower value if feed also contains fluoride.",
    "Nitrato + nitrito, como N.": "Nitrate + nitrite, as N.", "Nitrito solo, como N.": "Nitrite alone, as N.",
    "Hasta 5 mg/l si el arsénico no se agrega como aditivo del alimento.": "Up to 5 mg/L if arsenic is not added as a feed additive.",
    "Por especie: ovinos 0,4; bovinos 1; porcinos y aves 5 mg/l.": "By species: sheep 0.4; cattle 1; pigs and poultry 5 mg/L.",
    "Hasta 1.500 mg/l puede tolerarse si el alimento tiene poco nitrato.": "Up to 1500 mg/L may be tolerated if feed is low in nitrate.",
    "1.000–2.000 mg/l: posibles efectos; > 2.000 mg/l: problemas crónicos o agudos.": "1000–2000 mg/L: possible effects; > 2000 mg/L: chronic or acute problems.",
    "Sin efectos adversos hasta: bovinos de carne 4.000; de leche 2.500; ovinos 5.000; equinos y porcinos 4.000; aves 2.000 mg/l (tabla 4.3.1).": "No adverse effects up to: beef cattle 4000; dairy cattle 2500; sheep 5000; horses and pigs 4000; poultry 2000 mg/L (Table 4.3.1).",
    "Bacterias generales: hasta 100 colonias en 1 mL.": "General bacteria: up to 100 colonies in 1 mL.", "No detectable.": "Not detectable.",
    "Nitrito como N.": "Nitrite as N.", "Ion cianuro y cloruro de cianógeno, como cianuro.": "Cyanide ion and cyanogen chloride, as cyanide.",
    "Suma de PFOS y PFOA: 50 ng/L. Pasó de objetivo a norma el 1/4/2026.": "Sum of PFOS and PFOA: 50 ng/L. Changed from a target to a standard on 1 April 2026.",
    "Calcio, magnesio, etc. (dureza).": "Calcium, magnesium, etc. (hardness).",
    "Residuo por evaporación (蒸発残留物): se compara con los sólidos disueltos totales.": "Evaporation residue (蒸発残留物): compared with total dissolved solids.",
    "Materia orgánica como carbono orgánico total.": "Organic matter as total organic carbon.",
    "5 grados de color.": "5 colour units.", "2 grados de turbiedad.": "2 turbidity units.", "Mercurio total.": "Total mercury.",
    "«No detectable» con límite de cuantificación 0,1 mg/L: se considera que supera si se cuantifica.": "“Not detectable” with a quantification limit of 0.1 mg/L: considered exceeded if quantified.",
    "No se aplica en el mar.": "Not applicable to sea water.",
    "En la norma se evalúa como valor del 90 % de los muestreos del año; con muestras sueltas la comparación es orientativa.": "The standard is assessed on the 90% value of the year’s samples; with individual samples the comparison is indicative.",
    "Cinc total, promedio anual, igual en las clases 生物A, 生物特A, 生物B y 生物特B.": "Total zinc, annual mean, same for classes 生物A, 生物特A, 生物B and 生物特B.",
    "DQO al permanganato (método japonés), no al dicromato.": "Permanganate COD (Japanese method), not dichromate COD.",
    "Nitrógeno total.": "Total nitrogen.", "0,3 mS/cm.": "0.3 mS/cm.",
  };
  const vistos = new Set();
  for (const n of NORMAS) for (const s of Object.values(n.lim)){
    if (typeof s !== "object" || vistos.has(s) || !s.nota) continue;
    vistos.add(s);
    if (NOTA[s.nota]) s.nota = NOTA[s.nota]; else console.warn("Nota sin traducir:", s.nota);
  }
  EJEMPLO_SITIOS.splice(0, EJEMPLO_SITIOS.length,
    ["P1", "Camp well", "Pozo (subterránea)", "3900", "8"], ["V1", "Saline spring at the salt flat edge", "Vertiente", "3920", "8"], ["R1", "River, upstream", "Río o arroyo", "4050", "7"]);
}
