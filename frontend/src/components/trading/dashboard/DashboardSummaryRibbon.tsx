import React from 'react';
import { TrendingUp, Activity, BellPlus, Wallet } from 'lucide-react';

interface MarketQuoteLike {
  changeRate?: number;
  formattedChange?: string;
}

interface DashboardSummaryRibbonProps {
  selectedStock: { ticker: string; name: string; market: string };
  selectedCrypto: { ticker: string; name: string; market: string };
  currentStockPrice: number;
  currentCryptoPrice: number;
  stockQuote: MarketQuoteLike | null;
  cryptoQuote: MarketQuoteLike | null;
  stockFlash: 'up' | 'down' | null;
  cryptoFlash: 'up' | 'down' | null;
  activeTab: 'stock' | 'crypto' | 'news' | 'heatmap';
  setActiveTab: (tab: 'stock' | 'crypto' | 'news' | 'heatmap') => void;
  alertsCount: number;
  onOpenAlertModal: () => void;
  onOpenPortfolioModal: () => void;
}

export const DashboardSummaryRibbon: React.FC<DashboardSummaryRibbonProps> = ({
  selectedStock,
  selectedCrypto,
  currentStockPrice,
  currentCryptoPrice,
  stockQuote,
  cryptoQuote,
  stockFlash,
  cryptoFlash,
  activeTab,
  setActiveTab,
  alertsCount,
  onOpenAlertModal,
  onOpenPortfolioModal,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
      {/* Card 1: Stock Metric */}
      <div
        onClick={() => setActiveTab('stock')}
        className={`bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-all duration-300 cursor-pointer ${
          activeTab === 'stock' ? 'border-emerald-500/40 bg-emerald-500/5' : ''
        } ${
          stockFlash === 'up'
            ? 'flash-up border-emerald-500/40'
            : stockFlash === 'down'
            ? 'flash-down border-rose-500/40'
            : ''
        }`}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">주식 시세</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              {selectedStock.market}
            </span>
          </div>
          <h3 className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
            <span>{selectedStock.name}</span>
            <span className="text-[11px] font-mono text-slate-400 font-normal">({selectedStock.ticker})</span>
          </h3>
        </div>
        <div className="text-right">
          <p className="text-lg md:text-xl font-black text-white font-mono tabular-nums tracking-tight">
            ₩{currentStockPrice.toLocaleString()}
          </p>
          <p
            className={`text-[11px] font-mono tabular-nums font-bold ${
              (stockQuote?.changeRate ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stockQuote?.formattedChange || '+0.00%'}
          </p>
        </div>
      </div>

      {/* Card 2: Crypto Metric */}
      <div
        onClick={() => setActiveTab('crypto')}
        className={`bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-all duration-300 cursor-pointer ${
          activeTab === 'crypto' ? 'border-cyan-500/40 bg-cyan-500/5' : ''
        } ${
          cryptoFlash === 'up'
            ? 'flash-up border-cyan-500/40'
            : cryptoFlash === 'down'
            ? 'flash-down border-rose-500/40'
            : ''
        }`}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">업비트 시세</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
              LIVE
            </span>
          </div>
          <h3 className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
            <span>{selectedCrypto.name}</span>
            <span className="text-[11px] font-mono text-slate-400 font-normal">({selectedCrypto.ticker})</span>
          </h3>
        </div>
        <div className="text-right">
          <p className="text-lg md:text-xl font-black text-cyan-300 font-mono tabular-nums tracking-tight">
            ₩{currentCryptoPrice.toLocaleString()}
          </p>
          <p
            className={`text-[11px] font-mono tabular-nums font-bold ${
              (cryptoQuote?.changeRate ?? 0) >= 0 ? 'text-cyan-400' : 'text-rose-400'
            }`}
          >
            {cryptoQuote?.formattedChange || '0.00%'}
          </p>
        </div>
      </div>

      {/* Card 3: Portfolio P&L Quick Access */}
      <div
        onClick={onOpenPortfolioModal}
        className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-all cursor-pointer group"
      >
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">포트폴리오 P&L</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-bold text-slate-200">손익 시뮬레이터</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 font-mono">
              LIVE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
          <Wallet className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">열기</span>
        </div>
      </div>

      {/* Card 4: Alert Rules & Status */}
      <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">목표가 알림 엔진</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold text-slate-200">활성 {alertsCount}개</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold">
              실시간 🟢
            </span>
          </div>
        </div>
        <button
          onClick={onOpenAlertModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-xl text-xs shadow-sm active:scale-95 transition-all"
        >
          <BellPlus className="w-3.5 h-3.5" />
          <span>알림 추가</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardSummaryRibbon;
