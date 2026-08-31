import React, { useState } from 'react';
import axios from 'axios';
import { 
  Building2, 
  MapPin, 
  RefreshCw, 
  Sparkles, 
  CloudSun, 
  Flame, 
  Umbrella, 
  ShoppingBag, 
  Map as MapIcon, 
  LayoutList, 
  Columns2,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import PropertyDetailBentoModal from '../components/PropertyDetailBentoModal';
import RegionSelectorModal from '../components/RegionSelectorModal';
import KakaoRealEstateMap from '../components/KakaoRealEstateMap';
import MacroWeatherSummary from '../components/proptech/MacroWeatherSummary';
import RealEstateListPanel from '../components/proptech/RealEstateListPanel';
import WeatherConsumptionDashboard from '../components/proptech/WeatherConsumptionDashboard';
import { usePublicData } from '../hooks/usePublicData';
import type { RealEstateTx } from '../hooks/usePublicData';

const POPULAR_DISTRICT_CHIPS = [
  { id: '11680', label: '강남', sido: '서울' },
  { id: '11650', label: '서초', sido: '서울' },
  { id: '11710', label: '송파', sido: '서울' },
  { id: '11170', label: '용산', sido: '서울' },
  { id: '11200', label: '성동(성수)', sido: '서울' },
  { id: '11440', label: '마포', sido: '서울' },
  { id: '41135', label: '분당·판교', sido: '경기' },
  { id: '41290', label: '과천', sido: '경기' },
  { id: '41590', label: '동탄', sido: '경기' },
  { id: '26350', label: '해운대', sido: '부산' },
  { id: '36110', label: '세종', sido: '세종' },
  { id: '28185', label: '송도', sido: '인천' },
];

export default function PublicDataCenter() {
  const {
    summary,
    currentWeather,
    weatherSeries,
    transactions,
    loading,
    txLoading,
    selectedLawdCd,
    setSelectedLawdCd,
    selectedRegionLabel,
    setSelectedRegionLabel,
    selectedTradeType,
    setSelectedTradeType,
    selectedPropertyType,
    setSelectedPropertyType,
    currentPage,
    totalPages,
    totalElements,
    loadSummary,
    loadTransactions,
  } = usePublicData();

  const [activeTab, setActiveTab] = useState<'real-estate' | 'weather'>('real-estate');
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Modals & Focused items
  const [selectedTx, setSelectedTx] = useState<RealEstateTx | null>(null);
  const [focusedTx, setFocusedTx] = useState<RealEstateTx | null>(null);
  const [hoveredTxKey, setHoveredTxKey] = useState<string | null>(null);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSelectRegion = (lawdCd: string, name: string) => {
    setSelectedLawdCd(lawdCd);
    setSelectedRegionLabel(name);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await axios.post('/api/v1/public-data/refresh');
      await Promise.all([
        loadSummary(),
        loadTransactions(selectedLawdCd, selectedTradeType, selectedPropertyType, 1)
      ]);
      toast.success('공공데이터(기상청 & 국토부 실거래가) 동기화 완료!', { theme: 'dark' });
    } catch (e) {
      toast.error('동기화 갱신 실패', { theme: 'dark' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectFromMap = (tx: any) => {
    setFocusedTx(tx as RealEstateTx);
    setSelectedTx(tx as RealEstateTx);
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col p-3 md:p-4 gap-2.5 overflow-hidden font-sans select-none">
      
      {/* 1. TOP 4-METRIC PUBLIC INTELLIGENCE RIBBON */}
      <MacroWeatherSummary summary={summary} />

      {/* 2. MAIN BENTO CONTAINER */}
      <div className="flex-1 min-h-0 bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col overflow-hidden shadow-sm">
        
        {/* Top Control Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2.5 border-b border-white/5 shrink-0">
          
          {/* Left: Active Region Badge & Quick Popular Chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            <div 
              onClick={() => setIsRegionModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-teal-500/30 border border-indigo-500/40 text-xs font-bold text-white shadow-sm cursor-pointer hover:border-teal-400 transition-all shrink-0"
              title="클릭하여 전국 250개 시·군·구 선택기 열기"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-300" />
              <span>{selectedRegionLabel}</span>
              <span className="text-[10px] font-mono text-teal-300 font-normal">({selectedLawdCd})</span>
              <Sparkles className="w-3 h-3 text-teal-300 ml-0.5 animate-pulse" />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {POPULAR_DISTRICT_CHIPS.map((chip) => {
                const isSelected = selectedLawdCd === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => handleSelectRegion(chip.id, `${chip.sido} ${chip.label}`)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-teal-400 text-slate-950 border-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.4)]'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border-white/5'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: 3-Mode View Switcher & Main Tab Toggles */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
            
            {/* View Mode Toggle (Split / List / Map) */}
            {activeTab === 'real-estate' && (
              <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => {
                    setViewMode('split');
                    setIsPanelCollapsed(false);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'split' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="좌측 리스트 + 우측 카카오맵 분할 보기"
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">분할 뷰</span>
                </button>

                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'list' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="매물 리스트 전체화면 보기"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">목록 뷰</span>
                </button>

                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'map' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="카카오맵 전체화면 보기"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">지도 뷰</span>
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

        {/* 3. MAIN WORKSPACE */}
        {activeTab === 'real-estate' ? (
          <div className="flex-1 min-h-0 flex pt-2.5 overflow-hidden gap-3 relative">
            
            {/* Floating Expand Button */}
            {viewMode === 'split' && isPanelCollapsed && (
              <button
                onClick={() => setIsPanelCollapsed(false)}
                className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold px-3.5 py-2 rounded-2xl shadow-2xl border border-indigo-400/40 backdrop-blur-xl transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-teal-300" />
                <span>매물 목록 ({totalElements.toLocaleString()}건) 펼치기</span>
              </button>
            )}

            {/* Left/Main Column: Real Estate List & Filters */}
            {viewMode !== 'map' && (
              <RealEstateListPanel
                transactions={transactions}
                txLoading={txLoading}
                selectedTradeType={selectedTradeType}
                setSelectedTradeType={setSelectedTradeType}
                selectedPropertyType={selectedPropertyType}
                setSelectedPropertyType={setSelectedPropertyType}
                selectedLawdCd={selectedLawdCd}
                selectedRegionLabel={selectedRegionLabel}
                onSelectRegion={handleSelectRegion}
                onOpenRegionModal={() => setIsRegionModalOpen(true)}
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                onPageChange={(p) => loadTransactions(selectedLawdCd, selectedTradeType, selectedPropertyType, p)}
                viewMode={viewMode}
                isPanelCollapsed={isPanelCollapsed}
                onToggleCollapse={setIsPanelCollapsed}
                focusedTx={focusedTx}
                hoveredTxKey={hoveredTxKey}
                onSelectTx={(tx) => {
                  if (viewMode === 'list') {
                    setSelectedTx(tx);
                  } else {
                    setFocusedTx(tx);
                  }
                }}
                onHoverTx={setHoveredTxKey}
                onOpenDetailModal={setSelectedTx}
              />
            )}

            {/* Right Column: Interactive Kakao Map */}
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
          /* WEATHER & CONSUMPTION INTELLIGENCE TAB */
          <WeatherConsumptionDashboard
            currentWeather={currentWeather}
            weatherSeries={weatherSeries}
            selectedRegionLabel={selectedRegionLabel}
          />
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
          onSelectRegion={handleSelectRegion}
          onClose={() => setIsRegionModalOpen(false)}
        />
      )}
    </div>
  );
}
