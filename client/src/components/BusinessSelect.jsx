// BusinessSelect — a small combobox for picking / typing a business ID.
// Unlike a native <datalist>, clicking the chevron shows ALL known businesses
// (not just ones matching the current value), and you can still type a new ID.
import { useState, useRef, useEffect } from "react";

export default function BusinessSelect({ value, options = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(null); // null = not actively typing
  const ref = useRef(null);

  // What the input shows: the typed query while editing, else the committed value.
  const displayValue = query === null ? value : query;

  // Filter only when the user is actively typing a non-empty query.
  const filtered =
    query && query.trim()
      ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
      : options;

  // Commit a value to the parent and stop editing.
  function commit(next) {
    const v = (next ?? "").trim();
    if (v && v !== value) onChange(v);
    setQuery(null);
    setOpen(false);
  }

  // Close + commit any pending typed text when clicking outside.
  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        if (query !== null) commit(query || value); // empty query -> keep current value
        else setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [query, value]);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center rounded-md border border-gray-300 bg-white">
        <input
          value={displayValue}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(query ?? value);
            if (e.key === "Escape") { setQuery(null); setOpen(false); }
          }}
          placeholder="any-business-id"
          className="w-44 rounded-md px-2 py-1 text-sm outline-none"
        />
        <button
          type="button"
          aria-label="Show businesses"
          onClick={() => setOpen((o) => !o)}
          className="px-2 text-gray-400 hover:text-gray-600"
        >
          <span className={`inline-block transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 z-20 mt-1 max-h-64 w-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
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
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
                  o === value ? "font-semibold text-green-600" : "text-gray-700"
                }`}
              >
                {o}
                {o === value && <span className="text-xs">✓</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
