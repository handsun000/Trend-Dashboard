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
    <header className="h-20 bg-zinc-950/60 backdrop-blur-xl border-b border-zinc-800/60 flex items-center justify-between px-8 z-30 shadow-md">
      <div className="flex-1 max-w-xl">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleRunBatch}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>수동 데이터 동기화 테스트</span>
        </button>

        <button className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 transition-all relative group">
          <Bell className="w-5 h-5 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-2 border-l border-zinc-800/60">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[2px] shadow-lg shadow-emerald-500/10">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center font-bold text-xs text-emerald-400">
              TD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
