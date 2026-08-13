import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        axios.get(`/api/v1/search?q=${query}`)
          .then(res => {
            setResults(res.data);
            setIsOpen(true);
          })
          .catch(err => console.error(err));
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="종목명, 티커 검색 (예: 삼성전자, 005930)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(results.length > 0) setIsOpen(true); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full h-12 pl-12 pr-4 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-full text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all shadow-2xl"
        />
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute mt-2 w-full bg-slate-900/90 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150">
          {results.map((item, idx) => (
            <div key={idx} className="px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/10 last:border-0 transition-colors flex justify-between items-center text-slate-300">
              <div>
                <p className="text-white font-medium">{item.name}</p>
                <p className="text-slate-400 text-sm">{item.ticker}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">{item.market}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
