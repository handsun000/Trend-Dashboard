import React from 'react';
import LightweightTradingChart from './LightweightTradingChart';
import type { ChartTick, MarketQuote } from '@/hooks/useTradingDashboard';

interface TradingChartProps {
  data: ChartTick[];
  name: string;
  ticker: string;
  market: string;
  currentPrice: number;
  quote: MarketQuote | null;
  themeColor?: 'emerald' | 'cyan';
  isCrypto?: boolean;
}

export default function TradingChart({
  data,
  name,
  ticker,
  market,
  currentPrice,
  quote,
  themeColor = 'emerald',
  isCrypto = false,
}: TradingChartProps) {
  return (
    <LightweightTradingChart
      name={name}
      ticker={ticker}
      market={market}
      currentPrice={currentPrice}
      quote={quote}
      liveTicks={data}
      themeColor={themeColor}
      isCrypto={isCrypto}
    />
  );
}
