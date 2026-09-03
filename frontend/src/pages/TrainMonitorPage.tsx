import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  Train,
  Radio,
  Search,
  ArrowRightLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Bell,
  RefreshCw,
  UserCheck,
  Smartphone,
  Sparkles,
  Ticket,
  Lock
} from 'lucide-react';

interface TrainSchedule {
  trainNo: string;
  trainType: string;
  departureStation: string;
  departureStationCode: string;
  departureDate: string;
  departureTime: string;
  departureTimeRaw: string;
  arrivalStation: string;
  arrivalStationCode: string;
  arrivalTime: string;
  arrivalTimeRaw: string;
  runTime: string;
  price: number;
  generalSeatStatus: string;
  generalAvailable: boolean;
  specialSeatStatus: string;
  specialAvailable: boolean;
  waitAvailable: boolean;
  waitQueueCount: number;
  runDate: string;
  trainGroupCode: string;
  trainClassCode: string;
}

interface LoginSession {
  loggedIn: boolean;
  memberNo?: string;
  customerName?: string;
  customerNo?: string;
  message?: string;
}

interface MonitorEvent {
  taskId: string;
  trainNo: string;
  trainType: string;
  route: string;
  departureTime: string;
  status: string; // POLLING, SUCCESS_RESERVE, SUCCESS_WAITLIST, STOPPED, ERROR
  attempts: number;
  lastResponseTimeMs: number;
  message: string;
  timestamp: string;
}

export default function TrainMonitorPage() {
  // 코레일 세션 상태
  const [session, setSession] = useState<LoginSession>({ loggedIn: false });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [memberNoInput, setMemberNoInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // SMS 수신 전화번호 (미입력 시 비밀키 기본값 사용)
  const [phoneNo, setPhoneNo] = useState('');

  // 검색 파라미터
  const [departureStation, setDepartureStation] = useState('수서');
  const [arrivalStation, setArrivalStation] = useState('부산');
  const [searchDate, setSearchDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  });
  const dateInputRef = useRef<HTMLInputElement>(null);

  const setQuickDate = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSearchDate(`${yyyy}${mm}${dd}`);
  };

  const [searchHour, setSearchHour] = useState('000000');
  const [trains, setTrains] = useState<TrainSchedule[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 모니터링 상태
  const [activeMonitor, setActiveMonitor] = useState<MonitorEvent | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<TrainSchedule | null>(null);
  const [bookingMode, setBookingMode] = useState<'AUTO_ALL' | 'RESERVE_ONLY' | 'WAIT_ONLY'>('AUTO_ALL');
  const [successModal, setSuccessModal] = useState<{ open: boolean; event?: MonitorEvent }>({ open: false });

  // Web Audio Context (비프/차임벨)
  const playSound = (type: 'beep' | 'success') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'beep') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        // 2음계 성공 팡파레
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch {
      // ignore
    }
  };

  // 1. 초기 세션 및 현재 모니터링 상태 조회
  useEffect(() => {
    fetchSession();
    fetchMonitorStatus();
  }, []);

  // 2. WebSocket STOMP 구독 (/topic/train-monitor)
  useEffect(() => {
    let client: Client | null = null;
    try {
      client = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        reconnectDelay: 3000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          client?.subscribe('/topic/train-monitor', (message) => {
            if (message.body) {
              try {
                const event: MonitorEvent = JSON.parse(message.body);
                setActiveMonitor(event);

                if (event.status === 'SUCCESS_RESERVE' || event.status === 'SUCCESS_WAITLIST') {
                  playSound('success');
                  setSuccessModal({ open: true, event });
                  toast.success(`🎉 ${event.message}`, {
                    theme: 'dark',
                    autoClose: 10000,
                  });
                } else if (event.status === 'STOPPED') {
                  setActiveMonitor(null);
                  toast.info('모니터링이 종료되었습니다.');
                }
              } catch (e) {
                console.error(e);
              }
            }
          });
        },
      });
      client.activate();
    } catch (e) {
      console.warn('STOMP init failed:', e);
    }

    return () => {
      if (client) {
        try {
          client.deactivate();
        } catch {}
      }
    };
  }, []);

  const fetchSession = async () => {
    try {
      const res = await axios.get('/api/korail/session');
      setSession(res.data);
    } catch {
      // ignore
    }
  };

  const fetchMonitorStatus = async () => {
    try {
      const res = await axios.get('/api/korail/monitor/status');
      if (res.data && res.data.status && res.data.status !== 'IDLE' && res.data.status !== 'STOPPED') {
        setActiveMonitor(res.data);
      }
    } catch {
      // ignore
    }
  };

  const handleLogin = async (e?: React.FormEvent, useDefault = false) => {
    if (e) e.preventDefault();
    const reqMemberNo = useDefault ? '' : memberNoInput.trim();
    const reqPassword = useDefault ? '' : passwordInput;

    if (!useDefault && (!reqMemberNo || !reqPassword)) {
      toast.warn('회원번호와 비밀번호를 모두 입력해 주세요. (또는 기본 계정 연결 사용)');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await axios.post('/api/korail/login', {
        memberNo: reqMemberNo,
        password: reqPassword,
      });

      if (res.data && res.data.loggedIn) {
        setSession(res.data);
        setIsLoginModalOpen(false);
        setPasswordInput('');
        toast.success(`코레일 로그인 성공! (${res.data.customerName || '회원'}님)`);
      } else {
        toast.error(res.data.message || '로그인에 실패했습니다.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`로그인 네트워크 오류: ${errorMessage}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const res = await axios.get('/api/korail/search', {
        params: {
          departureStation,
          arrivalStation,
          date: searchDate,
          hour: searchHour,
          trainGroup: '109',
        },
      });

      if (res.data && res.data.success) {
        setTrains(res.data.trains || []);
        toast.info(`총 ${res.data.totalCount}개 열차가 조회되었습니다.`);
      } else {
        toast.warn(res.data?.message || '열차 정보를 불러오지 못했습니다.');
        setTrains([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`열차 조회 실패: ${errorMessage}`);
    } finally {
      setIsSearching(false);
    }
  };

  // 날짜, 시간대, 출발/도착역 변경 시 즉시 실시간 자동 재조회
  useEffect(() => {
    if (departureStation && arrivalStation && searchDate && searchDate.length === 8) {
      handleSearch();
    }
  }, [departureStation, arrivalStation, searchDate, searchHour]);

  const handleStartMonitor = async (train: TrainSchedule) => {
    if (!session.loggedIn) {
      toast.warn('자동 사냥 및 예매를 위해 먼저 코레일 계정을 연결(로그인)해 주세요.');
      setIsLoginModalOpen(true);
      return;
    }

    try {
      const res = await axios.post('/api/korail/monitor/start', {
        trainNo: train.trainNo,
        departureStation: train.departureStation,
        arrivalStation: train.arrivalStation,
        date: train.departureDate,
        hour: train.departureTimeRaw,
        phoneNo: phoneNo,
        bookingMode: bookingMode,
      });

      setActiveMonitor(res.data);
      playSound('beep');
      toast.success(`🚀 [${train.trainType} ${train.trainNo}호] 스텔스 자동 사냥이 시작되었습니다!`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`모니터링 시작 오류: ${errorMessage}`);
    }
  };

  const handleStopMonitor = async () => {
    try {
      await axios.post('/api/korail/monitor/stop');
      setActiveMonitor(null);
      toast.info('모니터링이 중지되었습니다.');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`중지 실패: ${errorMessage}`);
    }
  };

  const handleManualReserve = async (train: TrainSchedule, seatType: '1' | '2') => {
    if (!session.loggedIn) {
      toast.warn('예약을 위해 먼저 코레일 로그인이 필요합니다.');
      setIsLoginModalOpen(true);
      return;
    }

    try {
      const res = await axios.post(`/api/korail/reserve?seatType=${seatType}`, train);
      if (res.data && res.data.success) {
        playSound('success');
        toast.success(res.data.message);
      } else {
        toast.error(res.data?.message || '예약에 실패했습니다.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`예약 오류: ${errorMessage}`);
    }
  };

  const handleManualWait = async (train: TrainSchedule) => {
    if (!session.loggedIn) {
      toast.warn('예매대기 신청을 위해 먼저 코레일 로그인이 필요합니다.');
      setIsLoginModalOpen(true);
      return;
    }

    try {
      const res = await axios.post(`/api/korail/reserve-wait?phoneNo=${phoneNo}`, train);
      if (res.data && res.data.success) {
        playSound('success');
        toast.success(res.data.message);
      } else {
        toast.error(res.data?.message || '예매대기 신청에 실패했습니다.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`예매대기 신청 오류: ${errorMessage}`);
    }
  };

  const swapStations = () => {
    setDepartureStation(arrivalStation);
    setArrivalStation(departureStation);
  };

  const majorStations = ['수서', '부산', '서울', '동대구', '대전', '광명', '울산', '광주송정'];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#0B132B]/95 text-slate-200 overflow-hidden font-sans select-none">
      {/* 1. 상단 글로벌 컨트롤 바 */}
      <header className="px-6 py-3.5 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Train className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                <span>KTX/SRT 스텔스 사냥기</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 text-[9px] font-mono font-bold">
                  SNIPER BOT
                </span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              인간형 스마트 지터(2.8s~4.5s) 기반 취소표 & 예매대기 0초 즉시 낚아채기
            </p>
          </div>
        </div>

        {/* 세션 & SMS 설정 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400">SMS 알림:</span>
            <input
              type="text"
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-200 w-28 focus:outline-none focus:text-cyan-300"
              placeholder="01012345678"
            />
          </div>

          {session.loggedIn ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
              <span className="font-mono font-bold text-emerald-300">
                {session.customerName} ({session.memberNo}) 세션 Hot 대기 중
              </span>
              <button
                onClick={() => setSession({ loggedIn: false })}
                className="text-[10px] text-slate-400 hover:text-rose-300 underline ml-1"
              >
                해제
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>코레일 계정 연결</span>
            </button>
          )}
        </div>
      </header>

      {/* 메인 레이아웃 (스크롤 제로 100vh) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-5 gap-4">
        {/* 2. 활성 모니터링 레이더 카드 (Active Sniper Radar) */}
        {activeMonitor && activeMonitor.status === 'POLLING' && (
          <div className="relative p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-emerald-950/40 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-between gap-4 overflow-hidden shrink-0">
            {/* 레이더 펄스 광선 */}
            <div className="absolute top-0 right-0 w-64 h-full bg-cyan-400/5 blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-4 z-10">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <Radio className="w-6 h-6 animate-pulse" />
                <div className="absolute inset-0 rounded-2xl border border-cyan-400/60 animate-ping opacity-30"></div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-400/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-400/30">
                    SNIPER RADAR ACTIVE
                  </span>
                  <h3 className="text-base font-black text-white font-mono">
                    {activeMonitor.trainType} {activeMonitor.trainNo}호 ({activeMonitor.route})
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 font-mono">
                  {activeMonitor.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 z-10 font-mono text-xs">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Attempts</p>
                <p className="text-lg font-black text-cyan-300 tabular-nums">
                  {activeMonitor.attempts} <span className="text-xs font-normal text-slate-400">회</span>
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Latency</p>
                <p className="text-lg font-black text-emerald-400 tabular-nums">
                  {activeMonitor.lastResponseTimeMs || 320} <span className="text-xs font-normal text-slate-400">ms</span>
                </p>
              </div>

              <button
                onClick={handleStopMonitor}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold transition-all active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>사냥 중지</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. 검색 툴바 & 퀵 필터 */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shrink-0 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* 출발역 / 도착역 */}
            <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 px-3 py-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">출발</span>
                <input
                  type="text"
                  value={departureStation}
                  onChange={(e) => setDepartureStation(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white w-20 focus:outline-none"
                />
              </div>

              <button
                onClick={swapStations}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
                title="출발/도착역 반전"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1 border-l border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-mono">도착</span>
                <input
                  type="text"
                  value={arrivalStation}
                  onChange={(e) => setArrivalStation(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white w-20 focus:outline-none"
                />
              </div>
            </div>

            {/* 날짜 선택 (showPicker + 퀵 선택 버튼) */}
            <div className="flex items-center gap-1.5">
              <div
                onClick={() => dateInputRef.current?.showPicker?.()}
                className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800/90 px-3 py-2 rounded-xl border border-white/10 hover:border-emerald-500/50 text-xs transition-all cursor-pointer group shadow-sm"
                title="클릭하여 달력 열기"
              >
                <Calendar className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform pointer-events-none" />
                <input
                  ref={dateInputRef}
                  type="date"
                  value={searchDate && searchDate.length === 8 ? `${searchDate.slice(0, 4)}-${searchDate.slice(4, 6)}-${searchDate.slice(6, 8)}` : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSearchDate(e.target.value.replace(/-/g, ''));
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    (e.target as HTMLInputElement).showPicker?.();
                  }}
                  className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                />
                <span className="text-[10px] text-emerald-300 font-mono font-medium pointer-events-none">
                  {searchDate && searchDate.length === 8
                    ? `(${new Date(`${searchDate.slice(0, 4)}-${searchDate.slice(4, 6)}-${searchDate.slice(6, 8)}`).toLocaleDateString('ko-KR', { weekday: 'short' })})`
                    : ''}
                </span>
              </div>

              {/* 퀵 날짜 선택 버튼 */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  오늘
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  내일
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(2)}
                  className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  +2일
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(7)}
                  className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  +7일
                </button>
              </div>
            </div>

            {/* 시간대 선택 */}
            <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-white/10 text-xs">
              <Clock className="w-4 h-4 text-cyan-400" />
              <select
                value={searchHour}
                onChange={(e) => setSearchHour(e.target.value)}
                className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
              >
                <option value="000000" className="bg-slate-900">00:00 이후</option>
                <option value="060000" className="bg-slate-900">06:00 이후</option>
                <option value="080000" className="bg-slate-900">08:00 이후</option>
                <option value="100000" className="bg-slate-900">10:00 이후</option>
                <option value="120000" className="bg-slate-900">12:00 이후</option>
                <option value="140000" className="bg-slate-900">14:00 이후</option>
                <option value="160000" className="bg-slate-900">16:00 이후</option>
                <option value="180000" className="bg-slate-900">18:00 이후</option>
                <option value="200000" className="bg-slate-900">20:00 이후</option>
                <option value="220000" className="bg-slate-900">22:00 이후</option>
              </select>
            </div>

            {/* 사냥 모드 */}
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 text-[11px] font-mono">
              <button
                onClick={() => setBookingMode('AUTO_ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  bookingMode === 'AUTO_ALL'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                취소표+대기
              </button>
              <button
                onClick={() => setBookingMode('RESERVE_ONLY')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  bookingMode === 'RESERVE_ONLY'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                취소표만
              </button>
              <button
                onClick={() => setBookingMode('WAIT_ONLY')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  bookingMode === 'WAIT_ONLY'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                예매대기만
              </button>
            </div>

            {/* 검색 실행 버튼 */}
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
              <span>{isSearching ? '조회 중...' : '실시간 열차 조회'}</span>
            </button>
          </div>

          {/* 주요 역 퀵 태그 */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-white/5 overflow-x-auto text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">주요역:</span>
            {majorStations.map((stn) => (
              <button
                key={stn}
                onClick={() => {
                  if (departureStation !== stn) setArrivalStation(stn);
                }}
                className="px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/10 text-slate-300 text-[11px] font-medium transition-colors"
              >
                {stn}
              </button>
            ))}
          </div>
        </div>

        {/* 4. 열차 목록 테이블 (Scrollable) */}
        <div className="flex-1 min-h-0 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-white/10 bg-slate-900/40 flex items-center justify-between shrink-0 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">열차 목록</span>
              {searchDate && searchDate.length === 8 && (
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[11px]">
                  📅 {searchDate.slice(0, 4)}.{searchDate.slice(4, 6)}.{searchDate.slice(6, 8)} ({new Date(`${searchDate.slice(0, 4)}-${searchDate.slice(4, 6)}-${searchDate.slice(6, 8)}`).toLocaleDateString('ko-KR', { weekday: 'short' })})
                </span>
              )}
              <span className="text-[11px] text-slate-400">({trains.length}개 검색됨)</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 좌석있음
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> 예매대기 가능
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span> 매진
              </span>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto divide-y divide-white/5 relative transition-opacity ${isSearching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {isSearching && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 shadow-xl text-emerald-300 text-xs font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>실시간 시간표 & 좌석 정보 수신 중...</span>
                </div>
              </div>
            )}
            {trains.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <Train className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-xs font-mono">열차 조회 버튼을 눌러 실시간 운행 및 잔여석 현황을 확인하세요.</p>
              </div>
            ) : (
              trains.map((train) => {
                const isTarget = activeMonitor?.trainNo === train.trainNo && activeMonitor?.status === 'POLLING';

                return (
                  <div
                    key={train.trainNo}
                    className={`p-4 transition-colors flex items-center justify-between gap-4 ${
                      isTarget ? 'bg-cyan-950/20 border-l-4 border-cyan-400' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* 열차 정보 */}
                    <div className="flex items-center gap-4 w-52 shrink-0">
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-center min-w-[3.5rem]">
                        <span className="block text-[10px] text-emerald-400 font-bold">{train.trainType}</span>
                        <span className="block text-sm font-black text-white font-mono">{train.trainNo}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{train.departureStation}</span>
                          <span className="text-slate-500 text-xs">➡️</span>
                          <span className="text-xs font-bold text-white">{train.arrivalStation}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-emerald-300/90 font-mono font-medium">
                            {train.departureDate ? `${train.departureDate.slice(4, 6)}.${train.departureDate.slice(6, 8)}` : ''}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">·</span>
                          <span className="text-[11px] text-slate-400 font-mono">소요 {train.runTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* 시간 & 요금 */}
                    <div className="flex items-center gap-6 font-mono text-center">
                      <div>
                        <span className="block text-base font-black text-white">{train.departureTime}</span>
                        <span className="block text-[10px] text-slate-400">출발</span>
                      </div>
                      <div className="text-slate-600 text-xs">···</div>
                      <div>
                        <span className="block text-base font-black text-slate-300">{train.arrivalTime}</span>
                        <span className="block text-[10px] text-slate-400">도착</span>
                      </div>
                      <div className="text-right ml-4">
                        <span className="block text-xs font-bold text-slate-300">
                          {train.price > 0 ? `${train.price.toLocaleString()}원` : '-'}
                        </span>
                        <span className="block text-[10px] text-slate-500">일반실 요금</span>
                      </div>
                    </div>

                    {/* 좌석 상태 뱃지들 */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* 일반실 */}
                      <div className="text-center w-24">
                        <span className="block text-[10px] text-slate-400 mb-0.5">일반실</span>
                        {train.generalAvailable ? (
                          <button
                            onClick={() => handleManualReserve(train, '1')}
                            className="w-full py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all active:scale-95"
                          >
                            예약가능
                          </button>
                        ) : (
                          <span className="block py-1 px-2 rounded-lg bg-white/[0.03] text-slate-500 text-xs font-medium border border-white/5">
                            매진
                          </span>
                        )}
                      </div>

                      {/* 특실 */}
                      <div className="text-center w-24">
                        <span className="block text-[10px] text-slate-400 mb-0.5">특실</span>
                        {train.specialAvailable ? (
                          <button
                            onClick={() => handleManualReserve(train, '2')}
                            className="w-full py-1 px-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all active:scale-95"
                          >
                            예약가능
                          </button>
                        ) : (
                          <span className="block py-1 px-2 rounded-lg bg-white/[0.03] text-slate-500 text-xs font-medium border border-white/5">
                            매진
                          </span>
                        )}
                      </div>

                      {/* 예매대기 */}
                      <div className="text-center w-28">
                        <span className="block text-[10px] text-slate-400 mb-0.5">예매대기</span>
                        {train.waitAvailable ? (
                          <button
                            onClick={() => handleManualWait(train)}
                            className="w-full py-1 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95"
                          >
                            신청가능({train.waitQueueCount}명)
                          </button>
                        ) : (
                          <span className="block py-1 px-2 rounded-lg bg-white/[0.03] text-slate-500 text-xs font-medium border border-white/5">
                            마감
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 액션: 자동 사냥 시작/중지 */}
                    <div className="w-36 shrink-0 text-right">
                      {isTarget ? (
                        <button
                          onClick={handleStopMonitor}
                          className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>사냥 중지</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartMonitor(train)}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:brightness-110 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>자동 사냥 시작</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. 코레일 로그인 모달 */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0D152F] border border-white/10 shadow-2xl flex flex-col gap-4 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">코레일 계정 연결 (Hot Sniper 세션)</h3>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              취소표 및 예매대기가 발생하는 즉시 <span className="text-emerald-300 font-bold">지연시간 0초(0ms)</span>로 티켓을 선점하기 위해 코레일 공식 모바일 세션을 메모리에 상주시킵니다.
            </p>

            <form onSubmit={(e) => handleLogin(e, false)} className="flex flex-col gap-3 mt-2">
              <button
                type="button"
                disabled={isLoggingIn}
                onClick={() => handleLogin(undefined, true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 border border-cyan-400/30 disabled:opacity-50"
              >
                <span>🔑</span>
                <span>{isLoggingIn ? '연결 중...' : '비밀키 기본 계정으로 원클릭 연결 (Secret Key)'}</span>
              </button>

              <div className="flex items-center gap-2 my-1">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-[10px] text-slate-500 font-mono">또는 직접 계정 입력</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-mono mb-1">코레일 회원번호 (10자리)</label>
                <input
                  type="text"
                  value={memberNoInput}
                  onChange={(e) => setMemberNoInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-emerald-400"
                  placeholder="미입력 시 비밀키(secret.yml) 기본 계정 사용"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-mono mb-1">비밀번호</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
                  placeholder="미입력 시 비밀키 기본값"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoggingIn ? '암호화 로그인 중...' : '입력한 계정으로 세션 연결'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. 성공 축하 모달 */}
      {successModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-gradient-to-b from-[#111C3D] to-[#0A1024] border border-emerald-400/40 shadow-[0_0_50px_rgba(16,185,129,0.3)] flex flex-col items-center text-center gap-4 text-slate-200">
            <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <Sparkles className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                🎉 기차표 자동 사냥 성공!
              </h2>
              <p className="text-xs text-emerald-300 mt-1 font-mono">
                {successModal.event?.status === 'SUCCESS_RESERVE' ? '취소표 좌석 예약 완료' : '예매대기 신청 완료'}
              </p>
            </div>

            <div className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">열차 정보</span>
                <span className="text-white font-bold">{successModal.event?.trainType} {successModal.event?.trainNo}호</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">구간 / 시각</span>
                <span className="text-cyan-300 font-bold">{successModal.event?.route} ({successModal.event?.departureTime})</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2">
                <span className="text-slate-400">결과 안내</span>
                <span className="text-emerald-400 font-bold text-right">{successModal.event?.message}</span>
              </div>
            </div>

            <button
              onClick={() => setSuccessModal({ open: false })}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
