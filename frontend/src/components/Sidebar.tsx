import React from 'react';
import { LayoutDashboard, Settings, TrendingUp, Building2, BellRing, Sparkles, Home } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const navItems = [
    {
      id: 'home',
      label: '인텔리전스 허브',
      subLabel: '쇼케이스 & 홈',
      icon: Sparkles,
      badge: 'PRO',
    },
    {
      id: 'dashboard',
      label: '트레이딩 룸',
      subLabel: '주식 & 코인 실시간',
      icon: LayoutDashboard,
      badge: '1s LIVE',
    },
    {
      id: 'public-data',
      label: '공공데이터 센터',
      subLabel: '부동산·거시·소비',
      icon: Building2,
      badge: 'MAP',
    },
    {
      id: 'alerts',
      label: '알림 센터',
      subLabel: '목표가 감시 규칙',
      icon: BellRing,
    },
    {
      id: 'settings',
      label: '시스템 설정',
      subLabel: 'API & 피드 관리',
      icon: Settings,
    },
  ];

  return (
    <div className="w-60 bg-[#0B132B]/80 backdrop-blur-2xl border-r border-white/10 text-slate-300 flex flex-col h-full z-20 shrink-0 select-none shadow-2xl">
      {/* Brand Header */}
      <div className="p-4 flex items-center gap-3 border-b border-white/5">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <TrendingUp className="text-slate-950 w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
            <span>TrendDash</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-mono font-bold border border-emerald-400/30">PRO</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-mono">Single-Pane Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1.5 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`group flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-400/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 text-left">
                <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <p className={`font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>{item.label}</p>
                  <p className="text-[10px] text-slate-500 font-normal">{item.subLabel}</p>
                </div>
              </div>
              {item.badge && (
                <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                  item.badge === 'LIVE' 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Connection Status Footnote */}
      <div className="p-3.5 m-3 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Market Data Pipe</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[10px] font-bold text-emerald-400">Connected</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-white/5">
          <span>KIS & Upbit 286</span>
          <span className="text-emerald-400 font-bold">STOMP 1s</span>
        </div>
      </div>
    </div>
  );
}

