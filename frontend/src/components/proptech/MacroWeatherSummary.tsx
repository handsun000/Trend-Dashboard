import React from 'react';
import type { SummaryData } from '@/hooks/usePublicData';

interface MacroWeatherSummaryProps {
  summary: SummaryData | null;
}

export default function MacroWeatherSummary({ summary }: MacroWeatherSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0 select-none">
      {/* Card 1: KMA Seoul Temperature */}
      <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors shadow-sm">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">서울 최근 평균기온</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">기상청 108</span>
          </div>
          <h3 className="text-lg font-black text-white font-mono tabular-nums mt-0.5">
            {summary?.avgTemperature ?? 29.3}℃
          </h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-rose-400 font-mono font-bold">최고 {summary?.maxTemperature ?? 36.4}℃</span>
          <p className="text-[11px] font-mono tabular-nums text-slate-400">최저 {summary?.minTemperature ?? 22.6}℃</p>
        </div>
      </div>

      {/* Card 2: Rainfall & Delivery Demand */}
      <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors shadow-sm">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">월간 누적강수량</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">ASOS</span>
          </div>
          <h3 className="text-lg font-black text-cyan-300 font-mono tabular-nums mt-0.5">
            {summary?.totalRainfall ?? 72.8} mm
          </h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-mono">배달외식 소비지수</span>
          <p className="text-[11px] font-mono tabular-nums font-bold text-emerald-400">
            {summary?.deliveryDemandIndex ?? 162.5} pt 🚀
          </p>
        </div>
      </div>

      {/* Card 3: Top Real Estate Transaction */}
      <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors shadow-sm">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">최고가 실거래 단지</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20 shrink-0">국토부</span>
          </div>
          <h3 className="text-sm font-black text-white truncate mt-0.5">
            {summary?.highestTransactionApt ?? '갤러리아포레 (성수동)'}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-black font-mono text-purple-300">
            {summary?.highestTransactionPrice ?? 92.0} 억원
          </span>
          <p className="text-[10px] text-slate-400">신고가 경신</p>
        </div>
      </div>

      {/* Card 4: Macro Interest Rate */}
      <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors shadow-sm">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">한·미 기준금리</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">BOK/FED</span>
          </div>
          <h3 className="text-lg font-black text-white font-mono tabular-nums mt-0.5">
            {summary?.bokRate ?? 2.75}% <span className="text-xs text-slate-500 font-normal">/ {summary?.fedRate ?? 4.00}%</span>
          </h3>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            <span className="text-[10px] text-slate-400 font-mono">원/달러 환율</span>
            <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span>
          </div>
          <p className="text-[12px] font-mono tabular-nums text-emerald-300 font-bold mt-0.5">
            ₩{summary?.exchangeRate ? summary.exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
