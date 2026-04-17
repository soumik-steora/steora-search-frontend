import { Suspense } from 'react';
import { headers } from 'next/headers';
import AdvancedSearchForm from '@/components/AdvancedSearchForm';
import ResultsList from '@/components/ResultsList';
import { AdvancedSearchResponse } from '@/types';

// ── Data fetchers ──────────────────────────────────────────────────────────── //

async function fetchCourtLocations(): Promise<string[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/search/locations/`,
      { next: { revalidate: 3600 } },   // re-fetch at most once per hour
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.locations ?? [];
  } catch {
    return [];
  }
}

interface ClientInfo {
  ip: string;
  ua: string;
}

async function fetchAdvancedResults(
  params: URLSearchParams,
  client: ClientInfo,
): Promise<AdvancedSearchResponse | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/search/advanced/?${params.toString()}`,
      {
        cache: 'no-store',
        headers: {
          // Forward the real browser IP and User-Agent to Django so analytics
          // records the actual visitor rather than the Next.js server process.
          ...(client.ip && { 'X-Client-IP': client.ip }),
          ...(client.ua && { 'X-Client-UA': client.ua }),
        },
      },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Date-range label helper ────────────────────────────────────────────────── //

function dateRangeLabel(type: string, singleDate?: string, dates?: string): string {
  const map: Record<string, string> = {
    last30:  'last 30 days',
    last60:  'last 60 days',
    last90:  'last 90 days',
    last180: 'last 180 days',
    single:  singleDate ? `on ${singleDate}` : 'single date',
    multiple: dates ? `on ${dates.split(',').join(', ')}` : 'multiple dates',
  };
  return map[type] ?? type;
}

// ── Page ──────────────────────────────────────────────────────────────────── //

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [resolved, incomingHeaders] = await Promise.all([
    searchParams,
    headers(),
  ]);

  // Extract the real browser IP — Next.js/proxies set x-forwarded-for or x-real-ip.
  const rawForwardedFor = incomingHeaders.get('x-forwarded-for') ?? '';
  const clientIP =
    rawForwardedFor.split(',')[0].trim() ||
    incomingHeaders.get('x-real-ip') ||
    incomingHeaders.get('cf-connecting-ip') ||   // Cloudflare
    '';

  const clientUA = incomingHeaders.get('user-agent') ?? '';
  const client: ClientInfo = { ip: clientIP, ua: clientUA };

  const str = (key: string) => {
    const v = resolved[key];
    return typeof v === 'string' ? v.trim() : '';
  };

  const courtLocation  = str('courtLocation');
  const styleOfCause   = str('styleOfCause');
  const dateRangeType  = str('dateRangeType');
  const singleDate     = str('singleDate');
  const dates          = str('dates');
  const hasSearch      = !!courtLocation;

  // Build query params for the advanced search API
  const apiParams = new URLSearchParams();
  if (courtLocation)  apiParams.set('courtLocation', courtLocation);
  if (styleOfCause)   apiParams.set('styleOfCause',  styleOfCause);
  if (dateRangeType)  apiParams.set('dateRangeType',  dateRangeType);
  if (singleDate)     apiParams.set('singleDate',     singleDate);
  if (dates)          apiParams.set('dates',           dates);
  apiParams.set('page',  str('page') || '1');
  apiParams.set('limit', str('limit') || '20');

  // Fetch locations (cached) + results (if active search) in parallel
  const [locations, data] = await Promise.all([
    fetchCourtLocations(),
    hasSearch ? fetchAdvancedResults(apiParams, client) : Promise.resolve(null),
  ]);

  const totalCount = data?.total_count ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-10 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Advanced search form – requires Suspense because it reads useSearchParams() */}
        <div className="mb-8">
          <Suspense
            fallback={
              <div className="h-80 bg-white rounded-2xl border border-gray-200 animate-pulse" />
            }
          >
            <AdvancedSearchForm locations={locations} />
          </Suspense>
        </div>

        {/* Results area */}
        {hasSearch ? (
          <section>
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-x-2 mb-5 text-sm text-gray-600">
              <span>
                Found{' '}
                <strong className="text-gray-900">{totalCount}</strong>{' '}
                result{totalCount !== 1 ? 's' : ''} in{' '}
                <strong className="text-gray-900">{courtLocation}</strong>
              </span>
              {styleOfCause && (
                <span>
                  · matching{' '}
                  <strong className="text-gray-900">&ldquo;{styleOfCause}&rdquo;</strong>
                </span>
              )}
              {dateRangeType && (
                <span>
                  · {dateRangeLabel(dateRangeType, singleDate, dates)}
                </span>
              )}
              {data && (
                <span className="text-gray-400 ml-1">
                  ({data.meta.latency_ms}ms)
                </span>
              )}
            </div>

            {data ? (
              <ResultsList results={data.results} query={styleOfCause} />
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <p className="text-red-500 font-medium">
                  Could not reach the search service. Please try again.
                </p>
              </div>
            )}
          </section>
        ) : (
          /* Empty / prompt state */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 text-center">
            <div className="text-5xl mb-4">⚖️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Select a court location to begin</h2>
            <p className="text-gray-500 max-w-md text-sm leading-relaxed">
              <strong>Court Location</strong> is the only required field.
              Optionally add a <strong>Style of Cause</strong> for fuzzy text matching
              and a <strong>Date Range</strong> to narrow results further.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-500 max-w-lg">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-base mb-1">📍</div>
                <strong>Location only</strong>
                <p className="mt-0.5">Browse all transcripts at a court, newest first.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-base mb-1">⚖️</div>
                <strong>+ Style of Cause</strong>
                <p className="mt-0.5">Fuzzy-matched — typos and partial names still surface results.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-base mb-1">📅</div>
                <strong>+ Date Range</strong>
                <p className="mt-0.5">Relative windows, a single date, or multiple specific dates.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
