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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="종목명, 티커 검색 (예: 삼성전자, 005930)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(results.length > 0) setIsOpen(true); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full h-12 pl-12 pr-4 bg-zinc-900/80 border border-zinc-700/50 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
        />
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {results.map((item, idx) => (
            <div key={idx} className="px-4 py-3 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800/50 last:border-0 transition-colors flex justify-between items-center">
              <div>
                <p className="text-white font-medium">{item.name}</p>
                <p className="text-zinc-500 text-sm">{item.ticker}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">{item.market}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
