import { SearchResult } from '@/types';

export default function ResultsList({
  results,
  query,
}: {
  results: SearchResult[];
  query?: string;
}) {
  if (results.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
        <div className="text-4xl mb-3">🕵️</div>
        <p className="text-gray-700 text-lg font-semibold mb-1">No results found</p>
        {query && (
          <p className="text-gray-500 text-sm">
            No transcripts matched &ldquo;{query}&rdquo;. Try different keywords or check your spelling.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {results.map((item) => (
        <div key={item.id} className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-blue-900">{item.styleOfCause}</h3>
            {item.verified === 1 && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide">
                Verified
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-4 font-medium">
            {item.courtLocation && <span>📍 {item.courtLocation}</span>}
            <span>📅 {new Date(item.dateOfTranscript).toLocaleDateString()}</span>
            {item.presidingOfficial && <span>⚖️ {item.presidingOfficial}</span>}
            {item.ticketId && <span>🎫 {item.ticketId}</span>}
          </div>

          {item.context_snippet && item.context_snippet !== '' && (
             <div className="bg-gray-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                <p 
                  className="text-sm text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: `"...${item.context_snippet}..."` }} 
                />
             </div>
          )}
        </div>
      ))}
    </div>
  );
}