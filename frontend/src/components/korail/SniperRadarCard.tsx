import React from 'react';
import { Radio, Square } from 'lucide-react';
import type { MonitorEvent } from '@/types/korail';

interface SniperRadarCardProps {
  activeMonitor: MonitorEvent;
  onStopMonitor: () => void;
}

export const SniperRadarCard: React.FC<SniperRadarCardProps> = ({
  activeMonitor,
  onStopMonitor,
}) => {
  if (!activeMonitor || activeMonitor.status !== 'POLLING') return null;

  return (
    <div className="relative p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-emerald-950/40 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-between gap-4 overflow-hidden shrink-0">
      {/* 레이더 펄스 광선 */}
      <div className="absolute top-0 right-0 w-64 h-full bg-cyan-400/5 blur-3xl pointer-events-none"></div>

      <div className="flex items-center gap-4 z-10">
        <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <Radio className="w-6 h-6 animate-pulse" />
          <div className="absolute inset-0 rounded-2xl border border-cyan-400/60 animate-ping opacity-30"></div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-cyan-400/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-400/30">
              SNIPER RADAR ACTIVE
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-400/15 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-400/30 flex items-center gap-1">
              <span>📱</span> TELEGRAM ALERT ON
            </span>
            <h3 className="text-base font-black text-white font-mono">

              {activeMonitor.trainType} {activeMonitor.trainNo}호 ({activeMonitor.route})
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-0.5 font-mono">
            {activeMonitor.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 z-10 font-mono text-xs">
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Attempts</p>
          <p className="text-lg font-black text-cyan-300 tabular-nums">
            {activeMonitor.attempts} <span className="text-xs font-normal text-slate-400">회</span>
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Latency</p>
          <p className="text-lg font-black text-emerald-400 tabular-nums">
            {activeMonitor.lastResponseTimeMs || 320} <span className="text-xs font-normal text-slate-400">ms</span>
          </p>
        </div>

        <button
          onClick={onStopMonitor}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold transition-all active:scale-95"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>사냥 중지</span>
        </button>
      </div>
    </div>
  );
};

export default SniperRadarCard;
