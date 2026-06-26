// FAQUploader — drag-and-drop (or click) a .txt FAQ file, upload it, show result.
import { useState, useRef } from "react";
import { uploadFAQ } from "../lib/api";

export default function FAQUploader({ businessId, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null); // { type: "ok"|"error", text }
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

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
      setStatus({ type: "ok", text: `${res.chunks_embedded} chunks embedded successfully` });
      onUploaded?.(res);
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-gray-900">Upload FAQ</h2>
      <p className="mb-3 text-xs text-gray-500">
        Drop a plain-text FAQ for <span className="font-medium">{businessId}</span>. Shoduttor reads,
        chunks, and embeds it so the bot can answer from it.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition
          ${dragging ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <span className="text-sm text-gray-600">
          {busy ? "Embedding…" : "Drag & drop a .txt file, or click to choose"}
        </span>
      </div>

      {status && (
        <div
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            status.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {status.text}
        </div>
      )}
    </div>
  );
}
