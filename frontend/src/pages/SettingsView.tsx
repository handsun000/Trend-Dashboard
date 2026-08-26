import React from 'react';
import { Settings, Server, Database, Radio, KeyRound, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SettingsView() {
  return (
    <div className="flex-1 min-h-0 h-full flex flex-col p-4 gap-4 overflow-y-auto font-sans select-none max-w-4xl">
      {/* Top Card */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-3 shrink-0 shadow-sm">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
          <Settings className="text-slate-950 w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-black text-white">시스템 설정 & Open API 파이프라인 관리</h2>
          <p className="text-xs text-slate-400 mt-0.5">외부 증권사, 가상자산 거래소 및 공공데이터 연동 상태를 관리합니다.</p>
        </div>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* KIS API Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">한국투자증권(KIS) OpenAPI</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
              OAuth2 연동됨 🟢
            </span>
          </div>
          <div className="space-y-1 text-xs text-slate-400 font-mono">
            <p className="flex justify-between"><span>인증 엔드포인트</span><span className="text-slate-200">/oauth2/tokenP</span></p>
            <p className="flex justify-between"><span>시세 조회 API</span><span className="text-slate-200">inquire-price</span></p>
            <p className="flex justify-between"><span>보안 격리 파일</span><span className="text-emerald-400">application-secret.yml</span></p>
          </div>
        </div>

        {/* Upbit Open API Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">업비트(Upbit) Open API</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30">
              286 코인 적재 🟢
            </span>
          </div>
          <div className="space-y-1 text-xs text-slate-400 font-mono">
            <p className="flex justify-between"><span>마켓 조회</span><span className="text-slate-200">/v1/market/all</span></p>
            <p className="flex justify-between"><span>실시간 틱 스트림</span><span className="text-slate-200">STOMP /topic/ticks (3s)</span></p>
            <p className="flex justify-between"><span>데이터 적재 방식</span><span className="text-cyan-300">Memory Trie + H2/PG</span></p>
          </div>
        </div>

        {/* Database & Cache Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">인프라 및 데이터베이스</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30">
              정상 구동 중 🟢
            </span>
          </div>
          <div className="space-y-1 text-xs text-slate-400 font-mono">
            <p className="flex justify-between"><span>Primary DB</span><span className="text-slate-200">H2 In-Memory (운영: PostgreSQL)</span></p>
            <p className="flex justify-between"><span>H2 Web Console</span><span className="text-indigo-300">/h2-console</span></p>
            <p className="flex justify-between"><span>배치 데이터 단위</span><span className="text-slate-200">Chunk Size 500</span></p>
          </div>
        </div>

        {/* Theme & Engine Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">2026 Bento UI 엔진</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30">
              Active ✨
            </span>
          </div>
          <div className="space-y-1 text-xs text-slate-400 font-mono">
            <p className="flex justify-between"><span>스크롤 정책</span><span className="text-slate-200">Zero-Scroll (100vh)</span></p>
            <p className="flex justify-between"><span>타이포그래피</span><span className="text-slate-200">Fixed tabular-nums</span></p>
            <p className="flex justify-between"><span>오로라 조명 효과</span><span className="text-teal-300">Cyan & Emerald Ambient</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
