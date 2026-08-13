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
    <header className="h-20 bg-slate-900/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 z-20 shadow-2xl">
      <div className="flex-1 max-w-xl">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleRunBatch}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-xl text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>수동 데이터 동기화 테스트</span>
        </button>

        <button className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 transition-all duration-300 relative group shadow-2xl">
          <Bell className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition-colors" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-2 border-l border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 p-[2px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-xs text-emerald-400">
              TD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
