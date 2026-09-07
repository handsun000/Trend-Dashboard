import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Activity, Newspaper, LayoutGrid, Wallet } from 'lucide-react';
import UserAlertModal from '@/components/UserAlertModal';
import PortfolioTrackerModal from '@/components/trading/PortfolioTrackerModal';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTradingDashboard } from '@/hooks/useTradingDashboard';
import TradingChart from '@/components/trading/TradingChart';
import OrderBookWidget from '@/components/trading/OrderBookWidget';
import MarketNewsPanel from '@/components/trading/MarketNewsPanel';
import MarketHeatmap from '@/components/trading/MarketHeatmap';
import DashboardSummaryRibbon from '@/components/trading/dashboard/DashboardSummaryRibbon';
import ActiveAlertsBar from '@/components/trading/dashboard/ActiveAlertsBar';
import { ErrorBoundary } from '@/components/common';

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
      <DashboardSummaryRibbon
        selectedStock={selectedStock}
        selectedCrypto={selectedCrypto}
        currentStockPrice={currentStockPrice}
        currentCryptoPrice={currentCryptoPrice}
        stockQuote={stockQuote}
        cryptoQuote={cryptoQuote}
        stockFlash={stockFlash}
        cryptoFlash={cryptoFlash}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertsCount={alerts.length}
        onOpenAlertModal={() => setIsModalOpen(true)}
        onOpenPortfolioModal={() => setIsPortfolioOpen(true)}
      />

      {/* 2. COMPACT ACTIVE ALERTS CHIP ROW */}
      <ActiveAlertsBar alerts={alerts} onDeleteAlert={handleDeleteAlert} />

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
              <span>STOMP 1s Stream</span>
            </div>
          </div>
        </div>
        
        {/* TAB 1: STOCK VIEW */}
        <TabsContent value="stock" className="flex-1 min-h-0 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <ErrorBoundary resetKey={selectedStock.ticker}>
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
          </ErrorBoundary>
        </TabsContent>

        {/* TAB 2: CRYPTO VIEW */}
        <TabsContent value="crypto" className="flex-1 min-h-0 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <ErrorBoundary resetKey={selectedCrypto.ticker}>
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
          </ErrorBoundary>
        </TabsContent>

        {/* TAB 3: LIVE MARKET NEWS & GEMINI AI TAB */}
        <TabsContent value="news" className="flex-1 min-h-0 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <ErrorBoundary resetKey={selectedStock.ticker}>
            <MarketNewsPanel
              ticker={selectedStock.ticker}
              name={selectedStock.name}
            />
          </ErrorBoundary>
        </TabsContent>

        {/* TAB 4: FINVIZ SECTOR HEATMAP */}
        <TabsContent value="heatmap" className="flex-1 min-h-0 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <ErrorBoundary>
            <MarketHeatmap onSelectEntity={handleSelectEntity} />
          </ErrorBoundary>
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
