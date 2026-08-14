import React from 'react';
import { LayoutDashboard, Settings, TrendingUp, BarChart2, ShieldCheck } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-56 bg-[#0B132B]/60 backdrop-blur-2xl border-r border-white/5 text-slate-300 flex flex-col h-full z-20 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center gap-2.5 border-b border-white/5">
        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
          <TrendingUp className="text-slate-950 w-4 h-4 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
            <span>TrendDash</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-400 font-mono font-bold">PRO</span>
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-4">
        <button className="flex items-center gap-2.5 w-full px-3 py-2 bg-white/[0.06] border border-white/10 rounded-xl text-emerald-400 text-xs font-bold transition-all">
          <LayoutDashboard className="w-4 h-4 text-emerald-400" />
          <span>대시보드</span>
        </button>

        <button className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-white/[0.03] rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors">
          <BarChart2 className="w-4 h-4" />
          <span>시장 분석</span>
        </button>

        <button className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-white/[0.03] rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors">
          <ShieldCheck className="w-4 h-4" />
          <span>알림 규칙</span>
        </button>

        <button className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-white/[0.03] rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors">
          <Settings className="w-4 h-4" />
          <span>설정</span>
        </button>
      </nav>

      {/* Connection Status Footnote */}
      <div className="p-3 m-3 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Feed Status</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[10px] font-bold text-emerald-400">Live</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 font-mono">KIS & Upbit Connected</p>
      </div>
    </div>
  );
}
