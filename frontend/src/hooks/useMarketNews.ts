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
  newsList: NewsItem[];
}

export function useMarketNews(ticker: string, name?: string) {
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  const fetchNews = async (targetTicker: string, targetName?: string) => {
    if (!targetTicker) return;
    setNewsLoading(true);
    try {
      const res = await axios.get<NewsResponse>(
        `/api/v1/news?ticker=${targetTicker}${targetName ? `&name=${encodeURIComponent(targetName)}` : ''}`
      );
      setNewsData(res.data);
    } catch (e) {
      console.error('Failed to fetch market news & AI insight:', e);
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
    refetchNews: () => fetchNews(ticker, name),
  };
}
