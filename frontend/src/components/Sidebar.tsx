import React from 'react';
import { LayoutDashboard, Settings, TrendingUp, BarChart2, ShieldCheck } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-900/40 backdrop-blur-xl border-r border-white/10 text-slate-300 flex flex-col h-full z-20 shadow-2xl">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20">
          <TrendingUp className="text-slate-950 w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">
            TrendDash
          </h1>
          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Terminal Pro</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-6">
        <button className="flex items-center gap-3.5 w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-semibold shadow-2xl backdrop-blur-xl">
          <LayoutDashboard className="w-5 h-5 text-emerald-400" />
          <span>Dashboard</span>
        </button>

        <button className="flex items-center gap-3.5 w-full px-4 py-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl text-slate-400 hover:text-slate-200 transition-all font-medium">
          <BarChart2 className="w-5 h-5" />
          <span>Analytics</span>
        </button>

        <button className="flex items-center gap-3.5 w-full px-4 py-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl text-slate-400 hover:text-slate-200 transition-all font-medium">
          <ShieldCheck className="w-5 h-5" />
          <span>Alert Rules</span>
        </button>

        <button className="flex items-center gap-3.5 w-full px-4 py-3 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl text-slate-400 hover:text-slate-200 transition-all font-medium">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </nav>

      <div className="p-4 m-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">System Live</span>
        </div>
        <p className="text-[11px] text-slate-400">WebSocket / Rest Connected</p>
      </div>
    </div>
  );
}
