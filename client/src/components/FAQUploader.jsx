// FAQUploader — "Knowledge base" card: a big dropzone on the left, and an
// "Active source" panel on the right listing the .txt files this business's bot
// is answering from (filename, chunk count, embed date).
import { useState, useRef, useEffect, useCallback } from "react";
import { uploadFAQ, getFaqSources } from "../lib/api";
import { UploadIcon, FileIcon, CheckIcon } from "./icons";

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function FAQUploader({ businessId, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null); // { type, text }
  const [busy, setBusy] = useState(false);
  const [sources, setSources] = useState([]);
  const inputRef = useRef(null);

  const loadSources = useCallback(async () => {
    try {
      setSources(await getFaqSources(businessId));
    } catch {
      setSources([]);
    }
  }, [businessId]);

  useEffect(() => {
    setStatus(null);
    loadSources();
  }, [loadSources]);

  async function handleFile(file) {
    if (!file) return;
    if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
      setStatus({ type: "error", text: "Please upload a plain .txt file." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await uploadFAQ(businessId, file);
      setStatus({ type: "ok", text: `${file.name}: ${res.chunks_embedded} chunks embedded` });
      await loadSources();
      onUploaded?.(res);
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-green-600"><FileIcon /></span>
            <h2 className="text-base font-bold text-gray-900">Knowledge base</h2>
          </div>
          <p className="mt-1 max-w-md text-xs text-gray-500">
            Drop a plain-text FAQ for <span className="font-semibold">{cap(businessId)}</span>. Shoduttor
            reads, chunks and embeds it so the bot can answer from it.
          </p>
        </div>
        {sources.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
            <CheckIcon /> Indexed
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition
            ${dragging ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <UploadIcon />
          </div>
          <div className="mt-3 text-sm font-medium text-gray-700">
            {busy ? "Embedding…" : "Drag & drop a .txt file"}
          </div>
          {!busy && (
            <div className="text-xs text-gray-400">
              or <span className="font-medium text-green-600">click to choose</span>
            </div>
          )}
          {status && (
            <div className={`mt-3 rounded-md px-3 py-1.5 text-xs ${status.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {status.text}
            </div>
          )}
        </div>

        {/* Active source panel */}
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Active source
          </div>
          {sources.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-xs text-gray-400">
              No FAQ uploaded yet — the bot will escalate every message until you add one.
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map((s) => (
                <div key={s.source_file} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                    <FileIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-800">{s.source_file}</div>
                    <div className="text-[11px] text-gray-500">
                      {s.chunks} chunk{s.chunks === 1 ? "" : "s"}
                      {s.last_uploaded ? ` · embedded ${new Date(s.last_uploaded).toLocaleDateString()}` : ""}
                      {s.uploads > 1 ? ` · re-uploaded ${s.uploads}×` : ""}
                    </div>
                  </div>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" title="Indexed" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
