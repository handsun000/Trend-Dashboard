import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, X, Sparkles, Building2, ChevronRight, Check } from 'lucide-react';

export interface RegionSummary {
  lawdCd: string;
  sgg: string;
  fullName: string;
  isHotspot: boolean;
}

export interface SidoHierarchy {
  sido: string;
  sggList: RegionSummary[];
}

export interface RegionInfo {
  lawdCd: string;
  sido: string;
  sgg: string;
  fullName: string;
  shortName: string;
  aliases: string[];
  isHotspot: boolean;
}

interface RegionSelectorModalProps {
  currentLawdCd: string;
  currentRegionName: string;
  onSelectRegion: (lawdCd: string, regionName: string) => void;
  onClose: () => void;
}

export default function RegionSelectorModal({
  currentLawdCd,
  currentRegionName,
  onSelectRegion,
  onClose,
}: RegionSelectorModalProps) {
  const [hierarchy, setHierarchy] = useState<SidoHierarchy[]>([]);
  const [selectedSido, setSelectedSido] = useState<string>('서울특별시');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<RegionInfo[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load Hierarchy
  useEffect(() => {
    const fetchHierarchy = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get<SidoHierarchy[]>('/api/v1/public-data/regions/hierarchy');
        setHierarchy(res.data);
        if (res.data.length > 0 && !selectedSido) {
          setSelectedSido(res.data[0].sido);
        }
      } catch (err) {
        console.error('Failed to load region hierarchy:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHierarchy();
  }, []);

  // Search autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get<RegionInfo[]>(
          `/api/v1/public-data/regions/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        setSearchResults(res.data);
      } catch (e) {
        console.error('Failed to search regions:', e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const activeSggList = hierarchy.find(h => h.sido === selectedSido)?.sggList || [];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none font-sans"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900/95 border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                전국 250개 시·군·구 실거래 지역 탐색
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold">
                  국토교통부 표준
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                원하는 지역명을 검색하거나 시·도별 목록에서 선택하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/5 bg-white/[0.01]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="시·군·구 또는 동/단지명 검색 (예: 여의도, 판교, 해운대, 수원 영통, 송도, 성수동)"
              className="w-full bg-black/40 border border-white/10 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Search Results or 2-Col Hierarchy Navigator */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-[320px]">
          {searchQuery.trim() ? (
            /* Search Results View */
            <div>
              <div className="text-xs font-mono text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>검색 결과: <strong className="text-white">{searchResults.length}</strong>건</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  검색 결과가 없습니다. 다른 검색어를 입력해 보세요.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.map((r) => {
                    const isSelected = currentLawdCd === r.lawdCd;
                    return (
                      <button
                        key={r.lawdCd}
                        onClick={() => {
                          onSelectRegion(r.lawdCd, r.fullName);
                          onClose();
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-white shadow-sm'
                            : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 text-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{r.fullName}</span>
                            {r.isHotspot && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                                인기
                              </span>
                            )}
                          </div>
                          {r.aliases && r.aliases.length > 0 && (
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                              {r.aliases.slice(0, 5).join(' · ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {isSelected ? (
                            <span className="p-1 rounded-full bg-indigo-500 text-slate-950 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-slate-500">{r.lawdCd}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* 2-Column Hierarchy View (Sido Tabs on Left, SGG Grid on Right) */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              
              {/* Sido List Column */}
              <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-white/10 pr-0 md:pr-3 overflow-y-auto max-h-[360px] space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                  17개 광역시·도
                </div>
                {hierarchy.map((h) => {
                  const isCurrentSido = selectedSido === h.sido;
                  return (
                    <button
                      key={h.sido}
                      onClick={() => setSelectedSido(h.sido)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
                        isCurrentSido
                          ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                      }`}
                    >
                      <span>{h.sido}</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isCurrentSido ? 'text-indigo-400' : 'text-slate-600'}`} />
                    </button>
                  );
                })}
              </div>

              {/* SGG Grid Column */}
              <div className="md:col-span-2 overflow-y-auto max-h-[360px] pl-0 md:pl-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>{selectedSido} 산하 시·군·구</span>
                  <span className="font-mono text-[10px] text-slate-500">{activeSggList.length}개 지역</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeSggList.map((sgg) => {
                    const isSelected = currentLawdCd === sgg.lawdCd;
                    return (
                      <button
                        key={sgg.lawdCd}
                        onClick={() => {
                          onSelectRegion(sgg.lawdCd, sgg.fullName);
                          onClose();
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-white shadow-sm'
                            : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white truncate">{sgg.sgg}</span>
                          {sgg.isHotspot && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 shrink-0">
                              HOT
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>{sgg.lawdCd}</span>
                          {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer: Current Selection */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">현재 선택:</span>
            <span className="font-bold text-white flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              {currentRegionName || '전국 전체'}
            </span>
          </div>
          <button
            onClick={() => {
              onSelectRegion('ALL', '전국 주요 핵심 지역');
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-bold transition-all cursor-pointer text-xs"
          >
            전국 종합 모드로 보기
          </button>
        </div>

      </div>
    </div>
  );
}
