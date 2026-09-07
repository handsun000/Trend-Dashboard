import React from 'react';
import { Train, Zap, Square } from 'lucide-react';
import type { TrainSchedule, MonitorEvent, BookingMode } from '@/types/korail';
import { LoadingState, EmptyState } from '@/components/common';

interface TrainScheduleListProps {
  trains: TrainSchedule[];
  searchDate: string;
  isSearching: boolean;
  activeMonitor: MonitorEvent | null;
  onManualReserve: (train: TrainSchedule, seatType: '1' | '2') => void;
  onManualWait: (train: TrainSchedule) => void;
  onStartMonitor: (train: TrainSchedule, modeOverride?: BookingMode) => void;
  onStopMonitor: () => void;
}

export const TrainScheduleList: React.FC<TrainScheduleListProps> = ({
  trains,
  searchDate,
  isSearching,
  activeMonitor,
  onManualReserve,
  onManualWait,
  onStartMonitor,
  onStopMonitor,
}) => {
  return (
    <div className="flex-1 min-h-0 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl overflow-hidden flex flex-col">
      {/* 테이블 헤더 및 범례 */}
      <div className="px-5 py-3 border-b border-white/10 bg-slate-900/40 flex items-center justify-between shrink-0 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white">열차 목록</span>
          {searchDate && searchDate.length === 8 && (
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[11px]">
              📅 {searchDate.slice(0, 4)}.{searchDate.slice(4, 6)}.{searchDate.slice(6, 8)} (
              {new Date(
                `${searchDate.slice(0, 4)}-${searchDate.slice(4, 6)}-${searchDate.slice(6, 8)}`
              ).toLocaleDateString('ko-KR', { weekday: 'short' })}
              )
            </span>
          )}
          <span className="text-[11px] text-slate-400">({trains.length}개 검색됨)</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 좌석있음
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> 예매대기 가능
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-600"></span> 매진
          </span>
        </div>
      </div>

      {/* 스크롤 가능한 열차 리스트 */}
      <div
        className={`flex-1 overflow-y-auto divide-y divide-white/5 relative transition-opacity ${
          isSearching && trains.length > 0 ? 'opacity-60' : 'opacity-100'
        }`}
      >
        {isSearching && trains.length === 0 ? (
          <LoadingState
            variant="skeleton-table"
            title="코레일 실시간 열차 및 잔여석 정보 수신 중..."
            count={5}
            className="p-4"
          />
        ) : trains.length === 0 ? (
          <EmptyState
            icon={Train}
            title="조회된 열차가 없습니다."
            description="상단 검색바에서 출발/도착역과 날짜, 시간대를 선택한 후 [실시간 열차 조회] 버튼을 눌러주세요."
            className="h-full"
          />
        ) : (
          trains.map((train) => {
            const isTarget =
              activeMonitor?.trainNo === train.trainNo && activeMonitor?.status === 'POLLING';

            return (
              <div
                key={train.trainNo}
                className={`p-4 transition-colors flex items-center justify-between gap-4 ${
                  isTarget ? 'bg-cyan-950/20 border-l-4 border-cyan-400' : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* 열차 정보 */}
                <div className="flex items-center gap-4 w-52 shrink-0">
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-center min-w-[3.5rem]">
                    <span className="block text-[10px] text-emerald-400 font-bold">
                      {train.trainType}
                    </span>
                    <span className="block text-sm font-black text-white font-mono">
                      {train.trainNo}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{train.departureStation}</span>
                      <span className="text-slate-500 text-xs">➡️</span>
                      <span className="text-xs font-bold text-white">{train.arrivalStation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-emerald-300/90 font-mono font-medium">
                        {train.departureDate
                          ? `${train.departureDate.slice(4, 6)}.${train.departureDate.slice(6, 8)}`
                          : ''}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">·</span>
                      <span className="text-[11px] text-slate-400 font-mono">소요 {train.runTime}</span>
                    </div>
                  </div>
                </div>

                {/* 시간 & 요금 */}
                <div className="flex items-center gap-6 font-mono text-center">
                  <div>
                    <span className="block text-base font-black text-white">{train.departureTime}</span>
                    <span className="block text-[10px] text-slate-400">출발</span>
                  </div>
                  <div className="text-slate-600 text-xs">···</div>
                  <div>
                    <span className="block text-base font-black text-slate-300">{train.arrivalTime}</span>
                    <span className="block text-[10px] text-slate-400">도착</span>
                  </div>
                  <div className="text-right ml-4">
                    <span className="block text-xs font-bold text-slate-300">
                      {train.price > 0 ? `${train.price.toLocaleString()}원` : '-'}
                    </span>
                    <span className="block text-[10px] text-slate-500">일반실 요금</span>
                  </div>
                </div>

                {/* 좌석 상태 뱃지들 */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* 일반실 */}
                  <div className="text-center w-24">
                    <span className="block text-[10px] text-slate-400 mb-0.5">일반실</span>
                    {train.generalAvailable ? (
                      <button
                        onClick={() => onManualReserve(train, '1')}
                        className="w-full py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all active:scale-95"
                      >
                        예약가능
                      </button>
                    ) : (
                      <span className="block py-1 px-2 rounded-lg bg-white/[0.03] text-slate-500 text-xs font-medium border border-white/5">
                        매진
                      </span>
                    )}
                  </div>

                  {/* 특실 */}
                  <div className="text-center w-24">
                    <span className="block text-[10px] text-slate-400 mb-0.5">특실</span>
                    {train.specialAvailable ? (
                      <button
                        onClick={() => onManualReserve(train, '2')}
                        className="w-full py-1 px-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all active:scale-95"
                      >
                        예약가능
                      </button>
                    ) : (
                      <span className="block py-1 px-2 rounded-lg bg-white/[0.03] text-slate-500 text-xs font-medium border border-white/5">
                        매진
                      </span>
                    )}
                  </div>

                  {/* 예매대기 */}
                  <div className="text-center w-28">
                    <span className="block text-[10px] text-slate-400 mb-0.5">예매대기</span>
                    {train.waitAvailable ? (
                      <button
                        onClick={() => onManualWait(train)}
                        className="w-full py-1 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95"
                      >
                        신청가능({train.waitQueueCount}명)
                      </button>
                    ) : (
                      <span className="block py-1 px-2 rounded-lg bg-white/[0.03] text-slate-500 text-xs font-medium border border-white/5">
                        마감
                      </span>
                    )}
                  </div>
                </div>

                {/* 액션: 자동 사냥 시작/중지 */}
                <div className="w-40 shrink-0 flex flex-col gap-1 text-right">
                  {isTarget ? (
                    <button
                      onClick={onStopMonitor}
                      className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>사냥 중지</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onStartMonitor(train)}
                        className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:brightness-110 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>자동 사냥 시작</span>
                      </button>
                      {!train.generalAvailable && !train.specialAvailable && (
                        <button
                          onClick={() => onStartMonitor(train, 'WAIT_ONLY')}
                          className="w-full py-1 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                          title="좌석 매진 시 예매대기(SMS 알림) 슬롯이 오픈되는 즉시 접수"
                        >
                          <span>⏳ 대기만 사냥</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TrainScheduleList;
