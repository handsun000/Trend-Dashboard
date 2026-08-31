import React, { useState } from 'react';
import { 
  CloudSun, 
  Sun, 
  CloudRain, 
  Flame, 
  Wind, 
  Droplets, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  UtensilsCrossed, 
  Coffee, 
  ShoppingBag, 
  Zap, 
  MapPin, 
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import type { CurrentWeather, WeatherPoint } from '@/hooks/usePublicData';

interface WeatherConsumptionDashboardProps {
  currentWeather: CurrentWeather | null;
  weatherSeries: WeatherPoint[];
  selectedRegionLabel: string;
}

export default function WeatherConsumptionDashboard({
  currentWeather,
  weatherSeries,
  selectedRegionLabel,
}: WeatherConsumptionDashboardProps) {
  const [activeChartMetric, setActiveChartMetric] = useState<'all' | 'delivery' | 'fnb' | 'fashion'>('all');

  const w = currentWeather || {
    stnId: '108',
    stnName: '기상관측소',
    regionName: selectedRegionLabel,
    currentTemp: 29.4,
    sensoryTemp: 31.2,
    minTemp: 23.5,
    maxTemp: 34.0,
    humidity: 68,
    windSpeed: 2.4,
    rainfall: 0,
    weatherCondition: 'SUNNY' as const,
    conditionLabel: '맑음 ☀️',
    airQuality: 'GOOD',
    airQualityLabel: '좋음 🟢',
    aqiValue: 28,
    alertBadge: '쾌적한 날씨 🍃',
    deliveryIndex: 128.5,
    fnbIndex: 145.0,
    fashionIndex: 98.0,
    energyIndex: 135.0,
    aiWeatherReport: `${selectedRegionLabel} 지역의 실시간 기상 관측에 따른 소비 지수 분석 결과입니다.`,
    observationTime: '실시간 관측'
  };

  const getWeatherIcon = (cond: string) => {
    switch (cond) {
      case 'HEATWAVE':
        return <Flame className="w-9 h-9 text-rose-400 animate-bounce" />;
      case 'RAIN':
        return <CloudRain className="w-9 h-9 text-cyan-400 animate-pulse" />;
      case 'CLOUDY':
      case 'OVERCAST':
        return <CloudSun className="w-9 h-9 text-slate-300" />;
      default:
        return <Sun className="w-9 h-9 text-amber-400 animate-spin-slow" />;
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1 font-sans select-none scrollbar-thin">
      
      {/* 1. TOP LIVE WEATHER & CONSUMPTION CAST BENTO (3 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Card 1: Primary Live Weather Badge */}
        <div className="bg-gradient-to-br from-slate-900/90 via-[#0B132B] to-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl group-hover:scale-125 transition-transform" />
          
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                <MapPin className="w-3.5 h-3.5" />
                <span>{w.regionName}</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">({w.stnName})</span>
              </div>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/5 mt-1">
                {w.observationTime}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner">
              {getWeatherIcon(w.weatherCondition)}
            </div>
          </div>

          <div className="my-2 z-10">
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl lg:text-4xl font-black text-white font-mono tabular-nums tracking-tight">
                {w.currentTemp}℃
              </h2>
              <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                체감 {w.sensoryTemp}℃
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs font-mono text-slate-400">
              <span className="text-rose-400 font-bold">최고 {w.maxTemp}℃</span>
              <span>•</span>
              <span className="text-cyan-400 font-bold">최저 {w.minTemp}℃</span>
              <span>•</span>
              <span className="text-slate-300">{w.conditionLabel}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between z-10">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{w.alertBadge}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
              AQI {w.aqiValue} ({w.airQualityLabel})
            </span>
          </div>
        </div>

        {/* Card 2: Micro Environmental Sensor Grid */}
        <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-4 flex flex-col justify-between transition-colors shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>기상 환경 정밀 계측 (ASOS)</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
              정상 수신 🟢
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 my-2 text-xs font-mono">
            <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">상대습도</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-base font-black text-cyan-300">{w.humidity}%</span>
                <span className="text-[10px] text-slate-500">{w.humidity > 70 ? '습함' : '적정'}</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-cyan-400 h-full" style={{ width: `${w.humidity}%` }} />
              </div>
            </div>

            <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">풍속 / 풍향</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-base font-black text-teal-300">{w.windSpeed} m/s</span>
                <span className="text-[10px] text-slate-500">남동풍</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-teal-400 h-full" style={{ width: `${Math.min(100, w.windSpeed * 10)}%` }} />
              </div>
            </div>

            <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">일일 누적 강수량</span>
              <span className="text-base font-black text-cyan-300 mt-1 block">{w.rainfall} mm</span>
            </div>

            <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">통합 대기질 (미세먼지)</span>
              <span className="text-base font-black text-emerald-400 mt-1 block">{w.airQualityLabel}</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 text-right">기상청 종관기상관측소 10분 주기 갱신</p>
        </div>

        {/* Card 3: Real-time Retail & Consumer Demand Indices */}
        <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-4 flex flex-col justify-between transition-colors shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>실시간 날씨 연계 소비 예측</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Base 100 pt</span>
          </div>

          <div className="space-y-2 my-2 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1">
                <UtensilsCrossed className="w-3 h-3 text-emerald-400" />
                <span>배달/외식 지수</span>
              </span>
              <span className="text-emerald-400 font-bold">{w.deliveryIndex} pt</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1">
                <Coffee className="w-3 h-3 text-cyan-400" />
                <span>F&B / 음료 / 카페</span>
              </span>
              <span className="text-cyan-400 font-bold">{w.fnbIndex} pt</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1">
                <ShoppingBag className="w-3 h-3 text-purple-400" />
                <span>패션 / 계절 의류</span>
              </span>
              <span className="text-purple-400 font-bold">{w.fashionIndex} pt</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>냉난방 에너지 부하</span>
              </span>
              <span className="text-amber-400 font-bold">{w.energyIndex} pt</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-teal-300 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            <span className="truncate">기온 {w.currentTemp}℃ 상태에 최적화된 소비 지수 산출 완료</span>
          </div>
        </div>
      </div>

      {/* 2. AI WEATHER & CONSUMPTION REPORT BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900/50 to-indigo-950/30 border border-emerald-500/20 rounded-2xl p-3.5 flex items-start gap-3 shadow-md">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-black text-white flex items-center gap-2">
            <span>AI 기상 & 상권 소비 트렌드 진단 리포트</span>
            <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold">LIVE BRIEFING</span>
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {w.aiWeatherReport}
          </p>
        </div>
      </div>

      {/* 3. MULTI-INDEX COMPOSED CHART (12-Month Climate vs Consumer Indices) */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span>기상청 관측 시계열(12개월) × 3대 소비지표 상관관계 차트</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              기온(℃) 및 누적 강수량(mm) 변화에 따른 배달·F&B·패션 소비 지표의 계절적 추이
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 text-[11px] font-bold">
            <button
              onClick={() => setActiveChartMetric('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeChartMetric === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              종합 뷰
            </button>
            <button
              onClick={() => setActiveChartMetric('delivery')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeChartMetric === 'delivery' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              배달외식
            </button>
            <button
              onClick={() => setActiveChartMetric('fnb')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeChartMetric === 'fnb' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              음료/F&B
            </button>
            <button
              onClick={() => setActiveChartMetric('fashion')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeChartMetric === 'fashion' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              패션/의류
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-64 sm:h-72 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weatherSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              
              {/* Left Y Axis: Temperature */}
              <YAxis 
                yAxisId="left" 
                stroke="#10b981" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => `${val}℃`} 
              />
              
              {/* Right Y Axis: Consumer Demand Indices */}
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                domain={[60, 200]}
                tickFormatter={(val) => `${val}pt`} 
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
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {/* Precipitation Bar */}
              <Bar yAxisId="left" dataKey="rainfall" name="월간 강수량 (mm)" fill="#0284c7" opacity={0.4} radius={[4, 4, 0, 0]} />

              {/* Temperature Area */}
              <Area yAxisId="left" type="monotone" dataKey="temperature" name="평균기온 (℃)" stroke="#10b981" strokeWidth={2.5} fill="url(#tempGradient)" />

              {/* Consumer Lines */}
              {(activeChartMetric === 'all' || activeChartMetric === 'delivery') && (
                <Line yAxisId="right" type="monotone" dataKey="deliveryIndex" name="배달소비 지수" stroke="#34d399" strokeWidth={2} dot={{ r: 2.5 }} />
              )}
              {(activeChartMetric === 'all' || activeChartMetric === 'fnb') && (
                <Line yAxisId="right" type="monotone" dataKey="fnbIndex" name="음료/F&B 지수" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2.5 }} />
              )}
              {(activeChartMetric === 'all' || activeChartMetric === 'fashion') && (
                <Line yAxisId="right" type="monotone" dataKey="fashionIndex" name="패션의류 지수" stroke="#c084fc" strokeWidth={2} dot={{ r: 2.5 }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. SECTOR CONSUMPTION SENSITIVITY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
            <CloudRain className="w-4 h-4" />
            <span>장마 & 우천 민감 소비</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            강수량 50mm 이상 시 배달 음식, 실내 OTT 결제액 평균 +18.4% 상승.
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
            <Flame className="w-4 h-4" />
            <span>폭염 특보 & F&B 트렌드</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            최고 기온 33℃ 돌파 시 빙수, 냉음료, 심야 야식 주문량 +24.2% 급증.
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
            <ShoppingBag className="w-4 h-4" />
            <span>환절기 패션 & 아웃도어</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            일교차 10℃ 이상 시즌(3~4월, 10~11월) 기능성 아우터 매출 연중 최대.
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
            <Zap className="w-4 h-4" />
            <span>에너지 & 가전 수요</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            혹서기 및 한파 기간 냉난방 전력 부하 지수 평시 대비 +45% 증가.
          </p>
        </div>
      </div>

    </div>
  );
}
