// extract.js — turn an uploaded file (.txt / .pdf / .xlsx / .xls) into plain text
// that the chunk+embed pipeline can consume.
const { PDFParse } = require("pdf-parse");
const XLSX = require("xlsx");

function isType(name, mime, exts, mimeNeedles) {
  const n = (name || "").toLowerCase();
  if (exts.some((e) => n.endsWith(e))) return true;
  const m = (mime || "").toLowerCase();
  return mimeNeedles.some((needle) => m.includes(needle));
}

// Extract text from a PDF buffer.
async function extractPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const res = await parser.getText();
    return res.text || "";
  } finally {
    await parser.destroy().catch(() => {});
  }
}

// Extract text from an Excel buffer. Each row becomes a readable line; rows are
// batched (~8 per block, blank-line separated) so the chunker makes sensible chunks.
function extractXlsx(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  let out = "";

  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, blankrows: false });
    if (!rows.length) continue;

    // Treat the first row as headers if it looks like labels (non-numeric).
    const headers = (rows[0] || []).map((h) => String(h ?? "").trim());
    const hasHeader = headers.some((h) => h.length > 0 && isNaN(Number(h)));
    const dataRows = hasHeader ? rows.slice(1) : rows;

    out += `\n\n## ${sheetName}\n`;
    let block = [];
    for (const r of dataRows) {
      const line = hasHeader
        ? headers
            .map((h, i) => (r[i] != null && r[i] !== "" ? `${h}: ${r[i]}` : null))
            .filter(Boolean)
            .join(" · ")
        : (r || []).filter((c) => c != null && c !== "").join(" · ");
      if (!line.trim()) continue;
      block.push(line);
      if (block.length >= 8) {
        out += block.join("\n") + "\n\n";
        block = [];
      }
    }
    if (block.length) out += block.join("\n") + "\n\n";
  }
  return out;
}

// Main entry: pick the right extractor by filename/mimetype.
async function extractText(buffer, filename = "", mimetype = "") {
  if (isType(filename, mimetype, [".pdf"], ["pdf"])) {
    return extractPdf(buffer);
  }
  if (isType(filename, mimetype, [".xlsx", ".xls"], ["sheet", "excel", "spreadsheet"])) {
    return extractXlsx(buffer);
  }
  // Default: plain text.
  return buffer.toString("utf8");
}

module.exports = { extractText, extractPdf, extractXlsx };
