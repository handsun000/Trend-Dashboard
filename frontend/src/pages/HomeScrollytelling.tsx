import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Building2, 
  LayoutGrid, 
  ArrowRight, 
  Zap, 
  MousePointer2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface HomeScrollytellingProps {
  onNavigate: (view: string) => void;
}

export default function HomeScrollytelling({ onNavigate }: HomeScrollytellingProps) {
  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const animTargetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Smooth Momentum / Lerp Physics Animation Loop
  useEffect(() => {
    const updatePhysics = () => {
      setProgress((prev) => {
        const diff = animTargetRef.current - prev;
        if (Math.abs(diff) < 0.001) {
          return animTargetRef.current;
        }
        return prev + diff * 0.14; // smooth fluid damping
      });
      rafRef.current = requestAnimationFrame(updatePhysics);
    };

    rafRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Direct Wheel Event Handler: Mouse wheel anywhere on stage changes progress smoothly
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY * 0.0009;
    animTargetRef.current = Math.min(1.0, Math.max(0.0, animTargetRef.current + delta));
  };

  // Jump to specific progress step
  const setTargetProgress = (target: number) => {
    animTargetRef.current = Math.min(1.0, Math.max(0.0, target));
  };

  // Helper for interpolating values
  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
  
  // Phase 1 (Trading): 0.05 to 0.35
  const t1 = clamp((progress - 0.05) / 0.28, 0, 1);
  // Phase 2 (Gemini AI): 0.28 to 0.58
  const t2 = clamp((progress - 0.28) / 0.28, 0, 1);
  // Phase 3 (PropTech): 0.50 to 0.78
  const t3 = clamp((progress - 0.50) / 0.28, 0, 1);
  // Phase 4 (Heatmap/Portfolio): 0.70 to 0.96
  const t4 = clamp((progress - 0.70) / 0.26, 0, 1);

  // Intro fade out as cards assemble
  const introOpacity = clamp(1 - (progress * 2.6), 0, 1);
  const introScale = clamp(1 - (progress * 0.25), 0.75, 1);

  return (
    <div 
      onWheel={handleWheel}
      className="relative w-full h-full min-h-0 flex flex-col p-4 md:p-6 select-none font-sans overflow-hidden bg-[#0B132B]/90 backdrop-blur-3xl"
    >
      {/* 1. Ambient Dynamic Backlight */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="absolute -top-32 left-1/4 w-[42rem] h-[42rem] rounded-full bg-emerald-500/15 blur-[140px] transition-all duration-700" 
          style={{ 
            opacity: 0.25 + progress * 0.6,
            transform: `scale(${0.8 + progress * 0.4}) translate(${progress * 40}px, ${progress * 20}px)`
          }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[42rem] h-[42rem] rounded-full bg-cyan-500/15 blur-[140px] transition-all duration-700" 
          style={{ 
            opacity: 0.2 + progress * 0.6,
            transform: `scale(${0.8 + progress * 0.4}) translate(${progress * -40}px, ${progress * -20}px)`
          }}
        />
      </div>

      {/* 2. Dynamic Center Stage Header (Assembles into top bar) */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center text-center transition-all duration-300 pointer-events-none shrink-0 my-auto"
        style={{
          opacity: introOpacity,
          transform: `scale(${introScale}) translateY(${progress * -50}px)`,
          display: introOpacity <= 0.02 ? 'none' : 'flex',
        }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold mb-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
          <span>PINNED BENTO ASSEMBLY INTELLIGENCE</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
          TrendDash <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">PRO Hub</span>
        </h1>
        <p className="text-sm md:text-base text-slate-300 mt-2.5 max-w-xl font-medium leading-relaxed">
          마우스 휠을 아래로 굴리면 흩어져 있던 데이터 모듈이 자석처럼 제자리로 조립됩니다.
        </p>

        <div className="flex items-center gap-2.5 mt-5 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 font-mono animate-bounce">
          <MousePointer2 className="w-4 h-4 text-emerald-400" />
          <span>휠을 아래로 굴리거나 하단 타임라인을 클릭하세요 (Scroll to Assemble)</span>
        </div>
      </div>

      {/* 3. Top Mini Ribbon when assembled */}
      <div 
        className="relative z-20 flex justify-between items-center pb-2.5 border-b border-white/5 shrink-0 transition-opacity duration-300"
        style={{ opacity: clamp((progress - 0.15) * 2.5, 0, 1) }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-sm font-black text-white tracking-tight">TrendDash Pro Assembled Workspace</span>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
            {progress >= 0.95 ? '100% COMPLETE' : `${Math.round(progress * 100)}% ASSEMBLING`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTargetProgress(progress >= 0.95 ? 0 : 1)}
            className="px-3 py-1 text-xs font-mono font-bold rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>{progress >= 0.95 ? '블록 다시 분해' : '⚡ 즉시 전체 조립'}</span>
          </button>
        </div>
      </div>

      {/* 4. 2x2 Bento Magnetic Assembly Canvas */}
      <div className="relative z-10 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3.5 md:gap-4 mt-2">
        
        {/* ============================================================ */}
        {/* BENTO CARD 1: TradingView 1s Live Trading Room (Top Left)     */}
        {/* ============================================================ */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className={`group relative bg-white/[0.02] hover:bg-white/[0.05] border rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden shadow-2xl backdrop-blur-xl ${
            t1 >= 0.9 ? 'border-emerald-500/40 hover:border-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.2)]' : 'border-white/10'
          }`}
          style={{
            transform: `
              translate3d(${(1 - t1) * -140}px, ${(1 - t1) * -90}px, 0)
              rotate(${(1 - t1) * -12}deg)
              scale(${0.75 + t1 * 0.25})
            `,
            opacity: 0.15 + t1 * 0.85,
            filter: `blur(${(1 - t1) * 6}px)`,
          }}
        >
          <div className="absolute top-0 left-0 w-28 h-28 bg-emerald-500/10 rounded-br-full blur-xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-black shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">01 / LIVE ENGINE</span>
                  <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                    트레이딩 룸 & 1초 틱 스트림
                  </h3>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold animate-pulse">
                STOMP 1s LIVE
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
              TradingView 경량 캔들 차트 탑재. 1초 주기 실시간 틱 수신, MA(5/20/60/120), 볼린저밴드, 거래량 및 10호가창 통합.
            </p>

            {/* Mini Interactive Preview Graphic */}
            <div className="mt-3 bg-slate-950/70 border border-white/5 rounded-2xl p-3 flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">삼성전자 (005930)</span>
                <span className="text-base font-black text-emerald-400 tabular-nums">₩78,500</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">비트코인 (KRW-BTC)</span>
                <span className="text-base font-black text-cyan-300 tabular-nums">₩88,935,000</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-400 mt-2">
            <span className="font-mono text-[11px] text-slate-400">KIS 주식 2,500+ & Upbit 287 코인</span>
            <div className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
              <span>트레이딩 룸 바로가기</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BENTO CARD 2: Google Gemini 1.5 Flash AI News (Top Right)     */}
        {/* ============================================================ */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className={`group relative bg-white/[0.02] hover:bg-white/[0.05] border rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden shadow-2xl backdrop-blur-xl ${
            t2 >= 0.9 ? 'border-teal-500/40 hover:border-teal-400/80 shadow-[0_0_35px_rgba(20,184,166,0.2)]' : 'border-white/10'
          }`}
          style={{
            transform: `
              translate3d(${(1 - t2) * 150}px, ${(1 - t2) * -80}px, 0)
              rotate(${(1 - t2) * 10}deg)
              scale(${0.75 + t2 * 0.25})
            `,
            opacity: 0.15 + t2 * 0.85,
            filter: `blur(${(1 - t2) * 6}px)`,
          }}
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-teal-500/10 rounded-bl-full blur-xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950 font-black shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider block">02 / AI INTELLIGENCE</span>
                  <h3 className="text-base font-black text-white group-hover:text-teal-300 transition-colors">
                    Gemini 1.5 Flash 실시간 뉴스 & AI
                  </h3>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold">
                AI 3-LINE BRIEF
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
              실시간 경제 속보 전수 분석. Gemini AI가 핵심 3줄 브리핑과 호재/악재 지수(-100~+100), 연관 섹터 태그를 산출.
            </p>

            {/* Mini AI Preview Box */}
            <div className="mt-3 bg-slate-950/70 border border-white/5 rounded-2xl p-2.5 space-y-1 text-xs">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-slate-400">종합 감성 스코어</span>
                <span className="text-emerald-400 font-bold">82% (강한 호재 🟢)</span>
              </div>
              <p className="text-[11px] text-slate-300 truncate font-mono">
                "01. 삼전·닉스 자사주 매입 및 AI HBM 메모리 공급 확대..."
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-bold text-teal-400 mt-2">
            <span className="font-mono text-[11px] text-slate-400">15분 TTL 고속 캐시 & Fallback</span>
            <div className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
              <span>AI 뉴스 피드 입장</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BENTO CARD 3: KakaoMap PropTech & Public Data (Bottom Left)   */}
        {/* ============================================================ */}
        <div 
          onClick={() => onNavigate('public-data')}
          className={`group relative bg-white/[0.02] hover:bg-white/[0.05] border rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden shadow-2xl backdrop-blur-xl ${
            t3 >= 0.9 ? 'border-cyan-500/40 hover:border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.2)]' : 'border-white/10'
          }`}
          style={{
            transform: `
              translate3d(${(1 - t3) * -150}px, ${(1 - t3) * 90}px, 0)
              rotate(${(1 - t3) * -8}deg)
              scale(${0.75 + t3 * 0.25})
            `,
            opacity: 0.15 + t3 * 0.85,
            filter: `blur(${(1 - t3) * 6}px)`,
          }}
        >
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-cyan-500/10 rounded-tr-full blur-xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <Building2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">03 / PROPTECH & MACRO</span>
                  <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                    카카오맵 공공데이터 센터
                  </h3>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                MAP CLUSTER
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
              국토교통부 아파트/오피스텔 전국 실거래가, 정밀 지오코딩 & 안티-콜리전 엔진, 기상청 ASOS 날씨 & 계절 소비 지수.
            </p>

            {/* Mini Map Highlight Box */}
            <div className="mt-3 bg-slate-950/70 border border-white/5 rounded-2xl p-2.5 flex items-center justify-between font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">전국 단지 지오코딩</span>
                <span className="text-slate-200 font-bold">서울·경기·인천 100%</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">기상청 ASOS</span>
                <span className="text-cyan-300 font-bold">13개월 소비 상관성</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-bold text-cyan-400 mt-2">
            <span className="font-mono text-[11px] text-slate-400">단지별 Bento 상세 모달 & panTo</span>
            <div className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
              <span>공공데이터 센터 입장</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BENTO CARD 4: Finviz Heatmap & Portfolio P&L (Bottom Right)  */}
        {/* ============================================================ */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className={`group relative bg-white/[0.02] hover:bg-white/[0.05] border rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden shadow-2xl backdrop-blur-xl ${
            t4 >= 0.9 ? 'border-amber-500/40 hover:border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.2)]' : 'border-white/10'
          }`}
          style={{
            transform: `
              translate3d(${(1 - t4) * 140}px, ${(1 - t4) * 100}px, 0)
              rotate(${(1 - t4) * 12}deg)
              scale(${0.75 + t4 * 0.25})
            `,
            opacity: 0.15 + t4 * 0.85,
            filter: `blur(${(1 - t4) * 6}px)`,
          }}
        >
          <div className="absolute bottom-0 right-0 w-28 h-28 bg-amber-500/10 rounded-tl-full blur-xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">04 / MACRO & PORTFOLIO</span>
                  <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                    섹터 히트맵 & 실시간 P&L
                  </h3>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                HEATMAP & P&L
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
              Finviz 스타일 6대 주식 섹터 및 주요 코인 시총 트리맵. 가상 매수 포지션 등록 시 실시간 총 평가손익 및 수익률(%) 자동 추적.
            </p>

            {/* Mini Heatmap Preview Chips */}
            <div className="mt-3 grid grid-cols-3 gap-1.5 font-mono text-[10px]">
              <div className="p-1.5 rounded-xl bg-emerald-700/40 border border-emerald-500/30 text-center">
                <span className="block text-slate-300">반도체/AI</span>
                <span className="text-emerald-300 font-bold">+2.45%</span>
              </div>
              <div className="p-1.5 rounded-xl bg-emerald-800/40 border border-emerald-500/30 text-center">
                <span className="block text-slate-300">바이오</span>
                <span className="text-emerald-300 font-bold">+1.82%</span>
              </div>
              <div className="p-1.5 rounded-xl bg-rose-800/40 border border-rose-500/30 text-center">
                <span className="block text-slate-300">2차전지</span>
                <span className="text-rose-300 font-bold">-1.12%</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-bold text-amber-400 mt-2">
            <span className="font-mono text-[11px] text-slate-400">포트폴리오 자산 배분 도넛 차트</span>
            <div className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
              <span>히트맵 & 포트폴리오</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        </div>

      </div>

      {/* 5. Bottom Interactive Timeline Stepper Bar */}
      <div className="relative z-20 flex flex-col sm:flex-row justify-between items-center pt-3 mt-1 shrink-0 font-mono text-[11px] border-t border-white/5 gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 flex-wrap">
          <button
            onClick={() => setTargetProgress(0.0)}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${progress < 0.25 ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'hover:text-slate-200'}`}
          >
            01 INTRO
          </button>
          <span>➜</span>
          <button
            onClick={() => setTargetProgress(0.35)}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${progress >= 0.25 && progress < 0.55 ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'hover:text-slate-200'}`}
          >
            02 TRADING
          </button>
          <span>➜</span>
          <button
            onClick={() => setTargetProgress(0.60)}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${progress >= 0.55 && progress < 0.75 ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'hover:text-slate-200'}`}
          >
            03 AI NEWS
          </button>
          <span>➜</span>
          <button
            onClick={() => setTargetProgress(0.80)}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${progress >= 0.75 && progress < 0.95 ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'hover:text-slate-200'}`}
          >
            04 PROPTECH
          </button>
          <span>➜</span>
          <button
            onClick={() => setTargetProgress(1.0)}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${progress >= 0.95 ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'hover:text-slate-200'}`}
          >
            05 ASSEMBLED
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10 flex">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 rounded-full transition-all duration-100"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="text-slate-200 font-bold tabular-nums">{Math.round(progress * 100)}%</span>
        </div>
      </div>

    </div>
  );
}
