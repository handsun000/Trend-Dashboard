import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface NewsItem {
  id: string;
  ticker: string;
  targetName: string;
  title: string;
  source: string;
  publishedAt: string;
  sentiment: string;
  sentimentScore: number;
  sentimentLabel: string;
  summary: string;
  impactTags: string[];
  url: string;
}

export interface NewsResponse {
  ticker: string;
  targetName: string;
  overallSentimentScore: number;
  overallSentimentLabel: string;
  aiInsight: string;
  threeLineBriefing?: string[];
  sectorImpactTags?: string[];
  aiModel?: string;
  cached?: boolean;
  newsList: NewsItem[];
}

export function useMarketNews(ticker: string, name?: string) {
  const {
    data: newsData = null,
    isLoading: newsLoading,
    error: newsError,
    refetch,
  } = useQuery<NewsResponse>({
    queryKey: ['market-news', ticker, name],
    queryFn: async () => {
      const res = await axios.get<NewsResponse>(
        `/api/v1/news?ticker=${ticker}${name ? `&name=${encodeURIComponent(name)}` : ''}`
      );
      return res.data;
    },
    enabled: Boolean(ticker),
    staleTime: 1000 * 60 * 5, // 5분 캐싱: 탭 이동 후 복귀 시 0ms 즉시 렌더링
  });

  return {
    newsData,
    newsLoading,
    newsError,
    refetchNews: () => refetch(),
  };
}
