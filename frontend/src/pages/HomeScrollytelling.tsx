import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Building2, 
  LayoutGrid, 
  ArrowRight, 
  Zap, 
  MousePointer2,
  ChevronDown,
  Layers,
  Cpu,
  Globe2,
  BarChart3,
  Newspaper,
  ShieldCheck,
  Compass,
  ArrowUpRight,
  Play
} from 'lucide-react';

interface HomeScrollytellingProps {
  onNavigate: (view: string) => void;
}

export default function HomeScrollytelling({ onNavigate }: HomeScrollytellingProps) {
  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const animTargetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Smooth Lerp Physics Animation Loop (60fps fluid inertia)
  useEffect(() => {
    const updatePhysics = () => {
      setProgress((prev) => {
        const diff = animTargetRef.current - prev;
        if (Math.abs(diff) < 0.0008) {
          return animTargetRef.current;
        }
        return prev + diff * 0.12; // buttery smooth damping
      });
      rafRef.current = requestAnimationFrame(updatePhysics);
    };

    rafRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Direct Mouse Wheel on entire viewport
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY * 0.00085;
    animTargetRef.current = Math.min(1.0, Math.max(0.0, animTargetRef.current + delta));
  };

  // Jump to specific scene progress
  const goToScene = (target: number) => {
    animTargetRef.current = Math.min(1.0, Math.max(0.0, target));
  };

  // Helper for interpolating values
  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

  // Scene Opacities & Transforms based on scroll progress
  // Scene 1: 0.00 - 0.20
  const s1Opacity = clamp(1 - (progress / 0.18), 0, 1);
  const s1Scale = clamp(1 + (progress * 0.3), 1, 1.25);
  const s1Y = progress * -80;

  // Scene 2 (Trading): 0.18 - 0.45 (peaks around 0.30)
  const s2Progress = clamp((progress - 0.18) / 0.24, 0, 1);
  const s2Opacity = progress < 0.18 ? 0 : (progress > 0.45 ? clamp(1 - ((progress - 0.45) / 0.10), 0, 1) : clamp((progress - 0.18) / 0.08, 0, 1));
  const s2Y = (1 - s2Progress) * 60;

  // Scene 3 (Gemini AI): 0.42 - 0.70 (peaks around 0.55)
  const s3Progress = clamp((progress - 0.42) / 0.24, 0, 1);
  const s3Opacity = progress < 0.42 ? 0 : (progress > 0.70 ? clamp(1 - ((progress - 0.70) / 0.10), 0, 1) : clamp((progress - 0.42) / 0.08, 0, 1));
  const s3Y = (1 - s3Progress) * 60;

  // Scene 4 (PropTech): 0.68 - 0.90 (peaks around 0.80)
  const s4Progress = clamp((progress - 0.68) / 0.20, 0, 1);
  const s4Opacity = progress < 0.68 ? 0 : (progress > 0.90 ? clamp(1 - ((progress - 0.90) / 0.08), 0, 1) : clamp((progress - 0.68) / 0.08, 0, 1));
  const s4Y = (1 - s4Progress) * 60;

  // Scene 5 (Finale Gateway): 0.88 - 1.00
  const s5Progress = clamp((progress - 0.88) / 0.12, 0, 1);
  const s5Opacity = clamp((progress - 0.88) / 0.08, 0, 1);
  const s5Scale = 0.9 + s5Progress * 0.1;

  // Active scene index for UI dot indicator
  const activeSceneIndex = 
    progress < 0.20 ? 0 :
    progress < 0.45 ? 1 :
    progress < 0.70 ? 2 :
    progress < 0.88 ? 3 : 4;

  return (
    <div 
      onWheel={handleWheel}
      className="relative w-screen h-screen overflow-hidden select-none font-sans bg-[#080D1A] text-slate-100 flex flex-col justify-between"
    >
      {/* ========================================================================= */}
      {/* 1. LUXURY EDITORIAL BACKGROUND: Deep Slate, Mesh Glow & Architectural Lines */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Ambient Radial Lights that morph dynamically with scroll */}
        <div 
          className="absolute -top-40 left-1/4 w-[55rem] h-[55rem] rounded-full bg-emerald-500/15 blur-[160px] transition-all duration-1000"
          style={{ 
            transform: `translate(${progress * 100}px, ${progress * 50}px) scale(${1 + progress * 0.3})`,
            opacity: 0.3 + progress * 0.5
          }}
        />
        <div 
          className="absolute -bottom-40 right-1/4 w-[55rem] h-[55rem] rounded-full bg-cyan-500/15 blur-[160px] transition-all duration-1000"
          style={{ 
            transform: `translate(${progress * -100}px, ${progress * -50}px) scale(${1 + progress * 0.3})`,
            opacity: 0.25 + progress * 0.55
          }}
        />
        <div 
          className="absolute top-1/3 right-10 w-[35rem] h-[35rem] rounded-full bg-indigo-600/10 blur-[180px] transition-all duration-1000"
          style={{ opacity: 0.2 + progress * 0.4 }}
        />

        {/* Architectural Subtle Grid & Diagonal Chamfer Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:40px_40px] opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080D1A]/40 to-[#080D1A]" />
      </div>

      {/* ========================================================================= */}
      {/* 2. FLOATING GLASS TOP NAVIGATION (ERA Residence / Apple Style)           */}
      {/* ========================================================================= */}
      <header className="relative z-50 w-full px-6 md:px-12 py-5 flex items-center justify-between backdrop-blur-md bg-[#080D1A]/40 border-b border-white/5 transition-all duration-300">
        {/* Brand Logo */}
        <div 
          onClick={() => goToScene(0)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black shadow-[0_0_25px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-serif tracking-widest text-lg font-black text-white uppercase group-hover:text-emerald-300 transition-colors">
                TrendDash
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 tracking-wider">
              SINGLE-PANE INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Center Quick Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 font-mono text-xs font-semibold text-slate-300">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer py-1"
          >
            <span>트레이딩 룸</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
          <button 
            onClick={() => onNavigate('public-data')}
            className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer py-1"
          >
            <span>공공데이터 센터</span>
          </button>
          <button 
            onClick={() => onNavigate('alerts')}
            className="hover:text-teal-300 transition-colors flex items-center gap-1.5 cursor-pointer py-1"
          >
            <span>알림 센터</span>
          </button>
          <button 
            onClick={() => onNavigate('settings')}
            className="hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer py-1"
          >
            <span>설정</span>
          </button>
        </nav>

        {/* Right Action CTA Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-mono font-black text-xs tracking-wider uppercase hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>대시보드 시작하기</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. FULL-BLEED EDITORIAL STAGE (5 Seamless Scenes)                        */}
      {/* ========================================================================= */}
      <div className="relative z-20 flex-1 min-h-0 w-full flex items-center justify-center px-6 md:px-16 lg:px-24">

        {/* ----------------------------------------------------------------------- */}
        {/* SCENE 1: THE HERO - EDITORIAL COUTURE REALITY                           */}
        {/* ----------------------------------------------------------------------- */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-all duration-300 pointer-events-none"
          style={{
            opacity: s1Opacity,
            transform: `scale(${s1Scale}) translateY(${s1Y}px)`,
            display: s1Opacity <= 0.01 ? 'none' : 'flex'
          }}
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-emerald-300 text-xs font-mono font-bold mb-6 backdrop-blur-md shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="tracking-widest uppercase">Next-Gen Financial & Geospatial Intelligence</span>
          </div>

          <h1 className="text-4xl md:text-7xl lg:text-8xl font-serif font-black tracking-tight leading-[1.05] text-white max-w-5xl">
            INTELLIGENCE <br />
            <span className="font-sans italic font-normal bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              Beyond Boundaries.
            </span>
          </h1>

          <p className="text-base md:text-xl text-slate-300 font-light mt-6 max-w-2xl leading-relaxed">
            1초 라이브 틱 스트리밍, Google Gemini AI 실시간 뉴스 브리핑, 국토부 전국 실거래가 지오코딩을 
            하나의 싱글-페인(Single-Pane) 세계관으로 결합합니다.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="px-5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 font-mono flex items-center gap-2.5 backdrop-blur-xl animate-bounce">
              <MousePointer2 className="w-4 h-4 text-emerald-400" />
              <span>마우스 휠을 아래로 굴려 탐험 시작 (Scroll to Explore)</span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* SCENE 2: SUB-SECOND TRADING ENGINE (TradingView & 1s Tick Stream)       */}
        {/* ----------------------------------------------------------------------- */}
        <div 
          className="absolute inset-0 flex flex-col lg:flex-row items-center justify-between px-6 md:px-16 lg:px-24 gap-8 transition-all duration-300 pointer-events-none"
          style={{
            opacity: s2Opacity,
            transform: `translateY(${s2Y}px)`,
            display: s2Opacity <= 0.01 ? 'none' : 'flex'
          }}
        >
          {/* Left Editorial Typography */}
          <div className="flex-1 max-w-xl text-left pointer-events-auto">
            <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest uppercase block mb-3">
              01 / SUB-SECOND LATENCY
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-white leading-tight">
              TradingView Pro Engine & <br />
              <span className="font-sans italic text-emerald-300 font-light">1초 라이브 틱 스트림</span>
            </h2>
            <p className="text-sm md:text-base text-slate-300 mt-4 leading-relaxed font-light">
              Recharts의 정적 차트를 탈피하여 TradingView의 고성능 인터랙티브 캔들스틱 차트를 탑재했습니다.
              1초 주기 WebSocket STOMP 푸시로 마지막 캔들을 실시간 렌더링하며, MA 5/20/60/120, 볼린저밴드 및 10호가창을 지원합니다.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
              >
                <span>트레이딩 룸 바로 입장</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-slate-400">KIS 주식 2,500+ & Upbit 287 코인</span>
            </div>
          </div>

          {/* Right Giant Chamfered Live Mockup */}
          <div className="flex-1 max-w-xl w-full pointer-events-auto">
            <div className="relative bg-gradient-to-br from-slate-900/90 to-[#0A1124]/90 border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.15)] backdrop-blur-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-white/10 font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-sm font-bold text-white">삼성전자 (005930)</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">1s STREAM</span>
                </div>
                <span className="text-lg font-black text-emerald-400 tabular-nums">₩78,500 ▲ +2.45%</span>
              </div>

              {/* Graphic Candle Mockup */}
              <div className="h-44 my-4 flex items-end justify-between gap-2 px-2 pt-6">
                {[45, 60, 52, 78, 65, 85, 90, 75, 95, 110, 105, 130].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-0.5 bg-emerald-400/40 h-4" />
                    <div 
                      className="w-full rounded-sm bg-gradient-to-t from-emerald-500 to-teal-300 transition-all duration-500"
                      style={{ height: `${h}px` }}
                    />
                    <div className="w-0.5 bg-emerald-400/40 h-3" />
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/5 text-[11px] font-mono text-slate-400">
                <span>타임프레임: 1m / 5m / 1d / 1w</span>
                <span className="text-emerald-300">볼린저 밴드 & MA 5/20/60 ON</span>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* SCENE 3: COGNITIVE ANALYSIS (Google Gemini 1.5 Flash AI News)           */}
        {/* ----------------------------------------------------------------------- */}
        <div 
          className="absolute inset-0 flex flex-col lg:flex-row-reverse items-center justify-between px-6 md:px-16 lg:px-24 gap-8 transition-all duration-300 pointer-events-none"
          style={{
            opacity: s3Opacity,
            transform: `translateY(${s3Y}px)`,
            display: s3Opacity <= 0.01 ? 'none' : 'flex'
          }}
        >
          {/* Right Editorial Typography */}
          <div className="flex-1 max-w-xl text-left pointer-events-auto">
            <span className="text-xs font-mono font-bold text-teal-400 tracking-widest uppercase block mb-3">
              02 / COGNITIVE ANALYSIS
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-white leading-tight">
              Google Gemini 1.5 Flash <br />
              <span className="font-sans italic text-teal-300 font-light">실시간 뉴스 3줄 브리핑</span>
            </h2>
            <p className="text-sm md:text-base text-slate-300 mt-4 leading-relaxed font-light">
              구글 실시간 뉴스 RSS를 전수 수집하여 Gemini AI가 "최근 1시간 3줄 브리핑", 
              "호재/악재 감성 스코어(-100 ~ +100)", "관련 섹터 영향도"를 즉각 산출합니다.
              15분 TTL 메모리 캐시로 API 할당량을 철저히 방어합니다.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all"
              >
                <span>AI 뉴스룸 열기</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-slate-400">15분 고속 캐시 파이프라인</span>
            </div>
          </div>

          {/* Left Giant Hologram AI Card */}
          <div className="flex-1 max-w-xl w-full pointer-events-auto">
            <div className="relative bg-gradient-to-br from-slate-900/90 to-[#0C1A2E]/90 border border-teal-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(20,184,166,0.15)] backdrop-blur-2xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/10 font-mono">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-300 animate-spin" />
                  <span className="text-sm font-bold text-white">SK하이닉스 AI 감성 진단</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  82% 강한 호재 🟢
                </span>
              </div>

              {/* 3-line briefing lines */}
              <div className="space-y-2 font-mono text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                <p className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">01.</span>
                  <span>HBM4E 차세대 메모리 선점 및 주요 글로벌 빅테크 공급 협력 확대</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">02.</span>
                  <span>자사주 매입 및 외국인/기관 순매수 수급 유입으로 주가 모멘텀 강화</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">03.</span>
                  <span>글로벌 반도체 지수 반등에 따른 섹터 전반의 강력한 상승 견인</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">#AI반도체</span>
                <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">#실적공시</span>
                <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">#수급모멘텀</span>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* SCENE 4: GEOSPATIAL PROPTECH & MACRO (KakaoMap & ASOS Weather)          */}
        {/* ----------------------------------------------------------------------- */}
        <div 
          className="absolute inset-0 flex flex-col lg:flex-row items-center justify-between px-6 md:px-16 lg:px-24 gap-8 transition-all duration-300 pointer-events-none"
          style={{
            opacity: s4Opacity,
            transform: `translateY(${s4Y}px)`,
            display: s4Opacity <= 0.01 ? 'none' : 'flex'
          }}
        >
          {/* Left Editorial Typography */}
          <div className="flex-1 max-w-xl text-left pointer-events-auto">
            <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase block mb-3">
              03 / GEOSPATIAL INTELLIGENCE
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-white leading-tight">
              카카오맵 공공데이터 센터 & <br />
              <span className="font-sans italic text-cyan-300 font-light">전국 부동산 프롭테크</span>
            </h2>
            <p className="text-sm md:text-base text-slate-300 mt-4 leading-relaxed font-light">
              국토교통부 아파트/오피스텔 전국 실거래가 100% 정밀 지오코딩 및 마커 클러스터링을 구현했습니다.
              아파트 단지별 상세 Bento 모달과 기상청 ASOS 날씨 & 계절 소비 상관성 분석을 제공합니다.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={() => onNavigate('public-data')}
                className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
              >
                <span>공공데이터 센터 탐색</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-slate-400">서울·경기·인천 100% 커버리지</span>
            </div>
          </div>

          {/* Right Giant PropTech Map Card */}
          <div className="flex-1 max-w-xl w-full pointer-events-auto">
            <div className="relative bg-gradient-to-br from-slate-900/90 to-[#081726]/90 border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/10 font-mono">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-300" />
                  <span className="text-sm font-bold text-white">서울 강남구 압구정동 현대아파트</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  신고가 갱신 🏢
                </span>
              </div>

              {/* Map Preview Grid */}
              <div className="h-44 bg-slate-950/70 rounded-2xl border border-white/5 p-4 flex flex-col justify-between font-mono text-xs relative overflow-hidden">
                <div className="flex justify-between items-center z-10">
                  <span className="text-slate-400">최근 매매 실거래가</span>
                  <span className="text-base font-black text-cyan-300">₩4,200,000,000</span>
                </div>
                <div className="flex justify-between items-center z-10 text-[11px]">
                  <span className="text-slate-400">전세가율 (GAP)</span>
                  <span className="text-emerald-400 font-bold">48.5% (안정권)</span>
                </div>
                <div className="flex justify-between items-center z-10 text-[11px] pt-2 border-t border-white/5">
                  <span className="text-slate-400">기상청 ASOS 소비 상관계수</span>
                  <span className="text-yellow-300 font-bold">+0.74 (강한 상관성)</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1">
                <span>카카오맵 panTo & 클러스터 마커</span>
                <span className="text-cyan-300">단지별 연도별 갭 추이 차트</span>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* SCENE 5: FINALE / ENTER THE REALM                                       */}
        {/* ----------------------------------------------------------------------- */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-all duration-300 pointer-events-none"
          style={{
            opacity: s5Opacity,
            transform: `scale(${s5Scale})`,
            display: s5Opacity <= 0.01 ? 'none' : 'flex'
          }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold mb-6">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>ALL SYSTEMS FULLY ASSEMBLED & OPERATIONAL</span>
          </div>

          <h2 className="text-4xl md:text-7xl font-serif font-black tracking-tight leading-tight text-white max-w-4xl">
            READY TO EXPLORE <br />
            <span className="font-sans italic font-normal bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">
              TrendDash Intelligence
            </span>
          </h2>

          <p className="text-sm md:text-lg text-slate-300 font-light mt-4 max-w-xl">
            지금 바로 전문 트레이딩 룸과 공공데이터 센터를 자유롭게 넘나들며 금융과 지리공간 인텔리전스를 경험하세요.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 pointer-events-auto">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-mono font-black text-sm tracking-wider uppercase hover:scale-105 active:scale-95 transition-all shadow-[0_0_35px_rgba(16,185,129,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <span>📈 트레이딩 룸 입장하기</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={() => onNavigate('public-data')}
              className="px-8 py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/15 font-mono font-bold text-sm tracking-wider uppercase hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xl"
            >
              <span>🏢 공공데이터 센터 탐색하기</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. INFINITE LIVE TICKER MARQUEE (Apple / Bloomberg Style)                 */}
      {/* ========================================================================= */}
      <div className="relative z-30 w-full py-2.5 bg-black/40 border-t border-white/5 backdrop-blur-md overflow-hidden flex items-center font-mono text-xs">
        <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
          <span className="text-slate-400">🔥 LIVE TICKERS:</span>
          <span className="text-emerald-400 font-bold">삼성전자 (005930) ₩78,500 ▲ +2.45%</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-bold">SK하이닉스 (000660) ₩198,000 ▲ +3.12%</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-300 font-bold">KRW-BTC ₩88,935,000 ▲ +1.80%</span>
          <span className="text-slate-500">•</span>
          <span className="text-teal-300 font-bold">KRW-ETH ₩4,120,000 ▲ +2.15%</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">KOSPI 2,682.40 ▲ +1.20%</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">NASDAQ 18,240.50 ▲ +0.95%</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-400 font-bold">서울 아파트 평균 매매가 ₩1,240,000,000</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. RIGHT VERTICAL EDITORIAL SCENE STEPPER (ERA Residence Style)           */}
      {/* ========================================================================= */}
      <aside className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-end gap-4 font-mono text-[11px] pointer-events-auto">
        {[
          { label: '01 HERO', target: 0.00 },
          { label: '02 TRADING', target: 0.30 },
          { label: '03 GEMINI AI', target: 0.55 },
          { label: '04 PROPTECH', target: 0.80 },
          { label: '05 REALM', target: 1.00 },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => goToScene(item.target)}
            className={`group flex items-center gap-3 transition-all cursor-pointer ${
              activeSceneIndex === idx ? 'text-emerald-300 font-black' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity tracking-widest text-[10px]">
              {item.label}
            </span>
            <div 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeSceneIndex === idx 
                  ? 'bg-emerald-400 scale-150 shadow-[0_0_12px_rgba(16,185,129,0.8)]' 
                  : 'bg-slate-700 group-hover:bg-slate-500'
              }`} 
            />
          </button>
        ))}

        {/* Vertical Progress Line */}
        <div className="w-0.5 h-16 bg-slate-800 rounded-full mt-2 overflow-hidden">
          <div 
            className="w-full bg-emerald-400 transition-all duration-100"
            style={{ height: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </aside>

    </div>
  );
}
