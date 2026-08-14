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

  const handleSelect = (item: any) => {
    window.dispatchEvent(new CustomEvent('select-ticker', { detail: item }));
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="종목명, 티커 검색 (예: 카카오, 리플, 005930)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(results.length > 0) setIsOpen(true); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 250)}
          className="w-full h-9 pl-9 pr-3 bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400/50 focus:bg-[#0B132B] transition-all font-medium"
        />
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute mt-1.5 w-full bg-[#0B132B]/95 border border-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto">
          {results.map((item, idx) => (
            <div 
              key={idx} 
              onMouseDown={() => handleSelect(item)}
              className="px-4 py-2.5 hover:bg-white/[0.06] cursor-pointer border-b border-white/5 last:border-0 transition-colors flex justify-between items-center text-slate-200 group"
            >
              <div>
                <p className="text-white font-bold text-xs group-hover:text-emerald-400 transition-colors">{item.name}</p>
                <p className="text-slate-400 text-[11px] font-mono tabular-nums mt-0.5">{item.ticker}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 border border-white/10 font-bold">{item.market}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
