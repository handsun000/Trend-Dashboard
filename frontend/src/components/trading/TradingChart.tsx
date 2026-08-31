import React from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
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
  const isCyan = themeColor === 'cyan';
  const strokeColor = isCyan ? '#06b6d4' : '#10b981';
  const gradientId = isCyan ? 'cyanGradient' : 'emeraldGradient';
  const dotColor = isCyan ? '#22d3ee' : '#34d399';

  const prevPrice = quote?.prevClose ?? (currentPrice * 0.99);
  const highPrice = quote?.high ?? (currentPrice * 1.02);
  const lowPrice = quote?.low ?? (currentPrice * 0.98);
  const volume = quote?.volume ?? 125000;

  return (
    <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full overflow-hidden shadow-sm">
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black text-white flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isCyan ? 'bg-cyan-400' : 'bg-emerald-400'} animate-pulse`}></span>
            {name} ({ticker})
          </h3>
          <span className="text-[10px] px-2 py-0.2 rounded bg-white/5 text-slate-300 font-bold border border-white/5">
            {market}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-400 bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-lg">
          <span>전일 <b className="text-slate-200">₩{prevPrice.toLocaleString()}</b></span>
          <span>고가 <b className="text-rose-400">₩{highPrice.toLocaleString()}</b></span>
          <span>저가 <b className="text-cyan-400">₩{lowPrice.toLocaleString()}</b></span>
          <span>거래량 <b className="text-slate-200">{volume.toLocaleString()}</b></span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 min-h-0 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis 
              domain={isCrypto ? ['auto', 'auto'] : ['dataMin - 100', 'dataMax + 100']} 
              width={isCrypto ? 90 : 80} 
              stroke="#475569" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `₩${Number(val).toLocaleString()}`} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0B132B', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px', 
                backdropFilter: 'blur(16px)', 
                fontSize: '11px', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)' 
              }}
              itemStyle={{ color: dotColor, fontWeight: 'bold' }}
              formatter={(value: any) => [`₩${Number(value).toLocaleString()}`, '현재가']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={strokeColor} 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill={`url(#${gradientId})`} 
              dot={{ r: 3.5, fill: strokeColor, strokeWidth: 1.5, stroke: '#0B132B' }} 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
