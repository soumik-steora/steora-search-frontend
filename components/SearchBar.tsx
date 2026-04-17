'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useCallback } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(searchParams.get('q') || '');

  const commit = useCallback((query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  return (
    <div className="w-full max-w-3xl flex gap-2">
      <input
        type="text"
        className="flex-1 px-5 py-4 text-lg rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
        placeholder="Search matters, officials, or locations..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(term);
        }}
      />
      <button
        onClick={() => commit(term)}
        className="px-7 py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-lg rounded-xl shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        Search
      </button>
    </div>
  );
}