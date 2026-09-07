import React from 'react';
import { Sparkles, ExternalLink, RefreshCw, Newspaper, Zap } from 'lucide-react';
import { useMarketNews } from '@/hooks/useMarketNews';
import { LoadingState, EmptyState, ErrorState } from '@/components/common';

interface MarketNewsPanelProps {
  ticker: string;
  name: string;
}

export default function MarketNewsPanel({ ticker, name }: MarketNewsPanelProps) {
  const { newsData, newsLoading, newsError, refetchNews } = useMarketNews(ticker, name);

  if (newsLoading && !newsData) {
    return (
      <div className="w-full flex-1 min-h-0 flex flex-col gap-3">
        <LoadingState
          variant="skeleton-cards"
          title={`[${name}] Gemini 1.5 Flash AI 심층 분석 중...`}
          description="실시간 금융 뉴스 수집 및 AI 감성/호재 지수 산출"
          count={3}
          className="flex-1 min-h-0 overflow-hidden"
        />
      </div>
    );
  }

  if (newsError && !newsData) {
    return (
      <div className="w-full flex-1 min-h-0 flex flex-col justify-center">
        <ErrorState
          title={`[${name}] AI 뉴스 인텔리전스 조회 실패`}
          message="뉴스 수집 API 또는 Gemini AI 응답 과정에서 오류가 발생했습니다."
          details={newsError}
          onRetry={refetchNews}
        />
      </div>
    );
  }

  const score = newsData?.overallSentimentScore ?? 50;
  const isPositive = score >= 60;
  const isNegative = score <= 40;

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-3 overflow-hidden select-none font-sans">
      {/* 1. Gemini AI 3-Line Briefing & Sentiment Master Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-[#0B132B] to-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-3 shrink-0 shadow-xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient decoration */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top bar: AI Title & Sentiment Score Gauge */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>{name}</span>
                  <span className="text-xs text-slate-400 font-mono font-normal">({ticker})</span>
                  <span>AI 심층 브리핑</span>
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 font-bold">
                  {newsData?.aiModel || 'Gemini 1.5 Flash'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                실시간 뉴스 기사 및 공시 기반 종합 진단
              </p>
            </div>
          </div>

          {/* Sentiment Meter Bar */}
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-xl self-end sm:self-center">
            <div className="text-right font-mono">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">AI 호재 지수</span>
              <span
                className={`text-base font-black ${
                  isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-300'
                }`}
              >
                {score}%
              </span>
            </div>
            <div className="w-20 h-2 bg-slate-800/80 rounded-full overflow-hidden flex">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isPositive ? 'bg-emerald-400' : isNegative ? 'bg-rose-400' : 'bg-slate-400'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
            <button
              onClick={refetchNews}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title="새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${newsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. AI 3-Line Key Highlights Card */}
        {newsData?.threeLineBriefing && newsData.threeLineBriefing.length > 0 && (
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-1.5">
            <div className="text-[10px] font-bold text-emerald-400/90 flex items-center gap-1 uppercase tracking-wider mb-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>3-Line Core Intelligence</span>
            </div>
            {newsData.threeLineBriefing.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 leading-relaxed">
                <span className="text-emerald-400 font-mono font-bold shrink-0 mt-0.5">0{idx + 1}.</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        )}

        {/* 3. Sector & Theme Impact Chips */}
        {newsData?.sectorImpactTags && newsData.sectorImpactTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-500 mr-1">연관 섹터 / 테마:</span>
            {newsData.sectorImpactTags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300/90 border border-emerald-500/20"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4. Real-time News Feed Stream */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {!newsData?.newsList || newsData.newsList.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="최근 24시간 내 수집된 관련 뉴스가 없습니다."
            description="현재 종목의 주요 이슈나 공시 기사가 업데이트되면 자동으로 분석되어 표시됩니다."
            actionLabel="뉴스 다시 불러오기"
            onAction={refetchNews}
          />
        ) : (
          newsData.newsList.map((item) => (
            <div
              key={item.id}
              className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl p-3.5 transition-all flex flex-col gap-2 group"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      item.sentiment === 'POSITIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : item.sentiment === 'NEGATIVE'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
                    }`}
                  >
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

              <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
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
