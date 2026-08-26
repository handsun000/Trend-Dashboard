import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Building2, BarChart3, CloudSun, TrendingUp, Sparkles, ArrowUpRight, ShieldCheck, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface SummaryData {
  bokRate: number;
  fedRate: number;
  cpi: number;
  ppi: number;
  exchangeRate: number;
  seoulApartmentIndex: number;
  seoulApartmentChange: number;
  avgTemperature: number;
  deliveryDemandIndex: number;
  macroInsight: string;
  realEstateInsight: string;
  weatherInsight: string;
}

interface RealEstateTx {
  complexName: string;
  region: string;
  area: string;
  recentPrice: number;
  prevPrice: number;
  changeFormatted: string;
  changeRate: number;
  tradeDate: string;
  status: string;
}

export default function PublicDataCenter() {
  const [activeTab, setActiveTab] = useState('real-estate');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [realEstateSeries, setRealEstateSeries] = useState<any[]>([]);
  const [macroSeries, setMacroSeries] = useState<any[]>([]);
  const [weatherSeries, setWeatherSeries] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<RealEstateTx[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPublicData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, reRes, macroRes, weatherRes, txRes] = await Promise.all([
        axios.get('/api/v1/public-data/summary'),
        axios.get('/api/v1/public-data/series?category=REAL_ESTATE'),
        axios.get('/api/v1/public-data/series?category=MACRO'),
        axios.get('/api/v1/public-data/series?category=WEATHER_CONSUMPTION'),
        axios.get('/api/v1/public-data/real-estate/transactions'),
      ]);
      setSummary(sumRes.data);
      setRealEstateSeries(reRes.data);
      setMacroSeries(macroRes.data);
      setWeatherSeries(weatherRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      console.error('Failed to fetch public data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
  }, []);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col p-3 md:p-4 gap-2.5 overflow-hidden font-sans select-none">
      
      {/* 1. TOP 4-METRIC PUBLIC INTELLIGENCE RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        
        {/* Card 1: BOK Interest Rate */}
        <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">한국은행 기준금리</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">BOK</span>
            </div>
            <h3 className="text-lg font-black text-white font-mono tabular-nums mt-0.5">
              {summary?.bokRate ?? 2.75}%
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono">美 연준 {summary?.fedRate ?? 4.00}%</span>
            <p className="text-[11px] font-mono tabular-nums font-bold text-indigo-400">한미격차 1.25%p</p>
          </div>
        </div>

        {/* Card 2: CPI Inflation */}
        <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">소비자물가 (CPI)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">TARGET</span>
            </div>
            <h3 className="text-lg font-black text-white font-mono tabular-nums mt-0.5">
              +{summary?.cpi ?? 2.0}%
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono">생산자물가 +{summary?.ppi ?? 0.9}%</span>
            <p className="text-[11px] font-mono tabular-nums font-bold text-emerald-400">목표 2.0% 안착 🟢</p>
          </div>
        </div>

        {/* Card 3: Seoul Apartment Index */}
        <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">서울 아파트 매매지수</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">REB</span>
            </div>
            <h3 className="text-lg font-black text-white font-mono tabular-nums mt-0.5">
              {summary?.seoulApartmentIndex ?? 105.1} <span className="text-xs font-normal text-slate-400">pt</span>
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono">월간 6,850건 거래</span>
            <p className="text-[11px] font-mono tabular-nums font-bold text-cyan-400">+{summary?.seoulApartmentChange ?? 0.29}% 🚀</p>
          </div>
        </div>

        {/* Card 4: Weather & Consumption */}
        <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">폭염·계절 소비지수</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">HOT</span>
            </div>
            <h3 className="text-lg font-black text-amber-300 font-mono tabular-nums mt-0.5">
              {summary?.deliveryDemandIndex ?? 126.8} <span className="text-xs font-normal text-slate-400">pt</span>
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono">평균기온 {summary?.avgTemperature ?? 29.5}℃</span>
            <p className="text-[11px] font-mono tabular-nums font-bold text-amber-400">배달·음료 +18.5% 🔥</p>
          </div>
        </div>
      </div>

      {/* 2. TABS STRIP */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
        <div className="flex items-center justify-between gap-3 shrink-0">
          <TabsList>
            <TabsTrigger value="real-estate" className="gap-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>부동산 트렌드 (Real Estate)</span>
            </TabsTrigger>
            <TabsTrigger value="macro" className="gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>거시경제 & 물가 (Macro Economy)</span>
            </TabsTrigger>
            <TabsTrigger value="weather" className="gap-2">
              <CloudSun className="w-3.5 h-3.5" />
              <span>날씨 & 소비지수 (Weather & Consumption)</span>
            </TabsTrigger>
          </TabsList>

          <button
            onClick={fetchPublicData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-300 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>공공데이터 갱신</span>
          </button>
        </div>

        {/* ==================== TAB 1: REAL ESTATE ==================== */}
        <TabsContent value="real-estate" className="w-full flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2.5 overflow-hidden">
          {/* Left: 12-Month Index Chart */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full overflow-hidden shadow-sm">
            <div className="flex justify-between items-center mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <h3 className="text-sm font-black text-white">전국 / 수도권 / 서울 아파트 매매가격지수 추이 (2025.09 ~ 2026.08)</h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span>서울</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>수도권</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#64748b]"></span>전국</span>
              </div>
            </div>

            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={realEstateSeries} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="seoulGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="capitalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} width={45} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(16px)', fontSize: '11px' }}
                    formatter={(val: any) => [`${val} pt`]}
                  />
                  <Area type="monotone" dataKey="seoul" name="서울" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#seoulGrad)" dot={{ r: 3, fill: '#06b6d4' }} />
                  <Area type="monotone" dataKey="capital" name="수도권" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#capitalGrad)" dot={{ r: 2.5, fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="nationwide" name="전국" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Insight Bar */}
            <div className="mt-2 p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 flex items-center gap-2.5 text-xs text-slate-300 shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <p className="line-clamp-1">{summary?.realEstateInsight}</p>
            </div>
          </div>

          {/* Right: Recent Major Real Estate Transactions Table */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full overflow-hidden shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-white/5 shrink-0">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>주요 핵심 단지 실거래가 속보</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">국토교통부 연동</span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 py-2 pr-1">
              {transactions.map((tx, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-white">{tx.complexName}</p>
                      <p className="text-[10px] text-slate-400">{tx.region} · {tx.area}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${
                      tx.status.includes('신고가') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-white/5 font-mono">
                    <span className="text-xs font-black text-cyan-300 tabular-nums">₩{tx.recentPrice}억원</span>
                    <span className="text-[11px] font-bold text-emerald-400 tabular-nums">{tx.changeFormatted} ({tx.changeRate}%)</span>
                    <span className="text-[10px] text-slate-500">{tx.tradeDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 2: MACRO ECONOMY ==================== */}
        <TabsContent value="macro" className="w-full flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5 overflow-hidden">
          {/* Left: Interest Rates BOK vs Fed */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full overflow-hidden shadow-sm">
            <div className="flex justify-between items-center mb-2 shrink-0">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>한-미 기준금리 추이 및 금리차 스프레드 (%)</span>
              </h3>
              <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#818cf8]"></span>한국은행</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f43f5e]"></span>미국 연준(Fed)</span>
              </div>
            </div>

            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={macroSeries} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bokGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[2.0, 6.0]} width={40} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} />
                  <Area type="stepAfter" dataKey="bokRate" name="한국은행" stroke="#818cf8" strokeWidth={2.5} fillOpacity={1} fill="url(#bokGrad)" />
                  <Line type="stepAfter" dataKey="fedRate" name="미 연준" stroke="#f43f5e" strokeWidth={2} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-2 p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-300 shrink-0">
              <p className="line-clamp-1">{summary?.macroInsight}</p>
            </div>
          </div>

          {/* Right: CPI & PPI Inflation + Exchange Rate */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full overflow-hidden shadow-sm">
            <div className="flex justify-between items-center mb-2 shrink-0">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>인플레이션 지표 (CPI · PPI) 및 원/달러 환율 추이</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">한국은행 ECOS</span>
            </div>

            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={macroSeries} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="rate" domain={[0, 4.0]} width={35} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis yAxisId="ex" orientation="right" domain={[1300, 1450]} width={45} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₩${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} />
                  <Line yAxisId="rate" type="monotone" dataKey="cpi" name="소비자물가(CPI)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line yAxisId="rate" type="monotone" dataKey="ppi" name="생산자물가(PPI)" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2.5 }} />
                  <Line yAxisId="ex" type="monotone" dataKey="exchangeRate" name="원/달러 환율" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-slate-300 shrink-0">
              <p className="line-clamp-1">원/달러 환율 1,380원대 안정화 속, 물가상승률이 한국은행 중기 목표치(2.0%) 범위 내로 진입했습니다.</p>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 3: WEATHER & CONSUMPTION ==================== */}
        <TabsContent value="weather" className="w-full flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2.5 overflow-hidden">
          {/* Left: Weather vs Consumption Chart */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full overflow-hidden shadow-sm">
            <div className="flex justify-between items-center mb-2 shrink-0">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                <span>기온/강수량과 식음료(F&B) · 배달외식 소비지수 상관관계</span>
              </h3>
              <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>음료/빙과</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span>배달외식</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>패션/의류</span>
              </div>
            </div>

            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weatherSeries} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[60, 180]} width={40} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="fnbIndex" name="음료/빙과류" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="deliveryIndex" name="배달외식" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="fashionIndex" name="패션/의류" stroke="#a855f7" strokeWidth={1.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs text-slate-300 shrink-0">
              <p className="line-clamp-1">{summary?.weatherInsight}</p>
            </div>
          </div>

          {/* Right: Weather & Consumption AI Themes Card */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full overflow-hidden shadow-sm justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs font-bold text-white">기상 연계 소비 수혜 테마</span>
                <span className="text-[10px] text-amber-400 font-mono">기상청 Open API</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs font-bold text-amber-300">🔥 폭염 및 열대야 시즌 수혜</p>
                <p className="text-[11px] text-slate-300 mt-1">빙과/음료 매출 +35%, 야간 배달 주문 +28%, 실내 냉방 가전 수요 급증.</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-amber-200">#빙그레</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-amber-200">#하이트진로</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-amber-200">#신세계푸드</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-xs font-bold text-cyan-300">🌧️ 장마철 및 집중호우 영향</p>
                <p className="text-[11px] text-slate-300 mt-1">오프라인 쇼핑몰 방문객 -15%, 이커머스 당일배송 +22%, 제습기 수요 증가.</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-cyan-200">#쿠팡</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-cyan-200">#위닉스</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-cyan-200">#CJ대한통운</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 font-mono">
              실시간 기상청 날씨 레이더 & BC/신한 카드 소비 빅데이터 연계
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
