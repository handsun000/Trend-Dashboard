import React, { useRef } from 'react';
import { Search, ArrowRightLeft, Calendar, Clock } from 'lucide-react';
import type { BookingMode } from '@/types/korail';

interface TrainSearchBarProps {
  departureStation: string;
  setDepartureStation: (val: string) => void;
  arrivalStation: string;
  setArrivalStation: (val: string) => void;
  onSwapStations: () => void;
  searchDate: string;
  setSearchDate: (val: string) => void;
  searchHour: string;
  setSearchHour: (val: string) => void;
  bookingMode: BookingMode;
  setBookingMode: (mode: BookingMode) => void;
  isSearching: boolean;
  onSearch: () => void;
  majorStations: string[];
}

export const TrainSearchBar: React.FC<TrainSearchBarProps> = ({
  departureStation,
  setDepartureStation,
  arrivalStation,
  setArrivalStation,
  onSwapStations,
  searchDate,
  setSearchDate,
  searchHour,
  setSearchHour,
  bookingMode,
  setBookingMode,
  isSearching,
  onSearch,
  majorStations,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const setQuickDate = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSearchDate(`${yyyy}${mm}${dd}`);
  };

  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shrink-0 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 출발역 / 도착역 */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 px-3 py-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono">출발</span>
            <input
              type="text"
              value={departureStation}
              onChange={(e) => setDepartureStation(e.target.value)}
              className="bg-transparent text-sm font-bold text-white w-20 focus:outline-none"
            />
          </div>

          <button
            onClick={onSwapStations}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
            title="출발/도착역 반전"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 border-l border-white/10">
            <span className="text-[10px] text-slate-400 uppercase font-mono">도착</span>
            <input
              type="text"
              value={arrivalStation}
              onChange={(e) => setArrivalStation(e.target.value)}
              className="bg-transparent text-sm font-bold text-white w-20 focus:outline-none"
            />
          </div>
        </div>

        {/* 날짜 선택 (showPicker + 퀵 선택 버튼) */}
        <div className="flex items-center gap-1.5">
          <div
            onClick={() => dateInputRef.current?.showPicker?.()}
            className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800/90 px-3 py-2 rounded-xl border border-white/10 hover:border-emerald-500/50 text-xs transition-all cursor-pointer group shadow-sm"
            title="클릭하여 달력 열기"
          >
            <Calendar className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform pointer-events-none" />
            <input
              ref={dateInputRef}
              type="date"
              value={
                searchDate && searchDate.length === 8
                  ? `${searchDate.slice(0, 4)}-${searchDate.slice(4, 6)}-${searchDate.slice(6, 8)}`
                  : ''
              }
              onChange={(e) => {
                if (e.target.value) {
                  setSearchDate(e.target.value.replace(/-/g, ''));
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                (e.target as HTMLInputElement).showPicker?.();
              }}
              className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
            />
            <span className="text-[10px] text-emerald-300 font-mono font-medium pointer-events-none">
              {searchDate && searchDate.length === 8
                ? `(${new Date(
                    `${searchDate.slice(0, 4)}-${searchDate.slice(4, 6)}-${searchDate.slice(6, 8)}`
                  ).toLocaleDateString('ko-KR', { weekday: 'short' })})`
                : ''}
            </span>
          </div>

          {/* 퀵 날짜 선택 버튼 */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              내일
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(2)}
              className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              +2일
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(7)}
              className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              +7일
            </button>
          </div>
        </div>

        {/* 시간대 선택 */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-white/10 text-xs">
          <Clock className="w-4 h-4 text-cyan-400" />
          <select
            value={searchHour}
            onChange={(e) => setSearchHour(e.target.value)}
            className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
          >
            <option value="000000" className="bg-slate-900">00:00 이후</option>
            <option value="060000" className="bg-slate-900">06:00 이후</option>
            <option value="080000" className="bg-slate-900">08:00 이후</option>
            <option value="100000" className="bg-slate-900">10:00 이후</option>
            <option value="120000" className="bg-slate-900">12:00 이후</option>
            <option value="140000" className="bg-slate-900">14:00 이후</option>
            <option value="160000" className="bg-slate-900">16:00 이후</option>
            <option value="180000" className="bg-slate-900">18:00 이후</option>
            <option value="200000" className="bg-slate-900">20:00 이후</option>
            <option value="220000" className="bg-slate-900">22:00 이후</option>
          </select>
        </div>

        {/* 사냥 모드 */}
        <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 text-[11px] font-mono">
          <button
            onClick={() => setBookingMode('AUTO_ALL')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              bookingMode === 'AUTO_ALL'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            취소표+대기
          </button>
          <button
            onClick={() => setBookingMode('RESERVE_ONLY')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              bookingMode === 'RESERVE_ONLY'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            취소표만
          </button>
          <button
            onClick={() => setBookingMode('WAIT_ONLY')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              bookingMode === 'WAIT_ONLY'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            예매대기만
          </button>
        </div>

        {/* 검색 실행 버튼 */}
        <button
          onClick={onSearch}
          disabled={isSearching}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        >
          <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
          <span>{isSearching ? '조회 중...' : '실시간 열차 조회'}</span>
        </button>
      </div>

      {/* 주요 역 퀵 태그 */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-white/5 overflow-x-auto text-xs">
        <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">주요역:</span>
        {majorStations.map((stn) => (
          <button
            key={stn}
            onClick={() => {
              if (departureStation !== stn) setArrivalStation(stn);
            }}
            className="px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/10 text-slate-300 text-[11px] font-medium transition-colors"
          >
            {stn}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrainSearchBar;
