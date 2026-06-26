// BusinessSelect — avatar pill that opens a searchable dropdown of businesses.
// Clicking the pill shows ALL known businesses; the search box filters them and
// lets you type a brand-new business ID (Enter to use it).
import { useState, useRef, useEffect } from "react";
import { SearchIcon, CheckIcon } from "./icons";

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function BusinessSelect({ value, options = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const searchRef = useRef(null);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  function commit(next) {
    const v = (next ?? "").trim();
    if (v && v !== value) onChange(v);
    setQuery("");
    setOpen(false);
  }

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setQuery("");
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Focus the search box when opening.
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white py-1.5 pl-1.5 pr-2.5 text-sm shadow-sm hover:bg-gray-50"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-600 text-xs font-bold text-white">
          {(value || "?").charAt(0).toUpperCase()}
        </span>
        <span className="font-semibold text-gray-900">{cap(value)}</span>
        <span className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 text-gray-400">
            <SearchIcon />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit(query || value);
                if (e.key === "Escape") { setQuery(""); setOpen(false); }
              }}
              placeholder="Search or type an ID…"
              className="w-full text-sm text-gray-700 outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">
                {query ? `Press Enter to use "${query.trim()}"` : "No businesses yet"}
              </div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => commit(o)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    o === value ? "text-green-600" : "text-gray-700"
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-500">
                    {o.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">{cap(o)}</span>
                  {o === value && <span className="text-green-600"><CheckIcon /></span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
