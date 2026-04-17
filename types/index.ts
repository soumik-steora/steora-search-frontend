export interface SearchResult {
  id: string;
  ticketId: string | null;
  styleOfCause: string;
  dateOfTranscript: string;
  courtLocation: string | null;
  presidingOfficial: string | null;
  totalPages: number | null;
  verified: number;
  ts_score: number;
  trigram_score: number;
  final_score: number;
  context_snippet: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  count: number;
  total_count: number;
  meta: {
    page: number;
    limit?: number;
    latency_ms: number;
  };
}

export type DateRangeType =
  | ''
  | 'last30'
  | 'last60'
  | 'last90'
  | 'last180'
  | 'single'
  | 'multiple';

export interface AdvancedSearchResponse {
  courtLocation: string;
  styleOfCause: string;
  dateRangeType: DateRangeType;
  results: SearchResult[];
  count: number;
  total_count: number;
  meta: {
    page: number;
    limit: number;
    latency_ms: number;
  };
}