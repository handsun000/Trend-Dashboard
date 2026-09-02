import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Activity, BellPlus, Trash2, ShieldAlert, Newspaper, LayoutGrid, Wallet } from 'lucide-react';
import UserAlertModal from '@/components/UserAlertModal';
import PortfolioTrackerModal from '@/components/trading/PortfolioTrackerModal';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTradingDashboard } from '@/hooks/useTradingDashboard';
import TradingChart from '@/components/trading/TradingChart';
import OrderBookWidget from '@/components/trading/OrderBookWidget';
import MarketNewsPanel from '@/components/trading/MarketNewsPanel';
import MarketHeatmap from '@/components/trading/MarketHeatmap';

/**
 * [World-Class Single-Pane Trading Dashboard]
 * 1. Zero-Scroll Architecture: Strict 100vh constraint.
 * 2. TradingView Lightweight Charts: Candlestick, MA, BB, RSI, Volume indicators.
 * 3. Gemini 1.5 Flash AI News & Sentiment Intelligence: 3-Line briefing & sector tags.
 * 4. Finviz Sector Heatmap & Real-time Portfolio P&L Simulator.
 */
export default function Dashboard() {
  const {
    isModalOpen,
    setIsModalOpen,
    alerts,
    fetchAlerts,
    selectedStock,
    setSelectedStock,
    selectedCrypto,
    setSelectedCrypto,
    activeTab,
    setActiveTab,
    stockQuote,
    cryptoQuote,
    stockData,
    cryptoData,
    currentStockPrice,
    currentCryptoPrice,
    stockFlash,
    cryptoFlash,
    loadStockQuote,
    loadCryptoQuote,
  } = useTradingDashboard();

  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);

  const handleDeleteAlert = async (id: number) => {
    try {
      await axios.delete(`/api/v1/alerts/${id}`);
      toast.info('알림이 삭제되었습니다.');
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const getStep = (price: number) => {
    if (price >= 1000000) return 5000;
    if (price >= 100000) return 500;
    if (price >= 10000) return 100;
    if (price >= 100) return 10;
    return 1;
  };

  const stockStep = getStep(currentStockPrice);
  const cryptoStep = getStep(currentCryptoPrice);

  const handleSelectEntity = (entity: { ticker: string; name: string; market: string }) => {
    if (entity.market === 'CRYPTO' || entity.ticker.startsWith('KRW-')) {
      setSelectedCrypto({ ticker: entity.ticker, name: entity.name, market: 'CRYPTO' });
      loadCryptoQuote(entity.ticker, entity.name);
      setActiveTab('crypto');
    } else {
      setSelectedStock({ ticker: entity.ticker, name: entity.name, market: entity.market || 'KOSPI' });
      loadStockQuote(entity.ticker, entity.name);
      setActiveTab('stock');
    }
    toast.success(`[${entity.name}] 차트로 전환되었습니다.`);
  };

  return (
    <div className="h-full w-full flex flex-col p-3.5 md:p-4 gap-2.5 min-h-0 overflow-hidden text-slate-300 select-none font-sans">
      
      {/* 1. TOP SUMMARY RIBBON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        
        {/* Card 1: Stock Metric */}
        <div 
          onClick={() => setActiveTab('stock')}
          className={`bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-all duration-300 cursor-pointer ${activeTab === 'stock' ? 'border-emerald-500/40 bg-emerald-500/5' : ''} ${stockFlash === 'up' ? 'flash-up border-emerald-500/40' : stockFlash === 'down' ? 'flash-down border-rose-500/40' : ''}`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">주식 시세</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">{selectedStock.market}</span>
            </div>
            <h3 className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
              <span>{selectedStock.name}</span>
              <span className="text-[11px] font-mono text-slate-400 font-normal">({selectedStock.ticker})</span>
            </h3>
          </div>
          <div className="text-right">
            <p className="text-lg md:text-xl font-black text-white font-mono tabular-nums tracking-tight">₩{currentStockPrice.toLocaleString()}</p>
            <p className={`text-[11px] font-mono tabular-nums font-bold ${(stockQuote?.changeRate ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stockQuote?.formattedChange || '+0.00%'}
            </p>
          </div>
        </div>

        {/* Card 2: Crypto Metric */}
        <div 
          onClick={() => setActiveTab('crypto')}
          className={`bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-all duration-300 cursor-pointer ${activeTab === 'crypto' ? 'border-cyan-500/40 bg-cyan-500/5' : ''} ${cryptoFlash === 'up' ? 'flash-up border-cyan-500/40' : cryptoFlash === 'down' ? 'flash-down border-rose-500/40' : ''}`}>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">업비트 시세</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">LIVE</span>
            </div>
            <h3 className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
              <span>{selectedCrypto.name}</span>
              <span className="text-[11px] font-mono text-slate-400 font-normal">({selectedCrypto.ticker})</span>
            </h3>
          </div>
          <div className="text-right">
            <p className="text-lg md:text-xl font-black text-cyan-300 font-mono tabular-nums tracking-tight">₩{currentCryptoPrice.toLocaleString()}</p>
            <p className={`text-[11px] font-mono tabular-nums font-bold ${(cryptoQuote?.changeRate ?? 0) >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {cryptoQuote?.formattedChange || '0.00%'}
            </p>
          </div>
        </div>

        {/* Card 3: Portfolio P&L Quick Access */}
        <div 
          onClick={() => setIsPortfolioOpen(true)}
          className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-all cursor-pointer group"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">포트폴리오 P&L</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-slate-200">손익 시뮬레이터</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 font-mono">LIVE</span>
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
              <span className="text-xs font-bold text-slate-200">활성 {alerts.length}개</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold">실시간 🟢</span>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-xl text-xs shadow-sm active:scale-95 transition-all"
          >
            <BellPlus className="w-3.5 h-3.5" />
            <span>알림 추가</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT ACTIVE ALERTS CHIP ROW */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 shrink-0 select-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <ShieldAlert className="w-3 h-3 text-emerald-400" />
            <span>알림:</span>
          </span>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 text-xs shrink-0 transition-colors"
            >
              <span className="font-bold text-slate-200 uppercase">{alert.ticker}</span>
              <span className="font-mono tabular-nums text-emerald-300 font-bold">₩{alert.targetPrice.toLocaleString()}</span>
              <button
                onClick={() => handleDeleteAlert(alert.id)}
                className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
                title="삭제"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3. MAIN WORKSPACE TABS & SINGLE-PANE BENTO GRID */}
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => setActiveTab(val as 'stock' | 'crypto' | 'news' | 'heatmap')} 
        className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden"
      >
        {/* Tab Navigation Strip */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <TabsList>
            <TabsTrigger value="stock" className="gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>주식 ({selectedStock.name})</span>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>가상자산 ({selectedCrypto.name})</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-1.5">
              <Newspaper className="w-3.5 h-3.5 text-emerald-400" />
              <span>실시간 뉴스 & AI ({selectedStock.name})</span>
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span>섹터 히트맵 (Heatmap)</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
            <button
              onClick={() => setIsPortfolioOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-emerald-400 font-bold transition-all"
            >
              <Wallet className="w-3 h-3" />
              <span>내 포트폴리오</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>STOMP 3s Stream</span>
            </div>
          </div>
        </div>
        
        {/* TAB 1: STOCK VIEW */}
        <TabsContent value="stock" className="flex-1 min-h-0 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 flex-1 min-h-0 h-full overflow-hidden">
            <TradingChart
              data={stockData}
              name={selectedStock.name}
              ticker={selectedStock.ticker}
              market={selectedStock.market}
              currentPrice={currentStockPrice}
              quote={stockQuote}
              themeColor="emerald"
            />
            <OrderBookWidget
              currentPrice={currentStockPrice}
              step={stockStep}
              ticker={selectedStock.ticker}
              themeColor="emerald"
            />
          </div>
        </TabsContent>

        {/* TAB 2: CRYPTO VIEW */}
        <TabsContent value="crypto" className="flex-1 min-h-0 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 flex-1 min-h-0 h-full overflow-hidden">
            <TradingChart
              data={cryptoData}
              name={selectedCrypto.name}
              ticker={selectedCrypto.ticker}
              market="UPBIT"
              currentPrice={currentCryptoPrice}
              quote={cryptoQuote}
              themeColor="cyan"
              isCrypto={true}
            />
            <OrderBookWidget
              currentPrice={currentCryptoPrice}
              step={cryptoStep}
              ticker={selectedCrypto.ticker}
              themeColor="cyan"
            />
          </div>
        </TabsContent>

        {/* TAB 3: LIVE MARKET NEWS & GEMINI AI TAB */}
        <TabsContent value="news" className="flex-1 min-h-0 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <MarketNewsPanel
            ticker={selectedStock.ticker}
            name={selectedStock.name}
          />
        </TabsContent>

        {/* TAB 4: FINVIZ SECTOR HEATMAP */}
        <TabsContent value="heatmap" className="flex-1 min-h-0 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <MarketHeatmap onSelectEntity={handleSelectEntity} />
        </TabsContent>

      </Tabs>

      {/* Target Price Alert Registration Modal */}
      <UserAlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTicker={selectedStock.ticker}
        onAlertCreated={fetchAlerts}
      />

      {/* Portfolio Tracker & Real-time P&L Modal */}
      <PortfolioTrackerModal
        isOpen={isPortfolioOpen}
        onClose={() => setIsPortfolioOpen(false)}
        onSelectEntity={handleSelectEntity}
      />
    </div>
  );
}
