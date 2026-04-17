'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

function clampHighlight(index: number, len: number) {
  if (len <= 0) return 0;
  return Math.min(Math.max(0, index), len - 1);
}

/** Cheap Levenshtein for short typo tolerance when substring match fails. */
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev + cost, row[j - 1] + 1, row[j] + 1);
      prev = tmp;
    }
  }
  return row[b.length];
}

export type RankedLocation = { location: string; score: number };

/** Higher score = closer match. Negative = excluded. */
export function rankCourtLocations(
  query: string,
  locations: string[],
  /** Omit or pass `Infinity` to return every match (full scrollable list). */
  max: number = Number.POSITIVE_INFINITY,
): RankedLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...locations]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .map(location => ({ location, score: 0 }));
  }

  const ranked: RankedLocation[] = [];
  for (const location of locations) {
    const l = location.toLowerCase();
    let score = -1;
    if (l === q) score = 100_000;
    else if (l.startsWith(q)) score = 50_000 + (2000 - Math.min(2000, l.length));
    else {
      const idx = l.indexOf(q);
      if (idx >= 0) score = 25_000 + (1000 - Math.min(1000, idx));
      else {
        const windowLen = Math.min(l.length, Math.max(q.length + 4, 12));
        let best = Infinity;
        for (let s = 0; s <= Math.max(0, l.length - windowLen); s++) {
          const slice = l.slice(s, s + windowLen);
          best = Math.min(best, levenshtein(q, slice));
        }
        const thresh = Math.max(2, Math.floor(q.length / 3));
        if (best <= thresh) score = 5000 - best * 200;
      }
    }
    if (score >= 0) ranked.push({ location, score });
  }

  ranked.sort((a, b) => b.score - a.score || a.location.localeCompare(b.location));
  return Number.isFinite(max) ? ranked.slice(0, max) : ranked;
}

/**
 * Pick a canonical location string for the API, or null if the input is not specific enough.
 */
export function resolveCourtLocation(
  input: string,
  locations: string[],
): string | null {
  const t = input.trim();
  if (!t) return null;

  const exact = locations.find(l => l.toLowerCase() === t.toLowerCase());
  if (exact) return exact;

  const tl = t.toLowerCase();
  const prefixMatches = locations.filter(l => l.toLowerCase().startsWith(tl));
  if (prefixMatches.length === 1) return prefixMatches[0];

  const ranked = rankCourtLocations(t, locations);
  if (ranked.length === 0) return null;
  if (ranked.length === 1) return ranked[0].location;

  return null;
}

interface Props {
  locations: string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onClearError?: () => void;
}

export default function CourtLocationCombobox({
  locations,
  value,
  onChange,
  error,
  onClearError,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const suggestions = useMemo(
    () => rankCourtLocations(value, locations),
    [value, locations],
  );

  const displayHighlight = clampHighlight(highlight, suggestions.length);

  const selectLocation = useCallback(
    (loc: string) => {
      onChange(loc);
      onClearError?.();
      setOpen(false);
      inputRef.current?.blur();
    },
    [onChange, onClearError],
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight(h => clampHighlight(h + 1, suggestions.length));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => clampHighlight(h - 1, suggestions.length));
      return;
    }
    if (e.key === 'Enter') {
      const pick = suggestions[displayHighlight];
      if (open && pick) {
        e.preventDefault();
        selectLocation(pick.location);
      }
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Type to search court locations…"
        value={value}
        onChange={e => {
          setHighlight(0);
          onChange(e.target.value);
          onClearError?.();
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKeyDown}
        className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 outline-none transition-all
          focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-gray-400
          ${error ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'}`}
      />

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={s.location} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={i === displayHighlight}
                className={`w-full px-3 py-2 text-left text-sm transition-colors
                  ${i === displayHighlight ? 'bg-blue-50 text-blue-900' : 'text-gray-800 hover:bg-gray-50'}`}
                onMouseDown={e => e.preventDefault()}
                onClick={() => selectLocation(s.location)}
                onMouseEnter={() => setHighlight(i)}
              >
                {s.location}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
