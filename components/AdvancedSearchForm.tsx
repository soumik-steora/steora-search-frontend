'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { DateRangeType } from '@/types';
import CourtLocationCombobox, { resolveCourtLocation } from '@/components/CourtLocationCombobox';

const DATE_RANGE_OPTIONS: { value: DateRangeType; label: string }[] = [
  { value: '',       label: '— No date filter —' },
  { value: 'last30',  label: 'Last 30 Days' },
  { value: 'last60',  label: 'Last 60 Days' },
  { value: 'last90',  label: 'Last 90 Days' },
  { value: 'last180', label: 'Last 180 Days' },
  { value: 'single',  label: 'Single Date' },
  { value: 'multiple', label: 'Multiple Dates' },
];

interface Props {
  locations: string[];
}

export default function AdvancedSearchForm({ locations }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const sp       = useSearchParams();

  // Initialise from URL so the form reflects the current search on page load
  const [courtLocation,  setCourtLocation]  = useState(sp.get('courtLocation') ?? '');
  const [styleOfCause,   setStyleOfCause]   = useState(sp.get('styleOfCause') ?? '');
  const [dateRangeType,  setDateRangeType]  = useState<DateRangeType>(
    (sp.get('dateRangeType') ?? '') as DateRangeType,
  );
  const [singleDate,     setSingleDate]     = useState(sp.get('singleDate') ?? '');
  const [multipleDates,  setMultipleDates]  = useState<string[]>(() => {
    const raw = sp.get('dates');
    return raw ? raw.split(',').filter(Boolean) : ['', ''];
  });
  const [locationError, setLocationError] = useState('');

  // ── date helpers ──────────────────────────────────────────────────────── //
  const updateDate = (i: number, val: string) =>
    setMultipleDates(prev => prev.map((d, idx) => (idx === i ? val : d)));

  const addDate = () =>
    setMultipleDates(prev => (prev.length < 7 ? [...prev, ''] : prev));

  const removeDate = (i: number) =>
    setMultipleDates(prev => prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev);

  // ── submit ────────────────────────────────────────────────────────────── //
  const handleSubmit = useCallback(() => {
    if (!courtLocation.trim()) {
      setLocationError('Court Location is required to search.');
      return;
    }
    const resolved = resolveCourtLocation(courtLocation, locations);
    if (!resolved) {
      setLocationError(
        'Pick a court location from the suggestions, or keep typing until only one match appears.',
      );
      return;
    }
    setLocationError('');

    const params = new URLSearchParams();
    params.set('courtLocation', resolved);
    if (styleOfCause.trim())  params.set('styleOfCause', styleOfCause.trim());
    if (dateRangeType) {
      params.set('dateRangeType', dateRangeType);
      if (dateRangeType === 'single' && singleDate)
        params.set('singleDate', singleDate);
      if (dateRangeType === 'multiple') {
        const valid = multipleDates.filter(Boolean);
        if (valid.length) params.set('dates', valid.join(','));
      }
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  }, [courtLocation, locations, styleOfCause, dateRangeType, singleDate, multipleDates, router, pathname]);

  const handleClear = () => {
    setCourtLocation('');
    setStyleOfCause('');
    setDateRangeType('');
    setSingleDate('');
    setMultipleDates(['', '']);
    setLocationError('');
    router.push(pathname);
  };

  // ── render ────────────────────────────────────────────────────────────── //
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-8 w-full">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-none">Advanced Transcript Search</h2>
          <p className="text-xs text-gray-500 mt-0.5">OpenSearch-style fuzzy matching across all fields</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Court Location ── */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Court Location
            <span className="ml-1 text-red-500">*</span>
            <span className="ml-2 text-xs font-normal text-gray-400">required</span>
          </label>
          <CourtLocationCombobox
            locations={locations}
            value={courtLocation}
            onChange={setCourtLocation}
            error={locationError}
            onClearError={() => setLocationError('')}
          />
          {locationError && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {locationError}
            </p>
          )}
        </div>

        {/* ── Style of Cause ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Style of Cause
            <span className="ml-2 text-xs font-normal text-gray-400">optional · fuzzy matched</span>
          </label>
          <input
            type="text"
            value={styleOfCause}
            onChange={e => setStyleOfCause(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. R. v. Smith, Jones v. Jones…"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-black outline-none transition-all
              focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            Typo-tolerant — partial names and misspellings are matched.
          </p>
        </div>

        {/* ── Date of Transcript ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Date of Transcript
            <span className="ml-2 text-xs font-normal text-gray-400">optional</span>
          </label>
          <select
            value={dateRangeType}
            onChange={e => setDateRangeType(e.target.value as DateRangeType)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none
              transition-all focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            {DATE_RANGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Single date picker */}
          {dateRangeType === 'single' && (
            <input
              type="date"
              value={singleDate}
              onChange={e => setSingleDate(e.target.value)}
              className="mt-3 w-full px-4 py-3 rounded-xl border border-gray-300 text-black outline-none transition-all
                focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          )}

          {/* Multiple date pickers */}
          {dateRangeType === 'multiple' && (
            <div className="mt-3 space-y-2">
              {multipleDates.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={d}
                    onChange={e => updateDate(i, e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-black outline-none transition-all
                      focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                  />
                  {multipleDates.length > 2 && (
                    <button
                      onClick={() => removeDate(i)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                        hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove date"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {multipleDates.length < 7 && (
                <button
                  onClick={addDate}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 pt-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add another date
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Active search summary chip ── */}
      {(sp.get('courtLocation') || sp.get('styleOfCause') || sp.get('dateRangeType')) && (
        <div className="mt-6 flex flex-wrap gap-2">
          {sp.get('courtLocation') && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
              📍 {sp.get('courtLocation')}
            </span>
          )}
          {sp.get('styleOfCause') && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
              ⚖️ &ldquo;{sp.get('styleOfCause')}&rdquo;
            </span>
          )}
          {sp.get('dateRangeType') && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              📅 {DATE_RANGE_OPTIONS.find(o => o.value === sp.get('dateRangeType'))?.label}
              {sp.get('singleDate') && `: ${sp.get('singleDate')}`}
              {sp.get('dates') && `: ${sp.get('dates')?.split(',').join(', ')}`}
            </span>
          )}
        </div>
      )}

      {/* ── Buttons ── */}
      <div className="flex items-center justify-between mt-7 pt-6 border-t border-gray-100">
        <button
          onClick={handleClear}
          className="px-5 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200
            font-semibold rounded-xl transition-all"
        >
          Clear all
        </button>
        <button
          onClick={handleSubmit}
          className="px-7 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95
            text-white font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          Search
        </button>
      </div>
    </div>
  );
}
