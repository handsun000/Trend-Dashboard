import { useState, useEffect } from 'react';
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
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<any | null>(null);

  const fetchNews = async (targetTicker: string, targetName?: string) => {
    if (!targetTicker) return;
    setNewsLoading(true);
    setNewsError(null);
    try {
      const res = await axios.get<NewsResponse>(
        `/api/v1/news?ticker=${targetTicker}${targetName ? `&name=${encodeURIComponent(targetName)}` : ''}`
      );
      setNewsData(res.data);
    } catch (e) {
      console.error('Failed to fetch market news & AI insight:', e);
      setNewsError(e);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    if (ticker) {
      fetchNews(ticker, name);
    }
  }, [ticker, name]);

  return {
    newsData,
    newsLoading,
    newsError,
    refetchNews: () => fetchNews(ticker, name),
  };
}
