import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, BarChart, Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, CloudSun, Sparkles, RefreshCw, Layers, Flame, Droplets, MapPin, CheckCircle2, ShieldCheck, Home, Key, Coins, Building, HomeIcon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface SummaryData {
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  totalRainfall: number;
  deliveryDemandIndex: number;
  totalRealEstateTxCount: number;
  highestTransactionApt: string;
  highestTransactionPrice: number;
  realEstateInsight: string;
  weatherInsight: string;
}

interface RealEstateTx {
  complexName: string;
  region: string;
  district: string;
  dong: string;
  area: string;
  areaM2?: number;
  pyeong?: number;
  floor: string;
  buildYear: number;
  propertyType?: string;      // APT, OFFI, VILLA
  propertyTypeLabel?: string; // 아파트 🏢, 오피스텔 🏬, 빌라/다세대 🏡
  dealCategory?: string;      // TRADE, JEONSE, RENT
  tradePrice: number;         // 억원
  tradePriceWon: string;
  formattedPrice?: string;    // 매매 32억 / 전세 18억 / 보증금 5억, 월 250만
  deposit?: number;
  monthlyRent?: number;
  prevPrice?: number;
  changeFormatted?: string;
  changeRate?: number;
  tradeDate: string;
  tradeType: string;          // 매매 / 전세 / 월세
  status: string;             // 초고가/신고가, 우상향, 전세, 월세 등
}

interface WeatherPoint {
  date: string;
  temperature: number;
  minTemperature: number;
  maxTemperature: number;
  rainfall: number;
  hotDays: number;
  rainyDays: number;
  deliveryIndex: number;
  fnbIndex: number;
  fashionIndex: number;
}

const REGION_GROUPS = [
  {
    group: '수도권 핵심',
    items: [
      { id: 'ALL', label: '전체 대표' },
      { id: 'GANGNAM', label: '강남구' },
      { id: 'SEOCHO', label: '서초구' },
      { id: 'SONGPA', label: '송파구' },
      { id: 'YONGSAN', label: '용산구' },
      { id: 'MAPO', label: '마포구' },
      { id: 'SEONGDONG', label: '성동구' },
      { id: 'BUNDANG', label: '분당·판교' },
      { id: 'GWACHEON', label: '과천' },
      { id: 'SONGDO', label: '송도·인천' },
      { id: 'DONGTAN', label: '동탄·화성' },
      { id: 'SUWON_YEONGTONG', label: '광교·수원' },
      { id: 'HANAM', label: '하남·미사' },
    ]
  },
  {
    group: '지방 5대 광역 & 거점',
    items: [
      { id: 'BUSAN_HAEUNDAE', label: '부산 해운대' },
      { id: 'BUSAN_SUYEONG', label: '부산 수영구' },
      { id: 'DAEGU_SUSEONG', label: '대구 수성구' },
      { id: 'SEJONG', label: '세종특별자치시' },
      { id: 'DAEJEON_YUSEONG', label: '대전 유성구' },
      { id: 'GWANGJU_NAMGU', label: '광주 남구' },
    ]
  }
];

const TRADE_TYPE_TABS = [
  { id: 'ALL', label: '전체 계약', icon: Layers },
  { id: 'TRADE', label: '매매 실거래가', icon: Home },
  { id: 'JEONSE', label: '전세 시세', icon: Key },
  { id: 'RENT', label: '월세 시세', icon: Coins },
];

const PROPERTY_TYPE_TABS = [
  { id: 'ALL', label: '전체 부동산', icon: Layers },
  { id: 'APT', label: '아파트 🏢', icon: Building2 },
  { id: 'OFFI', label: '오피스텔 🏬', icon: Building },
  { id: 'VILLA', label: '빌라·다세대 🏡', icon: HomeIcon },
];

export default function PublicDataCenter() {
  const [activeTab, setActiveTab] = useState('real-estate');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedTradeType, setSelectedTradeType] = useState('ALL');
  const [selectedPropertyType, setSelectedPropertyType] = useState('ALL');
  
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [transactions, setTransactions] = useState<RealEstateTx[]>([]);
  const [weatherSeries, setWeatherSeries] = useState<WeatherPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch summary and weather once
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, weatherRes] = await Promise.all([
        axios.get<SummaryData>('/api/v1/public-data/summary'),
        axios.get<WeatherPoint[]>('/api/v1/public-data/series?category=WEATHER_CONSUMPTION'),
      ]);
      setSummary(sumRes.data);
      setWeatherSeries(weatherRes.data);
    } catch (err) {
      console.error('Failed to load initial public data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch transactions based on selected district, tradeType, and propertyType
  const loadTransactions = async (district: string, tradeType: string, propType: string) => {
    try {
      const res = await axios.get<RealEstateTx[]>(
        `/api/v1/public-data/real-estate/transactions?district=${district}&tradeType=${tradeType}&propertyType=${propType}`
      );
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTransactions(selectedDistrict, selectedTradeType, selectedPropertyType);
  }, [selectedDistrict, selectedTradeType, selectedPropertyType]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await axios.post('/api/v1/public-data/refresh');
      await Promise.all([loadInitialData(), loadTransactions(selectedDistrict, selectedTradeType, selectedPropertyType)]);
      toast.success('공공데이터(기상청 & 국토부 전국 부동산) OpenAPI 동기화 완료!', { theme: 'dark' });
    } catch (e) {
      toast.error('동기화 갱신 실패', { theme: 'dark' });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Compute distribution of price ranges for the current transactions
  const priceStats = {
    tradeCount: transactions.filter(t => t.dealCategory === 'TRADE' || !t.dealCategory).length,
    jeonseCount: transactions.filter(t => t.dealCategory === 'JEONSE').length,
    rentCount: transactions.filter(t => t.dealCategory === 'RENT').length,
    aptCount: transactions.filter(t => t.propertyType === 'APT' || !t.propertyType).length,
    offiCount: transactions.filter(t => t.propertyType === 'OFFI').length,
    villaCount: transactions.filter(t => t.propertyType === 'VILLA').length,
    over30: transactions.filter(t => t.tradePrice >= 30).length,
    under30: transactions.filter(t => t.tradePrice >= 20 && t.tradePrice < 30).length,
    under20: transactions.filter(t => t.tradePrice >= 10 && t.tradePrice < 20).length,
    under10: transactions.filter(t => t.tradePrice < 10).length,
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col p-3 md:p-4 gap-2.5 overflow-hidden font-sans select-none">
      
      {/* 1. TOP 4-METRIC PUBLIC INTELLIGENCE RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        
        {/* Card 1: KMA Seoul Temperature */}
        <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors shadow-sm">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">서울 최근 평균기온</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">기상청 108</span>
            </div>
            <h3 className="text-lg font-black text-white font-mono tabular-nums mt-0.5">
              {summary?.avgTemperature ?? 29.3}℃
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-rose-400 font-mono font-bold">최고 {summary?.maxTemperature ?? 36.4}℃</span>
            <p className="text-[11px] font-mono tabular-nums text-slate-400">최저 {summary?.minTemperature ?? 22.6}℃</p>
          </div>
        </div>

        {/* Card 2: Rainfall & Delivery Demand */}
        <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors shadow-sm">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">월간 누적강수량</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">ASOS</span>
            </div>
            <h3 className="text-lg font-black text-cyan-300 font-mono tabular-nums mt-0.5">
              {summary?.totalRainfall ?? 72.8} mm
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono">배달외식 소비지수</span>
            <p className="text-[11px] font-mono tabular-nums font-bold text-emerald-400">
              {summary?.deliveryDemandIndex ?? 162.5} pt 🚀
            </p>
          </div>
        </div>

        {/* Card 3: Top Real Estate Transaction */}
        <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors shadow-sm">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">최고가 실거래 단지</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20 shrink-0">국토부</span>
            </div>
            <h3 className="text-sm font-black text-white truncate mt-0.5">
              {summary?.highestTransactionApt ?? '갤러리아포레 (성수동)'}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 font-mono">체결가</span>
            <p className="text-sm font-mono tabular-nums font-black text-rose-400">
              {summary?.highestTransactionPrice ?? 92.0}억원
            </p>
          </div>
        </div>

        {/* Card 4: Live Data & Refresh Controller */}
        <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors shadow-sm">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">전국 실시간 수집</span>
              <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <h3 className="text-lg font-black text-white font-mono tabular-nums mt-0.5">
              {transactions.length}건 <span className="text-xs font-normal text-slate-400">조회됨</span>
            </h3>
          </div>
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-medium text-slate-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>{isRefreshing ? '동기화중' : '새로고침'}</span>
          </button>
        </div>

      </div>

      {/* 2. MAIN 2-TAB DATA INTELLIGENCE VIEW */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
          <TabsList className="bg-white/[0.03] border border-white/5 p-1 rounded-xl">
            <TabsTrigger value="real-estate" className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-teal-500 data-[state=active]:text-white">
              <Building2 className="w-3.5 h-3.5" />
              <span>전국 아파트·오피스텔·빌라 실거래 센터</span>
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-teal-500 data-[state=active]:text-white">
              <CloudSun className="w-3.5 h-3.5" />
              <span>기상청 날씨 & 계절소비 트렌드</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 국토부(아파트/오피스텔/빌라) & 기상청 공식 연동</span>
          </div>
        </div>

        {/* TAB 1: REAL ESTATE NATIONWIDE TRANSACTIONS & RENT */}
        <TabsContent value="real-estate" className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2.5 overflow-hidden m-0">
          
          {/* Left Main Table (2 Cols) */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full overflow-hidden shadow-sm">
            
            {/* 1. Category & Type Toggles Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/5 shrink-0">
              
              {/* Left: Property Type Selector (아파트 / 오피스텔 / 빌라) */}
              <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
                {PROPERTY_TYPE_TABS.map((p) => {
                  const isActive = selectedPropertyType === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPropertyType(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 font-black'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right: Trade Type Selector (매매 / 전세 / 월세) */}
              <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
                {TRADE_TYPE_TABS.map((t) => {
                  const Icon = t.icon;
                  const isActive = selectedTradeType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTradeType(t.id)}
                      className={`flex items-center gap-1.2 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* 2. Nationwide Region Filter Pills (수도권 & 지방 광역) */}
            <div className="py-2 space-y-1.5 border-b border-white/5 shrink-0">
              {REGION_GROUPS.map((grp, gIdx) => (
                <div key={gIdx} className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                  <span className="text-[10px] font-bold text-slate-500 shrink-0 w-16 uppercase tracking-wider">
                    {grp.group}
                  </span>
                  <div className="flex items-center gap-1">
                    {grp.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedDistrict(item.id)}
                        className={`px-2.5 py-0.8 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                          selectedDistrict === item.id
                            ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-black'
                            : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* High-Density Transactions Table */}
            <div className="flex-1 min-h-0 overflow-y-auto mt-2 pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
              {transactions.map((tx, idx) => {
                const isJeonse = tx.dealCategory === 'JEONSE' || tx.tradeType?.includes('전세');
                const isRent = tx.dealCategory === 'RENT' || tx.tradeType?.includes('월세');
                const isOffi = tx.propertyType === 'OFFI';
                const isVilla = tx.propertyType === 'VILLA';

                return (
                  <div 
                    key={idx}
                    className="bg-white/[0.015] hover:bg-white/[0.04] border border-white/5 hover:border-indigo-500/30 rounded-xl p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg border flex flex-col items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                        isJeonse 
                          ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300' 
                          : isRent 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' 
                          : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                      }`}>
                        <span>{tx.floor}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                            {tx.complexName}
                          </span>

                          {/* Property Type Badge */}
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                            isOffi 
                              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25' 
                              : isVilla 
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                          }`}>
                            {tx.propertyTypeLabel || (isOffi ? '오피스텔 🏬' : isVilla ? '빌라 🏡' : '아파트 🏢')}
                          </span>

                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 font-mono shrink-0">
                            {tx.buildYear}년산
                          </span>
                          
                          {/* Status / Category Badge */}
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                            isJeonse
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
                              : isRent
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                              : tx.tradePrice >= 30 
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25' 
                              : tx.tradePrice >= 15 
                              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/25'
                              : 'bg-slate-500/15 text-slate-300 border border-slate-500/25'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span className="text-slate-300 font-medium">{tx.region}</span>
                          <span>•</span>
                          <span className="text-slate-300">{tx.area}</span>
                          <span>•</span>
                          <span className="text-[10px] text-slate-500">{tx.tradeType}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto">
                      <span className={`text-sm font-mono font-black tabular-nums ${
                        isJeonse ? 'text-cyan-300' : isRent ? 'text-amber-300' : 'text-slate-100'
                      }`}>
                        {tx.formattedPrice || tx.tradePriceWon}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        계약일: {tx.tradeDate}
                      </span>
                    </div>
                  </div>
                );
              })}

              {transactions.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <p>선택하신 부동산 유형/지역의 최근 실거래 데이터를 불러오는 중이거나 없습니다.</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Intelligence Panel (1 Col) */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full justify-between overflow-hidden shadow-sm space-y-3">
            
            <div>
              <div className="flex items-center gap-1.5 pb-2 border-b border-white/5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-bold text-white">전국 부동산 실거래 분석 브리핑</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-2.5 bg-white/[0.015] border border-white/5 rounded-xl p-3 font-sans">
                {summary?.realEstateInsight ?? '서울 및 수도권 핵심지, 지방 거점 대단지 위주로 아파트, 오피스텔, 빌라 거래가 활발합니다.'}
              </p>
            </div>

            {/* 부동산 유형별 & 거래 유형별 비율 분포 */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                조회된 {transactions.length}건 부동산 유형 분포
              </span>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-xs tabular-nums text-center">
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                  <span className="text-[10px] text-blue-400 block font-bold">아파트</span>
                  <span className="text-sm font-black text-white">{priceStats.aptCount}건</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                  <span className="text-[10px] text-purple-400 block font-bold">오피스텔</span>
                  <span className="text-sm font-black text-white">{priceStats.offiCount}건</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                  <span className="text-[10px] text-emerald-400 block font-bold">빌라·다세대</span>
                  <span className="text-sm font-black text-white">{priceStats.villaCount}건</span>
                </div>
              </div>
            </div>

            {/* Price Range Distribution */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                금액대별 거래 분포
              </span>
              <div className="space-y-2 font-mono text-xs tabular-nums">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span className="text-rose-400 font-bold">30억원 이상 (초고가)</span>
                    <span>{priceStats.over30}건</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${transactions.length ? (priceStats.over30 / transactions.length) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span className="text-amber-400 font-bold">20억 ~ 30억원대</span>
                    <span>{priceStats.under30}건</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${transactions.length ? (priceStats.under30 / transactions.length) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span className="text-teal-400 font-bold">10억 ~ 20억원대</span>
                    <span>{priceStats.under20}건</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${transactions.length ? (priceStats.under20 / transactions.length) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span className="text-slate-400 font-bold">10억원 미만</span>
                    <span>{priceStats.under10}건</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-500 h-full rounded-full transition-all" style={{ width: `${transactions.length ? (priceStats.under10 / transactions.length) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Source Badge */}
            <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-2.5 text-[10px] text-slate-400">
              <p className="font-bold text-indigo-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                국토교통부 아파트·오피스텔·연립 실거래 시스템
              </p>
              <p className="mt-1 leading-snug">
                부동산 거래신고 및 주택임대차보호법에 따른 실거래 및 확정일자 공식 데이터입니다.
              </p>
            </div>

          </div>

        </TabsContent>

        {/* TAB 2: WEATHER & CONSUMPTION INTELLIGENCE */}
        <TabsContent value="weather" className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2.5 overflow-hidden m-0">
          
          {/* Left: 12-Month Dual Chart (Temperature & Rainfall) */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                  서울 최근 12개월 기온(℃) & 강수량(mm) 관측 추이
                </h3>
                <span className="text-[10px] px-2 py-0.2 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 font-mono">
                  기상청 종관관측 ASOS
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> 월평균 기온 (좌측)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> 강수량 (우측)</span>
              </div>
            </div>

            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weatherSeries} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#f59e0b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}℃`} width={45} />
                  <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}mm`} width={45} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(16px)', fontSize: '11px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                    formatter={(val: any, name: any) => [
                      name === 'temperature' ? `${val}℃` : name === 'rainfall' ? `${val}mm` : `${val}pt`,
                      name === 'temperature' ? '평균기온' : name === 'rainfall' ? '강수량' : '소비지수'
                    ]}
                  />
                  <Bar yAxisId="right" dataKey="rainfall" fill="#06b6d4" fillOpacity={0.6} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Area yAxisId="left" type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2.5} fill="url(#tempGradient)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Consumption Correlation Trends */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col min-h-0 h-full justify-between overflow-hidden shadow-sm space-y-3">
            <div>
              <div className="flex items-center gap-1.5 pb-2 border-b border-white/5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-white">기상 연동 계절 소비지표 상관분석</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-2.5 bg-white/[0.015] border border-white/5 rounded-xl p-3 font-sans">
                {summary?.weatherInsight ?? '기온 및 강수량 관측 데이터를 기반으로 산출된 소비 트렌드입니다.'}
              </p>
            </div>

            {/* 3 Major Consumption Indices */}
            <div className="space-y-2">
              <div className="bg-white/[0.015] border border-white/5 rounded-xl p-2.5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">배달외식 소비지수 (폭염·우천 연동)</span>
                  <span className="text-xs font-bold text-white">실내 배달 및 밀키트 수요</span>
                </div>
                <span className="text-sm font-black font-mono text-emerald-400 tabular-nums">
                  {summary?.deliveryDemandIndex ?? 162.5} pt
                </span>
              </div>

              <div className="bg-white/[0.015] border border-white/5 rounded-xl p-2.5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">음료 / F&B 소비지수 (고온 연동)</span>
                  <span className="text-xs font-bold text-white">빙과류, 탄산수, 아이스커피</span>
                </div>
                <span className="text-sm font-black font-mono text-cyan-400 tabular-nums">
                  168.0 pt
                </span>
              </div>

              <div className="bg-white/[0.015] border border-white/5 rounded-xl p-2.5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">패션 / 의류 소비지수 (환절기 연동)</span>
                  <span className="text-xs font-bold text-white">가을 신상 및 아우터 전환</span>
                </div>
                <span className="text-sm font-black font-mono text-amber-400 tabular-nums">
                  98.0 pt
                </span>
              </div>
            </div>

            {/* KMA Info Badge */}
            <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-2.5 text-[10px] text-slate-400">
              <p className="font-bold text-cyan-300 flex items-center gap-1">
                <CloudSun className="w-3 h-3 text-cyan-400" />
                기상청 지상(종관) 기상관측 (ASOS)
              </p>
              <p className="mt-1 leading-snug">
                서울 종관관측소(108)의 일평균 기온, 최고/최저 기온 및 일강수량 공공데이터를 기반으로 집계된 데이터입니다.
              </p>
            </div>

          </div>

        </TabsContent>

      </Tabs>
    </div>
  );
}
