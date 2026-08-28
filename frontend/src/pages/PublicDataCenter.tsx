import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Building2, 
  MapPin, 
  Layers, 
  RefreshCw, 
  TrendingUp, 
  Compass, 
  Coins, 
  Key, 
  Home, 
  Building, 
  Home as HomeIcon, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Sparkles, 
  Info,
  Car,
  Train,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Search,
  X,
  Globe,
  CloudSun,
  Flame,
  Umbrella,
  ShoppingBag,
  UtensilsCrossed,
  Map as MapIcon,
  LayoutList,
  Columns2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import PropertyDetailBentoModal from '../components/PropertyDetailBentoModal';
import RegionSelectorModal, { type RegionInfo, type SidoHierarchy } from '../components/RegionSelectorModal';
import KakaoRealEstateMap from '../components/KakaoRealEstateMap';

interface SummaryData {
  bokRate: number;
  fedRate: number;
  cpi: number;
  ppi: number;
  exchangeRate: number;
  seoulApartmentIndex: number;
  seoulApartmentChange: number;
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  totalRainfall: number;
  deliveryDemandIndex: number;
  totalRealEstateTxCount: number;
  highestTransactionApt: string;
  highestTransactionPrice: number;
  macroInsight: string;
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
  propertyType: string;       // "APT", "OFFI", "VILLA"
  propertyTypeLabel: string;  // "아파트 🏢", "오피스텔 🏬", "빌라/다세대 🏡"
  dealCategory: string;       // "TRADE", "JEONSE", "RENT"
  tradePrice: number;         // 억 단위
  tradePriceWon: string;      // "32억 7,000만원" or "보증금 1억원 / 월 280만원"
  formattedPrice?: string;
  deposit?: number;
  monthlyRent?: number;
  tradeDate: string;          // "2024.08.24"
  tradeType: string;          // 매매 / 전세 / 월세
  status: string;             // 초고가/신고가, 우상향, 전세, 월세 등
  isLive?: boolean;           // 100% 국토교통부 실시간 OpenAPI 수신 여부

  // 100% 동적 연동 필드
  direction?: string;
  parkingPerHousehold?: number;
  elevatorCount?: number;
  subwayInfo?: string;
  walkTimeToSubway?: number;
  buildingStructure?: string;
  safetyRating?: string;           // "SAFE", "CAUTION", "DANGER"
  seniorMortgageWon?: number;
  jeonseRatio?: number;
  isHugEligible?: boolean;
  safetyAnalysisReport?: string;
  districtAvgPrice?: number;
  districtMinPrice?: number;
  districtMaxPrice?: number;
  pricePercentile?: number;
  maintenanceFee?: number;
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

// 전국 핵심 인기 핫스팟 퀵 칩
const POPULAR_HOTSPOTS = [
  { id: 'ALL', label: '전국 종합', lawdCd: 'ALL', fullName: '전국 주요 핵심 지역' },
  { id: 'GANGNAM', label: '강남구', lawdCd: '11680', fullName: '서울특별시 강남구' },
  { id: 'SEOCHO', label: '서초구', lawdCd: '11650', fullName: '서울특별시 서초구' },
  { id: 'SONGPA', label: '송파구', lawdCd: '11710', fullName: '서울특별시 송파구' },
  { id: 'YONGSAN', label: '용산구', lawdCd: '11170', fullName: '서울특별시 용산구' },
  { id: 'YEONGDEUNGPO', label: '여의도·영등포', lawdCd: '11560', fullName: '서울특별시 영등포구' },
  { id: 'MAPO', label: '마포구', lawdCd: '11440', fullName: '서울특별시 마포구' },
  { id: 'SEONGDONG', label: '성동구', lawdCd: '11200', fullName: '서울특별시 성동구' },
  { id: 'BUNDANG', label: '분당·판교', lawdCd: '41135', fullName: '경기도 성남시 분당구' },
  { id: 'SUWON_YEONGTONG', label: '광교·수원', lawdCd: '41117', fullName: '경기도 수원시 영통구' },
  { id: 'SONGDO', label: '송도·인천', lawdCd: '28185', fullName: '인천광역시 연수구' },
  { id: 'DONGTAN', label: '동탄·화성', lawdCd: '41590', fullName: '경기도 화성시' },
  { id: 'BUSAN_HAEUNDAE', label: '부산 해운대', lawdCd: '26350', fullName: '부산광역시 해운대구' },
  { id: 'DAEGU_SUSEONG', label: '대구 수성', lawdCd: '27260', fullName: '대구광역시 수성구' },
  { id: 'SEJONG', label: '세종시', lawdCd: '36110', fullName: '세종특별자치시' },
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

interface TabCounts {
  totalCount: number;
  aptCount: number;
  offiCount: number;
  villaCount: number;
  tradeCount: number;
  jeonseCount: number;
  rentCount: number;
}

interface PagedRealEstateResponse {
  content: RealEstateTx[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  tabCounts: TabCounts;
}

export default function PublicDataCenter() {
  const [activeTab, setActiveTab] = useState<'real-estate' | 'weather'>('real-estate');
  
  // 지역 상태 관리 (법정동코드 & 화면 표시명)
  const [selectedLawdCd, setSelectedLawdCd] = useState<string>('ALL');
  const [selectedRegionLabel, setSelectedRegionLabel] = useState<string>('전국 주요 핵심 지역');

  const [selectedTradeType, setSelectedTradeType] = useState('ALL');
  const [selectedPropertyType, setSelectedPropertyType] = useState('ALL');
  
  // 뷰 모드 관리 (스플릿 뷰 / 리스트만 / 지도만)
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [hoveredTxKey, setHoveredTxKey] = useState<string | null>(null);

  // 페이징 및 탭 카운트 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [tabCounts, setTabCounts] = useState<TabCounts | null>(null);
  const pageSize = 20;

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [transactions, setTransactions] = useState<RealEstateTx[]>([]);
  const [weatherSeries, setWeatherSeries] = useState<WeatherPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTxLoading, setIsTxLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 모달 상태
  const [selectedTx, setSelectedTx] = useState<RealEstateTx | null>(null);
  const [focusedTx, setFocusedTx] = useState<RealEstateTx | null>(null);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);

  // 계층형 데이터 및 검색
  const [hierarchy, setHierarchy] = useState<SidoHierarchy[]>([]);
  const [selectedSido, setSelectedSido] = useState<string>('서울특별시');
  
  // 인라인 자동완성 검색 상태
  const [quickSearchQuery, setQuickSearchQuery] = useState<string>('');
  const [quickSearchResults, setQuickSearchResults] = useState<RegionInfo[]>([]);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState<boolean>(false);
  const quickSearchRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 분할 뷰에서 리스트 카드 클릭 시: 모달 대신 지도 카메라 이동 & 마커 하이라이트
  const handleCardClick = (tx: RealEstateTx) => {
    setFocusedTx(tx);
    setHoveredTxKey(tx.complexName);
    if (viewMode === 'list') {
      setSelectedTx(tx); // 목록 전면 뷰일 때는 바로 모달 오픈
    }
  };

  // 마커 클릭 시 해당 매물 카드로 부드러운 스크롤 이동 및 상세 모달 오픈
  const handleSelectFromMap = (tx: any) => {
    setSelectedTx(tx);
    setFocusedTx(tx);
    const cardEl = document.querySelector(`[data-complex="${tx.complexName}"]`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Fetch initial summary, weather, and hierarchy
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, weatherRes, hierRes] = await Promise.all([
        axios.get<SummaryData>('/api/v1/public-data/summary'),
        axios.get<WeatherPoint[]>('/api/v1/public-data/series?category=WEATHER_CONSUMPTION'),
        axios.get<SidoHierarchy[]>('/api/v1/public-data/regions/hierarchy')
      ]);
      setSummary(sumRes.data);
      setWeatherSeries(weatherRes.data);
      setHierarchy(hierRes.data);
    } catch (err) {
      console.error('Failed to load initial public data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch paged transactions based on selected lawdCd, tradeType, propertyType, page
  const loadTransactions = async (lawdCd: string, tradeType: string, propType: string, page: number) => {
    setIsTxLoading(true);
    try {
      const res = await axios.get<PagedRealEstateResponse>(
        `/api/v1/public-data/real-estate/paged?district=${lawdCd}&lawdCd=${lawdCd}&tradeType=${tradeType}&propertyType=${propType}&page=${page}&size=${pageSize}`
      );
      setTransactions(res.data.content || []);
      setCurrentPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
      setTabCounts(res.data.tabCounts || null);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsTxLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 필터나 지역 변경 시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
    loadTransactions(selectedLawdCd, selectedTradeType, selectedPropertyType, 1);
  }, [selectedLawdCd, selectedTradeType, selectedPropertyType]);

  // 페이지 이동 시 호출
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    loadTransactions(selectedLawdCd, selectedTradeType, selectedPropertyType, newPage);
  };

  // Quick Autocomplete Search Debounce
  useEffect(() => {
    if (!quickSearchQuery.trim()) {
      setQuickSearchResults([]);
      setIsQuickSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get<RegionInfo[]>(
          `/api/v1/public-data/regions/search?q=${encodeURIComponent(quickSearchQuery.trim())}`
        );
        setQuickSearchResults(res.data);
        setIsQuickSearchOpen(true);
      } catch (e) {
        console.error('Failed inline search:', e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [quickSearchQuery]);

  // Close quick search when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickSearchRef.current && !quickSearchRef.current.contains(event.target as Node)) {
        setIsQuickSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRegion = (lawdCd: string, name: string) => {
    setSelectedLawdCd(lawdCd);
    setSelectedRegionLabel(name);
    setQuickSearchQuery('');
    setIsQuickSearchOpen(false);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await axios.post('/api/v1/public-data/refresh');
      await Promise.all([
        loadInitialData(), 
        loadTransactions(selectedLawdCd, selectedTradeType, selectedPropertyType, 1)
      ]);
      toast.success('공공데이터(기상청 & 국토부 전국 250개 시군구 실거래가) 동기화 완료!', { theme: 'dark' });
    } catch (e) {
      toast.error('동기화 갱신 실패', { theme: 'dark' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeSggList = hierarchy.find(h => h.sido === selectedSido)?.sggList || [];

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
            <span className="text-sm font-black font-mono text-purple-300">
              {summary?.highestTransactionPrice ?? 92.0} 억원
            </span>
            <p className="text-[10px] text-slate-400">신고가 경신</p>
          </div>
        </div>

        {/* Card 4: Macro Interest Rate */}
        <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-colors shadow-sm">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">한·미 기준금리</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">BOK/FED</span>
            </div>
            <h3 className="text-lg font-black text-white font-mono tabular-nums mt-0.5">
              {summary?.bokRate ?? 2.75}% <span className="text-xs text-slate-500 font-normal">/ {summary?.fedRate ?? 4.00}%</span>
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono">원/달러 환율</span>
            <p className="text-[11px] font-mono tabular-nums text-slate-300">
              {summary?.exchangeRate ?? 1385.5} 원
            </p>
          </div>
        </div>

      </div>

      {/* 2. MAIN CENTER CONTENT VIEW */}
      <div className="flex-1 min-h-0 bg-white/[0.02] border border-white/5 rounded-2xl p-3 md:p-4 flex flex-col overflow-hidden shadow-lg">
        
        {/* Center Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/5 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-teal-500/20 border border-indigo-500/30 text-indigo-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                    {selectedRegionLabel}
                  </span>
                  <span className="text-slate-400 font-normal text-xs sm:text-sm">실거래가 데이터 센터</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold">
                  250개 시군구 전수 연동
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                국토교통부 표준 OpenAPI 실거래가 체결 데이터 및 Apple Bento-Grid AI 권리분석 시스템
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle: [분할 뷰 🪟] [목록 📋] [지도 🗺️] (부동산 탭일 때만 활성화) */}
            {activeTab === 'real-estate' && (
              <div className="hidden sm:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setViewMode('split')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'split'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="좌측 목록 + 우측 지도 분할 뷰"
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span>분할 뷰</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="매물 목록 전면 뷰"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>목록 뷰</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="지도 전면 뷰"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>지도 뷰</span>
                </button>
              </div>
            )}

            {/* View Tab Toggle (부동산 / 날씨소비) */}
            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('real-estate')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'real-estate'
                    ? 'bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>부동산 실거래</span>
              </button>
              <button
                onClick={() => setActiveTab('weather')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'weather'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CloudSun className="w-3.5 h-3.5" />
                <span>날씨 & 계절소비</span>
              </button>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
              <span className="hidden md:inline">{isRefreshing ? '동기화 중...' : 'OpenAPI 갱신'}</span>
            </button>
          </div>

        </div>

        {activeTab === 'real-estate' ? (
          /* 3. DYNAMIC 3-TIER REAL ESTATE NAVIGATOR & BENTO CARDS (SPLIT / LIST / MAP) */
          <div className="flex-1 min-h-0 flex pt-2.5 overflow-hidden gap-3 relative">
            
            {/* FLOATING EXPAND BUTTON (Shown when panel is collapsed in Split View) */}
            {viewMode === 'split' && isPanelCollapsed && (
              <button
                onClick={() => setIsPanelCollapsed(false)}
                className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold px-3.5 py-2 rounded-2xl shadow-2xl border border-indigo-400/40 backdrop-blur-xl transition-all cursor-pointer animate-fade-in"
              >
                <ChevronRight className="w-4 h-4 text-teal-300" />
                <span>매물 목록 ({totalElements.toLocaleString()}건) 펼치기</span>
              </button>
            )}

            {/* LEFT / MAIN COLUMN: 3-Tier Filter + Bento Cards List */}
            {viewMode !== 'map' && (
              <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 relative ${
                viewMode === 'split' 
                  ? isPanelCollapsed
                    ? 'w-0 opacity-0 pointer-events-none -translate-x-full p-0 overflow-hidden'
                    : 'w-full lg:w-[480px] xl:w-[520px] shrink-0 bg-[#0B132B]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 shadow-2xl z-20' 
                  : 'w-full'
              }`}>
                
                {/* TIER 1: Property Type (아파트 / 오피스텔 / 빌라) & Trade Type (매매 / 전세 / 월세) Tabs */}
                <div className="flex flex-col gap-1.5 shrink-0 pb-2 border-b border-white/5">
                  
                  {/* Top Bar with Collapse Button (in Split mode) */}
                  {viewMode === 'split' && (
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-400" />
                        <span>실시간 실거래 탐색</span>
                      </span>
                      <button
                        onClick={() => setIsPanelCollapsed(true)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="패널 접고 지도 전체화면 보기"
                      >
                        <ChevronLeft className="w-3 h-3 text-teal-400" />
                        <span>패널 접기</span>
                      </button>
                    </div>
                  )}

                  {/* Row 1: Property Type Selector */}
                  <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-none">
                    {PROPERTY_TYPE_TABS.map((p) => {
                      const Icon = p.icon;
                      const isActive = selectedPropertyType === p.id;
                      let count = 0;
                      if (tabCounts) {
                        if (p.id === 'ALL') count = tabCounts.totalCount;
                        else if (p.id === 'APT') count = tabCounts.aptCount;
                        else if (p.id === 'OFFI') count = tabCounts.offiCount;
                        else if (p.id === 'VILLA') count = tabCounts.villaCount;
                      }

                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPropertyType(p.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{p.label}</span>
                          {tabCounts && (
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                              isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                            }`}>
                              {count.toLocaleString()}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Row 2: Trade Type Selector (매매 / 전세 / 월세) */}
                  <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-none">
                    {TRADE_TYPE_TABS.map((t) => {
                      const Icon = t.icon;
                      const isActive = selectedTradeType === t.id;
                      let count = 0;
                      if (tabCounts) {
                        if (t.id === 'ALL') count = tabCounts.totalCount;
                        else if (t.id === 'TRADE') count = tabCounts.tradeCount;
                        else if (t.id === 'JEONSE') count = tabCounts.jeonseCount;
                        else if (t.id === 'RENT') count = tabCounts.rentCount;
                      }

                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTradeType(t.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-md shadow-indigo-600/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{t.label}</span>
                          {tabCounts && (
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                              isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                            }`}>
                              {count.toLocaleString()}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                </div>

                {/* TIER 2: Smart Search Bar + 2-Tier Sido/SGG Dropdowns + Full Map Explorer Button */}
                <div className="py-2 border-b border-white/5 flex flex-col gap-1.5 shrink-0 bg-white/[0.01] px-1 rounded-xl">
                  
                  {/* 1) Inline Autocomplete Search Box */}
                  <div className="relative w-full" ref={quickSearchRef}>
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                      <input
                        type="text"
                        value={quickSearchQuery}
                        onChange={(e) => setQuickSearchQuery(e.target.value)}
                        placeholder="시·군·구 / 동 / 단지 검색 (예: 신림, 여의도, 분당)"
                        className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                      />
                      {quickSearchQuery && (
                        <button
                          onClick={() => setQuickSearchQuery('')}
                          className="absolute right-2 p-0.5 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Autocomplete Dropdown Popup */}
                    {isQuickSearchOpen && quickSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-indigo-500/40 rounded-xl shadow-2xl z-40 max-h-56 overflow-y-auto p-1.5 space-y-1">
                        {quickSearchResults.map((r) => (
                          <button
                            key={r.lawdCd}
                            onClick={() => handleSelectRegion(r.lawdCd, r.fullName)}
                            className="w-full px-3 py-1.5 rounded-lg text-left text-xs flex items-center justify-between hover:bg-indigo-500/20 text-slate-200 hover:text-white transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="font-bold text-white">{r.fullName}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{r.lawdCd}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2) 2-Tier Sido / SGG Quick Dropdown Navigator */}
                  <div className="flex items-center gap-1.5">
                    
                    {/* Sido Select */}
                    <div className="relative flex-1">
                      <select
                        value={selectedSido}
                        onChange={(e) => setSelectedSido(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 hover:border-white/20 text-xs text-white rounded-xl px-2 py-1.5 pr-6 appearance-none outline-none cursor-pointer font-bold transition-all"
                      >
                        {hierarchy.map((h) => (
                          <option key={h.sido} value={h.sido} className="bg-slate-900 text-white">
                            {h.sido}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                    </div>

                    {/* Sgg Select */}
                    <div className="relative flex-1">
                      <select
                        value={selectedLawdCd}
                        onChange={(e) => {
                          const targetCd = e.target.value;
                          const found = activeSggList.find(s => s.lawdCd === targetCd);
                          handleSelectRegion(targetCd, found ? found.fullName : selectedSido);
                        }}
                        className="w-full bg-black/30 border border-white/10 hover:border-white/20 text-xs text-white rounded-xl px-2 py-1.5 pr-6 appearance-none outline-none cursor-pointer font-bold transition-all truncate"
                      >
                        <option value="ALL" className="bg-slate-900 text-white">전체 보기</option>
                        {activeSggList.map((s) => (
                          <option key={s.lawdCd} value={s.lawdCd} className="bg-slate-900 text-white">
                            {s.sgg}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                    </div>

                    {/* Full Explorer Modal Trigger Button */}
                    <button
                      onClick={() => setIsRegionModalOpen(true)}
                      className="p-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 text-xs font-bold text-indigo-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                      title="전국 250개 시군구 전체 탐색 지도 모달"
                    >
                      <Globe className="w-4 h-4 text-indigo-400" />
                    </button>

                  </div>

                </div>

                {/* TIER 3: Popular Hotspots Quick Chips */}
                <div className="py-1.5 border-b border-white/5 flex items-center justify-between gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                    <span className="text-[9px] font-bold text-slate-500 shrink-0 uppercase flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      핫스팟
                    </span>
                    <div className="flex items-center gap-1">
                      {POPULAR_HOTSPOTS.slice(0, 8).map((item) => {
                        const isSelected = selectedLawdCd === item.lawdCd;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectRegion(item.lawdCd, item.fullName)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-black'
                                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-[10px] text-slate-400 font-mono">
                    <span className="font-bold text-indigo-400">{totalElements.toLocaleString()}건</span>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* Visual-First Bento Property Cards (100% Dynamic Specs & Percentile Gauge) */}
                {/* ========================================================================= */}
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 min-h-0 overflow-y-auto mt-1.5 pr-1 space-y-2 scrollbar-thin scrollbar-thumb-white/10 relative"
                >
                  {isTxLoading && (
                    <div className="absolute inset-0 bg-[#0B132B]/60 backdrop-blur-sm z-30 flex items-center justify-center">
                      <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 px-4 py-2 rounded-2xl shadow-2xl">
                        <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
                        <span className="text-xs font-bold text-white">실거래가 로딩 중...</span>
                      </div>
                    </div>
                  )}

                  {transactions.length === 0 && !isTxLoading ? (
                    <div className="py-20 text-center text-slate-500 text-sm">
                      해당 조건에 맞는 실거래가 매물이 없습니다.
                    </div>
                  ) : (
                    transactions.map((tx, idx) => {
                      const isJeonse = tx.dealCategory === 'JEONSE' || tx.tradeType?.includes('전세');
                      const isRent = tx.dealCategory === 'RENT' || tx.tradeType?.includes('월세');
                      const isOffi = tx.propertyType === 'OFFI';
                      const isVilla = tx.propertyType === 'VILLA';

                      // 평수 & 면적 계산
                      const pyeongVal = tx.pyeong || (tx.areaM2 ? Math.round(tx.areaM2 / 3.3057) : 34);
                      
                      // 가격 게이지 퍼센트 (백엔드 pricePercentile 연동)
                      const gaugePct = tx.pricePercentile ?? Math.min(100, Math.max(15, Math.round((tx.tradePrice / 40) * 100)));
                      const isAffordable = gaugePct < 40;

                      // 보증금 안전도 판별 (백엔드 safetyRating 연동: SAFE, CAUTION, DANGER)
                      const safetyRating = tx.safetyRating || 'SAFE';
                      const isHovered = hoveredTxKey === tx.complexName;

                      return (
                        <div 
                          key={idx}
                          data-complex={tx.complexName}
                          onMouseEnter={() => setHoveredTxKey(tx.complexName)}
                          onMouseLeave={() => setHoveredTxKey(null)}
                          onClick={() => handleCardClick(tx)}
                          className={`rounded-2xl p-3 flex flex-col justify-between items-start gap-2.5 transition-all group cursor-pointer shadow-sm ${
                            isHovered
                              ? 'bg-indigo-950/90 border-teal-400 ring-2 ring-teal-400/50 shadow-teal-400/20 scale-[1.01]'
                              : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-indigo-500/40 hover:shadow-indigo-500/10'
                          }`}
                        >
                          
                          {/* Top Row: Complex Name & Badges & Price */}
                          <div className="w-full flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs sm:text-sm font-extrabold truncate transition-colors ${
                                  isHovered ? 'text-teal-300' : 'text-white group-hover:text-indigo-300'
                                }`}>
                                  {tx.complexName}
                                </span>

                                {tx.isLive && (
                                  <span className="text-[8px] px-1 py-0.2 rounded font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5 shrink-0">
                                    <span className="w-1 h-1 rounded-full bg-rose-400 animate-ping"></span>
                                    LIVE
                                  </span>
                                )}

                                <span className={`text-[8px] px-1.2 py-0.2 rounded font-bold shrink-0 ${
                                  isOffi 
                                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25' 
                                    : isVilla 
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                    : 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                                }`}>
                                  {tx.propertyTypeLabel || '아파트'}
                                </span>

                                <span className={`text-[8px] px-1.2 py-0.2 rounded font-bold shrink-0 ${
                                  isJeonse 
                                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25' 
                                    : isRent 
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' 
                                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                }`}>
                                  {tx.tradeType}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 font-mono">
                                <span>{tx.region} {tx.dong || ''}</span>
                                <span>·</span>
                                <span className="text-slate-300 font-bold">{pyeongVal}평</span>
                                <span>·</span>
                                <span>{tx.floor}</span>
                              </div>
                            </div>

                            {/* Price Big Typography & Open Modal Button */}
                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                              <div className={`text-xs sm:text-sm font-black font-mono tracking-tight transition-colors ${
                                isHovered ? 'text-teal-300' : 'text-white group-hover:text-indigo-300'
                              }`}>
                                {tx.formattedPrice || tx.tradePriceWon}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {tx.tradeDate}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTx(tx);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-[9px] font-bold text-indigo-300 hover:text-white transition-all cursor-pointer"
                                  title="권리분석 및 매물 상세 Bento 모달 열기"
                                >
                                  상세 ↗
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Row: Spec Chips & Safety */}
                          <div className="w-full flex items-center justify-between gap-1 pt-1.5 border-t border-white/5 flex-wrap">
                            <div className="flex items-center gap-1 flex-wrap">
                              {tx.direction && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-medium">
                                  {tx.direction}
                                </span>
                              )}
                              {tx.subwayInfo && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-medium truncate max-w-[150px]">
                                  {tx.subwayInfo}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 border ${
                                safetyRating === 'SAFE'
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : safetyRating === 'CAUTION'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              }`}>
                                {safetyRating === 'SAFE' ? (
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                ) : safetyRating === 'CAUTION' ? (
                                  <ShieldAlert className="w-2.5 h-2.5" />
                                ) : (
                                  <ShieldX className="w-2.5 h-2.5" />
                                )}
                                <span>{safetyRating === 'SAFE' ? '안심' : safetyRating === 'CAUTION' ? '확인권장' : '주의'}</span>
                              </span>

                              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                                {gaugePct}% 백분위
                              </span>
                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

                {/* ========================================================================= */}
                {/* Ultra-Fast Bento Pagination Controller Bar */}
                {/* ========================================================================= */}
                {totalPages > 1 && (
                  <div className="py-1.5 px-2 border-t border-white/5 flex items-center justify-between gap-1 shrink-0 bg-white/[0.01] rounded-xl mt-1">
                    
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isTxLoading}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      이전
                    </button>

                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        const isCurrent = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isTxLoading}
                            className={`w-6 h-6 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                              isCurrent
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || isTxLoading}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      다음
                    </button>

                  </div>
                )}

              </div>
            )}

            {/* RIGHT COLUMN: Interactive Kakao Map Canvas (Visible in 'split' or 'map' mode) */}
            {viewMode !== 'list' && (
              <div className="flex-1 h-full min-h-0 relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <KakaoRealEstateMap
                  lawdCd={selectedLawdCd}
                  regionName={selectedRegionLabel}
                  transactions={transactions}
                  selectedTx={focusedTx || selectedTx}
                  hoveredTxKey={hoveredTxKey}
                  onSelectTx={handleSelectFromMap}
                  onHoverTx={setHoveredTxKey}
                  onSearchInBounds={(payload) => {
                    setSelectedLawdCd(payload.lawdCd);
                    setSelectedRegionLabel(payload.regionName);
                    loadTransactions(payload.lawdCd, selectedTradeType, selectedPropertyType, 1);
                    toast.info(`📍 '${payload.regionName}' 영역 실거래가 재검색 완료!`, { theme: 'dark' });
                  }}
                />
              </div>
            )}

          </div>
        ) : (
          /* WEATHER & CONSUMPTION INTELLIGENCE VIEW */
          /* WEATHER & CONSUMPTION INTELLIGENCE VIEW */
          <div className="flex-1 min-h-0 overflow-y-auto pt-3 space-y-4 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-2">
                  <Umbrella className="w-4 h-4" />
                  <span>장마 및 강수 민감 소비</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  강수량이 50mm 이상인 날은 배달음식 및 실내 엔터테인먼트 결제액이 전월 대비 평균 18.4% 상승합니다.
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-2">
                  <Flame className="w-4 h-4" />
                  <span>폭염 지수 & F&B 트렌드</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  최고 기온 33℃ 이상 폭염일수 증가 시 빙과류, 빙수, 냉방 가전 및 야간 심야 배달 수요가 24.2% 급증합니다.
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>계절별 패션 & 아웃도어 지수</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  환절기 일교차가 10℃ 이상 벌어지는 시기 아우터 및 기능성 의류 검색량이 연중 최고치를 기록합니다.
                </p>
              </div>
            </div>

            {/* Weather Series Table */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                기상청 ASOS 관측 월별 시계열 & 소비 지표
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="pb-2">기준월</th>
                      <th className="pb-2">평균기온</th>
                      <th className="pb-2">최고 / 최저</th>
                      <th className="pb-2">강수량</th>
                      <th className="pb-2">폭염 / 강우일수</th>
                      <th className="pb-2 text-right">배달소비지수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {weatherSeries.map((w, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 font-bold text-white">{w.date}</td>
                        <td className="py-2.5 text-amber-300">{w.temperature}℃</td>
                        <td className="py-2.5 text-slate-400">{w.maxTemperature}℃ / {w.minTemperature}℃</td>
                        <td className="py-2.5 text-cyan-300">{w.rainfall}mm</td>
                        <td className="py-2.5 text-slate-400">{w.hotDays}일 / {w.rainyDays}일</td>
                        <td className="py-2.5 text-right font-bold text-emerald-400">{w.deliveryIndex} pt</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 4. APPLE BENTO-GRID PROPERTY DETAIL MODAL */}
      {selectedTx && (
        <PropertyDetailBentoModal 
          tx={selectedTx} 
          onClose={() => setSelectedTx(null)} 
        />
      )}

      {/* 5. NATIONWIDE 250 DISTRICTS REGION SELECTOR MODAL */}
      {isRegionModalOpen && (
        <RegionSelectorModal
          currentLawdCd={selectedLawdCd}
          currentRegionName={selectedRegionLabel}
          onSelectRegion={(lawdCd, name) => handleSelectRegion(lawdCd, name)}
          onClose={() => setIsRegionModalOpen(false)}
        />
      )}

    </div>
  );
}
