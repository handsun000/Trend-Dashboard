import React, { useState } from 'react';
import GlobalSearch from './GlobalSearch';
import { Bell, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function Header() {
  const [loading, setLoading] = useState(false);

  const handleRunBatch = async () => {
    setLoading(true);
    try {
      await axios.post('/api/v1/batch/run');
    } catch (err) {
      console.error('Batch trigger error:', err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <header className="h-14 bg-[#0B132B]/60 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-5 z-20 shadow-sm shrink-0">
      <div className="flex-1 max-w-md">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleRunBatch}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-xl text-xs shadow-[0_2px_12px_rgba(16,185,129,0.2)] active:scale-95 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">동기화</span>
        </button>

        <button className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all duration-200 relative group">
          <Bell className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 transition-colors" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
        </button>
        
        <div className="flex items-center pl-2 border-l border-white/5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400/80 to-teal-300/80 p-[1.5px] shadow-sm">
            <div className="w-full h-full bg-[#0B132B] rounded-[10px] flex items-center justify-center font-black text-[11px] text-emerald-400">
              TD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
