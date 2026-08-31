import React from 'react';
import { Sparkles, ExternalLink, RefreshCw, AlertCircle, Newspaper, ThumbsUp } from 'lucide-react';
import { useMarketNews } from '@/hooks/useMarketNews';

interface MarketNewsPanelProps {
  ticker: string;
  name: string;
}

export default function MarketNewsPanel({ ticker, name }: MarketNewsPanelProps) {
  const { newsData, newsLoading, refetchNews } = useMarketNews(ticker, name);

  if (newsLoading && !newsData) {
    return (
      <div className="w-full flex-1 min-h-0 bg-white/[0.02] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
        <p className="text-xs font-bold text-slate-300">[{name}] 관련 실시간 뉴스 & AI 감성 분석 수집 중...</p>
      </div>
    );
  }

  const score = newsData?.overallSentimentScore ?? 80;

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* 1. AI Sentiment Banner Header */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 border border-emerald-500/20 rounded-2xl p-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0 shadow-lg backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>{name}</span>
                <span className="text-xs text-slate-400 font-mono">({ticker})</span>
                <span>AI 감성 & 모멘텀 진단</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-black">
                {newsData?.overallSentimentLabel || '호재 우세 🟢'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
              {newsData?.aiInsight || `${name} 관련 최신 언론 보도 및 공시 분석 결과 매수 우세 국면입니다.`}
            </p>
          </div>
        </div>

        {/* Right Sentiment Meter Bar */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center bg-white/[0.03] border border-white/5 px-3 py-2 rounded-xl">
          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AI 호재 지수</span>
            <span className="text-base font-black text-emerald-400">{score}%</span>
          </div>
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
          </div>
          <button 
            onClick={refetchNews} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${newsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. News Article Feed Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
        {(!newsData?.newsList || newsData.newsList.length === 0) ? (
          <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-slate-400">
            <Newspaper className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">최근 24시간 내 수집된 관련 뉴스가 없습니다.</p>
          </div>
        ) : (
          newsData.newsList.map((item) => (
            <div 
              key={item.id}
              className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl p-3.5 transition-all flex flex-col gap-2 group"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    item.sentiment === 'POSITIVE' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : item.sentiment === 'NEGATIVE' 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                      : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
                  }`}>
                    {item.sentimentLabel}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{item.source}</span>
                  <span className="text-[11px] text-slate-500 font-mono">• {item.publishedAt}</span>
                </div>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-slate-500 hover:text-emerald-400 transition-colors p-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                {item.title}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                {item.summary}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.impactTags?.map((tag, tIdx) => (
                  <span 
                    key={tIdx} 
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-slate-400 border border-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
