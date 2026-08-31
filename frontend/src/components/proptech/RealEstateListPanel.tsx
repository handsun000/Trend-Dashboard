import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Search, 
  X, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Building, 
  Home, 
  Coins, 
  Key
} from 'lucide-react';
import axios from 'axios';
import type { RealEstateTx } from '@/hooks/usePublicData';
import type { RegionInfo, SidoHierarchy } from '@/components/RegionSelectorModal';

interface RealEstateListPanelProps {
  transactions: RealEstateTx[];
  txLoading: boolean;
  selectedTradeType: string;
  setSelectedTradeType: (t: string) => void;
  selectedPropertyType: string;
  setSelectedPropertyType: (p: string) => void;
  selectedLawdCd: string;
  selectedRegionLabel: string;
  onSelectRegion: (lawdCd: string, fullName: string) => void;
  onOpenRegionModal: () => void;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (p: number) => void;
  viewMode: 'split' | 'list' | 'map';
  isPanelCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  focusedTx: RealEstateTx | null;
  hoveredTxKey: string | null;
  onSelectTx: (tx: RealEstateTx) => void;
  onHoverTx: (key: string | null) => void;
  onOpenDetailModal: (tx: RealEstateTx) => void;
}

const PROPERTY_TYPE_TABS = [
  { id: 'ALL', label: '전체 매물', icon: Layers },
  { id: 'APT', label: '아파트', icon: Building2 },
  { id: 'OFFI', label: '오피스텔', icon: Building },
  { id: 'VILLA', label: '빌라/연립', icon: Home },
];

const TRADE_TYPE_TABS = [
  { id: 'ALL', label: '전체', icon: Layers },
  { id: 'TRADE', label: '매매', icon: Coins },
  { id: 'JEONSE', label: '전세', icon: Key },
  { id: 'RENT', label: '월세', icon: Home },
];

export default function RealEstateListPanel({
  transactions,
  txLoading,
  selectedTradeType,
  setSelectedTradeType,
  selectedPropertyType,
  setSelectedPropertyType,
  selectedLawdCd,
  selectedRegionLabel: _selectedRegionLabel,
  onSelectRegion,
  onOpenRegionModal,
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
  viewMode,
  isPanelCollapsed,
  onToggleCollapse,
  focusedTx,
  hoveredTxKey,
  onSelectTx,
  onHoverTx,
  onOpenDetailModal,
}: RealEstateListPanelProps) {
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [quickSearchResults, setQuickSearchResults] = useState<RegionInfo[]>([]);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const quickSearchRef = useRef<HTMLDivElement>(null);

  const [hierarchy, setHierarchy] = useState<SidoHierarchy[]>([]);
  const [selectedSido, setSelectedSido] = useState<string>('서울특별시');

  useEffect(() => {
    axios.get<SidoHierarchy[]>('/api/v1/public-data/regions/hierarchy')
      .then(res => setHierarchy(res.data))
      .catch(err => console.error('Failed hierarchy fetch:', err));
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickSearchRef.current && !quickSearchRef.current.contains(event.target as Node)) {
        setIsQuickSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeSggList = hierarchy.find(h => h.sido === selectedSido)?.sggList || [];

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 relative ${
      viewMode === 'split' 
        ? isPanelCollapsed
          ? 'w-0 opacity-0 pointer-events-none -translate-x-full p-0 overflow-hidden'
          : 'w-full lg:w-[480px] xl:w-[520px] shrink-0 bg-[#0B132B]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 shadow-2xl z-20' 
        : 'w-full'
    }`}>
      
      {/* TIER 1: Property Type & Trade Type Tabs */}
      <div className="flex flex-col gap-1.5 shrink-0 pb-2 border-b border-white/5">
        {viewMode === 'split' && (
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>실시간 실거래 탐색</span>
            </span>
            <button
              onClick={() => onToggleCollapse(true)}
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
              </button>
            );
          })}
        </div>

        {/* Row 2: Trade Type Selector */}
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-none">
          {TRADE_TYPE_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = selectedTradeType === t.id;
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
              </button>
            );
          })}
        </div>
      </div>

      {/* TIER 2: Search Bar + 2-Tier Dropdown */}
      <div className="py-2 border-b border-white/5 flex flex-col gap-1.5 shrink-0 bg-white/[0.01] px-1 rounded-xl">
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

          {/* Dropdown Popup */}
          {isQuickSearchOpen && quickSearchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-indigo-500/40 rounded-xl shadow-2xl z-40 max-h-56 overflow-y-auto p-1.5 space-y-1">
              {quickSearchResults.map((r) => (
                <button
                  key={r.lawdCd}
                  onClick={() => {
                    onSelectRegion(r.lawdCd, r.fullName);
                    setQuickSearchQuery('');
                    setIsQuickSearchOpen(false);
                  }}
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

        {/* 2-Tier Sido/Sgg Selector */}
        <div className="flex items-center gap-1.5">
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

          <div className="relative flex-1">
            <select
              value={selectedLawdCd}
              onChange={(e) => {
                const targetCd = e.target.value;
                const found = activeSggList.find(s => s.lawdCd === targetCd);
                onSelectRegion(targetCd, found ? found.fullName : selectedSido);
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

          <button
            onClick={onOpenRegionModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-xs font-bold text-teal-300 hover:text-white transition-all cursor-pointer shrink-0 shadow-sm"
            title="전국 250개 시군구 전용 모달 열기"
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>지도탐색</span>
          </button>
        </div>
      </div>

      {/* TIER 3: Transaction Card Feed */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 py-2 pr-1 scrollbar-thin">
        {txLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-300">국토교통부 실시간 실거래가 수집 중...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-slate-400">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">조건에 일치하는 실거래 내역이 없습니다.</p>
          </div>
        ) : (
          transactions.map((tx, idx) => {
            const key = `${tx.complexName}_${tx.tradeDate}_${idx}`;
            const isFocused = focusedTx?.complexName === tx.complexName && focusedTx?.tradeDate === tx.tradeDate;
            const isHovered = hoveredTxKey === key;

            return (
              <div
                key={key}
                onClick={() => onSelectTx(tx)}
                onMouseEnter={() => onHoverTx(key)}
                onMouseLeave={() => onHoverTx(null)}
                className={`bg-white/[0.02] hover:bg-white/[0.05] border rounded-xl p-3 transition-all cursor-pointer flex flex-col gap-2 relative group ${
                  isFocused
                    ? 'border-teal-400 bg-teal-950/20 shadow-[0_0_20px_rgba(20,184,166,0.2)]'
                    : isHovered
                    ? 'border-indigo-500/50 bg-indigo-950/10'
                    : 'border-white/5'
                }`}
              >
                {/* Header Row */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {tx.propertyTypeLabel || '아파트 🏢'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300">
                      {tx.tradeType || tx.dealCategory}
                    </span>
                    {tx.status && (
                      <span className="text-[10px] font-bold text-emerald-400">
                        {tx.status}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{tx.tradeDate}</span>
                </div>

                {/* Complex Name & Price */}
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black text-white group-hover:text-teal-300 transition-colors truncate">
                    {tx.complexName}
                  </h4>
                  <p className="text-sm font-black font-mono text-teal-300 shrink-0">
                    {tx.tradePriceWon || tx.formattedPrice}
                  </p>
                </div>

                {/* Sub info: Area, Floor, Build Year */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{tx.area} • {tx.floor}</span>
                  <div className="flex items-center gap-2">
                    <span>{tx.buildYear}년 준공</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetailModal(tx);
                      }}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-teal-500 hover:text-slate-950 text-slate-300 font-bold transition-all text-[10px]"
                    >
                      상세 ↗
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <span>총 {totalElements.toLocaleString()}건 ({currentPage}/{totalPages}P)</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (p > totalPages || p < 1) return null;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                    currentPage === p ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-400'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
