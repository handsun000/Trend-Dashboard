import React from 'react';
import { LayoutDashboard, Settings, TrendingUp, BarChart2, ShieldCheck } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-zinc-950/70 backdrop-blur-xl border-r border-zinc-800/60 text-white flex flex-col h-full rounded-tl-2xl rounded-bl-2xl z-30 shadow-2xl">
      <div className="p-6 flex items-center gap-3 border-b border-zinc-800/40">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
          <TrendingUp className="text-black w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            TrendDash
          </h1>
          <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Pro Terminal</span>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-6">
        <button className="flex items-center gap-3.5 w-full px-4 py-3.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/30 rounded-xl text-emerald-400 font-semibold transition-all shadow-sm shadow-emerald-500/10">
          <LayoutDashboard className="w-5 h-5 text-emerald-400" />
          <span>Dashboard</span>
        </button>
        <button className="flex items-center gap-3.5 w-full px-4 py-3.5 hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800/60 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all font-medium">
          <BarChart2 className="w-5 h-5" />
          <span>Analytics</span>
        </button>
        <button className="flex items-center gap-3.5 w-full px-4 py-3.5 hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800/60 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all font-medium">
          <ShieldCheck className="w-5 h-5" />
          <span>Alert Rules</span>
        </button>
        <button className="flex items-center gap-3.5 w-full px-4 py-3.5 hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800/60 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all font-medium">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </nav>
      <div className="p-4 m-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">System Live</span>
        </div>
        <p className="text-[11px] text-zinc-400">WebSocket / Rest API Connected</p>
      </div>
    </div>
  );
}
