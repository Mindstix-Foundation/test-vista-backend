/**
 * Minimal XLSX reader using system `unzip` (no npm deps).
 */
const { execFileSync } = require('child_process');

function parseXmlText(xml) {
  return String(xml || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function unzipEntry(filePath, entry) {
  return execFileSync('unzip', ['-p', filePath, entry], {
    maxBuffer: 50 * 1024 * 1024,
  }).toString('utf8');
}

function listEntries(filePath) {
  const out = execFileSync('unzip', ['-Z', '-1', filePath], {
    maxBuffer: 10 * 1024 * 1024,
  }).toString('utf8');
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

function getSharedStrings(filePath) {
  const names = listEntries(filePath);
  if (!names.includes('xl/sharedStrings.xml')) return [];
  const xml = unzipEntry(filePath, 'xl/sharedStrings.xml');
  const out = [];
  const siRe = /<si[\s\S]*?<\/si>/g;
  let m;
  while ((m = siRe.exec(xml))) {
    const texts = [...m[0].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => parseXmlText(x[1]));
    out.push(texts.join(''));
  }
  return out;
}

function sheetRowsFromXml(xml, shared) {
  const rows = [];
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const rowXml = rm[1];
    const obj = {};
    const cellRe = /<c r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/c>/g;
    let cm;
    while ((cm = cellRe.exec(rowXml))) {
      const col = cm[1];
      const attrs = cm[3] || '';
      const body = cm[4] || '';
      let val = '';
      if (/t="inlineStr"/.test(attrs)) {
        const t = body.match(/<t[^>]*>([\s\S]*?)<\/t>/);
        val = t ? parseXmlText(t[1]) : '';
      } else {
        const v = body.match(/<v>([\s\S]*?)<\/v>/);
        if (!v) val = '';
        else if (/t="s"/.test(attrs)) val = shared[Number(v[1])] ?? '';
        else val = parseXmlText(v[1]);
      }
      obj[col] = val;
    }
    rows.push(obj);
  }
  return rows;
}

class ZipFile {
  static open(filePath) {
    return new ZipFile(filePath);
  }

  constructor(filePath) {
    this.filePath = filePath;
    this.shared = getSharedStrings(filePath);
    this._sheetMap = this._buildSheetMap();
  }

  _buildSheetMap() {
    const wb = unzipEntry(this.filePath, 'xl/workbook.xml');
    const rels = unzipEntry(this.filePath, 'xl/_rels/workbook.xml.rels');
    const relMap = new Map();
    for (const m of rels.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) {
      relMap.set(m[1], m[2]);
    }
    // Some files put Target before Id
    for (const m of rels.matchAll(/Target="([^"]+)"[^>]*Id="(rId\d+)"/g)) {
      if (!relMap.has(m[2])) relMap.set(m[2], m[1]);
    }
    const map = new Map();
    for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
      const tag = m[0];
      const name = (tag.match(/\bname="([^"]+)"/) || [])[1];
      const rid = (tag.match(/\br:id="(rId\d+)"/) || [])[1];
      if (!name || !rid) continue;
      let target = relMap.get(rid);
      if (!target) continue;
      if (target.startsWith('/')) target = target.slice(1);
      else if (!target.startsWith('xl/')) target = `xl/${target}`;
      map.set(name, target);
    }
    return map;
  }

  sheetNames() {
    return [...this._sheetMap.keys()];
  }

  readSheetRows(sheetName) {
    const target = this._sheetMap.get(sheetName);
    if (!target) throw new Error(`Sheet not found: ${sheetName}`);
    const xml = unzipEntry(this.filePath, target);
    return sheetRowsFromXml(xml, this.shared);
  }
}

module.exports = { ZipFile };
