"use strict";
/* =====================================================================
   Kenti Calidad de Agua · datos de referencia
   Parámetros que Kenti reconoce y niveles guía de cada norma.
   Todo valor de norma va en mg/L de la forma indicada en `f` (o en la
   unidad propia del parámetro: µS/cm, NTU, UFC/100 mL, unidades de pH…).
   ===================================================================== */

/* ---------- Parámetros ----------
   fam: familia de unidades (ver UNI). mm: masa molar (g/mol) de la forma canónica; z: carga (para meq).
   forms: formas de expresión (nitrato como NO3⁻ o como N…) → factor a la forma canónica.
   m: expresión para reconocer el encabezado (sobre texto en minúsculas y sin tildes).
   plaus: valor canónico por encima del cual es probable un error de unidad. */
const GRUPOS = [
  ["campo", "Campo y fisicoquímicos generales"],
  ["iones", "Iones mayoritarios"],
  ["nutri", "Nutrientes y materia orgánica"],
  ["metal", "Metales y metaloides"],
  ["otros", "Otros inorgánicos"],
  ["micro", "Microbiológicos"],
];
const PARAMS = [
  // campo
  {id: "temp", n: "Temperatura del agua", g: "campo", fam: "temp", m: "^(t|temp|temperatura)( del agua| agua)?\\b|^t ?°", d: 1, plaus: 100},
  {id: "ph", n: "pH", g: "campo", fam: "ph", m: "^ph\\b(?! de sat)", d: 2, plaus: 14},
  {id: "ce", n: "Conductividad eléctrica", g: "campo", fam: "ce", m: "conductividad|^c\\.?e\\.?\\b|^ec\\b|^cond\\b|resistividad", d: 0, plaus: 400000},
  {id: "sdt", n: "Sólidos disueltos totales", g: "campo", fam: "masa", m: "s[oó]lidos disueltos|^sdt\\b|^tds\\b|^std\\b|residuo seco|residuo (a|por) evap", d: 0, plaus: 500000},
  {id: "sst", n: "Sólidos suspendidos totales", g: "campo", fam: "masa", m: "s[oó]lidos (suspendidos|en suspensi[oó]n)|^ss\\b|^sst\\b|^tss\\b|materia en suspensi", d: 1, plaus: 100000},
  {id: "dens", n: "Densidad", g: "campo", fam: "dens", m: "densidad|^dens\\b|peso espec", d: 4, plaus: 1.5},
  {id: "od", n: "Oxígeno disuelto", g: "campo", fam: "masa", mm: 31.998, m: "ox[ií]geno disuelto(?!.*%)|^o\\.?d\\.?\\b(?!.*%)", d: 2, plaus: 25},
  {id: "odsat", n: "Oxígeno disuelto (% saturación)", g: "campo", fam: "pct", m: "(ox[ií]geno|o\\.?d\\.?).*(%|sat)", d: 0, plaus: 250},
  {id: "turb", n: "Turbiedad", g: "campo", fam: "turb", m: "turbi(e)?dad|turbidez|^turb\\b", d: 1, plaus: 100000},
  {id: "color", n: "Color", g: "campo", fam: "color", m: "^color\\b", d: 0, plaus: 5000},
  {id: "orp", n: "Potencial redox (ORP)", g: "campo", fam: "mv", m: "\\borp\\b|redox|^eh\\b", d: 0, plaus: 1500, neg: true},
  // iones
  {id: "ca", n: "Calcio", g: "iones", fam: "masa", mm: 40.078, z: 2, m: "^calcio\\b|^ca\\b(?!co3)|^ca ?(2\\+|\\+\\+)", d: 1, plaus: 60000},
  {id: "mg", n: "Magnesio", g: "iones", fam: "masa", mm: 24.305, z: 2, m: "^magnesio|^mg\\b(?! ?/)|^mg ?(2\\+|\\+\\+)", d: 1, plaus: 80000},
  {id: "na", n: "Sodio", g: "iones", fam: "masa", mm: 22.990, z: 1, m: "^sodio|^na\\b|^na ?\\+", d: 1, plaus: 150000},
  {id: "k", n: "Potasio", g: "iones", fam: "masa", mm: 39.098, z: 1, m: "^potasio|^k\\b|^k ?\\+", d: 1, plaus: 80000},
  {id: "cl", n: "Cloruro", g: "iones", fam: "masa", mm: 35.453, z: 1, m: "^cloruros?|^cl\\b(?! ?(libre|resid|activo|total))|^cl ?-", d: 1, plaus: 250000},
  {id: "so4", n: "Sulfato", g: "iones", fam: "masa", mm: 96.06, z: 2, m: "^sulfatos?|^so ?4", d: 1, plaus: 150000},
  {id: "hco3", n: "Bicarbonato", g: "iones", fam: "masa", mm: 61.017, z: 1, m: "^bicarbonatos?|^hco ?3", d: 1, plaus: 20000},
  {id: "co3", n: "Carbonato", g: "iones", fam: "masa", mm: 60.009, z: 2, m: "^carbonatos?|^co ?3(?! ?ca)", d: 1, plaus: 20000},
  {id: "alc", n: "Alcalinidad total", g: "iones", fam: "caco3", m: "alcalinidad", d: 0, plaus: 20000},
  {id: "dureza", n: "Dureza total", g: "iones", fam: "caco3", m: "dureza", d: 0, plaus: 200000, calc: true},
  {id: "sio2", n: "Sílice", g: "iones", fam: "masa", mm: 60.084, m: "s[ií]lice|^sio ?2", d: 1, plaus: 2000},
  {id: "sar", n: "RAS (relación de adsorción de sodio)", g: "iones", fam: "adim", m: "^r\\.?a\\.?s\\.?\\b|^sar\\b|adsorci[oó]n de sodio", d: 2, plaus: 1000, calc: true},
  // nutrientes
  {id: "no3", n: "Nitrato", g: "nutri", fam: "masa", mm: 62.004, z: 1, forms: {"NO3": 1, "N": 62.004 / 14.007}, fc: "NO3", m: "nitratos?|^no ?3|n-no ?3", d: 2, plaus: 10000},
  {id: "no2", n: "Nitrito", g: "nutri", fam: "masa", mm: 46.006, z: 1, forms: {"NO2": 1, "N": 46.006 / 14.007}, fc: "NO2", m: "nitritos?|^no ?2|n-no ?2", d: 3, plaus: 1000},
  {id: "nh4", n: "Amonio", g: "nutri", fam: "masa", mm: 18.038, z: 1, forms: {"NH4": 1, "N": 18.038 / 14.007, "NH3": 18.038 / 17.031}, fc: "NH4", m: "amonio|amon[ií]aco|^nh ?[34]|n-nh ?[34]|nitr[oó]geno amoniacal", d: 2, plaus: 5000},
  {id: "nt", n: "Nitrógeno total", g: "nutri", fam: "masa", mm: 14.007, m: "nitr[oó]geno total(?! kjeldahl)|^nt\\b|^t-n\\b|^tn\\b", d: 2, plaus: 5000},
  {id: "pt", n: "Fósforo total", g: "nutri", fam: "masa", mm: 30.974, m: "f[oó]sforo total|^p ?total|^pt\\b", d: 3, plaus: 1000},
  {id: "po4", n: "Fosfato", g: "nutri", fam: "masa", mm: 94.971, z: 3, forms: {"PO4": 1, "P": 94.971 / 30.974}, fc: "PO4", m: "fosfatos?|ortofosfato|^po ?4|p-po ?4", d: 3, plaus: 3000},
  {id: "dbo", n: "DBO₅", g: "nutri", fam: "masa", mm: 31.998, m: "^dbo|demanda bioqu", d: 1, plaus: 50000},
  {id: "codmn", n: "DQO al permanganato (COD-Mn)", g: "nutri", fam: "masa", mm: 31.998, m: "permanganato|kmno ?4|cod ?-? ?mn|dqo ?-? ?mn|ox[ií]geno consumido", d: 1, plaus: 50000},
  {id: "dqo", n: "DQO", g: "nutri", fam: "masa", mm: 31.998, m: "^dqo|demanda qu[ií]m", d: 1, plaus: 100000},
  {id: "cod", n: "Carbono orgánico disuelto", g: "nutri", fam: "masa", mm: 12.011, m: "carbono org[aá]nico disuelto|^cod\\b|^doc\\b", d: 1, plaus: 1000},
  {id: "cot", n: "Carbono orgánico total", g: "nutri", fam: "masa", mm: 12.011, m: "carbono org[aá]nico total|^cot\\b|^toc\\b", d: 1, plaus: 1000},
  // metales y metaloides
  {id: "al", n: "Aluminio", g: "metal", fam: "masa", mm: 26.982, z: 3, m: "^aluminio|^al\\b", d: 3, plaus: 5000},
  {id: "sb", n: "Antimonio", g: "metal", fam: "masa", mm: 121.76, m: "^antimonio|^sb\\b", d: 4, plaus: 100},
  {id: "as", n: "Arsénico", g: "metal", fam: "masa", mm: 74.922, m: "^ars[eé]nico|^as\\b", d: 4, plaus: 200},
  {id: "ba", n: "Bario", g: "metal", fam: "masa", mm: 137.33, z: 2, m: "^bario|^ba\\b", d: 3, plaus: 1000},
  {id: "be", n: "Berilio", g: "metal", fam: "masa", mm: 9.012, z: 2, m: "^berilio|^be\\b", d: 5, plaus: 100},
  {id: "b", n: "Boro", g: "metal", fam: "masa", mm: 10.81, m: "^boro\\b|^b\\b", d: 3, plaus: 10000},
  {id: "cd", n: "Cadmio", g: "metal", fam: "masa", mm: 112.41, z: 2, m: "^cadmio|^cd\\b", d: 5, plaus: 100},
  {id: "zn", n: "Cinc", g: "metal", fam: "masa", mm: 65.38, z: 2, m: "^[cz]inc\\b|^zn\\b", d: 3, plaus: 10000},
  {id: "co", n: "Cobalto", g: "metal", fam: "masa", mm: 58.933, z: 2, m: "^cobalto|^co\\b(?! ?[23])", d: 4, plaus: 1000},
  {id: "cu", n: "Cobre", g: "metal", fam: "masa", mm: 63.546, z: 2, m: "^cobre|^cu\\b", d: 4, plaus: 10000},
  {id: "cr6", n: "Cromo hexavalente", g: "metal", fam: "masa", mm: 51.996, m: "cromo ?(\\(?vi\\)?|hexa|\\+ ?6|6 ?\\+)|^cr ?(\\(?vi\\)?|\\+ ?6|6 ?\\+)", d: 4, plaus: 1000},
  {id: "cr", n: "Cromo total", g: "metal", fam: "masa", mm: 51.996, m: "^cromo|^cr\\b", d: 4, plaus: 1000},
  {id: "fe", n: "Hierro", g: "metal", fam: "masa", mm: 55.845, z: 2, m: "^hierro|^fe\\b", d: 3, plaus: 50000},
  {id: "li", n: "Litio", g: "metal", fam: "masa", mm: 6.94, z: 1, m: "^litio|^li\\b", d: 3, plaus: 100000},
  {id: "mn", n: "Manganeso", g: "metal", fam: "masa", mm: 54.938, z: 2, m: "^manganeso|^mn\\b", d: 3, plaus: 10000},
  {id: "hg", n: "Mercurio", g: "metal", fam: "masa", mm: 200.59, z: 2, m: "^mercurio|^hg\\b", d: 5, plaus: 10},
  {id: "mo", n: "Molibdeno", g: "metal", fam: "masa", mm: 95.95, m: "^molibdeno|^mo\\b", d: 4, plaus: 1000},
  {id: "ni", n: "Níquel", g: "metal", fam: "masa", mm: 58.693, z: 2, m: "^n[ií]quel|^ni\\b", d: 4, plaus: 1000},
  {id: "ag", n: "Plata", g: "metal", fam: "masa", mm: 107.87, z: 1, m: "^plata|^ag\\b", d: 4, plaus: 100},
  {id: "pb", n: "Plomo", g: "metal", fam: "masa", mm: 207.2, z: 2, m: "^plomo|^pb\\b", d: 4, plaus: 1000},
  {id: "se", n: "Selenio", g: "metal", fam: "masa", mm: 78.97, m: "^selenio|^se\\b", d: 4, plaus: 100},
  {id: "sr", n: "Estroncio", g: "metal", fam: "masa", mm: 87.62, z: 2, m: "^estroncio|^sr\\b", d: 3, plaus: 10000},
  {id: "tl", n: "Talio", g: "metal", fam: "masa", mm: 204.38, m: "^talio|^tl\\b", d: 5, plaus: 100},
  {id: "u", n: "Uranio", g: "metal", fam: "masa", mm: 238.03, m: "^uranio|^u\\b", d: 4, plaus: 100},
  {id: "v", n: "Vanadio", g: "metal", fam: "masa", mm: 50.942, m: "^vanadio|^v\\b", d: 4, plaus: 1000},
  // otros inorgánicos
  {id: "f", n: "Fluoruro", g: "otros", fam: "masa", mm: 18.998, z: 1, m: "^fl[uú]or|^f\\b|^f ?-", d: 2, plaus: 500},
  {id: "cn", n: "Cianuro", g: "otros", fam: "masa", mm: 26.017, z: 1, m: "cianuro|^cn\\b|^cn ?-", d: 4, plaus: 1000},
  {id: "bro3", n: "Bromato", g: "otros", fam: "masa", mm: 127.90, z: 1, m: "bromato|^bro ?3", d: 4, plaus: 10},
  {id: "pfas", n: "PFOS + PFOA (suma)", g: "otros", fam: "masa", m: "pfos|pfoa", d: 7, plaus: 1},
  {id: "clres", n: "Cloro residual", g: "otros", fam: "masa", mm: 70.906, m: "cloro (libre|residual|activo)|^cl ?(libre|resid|activo)", d: 2, plaus: 50},
  // microbiológicos
  {id: "colt", n: "Coliformes totales", g: "micro", fam: "m100", m: "coliformes? totales|^ct\\b|bacterias coliformes", d: 0, plaus: 1e9, micro: true},
  {id: "colf", n: "Coliformes termotolerantes (fecales)", g: "micro", fam: "m100", m: "coliformes? (fecales|termo)|^cf\\b", d: 0, plaus: 1e9, micro: true},
  {id: "ecoli", n: "Escherichia coli", g: "micro", fam: "m100", m: "coli\\b(?!formes)|^e\\.? ?coli|escherichia", d: 0, plaus: 1e9, micro: true},
  {id: "pseud", n: "Pseudomonas aeruginosa", g: "micro", fam: "m100", m: "pseudomonas", d: 0, plaus: 1e9, micro: true},
  {id: "meso", n: "Bacterias aerobias mesófilas", g: "micro", fam: "m1", m: "mes[oó]fil|heter[oó]trof|recuento (total|en placa)", d: 0, plaus: 1e9, micro: true},
];

/* ---------- Unidades ----------
   Cada unidad: [etiqueta, tipo, factor, alias (regex sobre el texto normalizado)].
   Tipos de la familia «masa» (la canónica es mg/L de la forma canónica):
     v  masa por volumen de solución            mg/L = x·f
     m  masa por masa de solución (ppm, mg/kg)  mg/L = x·f·ρ
     M  molar (por litro de solución)           mg/L = x·f·masa molar
     b  molal (por kg de agua)                  mg/L = x·f·masa molar·ρ·(fracción de agua)
     E  equivalentes por litro                  mg/L = x·f·masa molar / carga
   Otras familias: l (lineal: canónica = x·f), r (recíproca: canónica = f/x), a (afín: canónica = x·f + g). */
const UNI = {
  masa: [
    ["mg/L", "v", 1, "^mg ?/ ?(l|dm3)$|^mg ?l-1$"], ["µg/L", "v", 1e-3, "^(u|µ|mc)g ?/ ?l$|^ug ?l-1$"], ["ng/L", "v", 1e-6, "^ng ?/ ?l$"],
    ["g/L", "v", 1e3, "^g ?/ ?l$"], ["µg/mL", "v", 1, "^(u|µ)g ?/ ?ml$"], ["mg/mL", "v", 1e3, "^mg ?/ ?ml$"], ["% (m/v)", "v", 1e4, "^% ?(m ?/ ?v|p ?/ ?v)?$"],
    ["ppm", "m", 1, "^ppm$"], ["ppb", "m", 1e-3, "^ppb$"], ["mg/kg", "m", 1, "^mg ?/ ?kg$"], ["µg/kg", "m", 1e-3, "^(u|µ)g ?/ ?kg$"],
    ["g/kg", "m", 1e3, "^g ?/ ?kg$"], ["% (m/m)", "m", 1e4, "^% ?(m ?/ ?m|p ?/ ?p)$"],
    ["mol/L", "M", 1e3, "^mol ?/ ?l$|^m$"], ["mmol/L", "M", 1, "^mmol ?/ ?l$|^mm$"], ["µmol/L", "M", 1e-3, "^(u|µ)mol ?/ ?l$|^(u|µ)m$"],
    ["mol/kg", "b", 1e3, "^mol ?/ ?kg$|^molal$"], ["mmol/kg", "b", 1, "^mmol ?/ ?kg$"],
    ["meq/L", "E", 1, "^meq ?/ ?l$"], ["µeq/L", "E", 1e-3, "^(u|µ)eq ?/ ?l$"],
  ],
  caco3: [
    ["mg/L CaCO₃", "l", 1, "^mg ?/ ?l( ?(como )?caco3)?$|^ppm( ?caco3)?$"], ["meq/L", "l", 100.087 / 2, "^meq ?/ ?l$"], ["mmol/L", "l", 100.087, "^mmol ?/ ?l$"],
    ["°f (grado francés)", "l", 10, "^°? ?f$|franc"], ["°dH (grado alemán)", "l", 17.848, "^°? ?dh$|alem"], ["°e (grado inglés)", "l", 14.254, "^°? ?e$|ingl|clark"], ["gpg", "l", 17.118, "^gpg$|grains"],
  ],
  ce: [
    ["µS/cm", "l", 1, "^(u|µ)s ?/ ?cm$|^(u|µ)mho ?/ ?cm$"], ["mS/cm", "l", 1e3, "^ms ?/ ?cm$|^mmho ?/ ?cm$"], ["dS/m", "l", 1e3, "^ds ?/ ?m$"],
    ["mS/m", "l", 10, "^ms ?/ ?m$"], ["S/m", "l", 1e4, "^s ?/ ?m$"], ["µS/m", "l", 0.01, "^(u|µ)s ?/ ?m$"],
    ["Ω·cm (resistividad)", "r", 1e6, "^(ω|ohm|ohmio)s? ?(·|\\.|x)? ?cm$"], ["kΩ·cm (resistividad)", "r", 1e3, "^k ?(ω|ohm)s? ?(·|\\.|x)? ?cm$"],
    ["MΩ·cm (resistividad)", "r", 1, "^m ?(ω|ohm)s? ?(·|\\.|x)? ?cm$"], ["Ω·m (resistividad)", "r", 1e4, "^(ω|ohm)s? ?(·|\\.|x)? ?m$"],
  ],
  temp: [["°C", "l", 1, "^°? ?c$|celsius|centigr|^grados? ?c$"], ["°F", "a", 5 / 9, "^°? ?f$|fahr|^grados? ?f$", -32 * 5 / 9], ["K", "a", 1, "^k$|kelvin|^°? ?k$", -273.15]],
  dens: [["g/mL", "l", 1, "^g ?/ ?(ml|cm3)$"], ["kg/L", "l", 1, "^kg ?/ ?(l|dm3)$"], ["kg/m³", "l", 1e-3, "^kg ?/ ?m3$"], ["g/L", "l", 1e-3, "^g ?/ ?l$"]],
  m100: [["UFC/100 mL", "l", 1, "^ufc ?/ ?100 ?ml$|^cfu ?/ ?100 ?ml$"], ["NMP/100 mL", "l", 1, "^nmp ?/ ?100 ?ml$|^mpn ?/ ?100 ?ml$"],
    ["UFC/mL", "l", 100, "^ufc ?/ ?ml$|^cfu ?/ ?ml$"], ["NMP/mL", "l", 100, "^nmp ?/ ?ml$"], ["UFC/L", "l", .1, "^ufc ?/ ?l$"], ["NMP/L", "l", .1, "^nmp ?/ ?l$"]],
  m1: [["UFC/mL", "l", 1, "^ufc ?/ ?ml$|^cfu ?/ ?ml$"], ["UFC/100 mL", "l", .01, "^ufc ?/ ?100 ?ml$"], ["UFC/L", "l", .001, "^ufc ?/ ?l$"]],
  ph: [["unid. pH", "l", 1, "^(u|unid|upH|unidades)"]],
  turb: [["NTU", "l", 1, "^ntu$"], ["UNT", "l", 1, "^unt$"], ["FNU", "l", 1, "^fnu$"], ["FTU", "l", 1, "^ftu$"]],
  color: [["Pt-Co", "l", 1, "pt|co|hazen|uc"]],
  mv: [["mV", "l", 1, "^mv$"], ["V", "l", 1e3, "^v$"]],
  pct: [["%", "l", 1, "%"]],
  adim: [["—", "l", 1, "."]],
};
const unitsOf = p => UNI[p.fam] || [["—", "l", 1]];
const canonUnit = p => unitsOf(p)[0][0];
const P = Object.fromEntries(PARAMS.map(p => [p.id, p]));


/* ---------- Normas ----------
   uso: consumo · fuente · acuatica · riego · ganado · industrial
   lim[param] = número (máximo) u objeto:
     {max, min, f (forma), t (tipo), nota, opc (no se lista como faltante),
      grados: [t1, t2] (FAO: ligera-moderada / severa),
      fn: nombre de la función de condición (ver LIM_FN)} */
const USOS = [
  {id: "consumo", l: "Consumo humano", d: "Agua de bebida ya potabilizada o de consumo directo."},
  {id: "fuente", l: "Fuente para potabilizar", d: "Agua cruda que se va a potabilizar con tratamiento convencional."},
  {id: "acuatica", l: "Vida acuática", d: "Protección de la biota en agua dulce superficial."},
  {id: "ambiental", l: "Cuerpo de agua (estándar ambiental)", d: "Estándares de calidad ambiental del río o lago: salud humana y clases de uso."},
  {id: "riego", l: "Riego", d: "Aptitud para irrigación de cultivos."},
  {id: "ganado", l: "Bebida de ganado", d: "Agua de bebida para animales de producción."},
  {id: "industrial", l: "Uso industrial", d: "No hay niveles guía legales generales para el agua de proceso. Japón fija clases de río aptas para uso industrial."},
];
const T = {salud: "Salud", estetico: "Aceptabilidad", indicador: "Indicador", secundario: "Secundario (no obligatorio)", accion: "Nivel de acción", operativo: "Operativo", guia: "Nivel guía", grado: "Grado de restricción"};

// Tablas del Anexo II del Dto. 831/93 (se repiten en el Anexo IV de la Ley 24.585).
const DUREZA_NOTA = "Depende de la dureza (mg/l CaCO₃): 0–60, 60–120, 120–180 y > 180 (notas de la tabla 2).";
const T831 = {
  t1: {
    al: .2, nh4: {max: .05, f: "NH4"}, sb: .01, as: .05, ba: 1, be: .000039, b: 1, cd: .005, cn: .1, zn: 5, cu: 1, cr: .05, cr6: .05,
    f: 1.5, fe: .3, mn: .1, hg: .001, ni: .025,
    no3: {max: 10, f: "N", nota: "El decreto no aclara la forma; el valor es el de la EPA (fuente A de la tabla), expresado como N."},
    no2: {max: 1, f: "N", nota: "El decreto no aclara la forma; el valor es el de la EPA (fuente B), expresado como N."},
    ag: .05, pb: .05, se: .01, tl: .018, u: .1,
  },
  t2: {
    al: {fn: "al831", nota: "5 µg/l con pH < 6,5, Ca²⁺ < 4 mg/l y COD < 2 mg/l; 100 µg/l con pH ≥ 6,5, Ca²⁺ ≥ 4 mg/l y COD ≥ 2 mg/l (nota 2 de la tabla 2)."},
    nh4: {max: 1.37, f: "NH4", nota: "«Amonio (total)» 1.370 µg/l. El decreto no aclara la forma; se compara como NH₄⁺."},
    sb: .016, as: .05, b: .75,
    cd: {fn: "dur831", v: [.0002, .0008, .0013, .0018], nota: DUREZA_NOTA},
    cn: {max: .005, nota: "Como cianuro libre. Si el laboratorio informó cianuro total, la comparación es conservadora."},
    zn: .03,
    cu: {fn: "dur831", v: [.002, .002, .003, .004], nota: DUREZA_NOTA},
    cr: {max: .002, nota: "2 µg/l para protección de la vida acuática incluido fito y zooplancton; 20 µg/l sólo para peces (nota 7)."},
    hg: .0001,
    ni: {fn: "dur831", v: [.025, .065, .11, .15], nota: DUREZA_NOTA},
    pb: {fn: "dur831", v: [.001, .002, .004, .007], nota: DUREZA_NOTA},
    se: .001, mn: .1, u: .02, v: .1,
  },
  t5: {al: 5, as: .1, be: .1, b: .5, cd: .01, zn: 2, co: .05, cu: .2, cr: .1, f: 1, fe: 5, li: 2.5, mn: .2, mo: .01, ni: .2, pb: .2, se: .02, u: .01, v: .1},
  t6: {
    al: 5, as: .5, be: .1, b: 5, cd: .02,
    zn: {max: .05, nota: "Valor impreso en el decreto: 50 µg/l. La fuente que cita (CCREM 1987) fija 50 mg/l para ganado, mil veces más: probable error de transcripción. Kenti compara con el valor impreso."},
    co: 1, cu: 1, cr: 1, f: 1, hg: .003, mo: .5, ni: 1, pb: .1, se: .05, u: .2, v: .1,
  },
};
const GANADO = [
  {id: "bovino_carne", l: "Bovinos de carne"}, {id: "bovino_leche", l: "Bovinos de leche"}, {id: "ovino", l: "Ovinos"},
  {id: "caprino", l: "Caprinos"}, {id: "camelido", l: "Camélidos (llamas, vicuñas)"}, {id: "equino", l: "Equinos"},
  {id: "porcino", l: "Porcinos"}, {id: "aves", l: "Aves"},
];
const NORMAS = [
  {id: "caa982", uso: "consumo", marco: "Argentina", escala: "Nacional · Argentina", tipo: "Obligatoria para agua de red",
    nombre: "Código Alimentario Argentino, art. 982", corto: "CAA art. 982",
    cita: "Código Alimentario Argentino (Ley 18.284), Capítulo XII, artículo 982, texto según Resolución Conjunta SCS–SAByDR 33/2023.",
    ambito: "Agua potable de suministro público y de uso domiciliario.",
    lim: {
      turb: {max: 3, t: "estetico"}, color: {max: 5, t: "estetico"}, ph: {min: 6.5, max: 8.5, t: "operativo"},
      nh4: {max: .2, f: "NH4"}, sb: .02, al: {max: .2, nota: "Aluminio residual."},
      as: {max: .01, nota: "Para regiones con alto contenido natural de arsénico, el CAA previó un plazo de adecuación desde 0,05 mg/l, prorrogado hasta completar los estudios de hidroarsenicismo. Verificar la situación de la jurisdicción."},
      b: {max: 2.4, nota: "2,4 mg/l desde la Res. Conj. 33/2023 (antes 0,5 mg/l)."},
      bro3: {max: .01, opc: true}, cd: .005, cn: .1, zn: 5, cl: 350, cu: 1, cr: .05,
      dureza: {max: 400, t: "estetico"},
      f: {fn: "fcaa", nota: "El límite depende de la temperatura media y máxima del año del lugar (tabla del art. 982): de 1,7 mg/l (10–12 °C) a 0,8 mg/l (26,3–32,6 °C). Se carga por sitio."},
      fe: .3, mn: {max: .1, nota: "La Res. Conj. 33/2023 admite hasta 0,4 mg/l en zonas con alto contenido natural de manganeso."},
      hg: .001, ni: .02, no3: {max: 45, f: "NO3"}, no2: {max: .1, f: "NO2"}, ag: .05, pb: .05, se: .01, sdt: 1500, so4: 400,
      clres: {min: .2, opc: true, t: "operativo", nota: "Mínimo exigible en agua de red desinfectada con cloro; no corresponde en agua sin tratar."},
      colt: {max: 0, nota: "Ausencia en 100 ml."}, ecoli: {max: 0, nota: "Ausencia en 100 ml."}, pseud: {max: 0, nota: "Ausencia en 100 ml."}, meso: {max: 500, nota: "Hasta 500 UFC/ml."},
    }},
  {id: "who2022", uso: "consumo", marco: "OMS", escala: "Internacional · OMS", tipo: "Guía internacional (no obligatoria)",
    nombre: "OMS · Guías para la calidad del agua de consumo humano, 4.ª ed. con 1.ª y 2.ª adenda (2022)", corto: "OMS 2022",
    cita: "WHO. 2022. Guidelines for drinking-water quality: fourth edition incorporating the first and second addenda. World Health Organization, Ginebra. Tabla A3.3 y capítulo 10.",
    ambito: "Agua de consumo humano. Valores de salud; los de aceptabilidad (gusto, aspecto) van aparte.",
    lim: {
      sb: .02, as: {max: .01, nota: "Provisional: se fijó por lo que se puede medir y tratar, no sólo por salud."}, ba: 1.3, b: 2.4, bro3: {max: .01, opc: true}, cd: .003,
      cr: {max: .05, nota: "Cromo total."}, cu: {max: 2, nota: "Por debajo de este valor puede manchar ropa y sanitarios."}, f: {max: 1.5, nota: "Considerar el volumen consumido y el aporte de otras fuentes."},
      pb: {max: .01, nota: "Provisional (analítica y tratamiento)."}, mn: {max: .08, nota: "Provisional. Manganeso total; también afecta color y gusto."},
      hg: {max: .006, nota: "Para mercurio inorgánico."}, ni: .07, no3: {max: 50, f: "NO3"}, no2: {max: 3, f: "NO2"}, se: {max: .04, nota: "Provisional."}, u: {max: .03, nota: "Provisional."},
      ecoli: {max: 0, nota: "No detectable en 100 ml."},
      sdt: {max: 1000, t: "estetico", nota: "Por encima de unos 1.000 mg/l el agua se vuelve cada vez menos aceptable al gusto (cap. 10). No es un valor de salud."},
      cl: {max: 250, t: "estetico", nota: "Umbral de gusto aproximado: 200–300 mg/l (cap. 10)."},
      so4: {max: 250, t: "estetico", nota: "Umbral de gusto aproximado: 250–1.000 mg/l según el catión (cap. 10)."},
      na: {max: 200, t: "estetico", nota: "Umbral de gusto aproximado (cap. 10)."},
      fe: {max: .3, t: "estetico", nota: "Gusto y manchas desde unos 0,3 mg/l (cap. 10)."},
    }},
  {id: "ue2020", uso: "consumo", marco: "Unión Europea", escala: "Regional · Unión Europea", tipo: "Obligatoria en la UE",
    nombre: "Directiva (UE) 2020/2184, anexo I (partes A, B y C)", corto: "UE 2020/2184",
    cita: "Directiva (UE) 2020/2184 del Parlamento Europeo y del Consejo, de 16 de diciembre de 2020, relativa a la calidad de las aguas destinadas al consumo humano. DO L 435 de 23/12/2020. Anexo I.",
    ambito: "Agua destinada al consumo humano. Parte B: parámetros químicos; parte C: parámetros indicadores.",
    lim: {
      sb: .01, as: .01, b: 1.5, bro3: {max: .01, opc: true}, cd: .005,
      cr: {max: .05, nota: "25 µg/l desde el 12/01/2036; hasta entonces, 50 µg/l."},
      cu: 2, cn: .05, f: 1.5,
      pb: {max: .01, nota: "5 µg/l desde el 12/01/2036; hasta entonces, 10 µg/l."},
      hg: .001, ni: .02, no3: {max: 50, f: "NO3", nota: "Además: [nitrato]/50 + [nitrito]/3 ≤ 1 (ver «Iones y derivados»)."}, no2: {max: .5, f: "NO2", nota: "0,10 mg/l a la salida de la planta."},
      se: {max: .02, nota: "30 µg/l en zonas con geología que lo justifique."}, u: .03,
      ecoli: {max: 0, nota: "0 en 100 ml."},
      al: {max: .2, t: "indicador"}, nh4: {max: .5, f: "NH4", t: "indicador"}, cl: {max: 250, t: "indicador"}, ce: {max: 2500, t: "indicador", nota: "A 20 °C."},
      ph: {min: 6.5, max: 9.5, t: "indicador"}, fe: {max: .2, t: "indicador"}, mn: {max: .05, t: "indicador"}, so4: {max: 250, t: "indicador"}, na: {max: 200, t: "indicador"},
      colt: {max: 0, t: "indicador", nota: "0 en 100 ml."},
    }},
  {id: "epa", uso: "consumo", marco: "EE.UU.", escala: "Federal · Estados Unidos", tipo: "Obligatoria en EE.UU. (MCL); secundarios no obligatorios",
    nombre: "US EPA · National Primary y Secondary Drinking Water Regulations", corto: "EPA (EE.UU.)",
    cita: "US EPA. National Primary Drinking Water Regulations (40 CFR 141) y National Secondary Drinking Water Regulations (40 CFR 143).",
    ambito: "Sistemas públicos de agua potable de EE.UU. MCL: nivel máximo de contaminante; secundarios: estéticos.",
    lim: {
      sb: .006, as: .01, ba: 2, be: .004, cd: .005, cr: .1,
      cu: {max: 1.3, t: "accion", nota: "Nivel de acción (tratamiento). El nivel secundario es 1,0 mg/l."},
      cn: {max: .2, nota: "Como cianuro libre."}, f: {max: 4, nota: "El nivel secundario es 2,0 mg/l."},
      pb: {max: .015, t: "accion", nota: "Nivel de acción. La regla LCRI (2024) lo baja a 0,010 mg/l desde noviembre de 2027."},
      hg: {max: .002, nota: "Mercurio inorgánico."}, no3: {max: 10, f: "N"}, no2: {max: 1, f: "N"}, se: .05, tl: .002, u: .03,
      ecoli: {max: 0},
      al: {max: .2, t: "secundario", nota: "Rango secundario 0,05–0,2 mg/l."}, cl: {max: 250, t: "secundario"}, color: {max: 15, t: "secundario"},
      fe: {max: .3, t: "secundario"}, mn: {max: .05, t: "secundario"}, ph: {min: 6.5, max: 8.5, t: "secundario"}, ag: {max: .1, t: "secundario"},
      so4: {max: 250, t: "secundario"}, sdt: {max: 500, t: "secundario"}, zn: {max: 5, t: "secundario"},
    }},
  {id: "d831_t1", uso: "fuente", marco: "Argentina", escala: "Nacional · Argentina", tipo: "Nivel guía (Ley 24.051)",
    nombre: "Ley 24.051 · Dto. 831/93, anexo II, tabla 1", corto: "Dto. 831/93 T1",
    cita: "Decreto 831/93, reglamentario de la Ley 24.051 de Residuos Peligrosos, anexo II, tabla 1: Niveles guía de calidad de agua para fuentes de agua de bebida humana con tratamiento convencional.",
    ambito: "Calidad de la FUENTE que se va a potabilizar con tratamiento convencional. No es el agua que se bebe.", lim: T831.t1},
  {id: "l24585_t1", uso: "fuente", marco: "Argentina · minería", escala: "Nacional · Argentina (actividad minera)", tipo: "Nivel guía (Ley 24.585)", espejo: "d831_t1",
    nombre: "Ley 24.585 (Código de Minería), anexo IV, tabla 1", corto: "Ley 24.585 T1",
    cita: "Ley 24.585 de Protección Ambiental para la Actividad Minera (Código de Minería), anexo IV, tabla 1: fuentes de agua de bebida humana con tratamiento convencional.",
    ambito: "Mismo alcance y valores que la tabla 1 del Dto. 831/93, en el marco de la actividad minera.", lim: T831.t1},
  {id: "d831_t2", uso: "acuatica", marco: "Argentina", escala: "Nacional · Argentina", tipo: "Nivel guía (Ley 24.051)",
    nombre: "Ley 24.051 · Dto. 831/93, anexo II, tabla 2", corto: "Dto. 831/93 T2",
    cita: "Decreto 831/93, anexo II, tabla 2: Niveles guía de calidad de agua para protección de vida acuática. Agua dulce superficial.",
    ambito: "Protección de la vida acuática en agua dulce superficial.", lim: T831.t2},
  {id: "l24585_t2", uso: "acuatica", marco: "Argentina · minería", escala: "Nacional · Argentina (actividad minera)", tipo: "Nivel guía (Ley 24.585)", espejo: "d831_t2",
    nombre: "Ley 24.585 (Código de Minería), anexo IV, tabla 2", corto: "Ley 24.585 T2",
    cita: "Ley 24.585, anexo IV, tabla 2: protección de vida acuática, agua dulce superficial.",
    ambito: "Mismo alcance y valores que la tabla 2 del Dto. 831/93, en el marco de la actividad minera.", lim: T831.t2},
  {id: "d831_t5", uso: "riego", marco: "Argentina", escala: "Nacional · Argentina", tipo: "Nivel guía (Ley 24.051)",
    nombre: "Ley 24.051 · Dto. 831/93, anexo II, tabla 5", corto: "Dto. 831/93 T5",
    cita: "Decreto 831/93, anexo II, tabla 5: Niveles guía de calidad de agua para irrigación.",
    ambito: "Agua para irrigación. Sólo metales y metaloides: la salinidad y el sodio se evalúan con FAO y Riverside.", lim: T831.t5},
  {id: "l24585_t5", uso: "riego", marco: "Argentina · minería", escala: "Nacional · Argentina (actividad minera)", tipo: "Nivel guía (Ley 24.585)", espejo: "d831_t5",
    nombre: "Ley 24.585 (Código de Minería), anexo IV, tabla 5", corto: "Ley 24.585 T5",
    cita: "Ley 24.585, anexo IV, tabla 5: irrigación.", ambito: "Mismo alcance y valores que la tabla 5 del Dto. 831/93.", lim: T831.t5},
  {id: "fao29", uso: "riego", marco: "FAO", escala: "Internacional · FAO", tipo: "Guía técnica (grados de restricción)",
    nombre: "FAO · Ayers y Westcot, Water quality for agriculture (Estudio FAO Riego y Drenaje 29, rev. 1)", corto: "FAO 29",
    cita: "Ayers, R. S. y D. W. Westcot. 1985. Water quality for agriculture. FAO Irrigation and Drainage Paper 29 rev. 1. FAO, Roma. Tabla 1.",
    ambito: "Aptitud para riego en tres grados: sin restricción, ligera a moderada, severa. Cloruro y sodio para riego superficial.",
    lim: {
      ce: {grados: [700, 3000], t: "grado", nota: "Salinidad: < 0,7 dS/m sin restricción; 0,7–3,0 ligera a moderada; > 3,0 severa."},
      sdt: {grados: [450, 2000], t: "grado"},
      sar: {grados: [3, 9], t: "grado", nota: "Toxicidad por sodio en riego superficial (RAS). La infiltración (RAS con CE) va en «Iones y derivados»."},
      cl: {grados: [141.8, 354.5], t: "grado", nota: "4 y 10 meq/l, riego superficial. En aspersión: > 3 meq/l (106 mg/l) ya restringe."},
      b: {grados: [.7, 3], t: "grado"},
      no3: {grados: [5, 30], f: "N", t: "grado", nota: "Nitrógeno como nitrato (NO₃-N); afecta cultivos sensibles."},
      hco3: {grados: [91.5, 518.7], t: "grado", nota: "1,5 y 8,5 meq/l; sólo aspersión sobre follaje."},
      ph: {min: 6.5, max: 8.4, t: "operativo", nota: "Rango normal."},
    }},
  {id: "d831_t6", uso: "ganado", marco: "Argentina", escala: "Nacional · Argentina", tipo: "Nivel guía (Ley 24.051)",
    nombre: "Ley 24.051 · Dto. 831/93, anexo II, tabla 6", corto: "Dto. 831/93 T6",
    cita: "Decreto 831/93, anexo II, tabla 6: Niveles guía de calidad de agua para bebida de ganado.",
    ambito: "Agua de bebida para ganado. Sólo metales, metaloides y flúor: no trae nitratos, sulfatos ni salinidad.", lim: T831.t6},
  {id: "l24585_t6", uso: "ganado", marco: "Argentina · minería", escala: "Nacional · Argentina (actividad minera)", tipo: "Nivel guía (Ley 24.585)", espejo: "d831_t6",
    nombre: "Ley 24.585 (Código de Minería), anexo IV, tabla 6", corto: "Ley 24.585 T6",
    cita: "Ley 24.585, anexo IV, tabla 6: bebida de ganado.", ambito: "Mismo alcance y valores que la tabla 6 del Dto. 831/93.", lim: T831.t6},
  {id: "ccme_ganado", uso: "ganado", marco: "Canadá", escala: "Nacional · Canadá", tipo: "Guía (no obligatoria)",
    nombre: "CCME · Canadian Water Quality Guidelines, protección de usos agrícolas: bebida de ganado", corto: "CCME ganado",
    cita: "Canadian Council of Ministers of the Environment. Canadian Environmental Quality Guidelines: Water Quality Guidelines for the Protection of Agricultural Water Uses — Livestock water (CCREM 1987 y actualizaciones).",
    ambito: "Agua de bebida para ganado.",
    lim: {
      al: 5, as: .025, be: .1, b: 5, cd: .08, cr: .05, co: 1,
      cu: {fn: "cuCCME", nota: "Por especie: ovinos 0,5; bovinos 1; porcinos y aves 5 mg/l."},
      f: {max: 2, nota: "1–2 mg/l; el menor si el alimento también aporta flúor."}, pb: .1, hg: .003, mo: .5, ni: 1,
      no3: {max: 100, f: "N", suma: true, nota: "Nitrato + nitrito, como N."}, no2: {max: 10, f: "N", nota: "Nitrito solo, como N."},
      se: .05, so4: 1000, sdt: 3000, u: .2, v: .1, zn: 50, ca: 1000,
    }},
  {id: "anzg_ganado", uso: "ganado", marco: "Australia y Nueva Zelanda", escala: "Nacional · Australia y Nueva Zelanda", tipo: "Guía (no obligatoria)",
    nombre: "ANZECC y ARMCANZ (2000), vigente en ANZG (2018): agua de bebida para ganado", corto: "ANZG ganado",
    cita: "ANZECC y ARMCANZ. 2000. Australian and New Zealand Guidelines for Fresh and Marine Water Quality, cap. 4.3 Livestock drinking water quality (tablas 4.3.1 y 4.3.2), vigentes en ANZG 2018. Hay un borrador de actualización (2023).",
    ambito: "Agua de bebida para ganado. Los valores son disparadores de revisión, no límites de toxicidad.",
    lim: {
      al: 5, as: {max: .5, nota: "Hasta 5 mg/l si el arsénico no se agrega como aditivo del alimento."}, b: 5, cd: .01, cr: 1, co: 1,
      cu: {fn: "cuANZG", nota: "Por especie: ovinos 0,4; bovinos 1; porcinos y aves 5 mg/l."},
      f: 2, pb: .1, hg: .002, mo: .15, ni: 1, se: .02, u: .2, zn: 20,
      no3: {max: 400, f: "NO3", nota: "Hasta 1.500 mg/l puede tolerarse si el alimento tiene poco nitrato."}, no2: {max: 30, f: "NO2"},
      so4: {max: 1000, nota: "1.000–2.000 mg/l: posibles efectos; > 2.000 mg/l: problemas crónicos o agudos."}, ca: 1000,
      sdt: {fn: "sdtANZG", nota: "Sin efectos adversos hasta: bovinos de carne 4.000; de leche 2.500; ovinos 5.000; equinos y porcinos 4.000; aves 2.000 mg/l (tabla 4.3.1)."},
    }},
  {id: "jp_suido", uso: "consumo", marco: "Japón", escala: "Nacional · Japón", tipo: "Obligatoria para agua de red",
    nombre: "Japón · Normas de calidad del agua potable (水質基準, 52 ítems)", corto: "Japón agua potable",
    cita: "Ministerio de Medio Ambiente de Japón. 水質基準に関する省令 (Ordenanza sobre normas de calidad del agua potable, Ley de Abastecimiento de Agua, art. 4), tabla de 52 ítems vigente desde el 1/4/2026. La administración del agua potable pasó del MHLW al Ministerio de Medio Ambiente en abril de 2024.",
    ambito: "Agua de red. Kenti incluye los ítems inorgánicos, generales y microbiológicos; no los orgánicos volátiles ni los subproductos de la desinfección, salvo el bromato.",
    lim: {
      meso: {max: 100, nota: "Bacterias generales: hasta 100 colonias en 1 mL."}, ecoli: {max: 0, nota: "No detectable."},
      cd: .003, hg: .0005, se: .01, pb: .01, as: .01, cr6: .02,
      no2: {max: .04, f: "N", nota: "Nitrito como N."},
      cn: {max: .01, nota: "Ion cianuro y cloruro de cianógeno, como cianuro."},
      no3: {max: 10, f: "N", suma: true, nota: "Nitrato + nitrito, como N."},
      f: .8, b: 1.0, pfas: {max: .00005, nota: "Suma de PFOS y PFOA: 50 ng/L. Pasó de objetivo a norma el 1/4/2026."},
      bro3: {max: .01, opc: true},
      zn: {max: 1.0, t: "estetico"}, al: {max: .2, t: "estetico"}, fe: {max: .3, t: "estetico"}, cu: {max: 1.0, t: "estetico"},
      na: {max: 200, t: "estetico"}, mn: {max: .05, t: "estetico"}, cl: {max: 200, t: "estetico"},
      dureza: {max: 300, t: "estetico", nota: "Calcio, magnesio, etc. (dureza)."},
      sdt: {max: 500, t: "estetico", nota: "Residuo por evaporación (蒸発残留物): se compara con los sólidos disueltos totales."},
      cot: {max: 3, t: "operativo", nota: "Materia orgánica como carbono orgánico total."},
      ph: {min: 5.8, max: 8.6, t: "operativo"},
      color: {max: 5, t: "estetico", nota: "5 grados de color."}, turb: {max: 2, t: "estetico", nota: "2 grados de turbiedad."},
    }},
  {id: "jp_eqs_salud", uso: "ambiental", marco: "Japón", escala: "Nacional · Japón", tipo: "Estándar ambiental (objetivo de gestión)",
    nombre: "Japón · Estándares de calidad ambiental del agua, protección de la salud humana (環境基準・健康項目)", corto: "Japón EQS salud",
    cita: "Ministerio de Medio Ambiente de Japón. 水質汚濁に係る環境基準 (Notificación 59 de la Agencia de Medio Ambiente, 1971, y modificaciones), anexo 1. Cadmio revisado en 2011; cromo hexavalente 0,02 mg/L desde el 1/4/2022.",
    ambito: "Aguas públicas (ríos, lagos, mar). Se evalúa como promedio anual, salvo el cianuro total, que se evalúa por el máximo.",
    lim: {
      cd: .003, pb: .01, cr6: .02, as: .01, hg: {max: .0005, nota: "Mercurio total."},
      cn: {max: .1, nota: "«No detectable» con límite de cuantificación 0,1 mg/L: se considera que supera si se cuantifica."},
      no3: {max: 10, f: "N", suma: true, nota: "Nitrato + nitrito, como N."},
      f: {max: .8, nota: "No se aplica en el mar."}, b: {max: 1, nota: "No se aplica en el mar."}, se: .01,
    }},
  {id: "jp_rio", uso: "ambiental", marco: "Japón", escala: "Nacional · Japón", tipo: "Estándar ambiental por clase de río",
    nombre: "Japón · Estándares de calidad ambiental para ríos, conservación del ambiente de vida (環境基準・生活環境項目, clases AA a E)", corto: "Japón ríos (clase)",
    cita: "Ministerio de Medio Ambiente de Japón. 水質汚濁に係る環境基準, anexo 2, tabla ア (ríos). E. coli reemplaza a los coliformes totales desde el 1/4/2022.",
    ambito: "El río tiene una clase asignada según su uso (AA: agua potable clase 1 y conservación; A: potable 2, pesca 1, baño; B: potable 3, pesca 2; C: pesca 3, industrial 1; D: industrial 2 y riego; E: industrial 3). Se elige en esta pestaña.",
    lim: {
      ph: {fn: "jpRio", k: "ph"}, dbo: {fn: "jpRio", k: "dbo"}, sst: {fn: "jpRio", k: "sst"}, od: {fn: "jpRio", k: "od"},
      ecoli: {fn: "jpRio", k: "ecoli", nota: "En la norma se evalúa como valor del 90 % de los muestreos del año; con muestras sueltas la comparación es orientativa."},
    }},
  {id: "jp_biota", uso: "acuatica", marco: "Japón", escala: "Nacional · Japón", tipo: "Estándar ambiental (biota acuática)",
    nombre: "Japón · Estándar ambiental para la conservación de organismos acuáticos en ríos (tabla イ)", corto: "Japón biota",
    cita: "Ministerio de Medio Ambiente de Japón. 水質汚濁に係る環境基準, anexo 2, tabla イ (ríos): cinc total 0,03 mg/L en todas las clases de biota; nonilfenol y LAS no están en Kenti.",
    ambito: "Protección de organismos acuáticos en ríos. Se evalúa como promedio anual.",
    lim: {zn: {max: .03, nota: "Cinc total, promedio anual, igual en las clases 生物A, 生物特A, 生物B y 生物特B."}}},
  {id: "jp_ind", uso: "industrial", marco: "Japón", escala: "Nacional · Japón", tipo: "Estándar ambiental por clase de río (uso industrial)",
    nombre: "Japón · Clases de río aptas para agua industrial (clases C, D y E del estándar ambiental)", corto: "Japón agua industrial",
    cita: "Ministerio de Medio Ambiente de Japón. 水質汚濁に係る環境基準, anexo 2, tabla ア: agua industrial clase 1 (tratamiento común de sedimentación) en ríos clase C; clase 2 (tratamiento con reactivos) en clase D; clase 3 (tratamiento especial) en clase E.",
    ambito: "No es una especificación del agua de proceso, sino la calidad del río que se considera apta para captar agua industrial con cada grado de tratamiento.",
    lim: {ph: {fn: "jpInd", k: "ph"}, dbo: {fn: "jpInd", k: "dbo"}, sst: {fn: "jpInd", k: "sst"}, od: {fn: "jpInd", k: "od"}}},
  {id: "jp_riego", uso: "riego", marco: "Japón", escala: "Nacional · Japón", tipo: "Guía técnica (no obligatoria)",
    nombre: "Japón · Norma de agua para riego de arroz (農業（水稲）用水基準)", corto: "Japón riego (arroz)",
    cita: "Consejo de Investigación Técnica en Agricultura, Silvicultura y Pesca de Japón (農林水産技術会議), 4/10/1971. Norma de referencia para agua de riego de arroz.",
    ambito: "Pensada para el cultivo de arroz inundado; para otros cultivos, usar FAO 29.",
    lim: {
      ph: {min: 6.0, max: 7.5}, codmn: {max: 6, nota: "DQO al permanganato (método japonés), no al dicromato."}, sst: 100, od: {min: 5},
      nt: {max: 1, nota: "Nitrógeno total."}, ce: {max: 300, nota: "0,3 mS/cm."}, as: .05, zn: .5, cu: .02,
    }},
];
const N = Object.fromEntries(NORMAS.map(n => [n.id, n]));

/* ---------- Límites que dependen de la muestra o del sitio ---------- */
const DUR_RANGOS = ["0–60", "60–120", "120–180", "> 180"];
const F_CAA = [[10, 12, 1.7], [12.1, 14.6, 1.5], [14.7, 17.6, 1.3], [17.7, 21.4, 1.2], [21.5, 26.2, 1.0], [26.3, 32.6, 0.8]];
const LIM_FN = {
  dur831(spec, ctx){
    const h = ctx.dureza;
    if (h == null) return {max: spec.v[0], cond: tx(`Sin dureza: se usa el valor más exigente (dureza 0–60 mg/l CaCO₃).`, `No hardness: the most stringent value is used (hardness 0–60 mg/L as CaCO₃).`), falta: tx("dureza", "hardness")};
    const i = h <= 60 ? 0 : h <= 120 ? 1 : h <= 180 ? 2 : 3;
    return {max: spec.v[i], cond: tx(`Dureza ${fmtN(h, 0)} mg/l CaCO₃${ctx.durezaCalc ? " (calculada con Ca y Mg)" : ""}: rango ${DUR_RANGOS[i]}.`, `Hardness ${fmtN(h, 0)} mg/L as CaCO₃${ctx.durezaCalc ? " (calculated from Ca and Mg)" : ""}: range ${DUR_RANGOS[i]}.`)};
  },
  al831(spec, ctx){
    const falt = [];
    if (ctx.ph == null) falt.push("pH"); if (ctx.ca == null) falt.push(tx("calcio", "calcium")); if (ctx.cod == null) falt.push(tx("COD", "DOC"));
    if (falt.length) return {max: .005, cond: tx(`Sin ${falt.join(", ")}: se usa el valor más exigente (5 µg/l).`, `No ${falt.join(", ")}: the most stringent value is used (5 µg/L).`), falta: falt.join(", ")};
    const alto = ctx.ph >= 6.5 && ctx.ca >= 4 && ctx.cod >= 2;
    return {max: alto ? .1 : .005, cond: alto ? tx("pH ≥ 6,5, Ca ≥ 4 mg/l y COD ≥ 2 mg/l: 100 µg/l.", "pH ≥ 6.5, Ca ≥ 4 mg/L and DOC ≥ 2 mg/L: 100 µg/L.") : tx("pH < 6,5, Ca < 4 mg/l o COD < 2 mg/l: 5 µg/l.", "pH < 6.5, Ca < 4 mg/L or DOC < 2 mg/L: 5 µg/L.")};
  },
  fcaa(spec, ctx){
    const t = ctx.tAire;
    if (t == null) return {max: 1.5, cond: tx("Sin temperatura media anual del sitio: se usa 1,5 mg/l (12,1–14,6 °C). Cargarla en «Sitios».", "No mean annual temperature for the site: 1.5 mg/L is used (12.1–14.6 °C). Enter it under “Sites”."), falta: tx("temperatura media anual del sitio", "site mean annual temperature")};
    const row = F_CAA.find(r => t <= r[1] + 1e-9) || F_CAA[F_CAA.length - 1];
    const fuera = t < 10 ? tx(" (por debajo de la tabla: se usa la primera fila)", " (below the table: the first row is used)") : t > 32.6 ? tx(" (por encima de la tabla: se usa la última fila)", " (above the table: the last row is used)") : "";
    return {max: row[2], cond: tx(`Temperatura media anual ${fmtN(t, 1)} °C: límite superior ${fmtN(row[2], 1)} mg/l${fuera}.`, `Mean annual temperature ${fmtN(t, 1)} °C: upper limit ${fmtN(row[2], 1)} mg/L${fuera}.`)};
  },
  cuCCME(spec, ctx){
    const e = ctx.ganado, v = {ovino: .5, caprino: .5, camelido: .5, bovino_carne: 1, bovino_leche: 1, equino: 1, porcino: 5, aves: 5}[e] ?? .5;
    const n = (EN ? {caprino: " No value of its own for goats: the sheep value is used.", camelido: " No value of its own for camelids: the sheep value is used, the most stringent.", equino: " No value of its own for horses: the cattle value is used."} : {caprino: " Sin valor propio para caprinos: se usa el de ovinos.", camelido: " Sin valor propio para camélidos: se usa el de ovinos, el más exigente.", equino: " Sin valor propio para equinos: se usa el de bovinos."})[e] || "";
    return {max: v, cond: `${ganadoLabel(e)}: ${fmtN(v, 1)} ${tx("mg/l", "mg/L")}.${n}`};
  },
  cuANZG(spec, ctx){
    const e = ctx.ganado, v = {ovino: .4, caprino: .4, camelido: .4, bovino_carne: 1, bovino_leche: 1, equino: 1, porcino: 5, aves: 5}[e] ?? .4;
    const n = (EN ? {caprino: " No value of its own for goats: the sheep value is used.", camelido: " No value of its own for camelids: the sheep value is used, the most stringent.", equino: " No value of its own for horses: the cattle value is used."} : {caprino: " Sin valor propio para caprinos: se usa el de ovinos.", camelido: " Sin valor propio para camélidos: se usa el de ovinos, el más exigente.", equino: " Sin valor propio para equinos: se usa el de bovinos."})[e] || "";
    return {max: v, cond: `${ganadoLabel(e)}: ${fmtN(v, 1)} ${tx("mg/l", "mg/L")}.${n}`};
  },
  jpRio(spec, ctx){
    const c = ctx.jpClase || "A", T = JP_RIO[c], k = spec.k;
    if (!T || T[k] == null) return {max: null, min: null, cond: tx(`Clase ${c}: sin valor para este parámetro.`, `Class ${c}: no value for this parameter.`)};
    const v = T[k];
    return Object.assign(Array.isArray(v) ? {min: v[0], max: v[1]} : k === "od" ? {min: v} : {max: v}, {cond: tx(`Río clase ${c} (${JP_USO[c]}).`, `River class ${c} (${JP_USO[c]}).`)});
  },
  jpInd(spec, ctx){
    const g = ctx.jpInd || "1", c = {1: "C", 2: "D", 3: "E"}[g], T = JP_RIO[c], k = spec.k, v = T[k];
    if (v == null) return {max: null, min: null, cond: tx(`Agua industrial clase ${g}: sin valor para este parámetro.`, `Industrial water class ${g}: no value for this parameter.`)};
    return Object.assign(Array.isArray(v) ? {min: v[0], max: v[1]} : k === "od" ? {min: v} : {max: v}, {cond: tx(`Agua industrial clase ${g} = río clase ${c}.`, `Industrial water class ${g} = river class ${c}.`)});
  },
  sdtANZG(spec, ctx){
    const e = ctx.ganado, v = {bovino_carne: 4000, bovino_leche: 2500, ovino: 5000, caprino: 5000, camelido: 5000, equino: 4000, porcino: 4000, aves: 2000}[e] ?? 2000;
    const n = (EN ? {caprino: " No value of its own for goats: the sheep value is used.", camelido: " No value of its own for camelids: the sheep value is used."} : {caprino: " Sin valor propio para caprinos: se usa el de ovinos.", camelido: " Sin valor propio para camélidos: se usa el de ovinos."})[e] || "";
    return {max: v, cond: tx(`${ganadoLabel(e)}: sin efectos adversos hasta ${fmtN(v, 0)} mg/l.${n}`, `${ganadoLabel(e)}: no adverse effects up to ${fmtN(v, 0)} mg/L.${n}`)};
  },
};
// Japón, ríos: pH [mín, máx], DBO, SS, OD mínimo, E. coli (UFC/100 mL). Clase E: SS sin valor (sin residuos flotantes).
const JP_RIO = {
  AA: {ph: [6.5, 8.5], dbo: 1, sst: 25, od: 7.5, ecoli: 20},
  A: {ph: [6.5, 8.5], dbo: 2, sst: 25, od: 7.5, ecoli: 300},
  B: {ph: [6.5, 8.5], dbo: 3, sst: 25, od: 5, ecoli: 1000},
  C: {ph: [6.5, 8.5], dbo: 5, sst: 50, od: 5},
  D: {ph: [6.0, 8.5], dbo: 8, sst: 100, od: 2},
  E: {ph: [6.0, 8.5], dbo: 10, od: 2},
};
const JP_USO = {AA: "agua potable 1 y conservación de la naturaleza", A: "agua potable 2, pesca 1 y baño", B: "agua potable 3 y pesca 2", C: "pesca 3 e industrial 1", D: "industrial 2 y riego", E: "industrial 3 y conservación del ambiente"};
const ganadoLabel = id => (GANADO.find(g => g.id === id) || {l: tx("Sin especie elegida", "No species selected")}).l;

/* ---------- CCME WQI ---------- */
const WQI_CLASES = [
  {min: 95, l: "Excelente", col: "azul", d: "Prácticamente sin amenazas ni deterioro; muy cerca de condiciones naturales."},
  {min: 80, l: "Buena", col: "verde", d: "Sólo un grado menor de amenaza o deterioro; rara vez se aparta de lo deseable."},
  {min: 65, l: "Regular", col: "amarillo", d: "Protegida en general, pero a veces amenazada o deteriorada."},
  {min: 45, l: "Marginal", col: "naranja", d: "Con frecuencia amenazada o deteriorada."},
  {min: 0, l: "Pobre", col: "rojo", d: "Casi siempre amenazada o deteriorada; muy lejos de lo deseable."},
];
const WQI_CITA = "CCME. 2017. Canadian Water Quality Guidelines for the Protection of Aquatic Life: CCME Water Quality Index, User's Manual — 2017 Update. Canadian Council of Ministers of the Environment, Winnipeg.";

/* ---------- Tabla de ejemplo: un informe de laboratorio ficticio, en el formato traspuesto ---------- */
const EJEMPLO_TSV = "Informe de ensayo de ejemplo (datos ficticios)\nParámetro\tUnidad\tLD\tMétodo\tP1\tV1\tR1\nFecha\t\t\t\t12/05/2026\t12/05/2026\t13/05/2026\npH\tupH\t\t4500-H\t7,85\t8,10\t6,20\nConductividad\tµS/cm\t\t2510\t1250\t4800\t380\nTemperatura\t°C\t\t\t14,2\t9,5\t11,0\nSólidos disueltos totales\tmg/l\t10\t2540C\t820\t3150\t240\nCalcio\tmg/l\t0,5\t\t62\t180\t28\nMagnesio\tmg/l\t0,5\t\t18\t75\t6\nSodio\tmg/l\t0,5\t\t160\t820\t35\nPotasio\tmg/l\t0,5\t\t12\t65\t4\nCloruros\tmg/l\t1\t\t180\t1350\t22\nSulfatos\tmg/l\t1\t\t140\t520\t40\nAlcalinidad total\tmg/l CaCO3\t5\t\t210\t180\t80\nNitratos\tmg/l NO3-\t0,5\t\t18\t3,2\t<0,5\nNitritos\tmg/l NO2-\t0,01\t\t<0,01\t0,05\t<0,01\nFluoruros\tmg/l\t0,05\t\t1,2\t2,1\t0,3\nArsénico\tµg/l\t1\t\t8\t180\t6\nBoro\tmg/l\t0,05\t\t1,8\t12,5\t0,4\nLitio\tmg/l\t0,01\t\t0,8\t15\t0,05\nHierro total\tmg/l\t0,02\t\t0,05\t0,3\t0,6\nManganeso\tmg/l\t0,01\t\t<0,01\t0,12\t0,05\nPlomo\tmg/l\t0,005\t\t<0,005\t<0,005\tND\nCadmio\tµg/l\t0,1\t\t<0,1\t0,4\t<0,1\nCobre\tmg/l\t0,005\t\t0,01\t0,008\t0,012\nCinc\tmg/l\t0,01\t\t0,03\t0,05\t0,08\nColiformes totales\tNMP/100 ml\t\t\tAusencia\t23\t>2400\nEscherichia coli\tNMP/100 ml\t\t\tAusencia\tAusencia\t150\n";
const EJEMPLO_SITIOS = [
  ["P1", "Pozo del campamento", "Pozo (subterránea)", "3900", "8"],
  ["V1", "Vertiente salina del borde del salar", "Vertiente", "3920", "8"],
  ["R1", "Río, aguas arriba", "Río o arroyo", "4050", "7"],
];
