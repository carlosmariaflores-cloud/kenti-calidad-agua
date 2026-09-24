// Arma el manuscrito .docx según la guía de autores de JWET. Uso: node armar.js es|en
const fs = require("fs"), path = require("path");
const D = require("docx");
const {Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageNumber, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, PageBreak, ShadingType} = D;
const LANG = process.argv[2] || "es";
const C = require(`./contenido_${LANG}.js`);
const TX = require(`./tablas_${LANG}.js`);
const FIG = [path.join(__dirname, "..", "repo", "figuras"), path.join(__dirname, "..", "figuras")].find(d => fs.existsSync(d));
const FONT = "Times New Roman", SZ = 22;                    // 11 pt

/* ---------- Referencias numeradas por orden de primera aparición ---------- */
const orden = [], mapa = {};
const expandir = g => g.split(/,\s*/).flatMap(t => { const m = /^(\d+)[–-](\d+)$/.exec(t.trim()); if (!m) return [+t]; const a = []; for (let i = +m[1]; i <= +m[2]; i++) a.push(i); return a; });
const textos = [];
C.secciones.forEach(s => { (s.p || []).forEach(t => textos.push(t)); (s.eq || []).forEach(t => textos.push(t)); (s.p2 || []).forEach(t => textos.push(t));
  (s.sub || []).forEach(u => { (u.p || []).forEach(t => textos.push(t)); (u.eq || []).forEach(t => textos.push(t)); (u.p2 || []).forEach(t => textos.push(t)); }); });
TX.tablas.forEach(t => textos.push(t.titulo, ...(t.notas || [])));
for (const t of textos) for (const m of t.matchAll(/\[(\d+(?:\s*[–-]\s*\d+)?(?:,\s*\d+(?:\s*[–-]\s*\d+)?)*)\]/g)) for (const n of expandir(m[1])) if (!(n in mapa)){ orden.push(n); mapa[n] = orden.length; }
C.referencias.forEach((_, i) => { if (!((i + 1) in mapa)){ orden.push(i + 1); mapa[i + 1] = orden.length; console.warn("Referencia sin citar:", i + 1); } });
const comprimir = ns => { ns = [...new Set(ns)].sort((a, b) => a - b); const out = []; for (let i = 0; i < ns.length;){ let j = i; while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++; out.push(j - i >= 2 ? `${ns[i]}–${ns[j]}` : ns.slice(i, j + 1).join(", ")); i = j + 1; } return out.join(", "); };
const renumerar = t => t.replace(/\[(\d+(?:\s*[–-]\s*\d+)?(?:,\s*\d+(?:\s*[–-]\s*\d+)?)*)\]/g, (_, g) => `[${comprimir(expandir(g).map(n => mapa[n]))}]`);

/* ---------- Texto con marcas: *itálica*, **negrita**, <sub>, <sup> ---------- */
function runs(t, base = {}){
  t = renumerar(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");
  const out = [], st = {b: 0, i: 0, sub: 0, sup: 0};
  for (const part of t.split(/(<\/?(?:b|i|sub|sup)>)/)){
    const m = /^<(\/?)(b|i|sub|sup)>$/.exec(part);
    if (m){ st[m[2]] += m[1] ? -1 : 1; continue; }
    if (!part) continue;
    out.push(new TextRun({text: part, font: FONT, size: base.size || SZ, bold: base.bold || st.b > 0, italics: base.italics || st.i > 0, subScript: st.sub > 0, superScript: st.sup > 0}));
  }
  return out;
}
const P = (t, o = {}) => new Paragraph({children: runs(t, o), alignment: o.align || AlignmentType.JUSTIFIED, spacing: {after: o.after ?? 120, before: o.before ?? 0, line: 240}, keepNext: o.keepNext});
const H = t => P(t, {bold: true, align: AlignmentType.LEFT, before: 240, after: 120, keepNext: true});
const H2 = t => P(t, {italics: true, bold: true, align: AlignmentType.LEFT, before: 160, after: 80, keepNext: true});
let neq = 0;
const EQ = t => new Paragraph({children: [...runs(t), new TextRun({text: `\t(${++neq})`, font: FONT, size: SZ})], tabStops: [{type: "right", position: 9000}], alignment: AlignmentType.LEFT, indent: {left: 567}, spacing: {after: 80}});

/* ---------- Tablas ---------- */
const W = 9070;
const bordeFino = {style: BorderStyle.SINGLE, size: 4, color: "000000"}, sinBorde = {style: BorderStyle.NONE, size: 0, color: "FFFFFF"};
function tabla(t){
  const cw = t.anchos.map(a => Math.round(a / t.anchos.reduce((x, y) => x + y) * W));
  cw[cw.length - 1] += W - cw.reduce((x, y) => x + y);
  const celda = (txt, i, head, last) => new TableCell({width: {size: cw[i], type: WidthType.DXA},
    borders: {top: head ? bordeFino : sinBorde, bottom: head || last ? bordeFino : sinBorde, left: sinBorde, right: sinBorde},
    margins: {top: 40, bottom: 40, left: 70, right: 70},
    children: [new Paragraph({children: runs(String(txt), {size: 18, bold: head}), alignment: i === 0 || t.izq?.includes(i) ? AlignmentType.LEFT : AlignmentType.CENTER, spacing: {after: 0}})]});
  const rows = [new TableRow({tableHeader: true, children: t.encabezado.map((x, i) => celda(x, i, true, false))}),
    ...t.filas.map((f, k) => new TableRow({children: f.map((x, i) => celda(x, i, false, k === t.filas.length - 1))}))];
  return [P(t.titulo, {align: AlignmentType.LEFT, keepNext: true, after: 80}),
    new Table({width: {size: W, type: WidthType.DXA}, columnWidths: cw, rows}),
    ...(t.notas || []).map(n => P(n, {size: 18, align: AlignmentType.LEFT, after: 40}))];
}

/* ---------- Documento ---------- */
const hijos = [];
hijos.push(P(C.titulo, {size: 28, bold: true, align: AlignmentType.LEFT, after: 240}));
hijos.push(P(C.autores, {align: AlignmentType.LEFT, after: 60}));
hijos.push(P(C.afiliacion, {align: AlignmentType.LEFT, italics: true, after: 240}));
hijos.push(P(C.palabras, {align: AlignmentType.LEFT, after: 240}));
C.correspondencia.forEach(x => hijos.push(P(x, {align: AlignmentType.LEFT, after: 40})));
hijos.push(new Paragraph({children: [new PageBreak()]}));
hijos.push(H(LANG === "es" ? "RESUMEN" : "ABSTRACT"));
hijos.push(P(C.resumen));
for (const s of C.secciones){
  hijos.push(H(s.h));
  (s.p || []).forEach(t => hijos.push(P(t)));
  for (const u of s.sub || []){
    hijos.push(H2(u.h));
    (u.p || []).forEach(t => hijos.push(P(t)));
    (u.eq || []).forEach(t => hijos.push(EQ(t)));
    (u.p2 || []).forEach(t => hijos.push(P(t)));
  }
}
hijos.push(H(LANG === "es" ? "REFERENCIAS" : "REFERENCES"));
orden.forEach((n, i) => hijos.push(new Paragraph({children: [new TextRun({text: `[${i + 1}] `, font: FONT, size: SZ}), ...runs(C.referencias[n - 1])], indent: {left: 454, hanging: 454}, spacing: {after: 60}, alignment: AlignmentType.LEFT})));
for (const t of TX.tablas){ hijos.push(new Paragraph({children: [new PageBreak()]})); hijos.push(...tabla(t)); }
for (const f of TX.figuras){
  hijos.push(new Paragraph({children: [new PageBreak()]}));
  const buf = fs.readFileSync(path.join(FIG, f.archivo));
  const px = require("child_process").execSync(`python3 -c "from PIL import Image; im=Image.open('${path.join(FIG, f.archivo)}'); print(im.size[0], im.size[1])"`).toString().trim().split(" ").map(Number);
  const ancho = f.ancho_cm / 2.54 * 96, alto = ancho * px[1] / px[0];
  hijos.push(new Paragraph({children: [new ImageRun({type: "png", data: buf, transformation: {width: Math.round(ancho), height: Math.round(alto)}})], alignment: AlignmentType.CENTER, spacing: {after: 120}}));
  hijos.push(P(f.leyenda, {align: AlignmentType.LEFT}));
}
const doc = new Document({
  styles: {default: {document: {run: {font: FONT, size: SZ}}}},
  sections: [{properties: {lineNumbers: {countBy: 1, restart: "continuous", distance: 284}, page: {size: {width: 11906, height: 16838}, margin: {top: 1418, bottom: 1418, left: 1418, right: 1418}}},
    footers: {default: new Footer({children: [new Paragraph({alignment: AlignmentType.CENTER, children: [new TextRun({children: [PageNumber.CURRENT], font: FONT, size: 20})]})]})},
    children: hijos}],
});
const salida = path.join(__dirname, TX.archivo);
Packer.toBuffer(doc).then(b => { fs.writeFileSync(salida, b); console.log("Escrito", salida); });
