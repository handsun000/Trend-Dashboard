import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Building2, 
  ArrowRight, 
  Zap, 
  MousePointer2,
  ArrowUpRight,
  Target,
  Train,
  CheckCircle2
} from 'lucide-react';

interface HomeScrollytellingProps {
  onNavigate: (view: string) => void;
}

export default function HomeScrollytelling({ onNavigate }: HomeScrollytellingProps) {
  // ---------------------------------------------------------------------------
  // 1. CINEMATIC PRELOADER & WARM-UP (Zero Jank Guarantee)
  // ---------------------------------------------------------------------------
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadPct, setLoadPct] = useState(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 18) + 12;
      if (current >= 100) {
        current = 100;
        setLoadPct(100);
        clearInterval(interval);
        setTimeout(() => setIsLoaded(true), 120);
      } else {
        setLoadPct(current);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------------------
  // 2. SMOOTH 60FPS LERP PHYSICS ENGINE
  // ---------------------------------------------------------------------------
  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const animTargetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const updatePhysics = () => {
      setProgress((prev) => {
        const diff = animTargetRef.current - prev;
        if (Math.abs(diff) < 0.0002) {
          return animTargetRef.current;
        }
        return prev + diff * 0.11; // buttery smooth fluid damping
      });
      rafRef.current = requestAnimationFrame(updatePhysics);
    };

    rafRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isLoaded]);

  // Normalized Wheel Handler: Substantially longer scroll travel distance (Numa pacing)
  const handleWheel = (e: React.WheelEvent) => {
    if (!isLoaded) return;
    e.stopPropagation();
    // Clamp single wheel tick and apply deep cinematic damping (~2.7x longer travel)
    const cappedDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 90);
    const delta = cappedDelta * 0.00028;
    animTargetRef.current = Math.min(1.0, Math.max(0.0, animTargetRef.current + delta));
  };

  const goToScene = (target: number) => {
    animTargetRef.current = Math.min(1.0, Math.max(0.0, target));
  };

  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

  // ===========================================================================
  // 3. EXTENDED PACING & REST ZONES (Numa-Inspired Deep Travel)
  // ===========================================================================

  // Header & Bottom Bar: Appear and dock gently
  const headerOpacity = clamp((progress - 0.03) / 0.08, 0, 1);
  const headerY = (1 - headerOpacity) * -20;

  const footerOpacity = clamp((progress - 0.82) / 0.10, 0, 1);
  const footerY = (1 - footerOpacity) * 20;

  const stepperOpacity = clamp((progress - 0.04) / 0.08, 0, 1);

  // Phase 1: Hero Text (0.00 -> 0.16)
  // 0.00 ~ 0.04: Still holding hero, 0.04 ~ 0.16: Gently exits upwards
  const heroOpacity = progress < 0.04 ? 1 : clamp(1 - (progress - 0.04) / 0.11, 0, 1);
  const heroY = progress < 0.04 ? 0 : (progress - 0.04) * -120;

  // Phase 2: Magnetic Cloud Assembly with Generous HOLD Zone (0.12 -> 0.45)
  // 0.12 ~ 0.26: Assembly fly-in, 0.26 ~ 0.39: HOLD & REST (User can inspect live data!), 0.39 ~ 0.45: Gentle exit
  const assemble = clamp((progress - 0.12) / 0.14, 0, 1);
  const p2Exit = clamp((progress - 0.39) / 0.06, 0, 1);
  const cloudOpacity = clamp((progress - 0.12) / 0.08, 0, 1) * (1 - p2Exit);

  // Phase 3: Kinetic Typography & AI Docking with HOLD Zone (0.42 -> 0.72)
  // 0.42 ~ 0.54: Staggered docking, 0.54 ~ 0.67: HOLD & READ (3 lines clear), 0.67 ~ 0.72: Gentle exit
  const p3Progress = clamp((progress - 0.42) / 0.12, 0, 1);
  const p3Exit = clamp((progress - 0.67) / 0.05, 0, 1);
  const p3Opacity = p3Progress * (1 - p3Exit);
  const kineticTypoX = (progress - 0.55) * -500;

  const aiCard1 = clamp((progress - 0.43) / 0.08, 0, 1);
  const aiCard2 = clamp((progress - 0.47) / 0.08, 0, 1);
  const aiCard3 = clamp((progress - 0.51) / 0.08, 0, 1);

  // Phase 4: Timeline Scrub & Realtime Sine Wave Morphing with Long Travel (0.69 -> 0.89)
  // 0.69 ~ 0.85: Deep timeline scrubbing & wave oscillation, 0.85 ~ 0.89: Exit to gateway
  const p4 = clamp((progress - 0.69) / 0.16, 0, 1);
  const p4Exit = clamp((progress - 0.86) / 0.04, 0, 1);
  const p4Opacity = clamp((progress - 0.69) / 0.06, 0, 1) * (1 - p4Exit);

  const wavePhase = p4 * Math.PI * 3;
  const cp1Y = 50 + Math.sin(wavePhase) * 35;
  const cp2Y = 50 - Math.cos(wavePhase * 1.3) * 38;
  const cp3Y = 50 + Math.sin(wavePhase * 1.7) * 28;
  const svgWavePath = `M 0,50 C 200,${cp1Y} 400,${cp2Y} 650,${cp3Y} S 850,${50 - Math.sin(wavePhase) * 35} 1000,50`;

  // Phase 5: Master Workspace Snapping (0.86 -> 1.00)
  const p5 = clamp((progress - 0.86) / 0.14, 0, 1);
  const p5Opacity = clamp(p5 * 1.8, 0, 1);
  const p5Scale = 0.90 + p5 * 0.10;

  const activeSceneIndex = 
    progress < 0.14 ? 0 :
    progress < 0.42 ? 1 :
    progress < 0.68 ? 2 :
    progress < 0.86 ? 3 : 4;

  const scenes = [
    { num: '01', code: 'INTRO', label: 'THE KINFOLK VOID', target: 0.00 },
    { num: '02', code: 'ASSEMBLY', label: 'MAGNETIC DECONSTRUCTION', target: 0.32 },
    { num: '03', code: 'KINETIC', label: 'HORIZON AI DOCKING', target: 0.58 },
    { num: '04', code: 'WAVE', label: 'TIMELINE & SVG MORPH', target: 0.78 },
    { num: '05', code: 'GATEWAY', label: 'MASTER WORKSPACE', target: 1.00 },
  ];

  return (
    <div 
      onWheel={handleWheel}
      className="relative w-screen h-screen overflow-hidden select-none font-sans bg-[#080D1A] text-slate-100 flex flex-col justify-between"
    >
      {/* ========================================================================= */}
      {/* PRELOADER SCREEN (Numa Style Minimalist Void Loader)                      */}
      {/* ========================================================================= */}
      {!isLoaded && (
        <div className="fixed inset-0 z-50 bg-[#080D1A] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black flex items-center justify-center mb-6 shadow-[0_0_35px_rgba(16,185,129,0.35)] animate-pulse">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="font-serif tracking-widest text-2xl font-black text-white mb-2 uppercase">
            TREND-DASHBOARD
          </span>
          <span className="font-mono text-xs tracking-widest text-emerald-400 font-semibold uppercase mb-6">
            WARMING UP SPATIAL CHOREOGRAPHY
          </span>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-100 ease-out"
              style={{ width: `${loadPct}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-slate-400 mt-3 tabular-nums">
            {loadPct}%
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AMBIENT BACKLIGHTS (Pure Quiet Luxury)                                     */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div 
          className="absolute -top-40 left-1/4 w-[55rem] h-[55rem] rounded-full bg-emerald-500/15 blur-[180px] transition-all duration-500"
          style={{ 
            transform: `translate(${progress * 100}px, ${progress * 40}px) scale(${1 + progress * 0.25})`,
            opacity: 0.3 + progress * 0.4
          }}
        />
        <div 
          className="absolute -bottom-40 right-1/4 w-[55rem] h-[55rem] rounded-full bg-cyan-500/15 blur-[180px] transition-all duration-500"
          style={{ 
            transform: `translate(${progress * -100}px, ${progress * -40}px) scale(${1 + progress * 0.25})`,
            opacity: 0.25 + progress * 0.45
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* ASSEMBLED TOP HEADER (ONLY Appears when scrolling begins!)                */}
      {/* ========================================================================= */}
      <header 
        className="relative z-50 w-full px-6 md:px-14 py-5 flex items-center justify-between pointer-events-auto transition-all duration-300"
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          pointerEvents: headerOpacity > 0.3 ? 'auto' : 'none',
        }}
      >
        <div 
          onClick={() => goToScene(0)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black shadow-[0_0_25px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif tracking-widest text-lg font-black text-white uppercase group-hover:text-emerald-300 transition-colors">
              TREND-DASHBOARD
            </span>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              CHOREOGRAPHY
            </span>
          </div>
        </div>

        {/* Center Scene Pill */}
        <div className="hidden md:flex items-center gap-5 px-5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-xl font-mono text-xs">
          <span className="text-slate-400 text-[11px]">PHASE:</span>
          <span className="text-emerald-300 font-bold tracking-wider">
            {scenes[activeSceneIndex].num} — {scenes[activeSceneIndex].code}
          </span>
          <div className="w-14 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        {/* Right Action Button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-mono font-black text-xs tracking-wider uppercase hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <span>대시보드 바로 진입</span>
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </header>

      {/* ========================================================================= */}
      {/* CONTINUOUS STAGE: PURE VOID TO ASSEMBLED INTELLIGENCE                     */}
      {/* ========================================================================= */}
      <div className="relative z-30 flex-1 min-h-0 w-full flex items-center justify-center px-6 md:px-14 lg:px-20 overflow-hidden">

        {/* ----------------------------------------------------------------------- */}
        {/* A. INITIAL HERO TYPOGRAPHY (Exits cleanly upwards without leaving dummy card) */}
        {/* ----------------------------------------------------------------------- */}
        {heroOpacity > 0.01 && (
          <div 
            className="absolute z-10 flex flex-col items-center justify-center text-center px-6 pointer-events-none transition-all duration-200 will-change-transform max-w-4xl"
            style={{ 
              opacity: heroOpacity, 
              transform: `translateY(${heroY}px) scale(${1 - progress * 0.25})`,
            }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono font-bold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="tracking-widest uppercase">SPATIAL CHOREOGRAPHY ENGINE</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black tracking-tight leading-[0.98] text-white">
              INTELLIGENCE <br />
              <span className="font-sans italic font-light bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                Beyond Boundaries.
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-300 font-light mt-5 max-w-xl leading-relaxed">
              마우스 휠을 아래로 굴리면 흩어져 있던 실시간 데이터 모듈들이 
              자석처럼 제자리로 완벽하게 조립됩니다.
            </p>

            <div className="mt-8 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-slate-300 font-mono animate-bounce">
              <MousePointer2 className="w-4 h-4 text-emerald-400" />
              <span>마우스 휠을 아래로 굴려 조립 시작 (Scroll to Assemble)</span>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* B. PHASE 2: FLOATING CLOUD CAPSULES (Assemble into Center Cluster with NO Obstructive Box) */}
        {/* ----------------------------------------------------------------------- */}
        {cloudOpacity > 0.01 && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 z-20"
            style={{ opacity: cloudOpacity }}
          >
            {/* Center Dynamic Breathing Glow Node (Minimalist, unobtrusive pulse) */}
            <div 
              className="absolute w-36 h-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none transition-transform duration-500"
              style={{ transform: `scale(${0.5 + assemble * 0.8})` }}
            />

            {/* Capsule 1: Top-Left Live Ticker Block */}
            <div 
              className="absolute pointer-events-auto bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl font-mono text-xs w-64 will-change-transform"
              style={{
                transform: `
                  translate3d(${-240 - (1 - assemble) * 220}px, ${-120 - (1 - assemble) * 110}px, 0)
                  rotate(${-4 + (1 - assemble) * -16}deg)
                  scale(${0.78 + assemble * 0.22})
                `,
                filter: `blur(${(1 - assemble) * 5}px)`,
                opacity: 0.2 + assemble * 0.8,
              }}
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 pb-1 border-b border-white/10">
                <span className="text-emerald-400 font-bold">01 // TICKER CLOUD</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">1s STREAM</span>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-white">삼성전자 (005930)</span>
                <span className="text-base font-black text-emerald-400 tabular-nums">₩78,500</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-semibold block mt-0.5">▲ +2.45% (+1,800)</span>
            </div>

            {/* Capsule 2: Bottom-Left Candlestick Wave */}
            <div 
              className="absolute pointer-events-auto bg-slate-900/90 border border-teal-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl font-mono text-xs w-72 will-change-transform"
              style={{
                transform: `
                  translate3d(${-240 - (1 - assemble) * 200}px, ${120 + (1 - assemble) * 120}px, 0)
                  rotate(${3 + (1 - assemble) * 14}deg)
                  scale(${0.78 + assemble * 0.22})
                `,
                filter: `blur(${(1 - assemble) * 5}px)`,
                opacity: 0.2 + assemble * 0.8,
              }}
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 pb-1 border-b border-white/10">
                <span className="text-teal-400 font-bold">02 // 1-MIN CANDLES</span>
                <span>TRADINGVIEW</span>
              </div>
              <div className="h-16 flex items-end justify-between gap-1.5 pt-3">
                {[30, 48, 42, 60, 52, 70, 65, 85, 78, 95].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-0.5 bg-emerald-400/40 h-2" />
                    <div 
                      className="w-full rounded-sm bg-gradient-to-t from-emerald-500 to-teal-300"
                      style={{ height: `${h * (0.3 + assemble * 0.7)}%` }}
                    />
                    <div className="w-0.5 bg-emerald-400/40 h-1.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Capsule 3: Top-Right 10-OrderBook Depth Strip */}
            <div 
              className="absolute pointer-events-auto bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl font-mono text-xs w-64 will-change-transform"
              style={{
                transform: `
                  translate3d(${240 + (1 - assemble) * 220}px, ${-120 - (1 - assemble) * 110}px, 0)
                  rotate(${4 + (1 - assemble) * 15}deg)
                  scale(${0.78 + assemble * 0.22})
                `,
                filter: `blur(${(1 - assemble) * 5}px)`,
                opacity: 0.2 + assemble * 0.8,
              }}
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 pb-1 border-b border-white/10">
                <span className="text-cyan-400 font-bold">03 // 10-ORDERBOOK</span>
                <span>UPBIT DEPTH</span>
              </div>
              <div className="space-y-1 text-[11px] mt-2">
                <div className="flex justify-between text-rose-400"><span>78,600</span><span className="text-slate-400">14,210</span></div>
                <div className="py-0.5 text-center font-bold text-emerald-400 bg-emerald-500/10 rounded">78,500 체결</div>
                <div className="flex justify-between text-emerald-400"><span>78,400</span><span className="text-slate-400">32,100</span></div>
              </div>
            </div>

            {/* Capsule 4: Bottom-Right Gemini AI Sentiment Ring */}
            <div 
              className="absolute pointer-events-auto bg-slate-900/90 border border-teal-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl font-mono text-xs w-64 will-change-transform"
              style={{
                transform: `
                  translate3d(${240 + (1 - assemble) * 200}px, ${120 + (1 - assemble) * 120}px, 0)
                  rotate(${-4 + (1 - assemble) * -14}deg)
                  scale(${0.78 + assemble * 0.22})
                `,
                filter: `blur(${(1 - assemble) * 5}px)`,
                opacity: 0.2 + assemble * 0.8,
              }}
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 pb-1 border-b border-white/10">
                <span className="text-teal-300 font-bold">04 // GEMINI SENTIMENT</span>
                <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300">84% 호재</span>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-400/80 flex items-center justify-center text-xs font-black text-emerald-300 bg-emerald-500/10">
                  +84
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">SK하이닉스 HBM</span>
                  <span className="text-[10px] text-slate-400">글로벌 공급 확대 모멘텀</span>
                </div>
              </div>
            </div>

            {/* Capsule 5: Center Top Exchange Rate Ribbon */}
            <div 
              className="absolute pointer-events-auto bg-slate-900/90 border border-amber-500/40 rounded-full px-5 py-2 shadow-2xl backdrop-blur-xl font-mono text-xs flex items-center gap-4 will-change-transform"
              style={{
                transform: `
                  translate3d(0, ${-180 - (1 - assemble) * 140}px, 0)
                  scale(${0.8 + assemble * 0.2})
                `,
                filter: `blur(${(1 - assemble) * 4}px)`,
                opacity: 0.2 + assemble * 0.8,
              }}
            >
              <span className="text-amber-400 font-bold">USD/KRW: ₩1,376.6</span>
              <span className="text-white/20">|</span>
              <span className="text-slate-300">100JPY: ₩860.1</span>
            </div>

            {/* Capsule 6: Center Bottom Korail Sniper Pill */}
            <div 
              className="absolute pointer-events-auto bg-slate-900/90 border border-emerald-500/40 rounded-full px-5 py-2 shadow-2xl backdrop-blur-xl font-mono text-xs flex items-center gap-3 will-change-transform"
              style={{
                transform: `
                  translate3d(0, ${180 + (1 - assemble) * 140}px, 0)
                  scale(${0.8 + assemble * 0.2})
                `,
                filter: `blur(${(1 - assemble) * 4}px)`,
                opacity: 0.2 + assemble * 0.8,
              }}
            >
              <Target className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-bold">KTX 경부선 스텔스 사냥기 ACTIVE</span>
              <span className="text-[10px] text-slate-400">(2.8s 지터 순환)</span>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* C. PHASE 3: KINETIC TYPOGRAPHY & HORIZONTAL DOCKING (0.45 -> 0.72)      */}
        {/* ----------------------------------------------------------------------- */}
        {p3Opacity > 0.01 && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300 z-20 px-8"
            style={{ opacity: p3Opacity }}
          >
            {/* Sliding Giant Kinetic Typography */}
            <div 
              className="absolute text-5xl md:text-8xl lg:text-9xl font-serif font-black text-white/[0.05] tracking-tighter whitespace-nowrap transition-transform duration-100 will-change-transform"
              style={{ transform: `translateX(${kineticTypoX}px)` }}
            >
              SUB-SECOND LATENCY & COGNITIVE AI
            </div>

            <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Left Editorial Text */}
              <div className="max-w-md text-left pointer-events-auto">
                <span className="text-xs font-mono font-bold text-teal-400 tracking-widest uppercase block mb-3">
                  03 // COGNITIVE DOCKING
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-black text-white leading-tight">
                  수평 트랙으로 도킹하는 <br />
                  <span className="font-sans italic text-teal-300 font-light">Gemini AI 3줄 브리핑</span>
                </h2>
                <p className="text-sm text-slate-300 mt-4 leading-relaxed font-light">
                  실시간 RSS 금융 뉴스를 AI가 초 단위로 분석하여 
                  3개의 핵심 문장으로 조각내어 순차 도킹합니다. 15분 메모리 캐시로 API를 극대화합니다.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <button 
                    onClick={() => onNavigate('dashboard')}
                    className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
                  >
                    <span>뉴스룸 바로 입장</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right 3-Stack Docking AI Cards */}
              <div className="w-full max-w-lg space-y-3 pointer-events-auto">
                <div 
                  className="bg-slate-900/90 border border-teal-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-xl font-mono text-xs flex items-start gap-3 transition-all duration-300 will-change-transform"
                  style={{
                    transform: `translateX(${(1 - aiCard1) * 200}px)`,
                    opacity: aiCard1,
                  }}
                >
                  <span className="text-teal-400 font-bold text-sm">01.</span>
                  <p className="text-slate-200 leading-relaxed">
                    차세대 HBM4E 조기 양산 체제 확립 및 글로벌 빅테크 독점 공급 계약 논의 가속화
                  </p>
                </div>

                <div 
                  className="bg-slate-900/90 border border-teal-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-xl font-mono text-xs flex items-start gap-3 transition-all duration-300 will-change-transform"
                  style={{
                    transform: `translateX(${(1 - aiCard2) * 220}px)`,
                    opacity: aiCard2,
                  }}
                >
                  <span className="text-teal-400 font-bold text-sm">02.</span>
                  <p className="text-slate-200 leading-relaxed">
                    외국인 및 기관 순매수 5거래일 연속 유입으로 코스피 2,700선 견고한 지지선 형성
                  </p>
                </div>

                <div 
                  className="bg-slate-900/90 border border-teal-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-xl font-mono text-xs flex items-start gap-3 transition-all duration-300 will-change-transform"
                  style={{
                    transform: `translateX(${(1 - aiCard3) * 240}px)`,
                    opacity: aiCard3,
                  }}
                >
                  <span className="text-teal-400 font-bold text-sm">03.</span>
                  <p className="text-slate-200 leading-relaxed">
                    글로벌 AI 데이터센터 투자 확대에 따른 반도체 및 전력 인프라 섹터 동반 강세
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* D. PHASE 4: TIMELINE SCRUB & REALTIME WAVE MORPHING (0.68 -> 0.88)      */}
        {/* ----------------------------------------------------------------------- */}
        {p4Opacity > 0.01 && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300 z-20 px-6 max-w-5xl mx-auto"
            style={{ opacity: p4Opacity }}
          >
            <div className="w-full flex justify-between items-end mb-6 font-mono pointer-events-auto">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                  04 // WAVE MORPHING & PROPTECH
                </span>
                <h3 className="text-3xl font-serif font-black text-white">
                  실시간 시계열 파형 모핑 & 부동산 청사진
                </h3>
              </div>
              <div className="text-right text-xs text-slate-400">
                <span className="text-emerald-400 font-bold">MOLIT & KORAIL SYNC</span>
                <p className="text-[11px] text-slate-500">지터 스크럽: {(p4 * 100).toFixed(0)}%</p>
              </div>
            </div>

            {/* Timeline Ruler Scrubber (Numa Style) */}
            <div className="w-full bg-slate-950/70 border border-white/10 rounded-2xl p-4 font-mono text-xs pointer-events-auto shadow-2xl backdrop-blur-2xl">
              <div className="flex justify-between items-center text-slate-400 text-[11px] pb-2 border-b border-white/5">
                {['09:00 OPEN', '10:30 PEAK', '12:00 LUNCH', '14:30 SURGE', '15:30 CLOSE', '20:00 STEALTH'].map((t, idx) => (
                  <span 
                    key={idx} 
                    className={`transition-colors ${idx === Math.floor(p4 * 5.99) ? 'text-emerald-300 font-bold' : ''}`}
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Dynamic SVG Wave Canvas */}
              <div className="h-32 w-full my-3 relative flex items-center justify-center">
                <svg viewBox="0 0 1000 100" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                  <path 
                    d={svgWavePath} 
                    fill="none" 
                    stroke="url(#waveGrad)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                  />
                  <circle 
                    cx={p4 * 960 + 20} 
                    cy={cp2Y} 
                    r="6" 
                    className="fill-emerald-400 animate-pulse" 
                  />
                </svg>

                <div 
                  className="absolute bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-md shadow-lg"
                  style={{
                    left: `${Math.min(85, Math.max(10, p4 * 90))}%`,
                    top: `${clamp(cp2Y - 30, 10, 80)}px`,
                  }}
                >
                  취소표 포착 핀 (2.8s 폴링)
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-white/5">
                <span>국토부 전국 아파트 실거래가 안티-콜리전 지오코딩</span>
                <span className="text-cyan-300 font-bold">카카오맵 클러스터링 동기화</span>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* E. PHASE 5: THE MASTER WORKSPACE ASSEMBLY (Final Grand Gateway)         */}
        {/* ----------------------------------------------------------------------- */}
        {p5Opacity > 0.01 && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none transition-opacity duration-300 z-30 px-6 max-w-5xl mx-auto will-change-transform"
            style={{
              opacity: p5Opacity,
              transform: `scale(${p5Scale})`,
            }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold mb-5 backdrop-blur-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% COMPLETE // MASTER WORKSPACE ASSEMBLED</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-serif font-black text-white leading-tight">
              완성된 싱글-페인 세계관, <br />
              <span className="font-sans italic font-light bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                Trend-Dashboard Master Suite
              </span>
            </h2>

            <p className="text-sm md:text-base text-slate-300 font-light mt-4 max-w-xl leading-relaxed">
              모든 데이터 모듈의 연속 조립이 완료되었습니다. 
              원하시는 프로 룸을 선택하여 초고속 단일 창 레이아웃으로 진입하십시오.
            </p>

            {/* 4 Final Assembled Workspace Cards */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full pointer-events-auto">
              {[
                { id: 'dashboard', title: '트레이딩 룸', desc: '1s 틱 & TradingView 차트', icon: TrendingUp, color: 'emerald' },
                { id: 'train', title: '코레일 사냥기', desc: 'KTX/SRT 실시간 취소표 사냥', icon: Train, color: 'teal' },
                { id: 'public-data', title: '부동산 센터', desc: '국토부 실거래가 카카오맵', icon: Building2, color: 'cyan' },
                { id: 'alerts', title: '목표가 알림', desc: '웹소켓 실시간 가격 알림', icon: Zap, color: 'amber' },
              ].map((room) => {
                const Icon = room.icon;
                return (
                  <div
                    key={room.id}
                    onClick={() => onNavigate(room.id)}
                    className="p-5 rounded-2xl bg-slate-900/85 border border-white/10 hover:border-emerald-400/60 hover:bg-slate-800/90 transition-all cursor-pointer group flex flex-col items-center text-center shadow-2xl backdrop-blur-xl hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(16,185,129,0.25)]"
                  >
                    <div className="p-3.5 rounded-2xl bg-white/[0.04] group-hover:bg-emerald-500/20 text-emerald-400 mb-3 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-serif font-bold text-white text-base group-hover:text-emerald-300 transition-colors">
                      {room.title}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 mt-1">
                      {room.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* ASSEMBLED BOTTOM MARQUEE (ONLY Docks when reaching final phase!)          */}
      {/* ========================================================================= */}
      <div 
        className="relative z-40 w-full py-2 bg-black/60 border-t border-white/[0.08] backdrop-blur-xl overflow-hidden flex items-center font-mono text-xs select-none transition-all duration-300"
        style={{
          opacity: footerOpacity,
          transform: `translateY(${footerY}px)`,
          pointerEvents: footerOpacity > 0.3 ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
          <span className="text-emerald-400 font-bold">⚡ REALTIME WIRE:</span>
          <span className="text-slate-300">삼성전자 (005930) <strong className="text-emerald-400">₩78,500 ▲ +2.45%</strong></span>
          <span className="text-white/20">•</span>
          <span className="text-slate-300">SK하이닉스 (000660) <strong className="text-emerald-400">₩198,000 ▲ +3.12%</strong></span>
          <span className="text-white/20">•</span>
          <span className="text-slate-300">KRW-BTC <strong className="text-cyan-300">₩88,935,000 ▲ +1.80%</strong></span>
          <span className="text-white/20">•</span>
          <span className="text-slate-300">KRW-ETH <strong className="text-teal-300">₩4,120,000 ▲ +2.15%</strong></span>
          <span className="text-white/20">•</span>
          <span className="text-slate-300">USD/KRW <strong className="text-amber-300">₩1,376.6</strong></span>
          <span className="text-white/20">•</span>
          <span className="text-slate-300">서울 아파트 평균가 <strong className="text-cyan-400">₩1,240,000,000</strong></span>
          <span className="text-white/20">•</span>
          <span className="text-slate-300">KTX 경부선 <strong className="text-emerald-400">취소표 스나이퍼 가동 중</strong></span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT VERTICAL CHOREOGRAPHY STEPPER (Fades in smoothly)                   */}
      {/* ========================================================================= */}
      <aside 
        className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-end gap-5 font-mono text-[11px] transition-all duration-300"
        style={{
          opacity: stepperOpacity,
          pointerEvents: stepperOpacity > 0.3 ? 'auto' : 'none',
        }}
      >
        <div className="text-[9px] tracking-widest text-slate-500 font-bold uppercase mb-1">
          CHOREO
        </div>

        {scenes.map((scene, idx) => {
          const isActive = activeSceneIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => goToScene(scene.target)}
              className={`group flex items-center gap-3 transition-all cursor-pointer ${
                isActive ? 'text-emerald-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={`flex items-center gap-2 transition-all ${
                isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
              }`}>
                <span className="text-[10px] font-bold text-slate-400">{scene.num}</span>
                <span className="text-[10px] tracking-widest font-semibold">{scene.code}</span>
                {isActive && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SNAP
                  </span>
                )}
              </div>

              <div className="relative flex items-center justify-center">
                <div 
                  className={`transition-all duration-300 rounded-full ${
                    isActive 
                      ? 'w-3 h-3 bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.9)] scale-125' 
                      : 'w-1.5 h-1.5 bg-slate-700 group-hover:bg-slate-400'
                  }`} 
                />
              </div>
            </button>
          );
        })}

        {/* Vertical Progress Bar */}
        <div className="w-0.5 h-20 bg-slate-800 rounded-full mt-2 relative overflow-hidden">
          <div 
            className="w-full bg-gradient-to-b from-emerald-400 to-teal-300 transition-all duration-100"
            style={{ height: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <span className="text-[9px] text-slate-400 tabular-nums">
          {Math.round(progress * 100)}%
        </span>
      </aside>

    </div>
  );
}
