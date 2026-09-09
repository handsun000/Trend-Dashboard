import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useStompSubscription } from '@/contexts/WebSocketContext';
import { Train, Smartphone, Lock } from 'lucide-react';

import type { TrainSchedule, LoginSession, MonitorEvent, BookingMode } from '@/types/korail';
import SniperRadarCard from '@/components/korail/SniperRadarCard';
import TrainSearchBar from '@/components/korail/TrainSearchBar';
import TrainScheduleList from '@/components/korail/TrainScheduleList';
import KorailLoginModal from '@/components/korail/KorailLoginModal';
import ReservationSuccessModal from '@/components/korail/ReservationSuccessModal';

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

  const [searchHour, setSearchHour] = useState('000000');
  const [trains, setTrains] = useState<TrainSchedule[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 모니터링 상태
  const [activeMonitor, setActiveMonitor] = useState<MonitorEvent | null>(null);
  const [bookingMode, setBookingMode] = useState<BookingMode>('AUTO_ALL');
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

  // 2. WebSocket STOMP 구독 (/topic/train-monitor) via unified WebSocketContext
  useStompSubscription<MonitorEvent>('/topic/train-monitor', (event) => {
    if (!event) return;
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
  });


  const fetchSession = async () => {
    try {
      const res = await axios.get('/api/v1/korail/session');
      setSession(res.data);
    } catch {
      // ignore
    }
  };

  const fetchMonitorStatus = async () => {
    try {
      const res = await axios.get('/api/v1/korail/monitor/status');
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
      const res = await axios.post('/api/v1/korail/login', {
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
      const res = await axios.get('/api/v1/korail/search', {
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

  const handleStartMonitor = async (train: TrainSchedule, modeOverride?: BookingMode) => {
    if (!session.loggedIn) {
      toast.warn('자동 사냥 및 예매를 위해 먼저 코레일 계정을 연결(로그인)해 주세요.');
      setIsLoginModalOpen(true);
      return;
    }

    const targetMode = modeOverride || bookingMode;
    if (modeOverride) {
      setBookingMode(modeOverride);
    }

    try {
      const res = await axios.post('/api/v1/korail/monitor/start', {
        trainNo: train.trainNo,
        departureStation: train.departureStation,
        arrivalStation: train.arrivalStation,
        date: train.departureDate,
        hour: train.departureTimeRaw,
        phoneNo: phoneNo,
        bookingMode: targetMode,
      });

      setActiveMonitor(res.data);
      playSound('beep');
      const modeLabel =
        targetMode === 'WAIT_ONLY'
          ? '대기 집중 모드'
          : targetMode === 'RESERVE_ONLY'
          ? '취소표 즉시예약 전용'
          : '스텔스 통합 사냥';
      toast.success(`🚀 [${train.trainType} ${train.trainNo}호] ${modeLabel}가 시작되었습니다!`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`모니터링 시작 오류: ${errorMessage}`);
    }
  };

  const handleStopMonitor = async () => {
    try {
      await axios.post('/api/v1/korail/monitor/stop');
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
      const res = await axios.post(`/api/v1/korail/reserve?seatType=${seatType}`, train);
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
      const res = await axios.post(`/api/v1/korail/reserve-wait?phoneNo=${phoneNo}`, train);
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
        {/* 2. 활성 모니터링 레이더 카드 */}
        {activeMonitor && activeMonitor.status === 'POLLING' && (
          <SniperRadarCard activeMonitor={activeMonitor} onStopMonitor={handleStopMonitor} />
        )}

        {/* 3. 검색 툴바 & 퀵 필터 */}
        <TrainSearchBar
          departureStation={departureStation}
          setDepartureStation={setDepartureStation}
          arrivalStation={arrivalStation}
          setArrivalStation={setArrivalStation}
          onSwapStations={swapStations}
          searchDate={searchDate}
          setSearchDate={setSearchDate}
          searchHour={searchHour}
          setSearchHour={setSearchHour}
          bookingMode={bookingMode}
          setBookingMode={setBookingMode}
          isSearching={isSearching}
          onSearch={handleSearch}
          majorStations={majorStations}
        />

        {/* 4. 열차 목록 테이블 */}
        <TrainScheduleList
          trains={trains}
          searchDate={searchDate}
          isSearching={isSearching}
          activeMonitor={activeMonitor}
          onManualReserve={handleManualReserve}
          onManualWait={handleManualWait}
          onStartMonitor={handleStartMonitor}
          onStopMonitor={handleStopMonitor}
        />
      </div>

      {/* 5. 코레일 로그인 모달 */}
      <KorailLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        memberNoInput={memberNoInput}
        setMemberNoInput={setMemberNoInput}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
      />

      {/* 6. 성공 축하 모달 */}
      <ReservationSuccessModal
        isOpen={successModal.open}
        onClose={() => setSuccessModal({ open: false })}
        event={successModal.event}
      />
    </div>
  );
}
