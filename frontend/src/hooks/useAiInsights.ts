import { useQuery } from 'react-query';
import { getInsights } from '../lib/aiApi';
import type { InsightCard } from '../types/ai';

/**
 * React Query hook for fetching AI-generated dashboard insight cards.
 * Uses stale-while-revalidate: serves cached data immediately while
 * refetching in the background. Insights refresh every 4 hours on the
 * backend, so a 5-minute stale time keeps the UI responsive without
 * unnecessary requests.
 */
export function useAiInsights() {
  return useQuery<InsightCard[]>(
    'ai-insights',
    () => getInsights().then((res) => res.data),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  );
}
