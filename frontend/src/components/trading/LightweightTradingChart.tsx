import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  createChart, 
  ColorType, 
  CrosshairMode, 
  CandlestickSeries, 
  AreaSeries, 
  HistogramSeries, 
  LineSeries 
} from 'lightweight-charts';
import type { 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  LineData, 
  HistogramData, 
  UTCTimestamp 
} from 'lightweight-charts';
import { BarChart3, LineChart } from 'lucide-react';
import type { ChartTick, MarketQuote } from '@/hooks/useTradingDashboard';

interface LightweightTradingChartProps {
  name: string;
  ticker: string;
  market: string;
  currentPrice: number;
  quote: MarketQuote | null;
  liveTicks?: ChartTick[];
  themeColor?: 'emerald' | 'cyan';
  isCrypto?: boolean;
}

type ChartType = 'candlestick' | 'area';
type Timeframe = '1m' | '5m' | '1d' | '1w';

export default function LightweightTradingChart({
  name,
  ticker,
  market,
  currentPrice,
  quote,
  themeColor = 'emerald',
  isCrypto = false,
}: LightweightTradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  
  // Series References
  const candleSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const ma5SeriesRef = useRef<ISeriesApi<any> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<any> | null>(null);
  const ma60SeriesRef = useRef<ISeriesApi<any> | null>(null);
  const ma120SeriesRef = useRef<ISeriesApi<any> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<any> | null>(null);

  // States
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  
  // Indicator Toggles
  const [showMA, setShowMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  // OHLC hover info state
  const [hoverOhlc, setHoverOhlc] = useState<{ open: number; high: number; low: number; close: number; volume?: number } | null>(null);

  const prevPrice = quote?.prevClose ?? (currentPrice * 0.99);
  const highPrice = quote?.high ?? (currentPrice * 1.02);
  const lowPrice = quote?.low ?? (currentPrice * 0.98);
  const totalVolume = quote?.volume ?? 125000;

  // Generate historical base candles based on current price & timeframe
  const initialData = useMemo(() => {
    const candles: CandlestickData<UTCTimestamp>[] = [];
    const volumes: HistogramData<UTCTimestamp>[] = [];
    const now = Math.floor(Date.now() / 1000);
    const stepSeconds = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '1d' ? 86400 : 604800;
    const count = 100;

    let base = currentPrice > 0 ? currentPrice : 100000;
    const prices: number[] = [base];
    for (let i = count - 1; i >= 1; i--) {
      const volatility = base * (isCrypto ? 0.006 : 0.003);
      const delta = (Math.random() - 0.49) * volatility;
      base = Math.max(base - delta, 100);
      prices.unshift(base);
    }

    for (let i = 0; i < count; i++) {
      const time = (now - (count - i) * stepSeconds) as UTCTimestamp;
      const p = prices[i];
      const open = i === 0 ? p : prices[i - 1];
      const close = p;
      const spread = Math.abs(close - open) + (p * 0.002);
      const high = Math.max(open, close) + Math.random() * spread;
      const low = Math.min(open, close) - Math.random() * spread;
      const isUp = close >= open;

      candles.push({
        time,
        open: Math.round(open),
        high: Math.round(high),
        low: Math.round(low),
        close: Math.round(close),
      });

      volumes.push({
        time,
        value: Math.round(Math.random() * 5000 + 500),
        color: isUp ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
      });
    }

    return { candles, volumes };
  }, [ticker, timeframe]);

  // Calculate Moving Averages
  const calculateMA = (data: CandlestickData<UTCTimestamp>[], period: number): LineData<UTCTimestamp>[] => {
    const result: LineData<UTCTimestamp>[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) continue;
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      result.push({
        time: data[i].time,
        value: Math.round((sum / period) * 100) / 100,
      });
    }
    return result;
  };

  // Calculate Bollinger Bands
  const calculateBollingerBands = (data: CandlestickData<UTCTimestamp>[], period: number = 20, multiplier: number = 2) => {
    const upper: LineData<UTCTimestamp>[] = [];
    const lower: LineData<UTCTimestamp>[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) continue;
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      const mean = sum / period;
      let variance = 0;
      for (let j = 0; j < period; j++) {
        variance += Math.pow(data[i - j].close - mean, 2);
      }
      const stdDev = Math.sqrt(variance / period);
      upper.push({ time: data[i].time, value: Math.round(mean + multiplier * stdDev) });
      lower.push({ time: data[i].time, value: Math.round(mean - multiplier * stdDev) });
    }
    return { upper, lower };
  };

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartApiRef.current) {
      chartApiRef.current.remove();
      chartApiRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontSize: 10,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(16, 185, 129, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0f172a',
        },
        horzLine: {
          color: 'rgba(16, 185, 129, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0f172a',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.22,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartApiRef.current = chart;

    // 1. Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume_scale',
    });
    chart.priceScale('volume_scale').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeries.setData(initialData.volumes);
    volumeSeriesRef.current = volumeSeries;

    // 2. Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });
    candleSeries.setData(initialData.candles);
    candleSeriesRef.current = candleSeries;

    // 3. Area Series
    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: themeColor === 'cyan' ? 'rgba(6, 182, 212, 0.35)' : 'rgba(16, 185, 129, 0.35)',
      bottomColor: 'rgba(16, 185, 129, 0.0)',
      lineColor: themeColor === 'cyan' ? '#06b6d4' : '#10b981',
      lineWidth: 2,
      visible: chartType === 'area',
    });
    const areaData: LineData<UTCTimestamp>[] = initialData.candles.map(c => ({ time: c.time, value: c.close }));
    areaSeries.setData(areaData);
    areaSeriesRef.current = areaSeries;

    // 4. Moving Averages
    const ma5 = chart.addSeries(LineSeries, { color: '#facc15', lineWidth: 1, title: 'MA5', visible: showMA });
    ma5.setData(calculateMA(initialData.candles, 5));
    ma5SeriesRef.current = ma5;

    const ma20 = chart.addSeries(LineSeries, { color: '#fb923c', lineWidth: 1, title: 'MA20', visible: showMA });
    ma20.setData(calculateMA(initialData.candles, 20));
    ma20SeriesRef.current = ma20;

    const ma60 = chart.addSeries(LineSeries, { color: '#c084fc', lineWidth: 1, title: 'MA60', visible: showMA });
    ma60.setData(calculateMA(initialData.candles, 60));
    ma60SeriesRef.current = ma60;

    const ma120 = chart.addSeries(LineSeries, { color: '#38bdf8', lineWidth: 1, title: 'MA120', visible: showMA });
    ma120.setData(calculateMA(initialData.candles, 120));
    ma120SeriesRef.current = ma120;

    // 5. Bollinger Bands
    const bb = calculateBollingerBands(initialData.candles, 20, 2);
    const bbUpper = chart.addSeries(LineSeries, { color: 'rgba(45, 212, 191, 0.6)', lineWidth: 1, lineStyle: 2, title: 'BB Upper', visible: showBB });
    bbUpper.setData(bb.upper);
    bbUpperSeriesRef.current = bbUpper;

    const bbLower = chart.addSeries(LineSeries, { color: 'rgba(45, 212, 191, 0.6)', lineWidth: 1, lineStyle: 2, title: 'BB Lower', visible: showBB });
    bbLower.setData(bb.lower);
    bbLowerSeriesRef.current = bbLower;

    // Crosshair hover tracking
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData) {
        const cData = param.seriesData.get(candleSeries) as any;
        const vData = param.seriesData.get(volumeSeries) as any;
        if (cData) {
          setHoverOhlc({
            open: cData.open,
            high: cData.high,
            low: cData.low,
            close: cData.close,
            volume: vData?.value,
          });
        }
      } else {
        setHoverOhlc(null);
      }
    });

    const handleResize = () => {
      if (container && chartApiRef.current) {
        chartApiRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartApiRef.current) {
        chartApiRef.current.remove();
        chartApiRef.current = null;
      }
    };
  }, [initialData]);

  // Handle Chart Type Toggle
  useEffect(() => {
    if (candleSeriesRef.current && areaSeriesRef.current) {
      candleSeriesRef.current.applyOptions({ visible: chartType === 'candlestick' });
      areaSeriesRef.current.applyOptions({ visible: chartType === 'area' });
    }
  }, [chartType]);

  // Handle Indicators Visibility
  useEffect(() => {
    ma5SeriesRef.current?.applyOptions({ visible: showMA });
    ma20SeriesRef.current?.applyOptions({ visible: showMA });
    ma60SeriesRef.current?.applyOptions({ visible: showMA });
    ma120SeriesRef.current?.applyOptions({ visible: showMA });
  }, [showMA]);

  useEffect(() => {
    bbUpperSeriesRef.current?.applyOptions({ visible: showBB });
    bbLowerSeriesRef.current?.applyOptions({ visible: showBB });
  }, [showBB]);

  useEffect(() => {
    volumeSeriesRef.current?.applyOptions({ visible: showVolume });
  }, [showVolume]);

  // Real-time Tick updates
  useEffect(() => {
    if (!currentPrice || !candleSeriesRef.current) return;
    const now = Math.floor(Date.now() / 1000) as UTCTimestamp;
    
    try {
      candleSeriesRef.current.update({
        time: now,
        open: currentPrice,
        high: Math.max(currentPrice, highPrice),
        low: Math.min(currentPrice, lowPrice),
        close: currentPrice,
      });

      if (areaSeriesRef.current) {
        areaSeriesRef.current.update({
          time: now,
          value: currentPrice,
        });
      }
    } catch (e) {
      // Ignore timestamp sequencing collisions on fast ticks
    }
  }, [currentPrice]);

  const displayedOhlc = hoverOhlc || {
    open: prevPrice,
    high: highPrice,
    low: lowPrice,
    close: currentPrice,
    volume: totalVolume,
  };

  const isUp = displayedOhlc.close >= displayedOhlc.open;

  return (
    <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full overflow-hidden shadow-sm backdrop-blur-md">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 shrink-0 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black text-white flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${themeColor === 'cyan' ? 'bg-cyan-400' : 'bg-emerald-400'} animate-pulse`}></span>
            {name}
            <span className="text-xs text-slate-400 font-mono font-normal">({ticker})</span>
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300 font-bold border border-white/5">
            {market}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            TradingView
          </span>
        </div>

        {/* Timeframe & Chart Type Controls */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 p-1 rounded-xl">
          {(['1m', '5m', '1d', '1w'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg transition-all ${
                timeframe === tf
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}

          <div className="w-px h-3 bg-white/10 mx-1" />

          <button
            onClick={() => setChartType('candlestick')}
            className={`p-1 rounded-lg transition-all ${
              chartType === 'candlestick'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="캔들스틱 차트"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`p-1 rounded-lg transition-all ${
              chartType === 'area'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="영역 라인 차트"
          >
            <LineChart className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Indicators Toolbar */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <button
            onClick={() => setShowMA(!showMA)}
            className={`px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
              showMA 
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                : 'bg-white/[0.02] text-slate-500 border-white/5 hover:text-slate-300'
            }`}
          >
            <span>MA (5/20/60/120)</span>
          </button>

          <button
            onClick={() => setShowBB(!showBB)}
            className={`px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
              showBB 
                ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' 
                : 'bg-white/[0.02] text-slate-500 border-white/5 hover:text-slate-300'
            }`}
          >
            <span>볼린저밴드</span>
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
              showVolume 
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' 
                : 'bg-white/[0.02] text-slate-500 border-white/5 hover:text-slate-300'
            }`}
          >
            <span>거래량</span>
          </button>
        </div>
      </div>

      {/* 2. Real-time OHLCV Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono tabular-nums text-slate-400 bg-white/[0.015] border border-white/5 px-3 py-1.5 rounded-xl mb-1.5 shrink-0">
        <div className="flex items-center gap-3">
          <span>시가 <b className="text-slate-200">₩{displayedOhlc.open?.toLocaleString()}</b></span>
          <span>고가 <b className="text-rose-400">₩{displayedOhlc.high?.toLocaleString()}</b></span>
          <span>저가 <b className="text-cyan-400">₩{displayedOhlc.low?.toLocaleString()}</b></span>
          <span>종가 <b className={isUp ? 'text-emerald-400' : 'text-rose-400'}>₩{displayedOhlc.close?.toLocaleString()}</b></span>
        </div>
        <div className="flex items-center gap-3">
          <span>거래량 <b className="text-slate-300">{displayedOhlc.volume?.toLocaleString() ?? totalVolume.toLocaleString()}</b></span>
          {showMA && (
            <div className="hidden sm:flex items-center gap-2 text-[10px]">
              <span className="text-yellow-400">MA5</span>
              <span className="text-orange-400">MA20</span>
              <span className="text-purple-400">MA60</span>
              <span className="text-cyan-400">MA120</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Lightweight Chart Canvas */}
      <div className="flex-1 min-h-0 w-full relative" ref={chartContainerRef}>
        <div className="absolute right-4 bottom-8 text-white/[0.02] font-black text-5xl pointer-events-none select-none tracking-tighter">
          TRENDDASH
        </div>
      </div>
    </div>
  );
}
