import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface OrderBookUnit {
  ask_price: number;
  bid_price: number;
  ask_size: number;
  bid_size: number;
}

interface OrderBookData {
  market: string;
  total_ask_size: number;
  total_bid_size: number;
  orderbook_units: OrderBookUnit[];
}

interface OrderBookWidgetProps {
  currentPrice: number;
  step: number;
  ticker?: string;
  themeColor?: 'emerald' | 'cyan';
}

export default function OrderBookWidget({ currentPrice, step, ticker, themeColor = 'emerald' }: OrderBookWidgetProps) {
  const isCyan = themeColor === 'cyan';
  const bidBg = isCyan ? 'bg-cyan-500/10' : 'bg-emerald-500/10';
  const bidText = isCyan ? 'text-cyan-400' : 'text-emerald-400';

  const [liveOrderbook, setLiveOrderbook] = useState<OrderBookData | null>(null);

  useEffect(() => {
    if (!ticker) return;

    const fetchLiveBook = async () => {
      try {
        const res = await axios.get<OrderBookData>(`/api/v1/market/orderbook?ticker=${ticker}`);
        if (res.data && res.data.orderbook_units && res.data.orderbook_units.length > 0) {
          setLiveOrderbook(res.data);
        } else {
          setLiveOrderbook(null);
        }
      } catch (err) {
        setLiveOrderbook(null);
      }
    };

    fetchLiveBook();
    const interval = setInterval(fetchLiveBook, 3000);
    return () => clearInterval(interval);
  }, [ticker]);

  // If live orderbook exists from exchange, render real live units
  const hasLive = liveOrderbook && liveOrderbook.orderbook_units && liveOrderbook.orderbook_units.length > 0;

  let askLevels: { price: number; volume: number; pct: number }[] = [];
  let bidLevels: { price: number; volume: number; pct: number }[] = [];
  let totalAskRatio = 50;
  let totalBidRatio = 50;

  if (hasLive) {
    const units = liveOrderbook.orderbook_units.slice(0, 5);
    const maxAskVol = Math.max(...units.map(u => u.ask_size || 0.001), 0.001);
    const maxBidVol = Math.max(...units.map(u => u.bid_size || 0.001), 0.001);

    // Asks displayed top to bottom (5 down to 1)
    askLevels = [...units].reverse().map(u => ({
      price: u.ask_price,
      volume: Math.round(u.ask_size * 1000) / 1000,
      pct: Math.min(100, Math.round((u.ask_size / maxAskVol) * 80 + 10)),
    }));

    bidLevels = units.map(u => ({
      price: u.bid_price,
      volume: Math.round(u.bid_size * 1000) / 1000,
      pct: Math.min(100, Math.round((u.bid_size / maxBidVol) * 80 + 10)),
    }));

    const totalAsks = liveOrderbook.total_ask_size || 1;
    const totalBids = liveOrderbook.total_bid_size || 1;
    const sum = totalAsks + totalBids;
    totalAskRatio = Math.round((totalAsks / sum) * 100);
    totalBidRatio = 100 - totalAskRatio;
  } else {
    // Deterministic KRX tick calculation without Math.random()
    askLevels = [5, 4, 3, 2, 1].map((lvl) => ({
      price: currentPrice + lvl * step,
      volume: Math.round((currentPrice * 0.02) / lvl),
      pct: Math.min(85, 20 + lvl * 12),
    }));

    bidLevels = [1, 2, 3, 4, 5].map((lvl) => ({
      price: currentPrice - lvl * step,
      volume: Math.round((currentPrice * 0.025) / lvl),
      pct: Math.min(85, 20 + (6 - lvl) * 12),
    }));
  }

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full justify-between overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-white">호가창 (Orderbook)</span>
          {hasLive && (
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
              실시간 LIVE
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-slate-400">10단계 호가잔량</span>
      </div>

      {/* 10-Level Order Book List */}
      <div className="flex-1 min-h-0 flex flex-col justify-between py-1 font-mono tabular-nums text-[11px]">
        {/* 5 Ask Levels (매도호가) */}
        {askLevels.map((lvl, idx) => (
          <div key={`ask-${idx}`} className="relative flex justify-between items-center px-2 py-0.5 rounded overflow-hidden">
            <div 
              className="absolute inset-y-0 right-0 bg-rose-500/15 transition-all duration-300" 
              style={{ width: `${lvl.pct}%` }}
            />
            <span className="text-rose-400 font-bold z-10">₩{lvl.price.toLocaleString()}</span>
            <span className="text-slate-400 text-[10px] z-10">{lvl.volume.toLocaleString()}</span>
          </div>
        ))}

        {/* Current Center Price */}
        <div className="my-0.5 py-1 px-2.5 rounded-lg bg-white/[0.04] border border-white/10 flex justify-between items-center shadow-inner">
          <span className="text-xs font-black text-white">체결가</span>
          <span className={`text-xs font-black ${bidText}`}>₩{currentPrice.toLocaleString()}</span>
        </div>

        {/* 5 Bid Levels (매수호가) */}
        {bidLevels.map((lvl, idx) => (
          <div key={`bid-${idx}`} className="relative flex justify-between items-center px-2 py-0.5 rounded overflow-hidden">
            <div 
              className={`absolute inset-y-0 right-0 ${bidBg} transition-all duration-300`} 
              style={{ width: `${lvl.pct}%` }}
            />
            <span className={`${bidText} font-bold z-10`}>₩{lvl.price.toLocaleString()}</span>
            <span className="text-slate-400 text-[10px] z-10">{lvl.volume.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Bottom Buy/Sell Strength Depth Gauge */}
      <div className="pt-2 border-t border-white/5 shrink-0 flex flex-col gap-1 text-[10px] text-slate-400">
        <div className="flex justify-between">
          <span className="text-rose-400 font-bold">매도잔량 {totalAskRatio}%</span>
          <span className={`${bidText} font-bold`}>매수잔량 {totalBidRatio}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${totalAskRatio}%` }} />
          <div className={`${isCyan ? 'bg-cyan-400' : 'bg-emerald-400'} h-full transition-all duration-300`} style={{ width: `${totalBidRatio}%` }} />
        </div>
      </div>
    </div>
  );
}
