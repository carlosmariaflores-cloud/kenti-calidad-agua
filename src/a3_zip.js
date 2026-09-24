/* =========================== Leer y escribir .xlsx (sin dependencias) =========================== */
async function unzipEntries(buf){
  const u8 = new Uint8Array(buf), dv = new DataView(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50){ eocd = i; break; }
  if (eocd < 0) throw new Error(tx("no es un archivo .xlsx válido", "not a valid .xlsx file"));
  const count = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder(), out = {};
  for (let k = 0; k < count; k++){
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
    out[name] = {method, lo, csize};
    p += 46 + nlen + elen + clen;
  }
  const read = async name => {
    const e = out[name]; if (!e) return null;
    const start = e.lo + 30 + dv.getUint16(e.lo + 26, true) + dv.getUint16(e.lo + 28, true);
    const data = u8.subarray(start, start + e.csize);
    if (e.method === 0) return dec.decode(data);
    if (e.method !== 8 || typeof DecompressionStream === "undefined") throw new Error(tx("formato de compresión no soportado", "unsupported compression format"));
    const raw = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer();
    return dec.decode(raw);
  };
  return {names: Object.keys(out), read};
}
async function readXlsx(buf){
  const z = await unzipEntries(buf);
  const xml = t => new DOMParser().parseFromString(t, "application/xml");
  const byTag = (node, tag) => [...node.getElementsByTagName("*")].filter(el => el.localName === tag);
  const wb = xml(await z.read("xl/workbook.xml") || "");
  const rels = xml(await z.read("xl/_rels/workbook.xml.rels") || "<Relationships/>");
  const relMap = {}; byTag(rels, "Relationship").forEach(r => relMap[r.getAttribute("Id")] = r.getAttribute("Target"));
  const shared = [];
  const ss = await z.read("xl/sharedStrings.xml");
  if (ss) byTag(xml(ss), "si").forEach(si => shared.push(byTag(si, "t").map(t => t.textContent).join("")));
  // Formatos de fecha: para leer bien las fechas que Excel guarda como número de serie.
  const stx = await z.read("xl/styles.xml"); const dateXf = new Set();
  if (stx){
    const sd = xml(stx), custom = {};
    byTag(sd, "numFmt").forEach(n => custom[n.getAttribute("numFmtId")] = n.getAttribute("formatCode") || "");
    const cx = byTag(sd, "cellXfs")[0];
    if (cx) byTag(cx, "xf").forEach((x, i) => { const id = +x.getAttribute("numFmtId"); if ((id >= 14 && id <= 22) || (custom[id] && /[dmy]/i.test(custom[id].replace(/\[[^\]]*\]|"[^"]*"/g, "")) && !/0\.0/.test(custom[id]))) dateXf.add(i); });
  }
  const sheets = byTag(wb, "sheet").map(sh => {
    const rid = [...sh.attributes].find(a => a.localName === "id" && a.name !== "sheetId");
    let target = relMap[rid ? rid.value : ""] || "";
    target = target.startsWith("/") ? target.slice(1) : "xl/" + target.replace(/^\.\//, "");
    return {name: sh.getAttribute("name"), path: target};
  });
  const colIdx = ref => { const m = /^([A-Z]+)/.exec(ref || ""); if (!m) return null; let n = 0; for (const ch of m[1]) n = n*26 + ch.charCodeAt(0) - 64; return n - 1; };
  for (const sh of sheets){
    const doc = xml(await z.read(sh.path) || "<worksheet/>");
    const grid = [];
    byTag(doc, "row").forEach((row, ri) => {
      const r = (+row.getAttribute("r") || ri + 1) - 1; const cells = [];
      let next = 0;
      byTag(row, "c").forEach(c => {
        const ci = colIdx(c.getAttribute("r")) ?? next; next = ci + 1;
        const t = c.getAttribute("t"), v = byTag(c, "v")[0]?.textContent ?? "", s = +c.getAttribute("s");
        let val = "";
        if (t === "s") val = shared[+v] ?? "";
        else if (t === "inlineStr") val = byTag(c, "t").map(x => x.textContent).join("");
        else if (t === "str") val = v;
        else if (t === "b") val = v === "1" ? "1" : "0";
        else if (t === "e") val = "";
        else if (v !== "" && dateXf.has(s)){
          const n = +v;
          if (n > 0 && n < 1){ const mm = Math.round(n * 1440); val = `${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`; }
          else if (n >= 1 && n < 100000) val = new Date(Math.round((Math.floor(n) - 25569) * 86400e3)).toISOString().slice(0, 10);
          else val = numToTxt(n);
        }
        else val = v === "" ? "" : numToTxt(+v);
        cells[ci] = val;
      });
      grid[r] = cells;
    });
    sh.rows = Array.from(grid, r => Array.from(r || [], c => c ?? ""));
  }
  return sheets;
}
// Un número leído de Excel, escrito con coma decimal y sin notación científica innecesaria.
function numToTxt(x){
  if (!isFinite(x)) return "";
  let s = Math.abs(x) < 1e-4 && x !== 0 ? x.toExponential().replace(/\.?0+e/, "e") : String(+x.toPrecision(12));
  return s.replace(".", ",");
}
const XE = s => String(s ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const U8 = new TextEncoder();
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8){ let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
async function deflateRaw(u8){
  if (typeof CompressionStream === "undefined") return null;
  try { return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer()); } catch(e){ return null; }
}
async function zipFiles(files){
  const parts = [], central = []; let offset = 0;
  const d = new Date(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const f of files){
    const name = U8.encode(f.name), data = typeof f.data === "string" ? U8.encode(f.data) : f.data, crc = crc32(data);
    let method = 0, body = data;
    const z = await deflateRaw(data); if (z && z.length < data.length){ method = 8; body = z; }
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, method, true);
    lh.setUint16(10, tm, true); lh.setUint16(12, dt, true); lh.setUint32(14, crc, true); lh.setUint32(18, body.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true);
    parts.push(new Uint8Array(lh.buffer), name, body);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, method, true);
    ch.setUint16(12, tm, true); ch.setUint16(14, dt, true); ch.setUint32(16, crc, true); ch.setUint32(20, body.length, true); ch.setUint32(24, data.length, true);
    ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + body.length;
  }
  const size = central.reduce((t, a) => t + a.length, 0), end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, size, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}

class XStyles {
  constructor(){
    this.fonts = []; this.fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
    this.borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>']; this.nums = []; this.xfs = []; this.keys = new Map();
    this.font({}); this.xf({});
  }
  _id(list, xml){ let i = list.indexOf(xml); if (i < 0){ list.push(xml); i = list.length - 1; } return i; }
  font({b, i, sz = 10, color = "FF18200F", name = "Calibri"}){
    return this._id(this.fonts, `<font>${b ? "<b/>" : ""}${i ? "<i/>" : ""}<sz val="${sz}"/><color rgb="${color}"/><name val="${name}"/><family val="2"/></font>`);
  }
  fill(rgb){ return rgb ? this._id(this.fills, `<fill><patternFill patternType="solid"><fgColor rgb="${rgb}"/><bgColor indexed="64"/></patternFill></fill>`) : 0; }
  border(k){
    if (!k) return 0;
    const t = `style="thin"><color rgb="FFC3CAB9"/>`, m = `style="medium"><color rgb="FF465040"/>`;
    if (k === "all") return this._id(this.borders, `<border><left ${t}</left><right ${t}</right><top ${t}</top><bottom ${t}</bottom><diagonal/></border>`);
    if (k === "bottom") return this._id(this.borders, `<border><left/><right/><top/><bottom ${m}</bottom><diagonal/></border>`);
    return 0;
  }
  num(code){ const b = {"General": 0, "0": 1, "0.00": 2, "#,##0": 3, "@": 49}; return code in b ? b[code] : 164 + this._id(this.nums, code); }
  xf(o){
    const key = JSON.stringify(o); if (this.keys.has(key)) return this.keys.get(key);
    const al = (o.align || o.wrap || o.v) ? `<alignment${o.align ? ` horizontal="${o.align}"` : ""}${o.v ? ` vertical="${o.v}"` : ""}${o.wrap ? ' wrapText="1"' : ""}/>` : "";
    this.xfs.push(`<xf numFmtId="${this.num(o.num || "General")}" fontId="${this.font(o.font || {})}" fillId="${this.fill(o.fill)}" borderId="${this.border(o.border)}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"${al ? ' applyAlignment="1"' : ""}>${al}</xf>`);
    this.keys.set(key, this.xfs.length - 1); return this.xfs.length - 1;
  }
  xml(){
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
      + (this.nums.length ? `<numFmts count="${this.nums.length}">${this.nums.map((c, i) => `<numFmt numFmtId="${164 + i}" formatCode="${XE(c)}"/>`).join("")}</numFmts>` : "")
      + `<fonts count="${this.fonts.length}">${this.fonts.join("")}</fonts><fills count="${this.fills.length}">${this.fills.join("")}</fills>`
      + `<borders count="${this.borders.length}">${this.borders.join("")}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`
      + `<cellXfs count="${this.xfs.length}">${this.xfs.join("")}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  }
}
const colName = c => { let s = ""; c++; while (c){ const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };
const cref = (r, c) => colName(c) + (r + 1);
const rng = (r1, c1, r2, c2) => cref(r1, c1) + ":" + cref(r2, c2);
class XSheet {
  constructor(name, o = {}){ this.name = name.slice(0, 31); this.cells = new Map(); this.widths = {}; this.heights = {}; this.merges = []; this.dv = []; this.freeze = null; this.portrait = !!o.portrait; }
  set(r, c, v, st = 0){ if (v === undefined) return this; if (!this.cells.has(r)) this.cells.set(r, new Map()); this.cells.get(r).set(c, {v, st}); return this; }
  fx(r, c, f, st = 0){ if (!this.cells.has(r)) this.cells.set(r, new Map()); this.cells.get(r).set(c, {f, st}); return this; }
  row(r, c0, vals, st){ vals.forEach((v, i) => this.set(r, c0 + i, v, Array.isArray(st) ? st[i] : st)); return this; }
  merge(r1, c1, r2, c2){ this.merges.push(rng(r1, c1, r2, c2)); return this; }
  list(sqref, items){ this.dv.push({sqref, f: `"${items.join(",")}"`}); return this; }
  cellXml(r, c, cell){
    const a = `r="${cref(r, c)}"${cell.st ? ` s="${cell.st}"` : ""}`;
    if (cell.f != null) return `<c ${a}><f>${XE(cell.f)}</f></c>`;
    const v = cell.v;
    if (v == null || v === "") return cell.st ? `<c ${a}/>` : "";
    if (typeof v === "number") return okNum(v) ? `<c ${a}><v>${v}</v></c>` : `<c ${a}/>`;
    return `<c ${a} t="inlineStr"><is><t xml:space="preserve">${XE(v)}</t></is></c>`;
  }
  xml(selected){
    let sd = "";
    const rowsIdx = new Set([...this.cells.keys(), ...Object.keys(this.heights).map(Number)]);
    for (const r of [...rowsIdx].sort((a, b) => a - b)){
      const cols = [...(this.cells.get(r) || new Map()).entries()].sort((a, b) => a[0] - b[0]);
      const h = this.heights[r];
      sd += `<row r="${r + 1}"${h ? ` ht="${h}" customHeight="1"` : ""}>${cols.map(([c, cell]) => this.cellXml(r, c, cell)).join("")}</row>`;
    }
    let pane = "";
    if (this.freeze){ const [fr, fc] = this.freeze; pane = `<pane${fc ? ` xSplit="${fc}"` : ""}${fr ? ` ySplit="${fr}"` : ""} topLeftCell="${cref(fr, fc)}" activePane="${fr && fc ? "bottomRight" : fr ? "bottomLeft" : "topRight"}" state="frozen"/>`; }
    const cols = Object.keys(this.widths).map(Number).sort((a, b) => a - b).map(c => `<col min="${c + 1}" max="${c + 1}" width="${this.widths[c]}" customWidth="1"/>`).join("");
    const mg = this.merges.length ? `<mergeCells count="${this.merges.length}">${this.merges.map(m => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>` : "";
    const dv = this.dv.length ? `<dataValidations count="${this.dv.length}">${this.dv.map(d => `<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorStyle="warning" sqref="${d.sqref}"><formula1>${XE(d.f)}</formula1></dataValidation>`).join("")}</dataValidations>` : "";
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
      + `<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0" showGridLines="0"${selected ? ' tabSelected="1"' : ""}>${pane}</sheetView></sheetViews>`
      + `<sheetFormatPr defaultRowHeight="15"/>${cols ? `<cols>${cols}</cols>` : ""}<sheetData>${sd}</sheetData>${mg}${dv}`
      + `<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.25" footer="0.25"/><pageSetup paperSize="9" orientation="${this.portrait ? "portrait" : "landscape"}" fitToWidth="1" fitToHeight="0"/>`
      + `<headerFooter><oddFooter>&amp;L${XE(this.name)}&amp;CHoja &amp;P de &amp;N&amp;RDesarrollado por Kenti</oddFooter></headerFooter></worksheet>`;
  }
}
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
async function workbookBlob(sheets, styles, title){
  const files = [], over = [];
  sheets.forEach((sh, i) => {
    files.push({name: `xl/worksheets/sheet${i + 1}.xml`, data: sh.xml(i === 0)});
    over.push(`<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
  });
  const iso = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  files.unshift(
    {name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${over.join("")}</Types>`},
    {name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${REL}/extended-properties" Target="docProps/app.xml"/></Relationships>`},
    {name: "docProps/core.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${XE(title)}</dc:title><dc:creator>Kenti Calidad de Agua</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified></cp:coreProperties>`},
    {name: "docProps/app.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Kenti</Application></Properties>`},
    {name: "xl/workbook.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${REL}"><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="15000" activeTab="0"/></bookViews><sheets>${sheets.map((sh, i) => `<sheet name="${XE(sh.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`},
    {name: "xl/_rels/workbook.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="${REL}/styles" Target="styles.xml"/></Relationships>`},
    {name: "xl/styles.xml", data: styles.xml()},
  );
  return zipFiles(files);
}
