import React from 'react';
import { Target, Square, Zap, ShieldCheck, Clock, ArrowRight, Bell, Sparkles } from 'lucide-react';
import type { TrainSchedule, MonitorEvent } from '@/types/korail';

interface SelectedRadarListProps {
  activeMonitor: MonitorEvent | null;
  selectedTrains: TrainSchedule[];
  onStopMonitor: () => void;
  onRemoveTarget?: (trainNo: string) => void;
  onManualReserve: (train: TrainSchedule, seatType: '1' | '2') => void;
  onManualWait: (train: TrainSchedule) => void;
  onGoToSearchTab: () => void;
}

export const SelectedRadarList: React.FC<SelectedRadarListProps> = ({
  activeMonitor,
  selectedTrains,
  onStopMonitor,
  onRemoveTarget,
  onManualReserve,
  onManualWait,
  onGoToSearchTab,
}) => {
  const isRunning = activeMonitor && activeMonitor.status === 'POLLING';

  // 모니터링 중인 실제 타깃 열차 목록
  const targetTrains = isRunning
    ? (activeMonitor && activeMonitor.targetTrains && activeMonitor.targetTrains.length > 0
        ? activeMonitor.targetTrains
        : selectedTrains)
    : selectedTrains;

  if (!isRunning && targetTrains.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/20 rounded-2xl border border-white/5 m-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
          <Target className="w-8 h-8 opacity-80" />
        </div>
        <span className="text-[11px] font-mono tracking-widest text-amber-400 font-bold uppercase mb-1">
          02 / MULTI-TARGET RADAR EMPTY
        </span>
        <h3 className="text-xl font-black text-white font-serif tracking-tight mb-2">
          현재 사냥 중인 열차가 없습니다
        </h3>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6 font-sans">
          [전체 열차 검색] 탭에서 원하는 시간대의 열차들을 체크박스로 다중 선택한 후, <br />
          <span className="text-amber-300 font-bold">'선택 열차 동시 사냥 시작'</span>을 누르면 이곳에서 집중 감시됩니다.
        </p>
        <button
          onClick={onGoToSearchTab}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>전체 열차 검색으로 이동하여 선택하기</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-950/40 rounded-2xl border border-white/10 p-5 overflow-hidden select-none m-4">
      {/* 1. 상단 사냥 레이더 헤더 & 통제 바 */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-lg">
            <Target className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
            {isRunning && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black text-amber-400 tracking-wider uppercase">
                TARGET SNIPER RADAR
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-mono text-emerald-300 font-bold">
                <ShieldCheck className="w-3 h-3" />
                <span>WAF 방어 배치 스캔 중 (트래픽 1x)</span>
              </span>
            </div>
            <h3 className="text-lg font-black text-white font-serif tracking-tight flex items-center gap-2">
              <span>{isRunning ? '현재 사냥 중인 관심 열차' : '선택된 관심 열차'}</span>
              <span className="text-amber-400 font-mono text-sm font-normal">
                ({targetTrains.length}대 {isRunning ? '동시 추적 중' : '대기'})
              </span>
            </h3>
          </div>
        </div>

        {/* 액션 컨트롤 */}
        <div className="flex items-center gap-3">
          {isRunning ? (
            <button
              onClick={onStopMonitor}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-rose-500/10"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>전체 사냥 중지</span>
            </button>
          ) : (
            <span className="text-xs font-mono text-slate-500">대기 상태</span>
          )}
        </div>
      </div>

      {/* 2. 상태 서머리 뱃지 바 */}
      {isRunning && activeMonitor && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 flex items-center justify-between gap-4 text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>상태: <strong className="text-amber-300">{activeMonitor.message}</strong></span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>시도 횟수: <strong className="text-white tabular-nums">{activeMonitor.attempts}회</strong></span>
            <span>응답속도: <strong className="text-emerald-400 tabular-nums">{activeMonitor.lastResponseTimeMs}ms</strong></span>
            <span>최근수신: <strong className="text-slate-200 tabular-nums">{activeMonitor.timestamp}</strong></span>
          </div>
        </div>
      )}

      {/* 3. 선택된 관심 열차 리스트 */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0 custom-scrollbar">
        {targetTrains.map((train, idx) => {
          return (
            <div
              key={train.trainNo}
              className="relative p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 transition-all flex flex-wrap items-center justify-between gap-4 group"
            >
              {/* 좌측: 인덱스 & 열차 정보 */}
              <div className="flex items-center gap-4 min-w-[240px]">
                <div className="text-center w-8">
                  <span className="text-[10px] font-mono text-slate-500 font-bold block">
                    #{String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-cyan-400/80 mx-auto mt-1 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono font-black">
                      {train.trainType} {train.trainNo}호
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {train.runTime || '소요시간 미정'}
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-100 flex items-center gap-2 mt-1 font-sans">
                    <span>{train.departureStation}</span>
                    <span className="text-sm font-mono text-amber-400 font-bold">{train.departureTime}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span>{train.arrivalStation}</span>
                    <span className="text-sm font-mono text-cyan-400 font-bold">{train.arrivalTime}</span>
                  </div>
                </div>
              </div>

              {/* 중앙: 실시간 좌석 및 예매대기 상태 */}
              <div className="flex items-center gap-3 shrink-0">
                {/* 일반실 */}
                <div className="text-center w-24">
                  <span className="block text-[10px] text-slate-400 mb-0.5">일반실</span>
                  {train.generalAvailable ? (
                    <button
                      onClick={() => onManualReserve(train, '1')}
                      className="w-full py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-black animate-pulse transition-all active:scale-95"
                    >
                      취소표 예약
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
                      className="w-full py-1 px-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-black animate-pulse transition-all active:scale-95"
                    >
                      특실 예약
                    </button>
                  ) : (
                    <span className="block py-1 px-2 rounded-lg bg-white/[0.03] text-slate-500 text-xs font-medium border border-white/5">
                      매진
                    </span>
                  )}
                </div>

                {/* 예매대기 */}
                <div className="text-center w-32">
                  <span className="block text-[10px] text-slate-400 mb-0.5">예매대기</span>
                  {train.waitAvailable ? (
                    <button
                      onClick={() => onManualWait(train)}
                      className="w-full py-1 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center justify-center gap-1 transition-all active:scale-95"
                    >
                      <Bell className="w-3 h-3 fill-current" />
                      <span>신청가능({train.waitQueueCount}명)</span>
                    </button>
                  ) : (
                    <span className="block py-1 px-2 rounded-lg bg-white/[0.03] text-slate-500 text-xs font-medium border border-white/5">
                      마감
                    </span>
                  )}
                </div>
              </div>

              {/* 우측: 타깃 상태 표시 또는 제거 */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[11px] font-mono font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>사냥 추적 중</span>
                </span>
                {onRemoveTarget && !isRunning && (
                  <button
                    onClick={() => onRemoveTarget(train.trainNo)}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-rose-500/20 hover:text-rose-300 text-slate-500 transition-colors"
                    title="타깃 목록에서 제거"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default SelectedRadarList;
