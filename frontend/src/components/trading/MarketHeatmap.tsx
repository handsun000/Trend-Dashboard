import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutGrid, RefreshCw, TrendingUp, Sparkles, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

export interface HeatmapItem {
  ticker: string;
  name: string;
  sector: string;
  market: string;
  price: number;
  changeRate: number;
  marketCap: number;
  tradeVolume: number;
}

export interface SectorGroup {
  sectorName: string;
  averageChangeRate: number;
  items: HeatmapItem[];
}

export interface HeatmapResponse {
  marketType: string;
  sectors: SectorGroup[];
  updatedAt: number;
}

interface MarketHeatmapProps {
  onSelectEntity: (entity: { ticker: string; name: string; market: string }) => void;
}

export default function MarketHeatmap({ onSelectEntity }: MarketHeatmapProps) {
  const [marketType, setMarketType] = useState<'STOCKS' | 'CRYPTO'>('STOCKS');
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHeatmap = async (type: 'STOCKS' | 'CRYPTO') => {
    setLoading(true);
    try {
      const res = await axios.get<HeatmapResponse>(`/api/v1/market/heatmap?type=${type}`);
      setData(res.data);
    } catch (e) {
      console.error('Failed to fetch market heatmap data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmap(marketType);
  }, [marketType]);

  const getColorClass = (changeRate: number) => {
    if (changeRate >= 3.0) return 'bg-emerald-600/75 border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/85';
    if (changeRate >= 1.0) return 'bg-emerald-700/45 border-emerald-500/30 text-emerald-200 hover:bg-emerald-600/60';
    if (changeRate > 0) return 'bg-emerald-900/35 border-emerald-600/25 text-emerald-300 hover:bg-emerald-800/50';
    if (changeRate === 0) return 'bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-700/50';
    if (changeRate > -1.0) return 'bg-rose-950/35 border-rose-600/25 text-rose-300 hover:bg-rose-900/50';
    if (changeRate > -3.0) return 'bg-rose-800/45 border-rose-500/30 text-rose-200 hover:bg-rose-700/60';
    return 'bg-rose-600/75 border-rose-400/40 text-rose-100 hover:bg-rose-500/85';
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden select-none font-sans">
      
      {/* 1. Top Controls Bar */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>Finviz 스타일 시가총액 & 섹터 히트맵</span>
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 font-bold">
                PRO SECTOR HEATMAP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              시가총액 규모 및 일간 등락률 실시간 시각화 (타일 클릭 시 해당 종목으로 즉시 전환)
            </p>
          </div>
        </div>

        {/* Market Type Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setMarketType('STOCKS')}
              className={`px-3 py-1 text-xs font-bold font-mono rounded-lg transition-all ${
                marketType === 'STOCKS'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              국내 주식 섹터
            </button>
            <button
              onClick={() => setMarketType('CRYPTO')}
              className={`px-3 py-1 text-xs font-bold font-mono rounded-lg transition-all ${
                marketType === 'CRYPTO'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              가상자산 (UPBIT)
            </button>
          </div>

          <button
            onClick={() => fetchHeatmap(marketType)}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 transition-colors"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Sector Tree Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {loading && !data ? (
          <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <p className="text-xs font-bold text-slate-300">실시간 섹터별 시가총액 & 등락률 트리맵 로딩 중...</p>
          </div>
        ) : (
          data?.sectors?.map((sec, sIdx) => {
            const isSecPositive = sec.averageChangeRate >= 0;
            return (
              <div 
                key={sIdx}
                className="bg-white/[0.015] border border-white/5 rounded-2xl p-3 flex flex-col gap-2 backdrop-blur-md"
              >
                {/* Sector Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-3.5 rounded-full bg-cyan-400" />
                    <h4 className="text-xs font-black text-slate-200">{sec.sectorName}</h4>
                  </div>
                  <span className={`text-[11px] font-mono font-black ${isSecPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isSecPositive ? `+${sec.averageChangeRate}%` : `${sec.averageChangeRate}%`}
                  </span>
                </div>

                {/* Sector Item Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {sec.items.map((item) => {
                    const isPos = item.changeRate >= 0;
                    return (
                      <button
                        key={item.ticker}
                        onClick={() => onSelectEntity({ ticker: item.ticker, name: item.name, market: item.market })}
                        className={`p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between text-left group shadow-sm cursor-pointer ${getColorClass(item.changeRate)}`}
                      >
                        <div className="flex items-start justify-between gap-1 w-full">
                          <div>
                            <p className="text-xs font-black group-hover:scale-105 transition-transform origin-left">{item.name}</p>
                            <p className="text-[10px] font-mono opacity-70">{item.ticker}</p>
                          </div>
                          {isPos ? (
                            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-80" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 shrink-0 opacity-80" />
                          )}
                        </div>

                        <div className="mt-2.5 pt-1.5 border-t border-white/10 flex items-end justify-between font-mono tabular-nums">
                          <span className="text-[11px] font-bold">₩{item.price?.toLocaleString()}</span>
                          <span className="text-xs font-black tracking-tight">
                            {isPos ? `+${item.changeRate}%` : `${item.changeRate}%`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
