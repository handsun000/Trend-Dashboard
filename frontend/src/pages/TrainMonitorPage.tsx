import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useStompSubscription } from '@/contexts/WebSocketContext';
import { Train, Smartphone, Lock, Target, Layers, Sparkles } from 'lucide-react';

import type { TrainSchedule, LoginSession, MonitorEvent, BookingMode } from '@/types/korail';
import TrainSearchBar from '@/components/korail/TrainSearchBar';
import TrainScheduleList from '@/components/korail/TrainScheduleList';
import SelectedRadarList from '@/components/korail/SelectedRadarList';
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

  // 탭 상태: ALL_SCHEDULES (전체 열차 검색) vs TARGET_RADAR (사냥 레이더 집중 뷰)
  const [activeTab, setActiveTab] = useState<'ALL_SCHEDULES' | 'TARGET_RADAR'>('ALL_SCHEDULES');

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

  // 다중 선택된 관심 열차 목록
  const [selectedTrains, setSelectedTrains] = useState<TrainSchedule[]>([]);

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

  // 2. WebSocket STOMP 구독 (/topic/train-monitor)
  useStompSubscription<MonitorEvent>('/topic/train-monitor', (event) => {
    if (!event) return;

    // 만약 중지 이벤트라면 activeMonitor 즉시 해제
    if (event.status === 'STOPPED' || event.status === 'STOPPED_SAFE') {
      setActiveMonitor(null);
      toast.info('모니터링이 종료되었습니다.');
      return;
    }

    setActiveMonitor(event);

    if (event.status === 'SUCCESS_RESERVE' || event.status === 'SUCCESS_WAITLIST') {
      playSound('success');
      setSuccessModal({ open: true, event });
      toast.success(`🎉 ${event.message}`, {
        theme: 'dark',
        autoClose: 10000,
      });
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
        if (res.data.targetTrains && res.data.targetTrains.length > 0) {
          setSelectedTrains(res.data.targetTrains);
        }
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

  // 체크박스 선택/해제 핸들러
  const handleToggleSelectTrain = useCallback((train: TrainSchedule) => {
    setSelectedTrains((prev) => {
      const exists = prev.some((t) => t.trainNo === train.trainNo);
      if (exists) {
        return prev.filter((t) => t.trainNo !== train.trainNo);
      } else {
        return [...prev, train];
      }
    });
  }, []);

  const handleSelectAllTrains = useCallback(() => {
    setSelectedTrains((prev) => {
      const currentNos = new Set(prev.map((t) => t.trainNo));
      const newlyAdded = trains.filter((t) => !currentNos.has(t.trainNo));
      return [...prev, ...newlyAdded];
    });
  }, [trains]);

  const handleClearSelectedTrains = useCallback(() => {
    setSelectedTrains([]);
  }, []);

  const handleRemoveTarget = useCallback((trainNo: string) => {
    setSelectedTrains((prev) => prev.filter((t) => t.trainNo !== trainNo));
  }, []);

  // 단일 열차 사냥 시작
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
      setSelectedTrains([train]);
      playSound('beep');
      const modeLabel =
        targetMode === 'WAIT_ONLY'
          ? '대기 집중 모드'
          : targetMode === 'RESERVE_ONLY'
          ? '취소표 즉시예약 전용'
          : '스텔스 통합 사냥';
      toast.success(`🚀 [${train.trainType} ${train.trainNo}호] ${modeLabel}가 시작되었습니다!`);
      setActiveTab('TARGET_RADAR');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`모니터링 시작 오류: ${errorMessage}`);
    }
  };

  // 멀티 타깃 동시 사냥 시작 (단일 쿼리 WAF 방어)
  const handleStartMultiMonitor = async (modeOverride?: BookingMode) => {
    if (!session.loggedIn) {
      toast.warn('자동 사냥 및 예매를 위해 먼저 코레일 계정을 연결(로그인)해 주세요.');
      setIsLoginModalOpen(true);
      return;
    }

    if (selectedTrains.length === 0) {
      toast.warn('동시 사냥을 진행할 열차를 목록에서 최소 1개 이상 체크해 주세요.');
      return;
    }

    const targetMode = modeOverride || bookingMode;
    if (modeOverride) {
      setBookingMode(modeOverride);
    }

    const firstTrain = selectedTrains[0];
    const trainNos = selectedTrains.map((t) => t.trainNo);

    try {
      const res = await axios.post('/api/v1/korail/monitor/start', {
        trainNo: firstTrain.trainNo,
        targetTrainNos: trainNos,
        targetTrains: selectedTrains,
        departureStation: firstTrain.departureStation || departureStation,
        arrivalStation: firstTrain.arrivalStation || arrivalStation,
        date: firstTrain.departureDate || searchDate,
        hour: firstTrain.departureTimeRaw || searchHour,
        phoneNo: phoneNo,
        bookingMode: targetMode,
      });

      setActiveMonitor(res.data);
      playSound('beep');
      toast.success(`🎯 [${selectedTrains.length}대 열차 동시 사냥] WAF 방어 스텔스 모니터링이 시작되었습니다!`);
      setActiveTab('TARGET_RADAR');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`동시 모니터링 시작 실패: ${errorMessage}`);
    }
  };

  const handleStopMonitor = async () => {
    setActiveMonitor(null);
    try {
      await axios.post('/api/v1/korail/monitor/stop');
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
        setSuccessModal({
          open: true,
          event: {
            taskId: 'MANUAL',
            trainNo: train.trainNo,
            trainType: train.trainType,
            route: `${train.departureStation} ➡️ ${train.arrivalStation}`,
            departureTime: train.departureTime,
            status: 'SUCCESS_RESERVE',
            attempts: 1,
            lastResponseTimeMs: 0,
            message: res.data.message,
            timestamp: new Date().toLocaleTimeString(),
          },
        });
      } else {
        if (res.data?.message?.includes('P058') || res.data?.message?.includes('로그아웃')) {
          fetchSession();
        }
        toast.error(res.data?.message || '예약에 실패했습니다.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`예약 오류: ${errorMessage}`);
      fetchSession();
    }
  };

  const handleManualWait = async (train: TrainSchedule) => {
    if (!session.loggedIn) {
      toast.warn('예매대기 신청을 위해 먼저 코레일 로그인이 필요합니다.');
      setIsLoginModalOpen(true);
      return;
    }

    const targetPhone = phoneNo || session.phoneNo || '';
    if (!targetPhone) {
      toast.warn('예매대기 안내를 수신할 휴대폰 번호를 상단 SMS 알림 입력창에 입력해 주세요.');
      return;
    }
    toast.info(`⏳ [${train.trainType} ${train.trainNo}호] 일반실 예매대기 정규 신청 전송 중...`);

    try {
      const res = await axios.post(
        `/api/v1/korail/reserve-wait?phoneNo=${encodeURIComponent(targetPhone)}&includeSpecial=false`,
        train
      );
      if (res.data && res.data.success) {
        playSound('success');
        toast.success(res.data.message);
        setSuccessModal({
          open: true,
          event: {
            taskId: 'MANUAL',
            trainNo: train.trainNo,
            trainType: train.trainType,
            route: `${train.departureStation} ➡️ ${train.arrivalStation}`,
            departureTime: train.departureTime,
            status: 'SUCCESS_WAITLIST',
            attempts: 1,
            lastResponseTimeMs: 0,
            message: res.data.message,
            timestamp: new Date().toLocaleTimeString(),
          },
        });
      } else {
        if (res.data?.message?.includes('P058') || res.data?.message?.includes('로그아웃')) {
          fetchSession();
        }
        toast.error(res.data?.message || '예매대기 신청에 실패했습니다.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`예매대기 신청 오류: ${errorMessage}`);
      fetchSession();
    }
  };

  const swapStations = () => {
    setDepartureStation(arrivalStation);
    setArrivalStation(departureStation);
  };

  const majorStations = ['수서', '부산', '서울', '동대구', '대전', '광명', '울산', '광주송정'];

  const isMonitoringRunning = activeMonitor?.status === 'POLLING';
  const selectedTrainNos = selectedTrains.map((t) => t.trainNo);
  const runningTargetCount =
    activeMonitor?.targetTrainCount ||
    activeMonitor?.targetTrainNos?.length ||
    (activeMonitor?.targetTrains?.length ?? 0);
  const radarBadgeCount = isMonitoringRunning
    ? (runningTargetCount > 0 ? runningTargetCount : 1)
    : selectedTrains.length;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#0B132B]/95 text-slate-200 overflow-hidden font-sans select-none">
      {/* 1. 상단 글로벌 컨트롤 바 */}
      <header className="px-6 py-3 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Train className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                <span>KTX/SRT 스텔스 멀티 사냥기</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 text-[9px] font-mono font-bold">
                  SNIPER RADAR
                </span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              단일 쿼리 기반 3~5대 동시 감시(WAF 1x) · 취소표 즉시 낚아채기 & 텔레그램 즉시 알림
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

      {/* 2. 에디토리얼 쿠튀르 탭 셀렉터 바 (100vh Single-Pane 구조) */}
      <div className="px-6 pt-3 pb-0 bg-slate-950/40 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          {/* Tab 1: 전체 열차 검색 */}
          <button
            onClick={() => setActiveTab('ALL_SCHEDULES')}
            className={`relative pb-3 px-3 text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'ALL_SCHEDULES'
                ? 'text-white border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>01 / 전체 열차 검색</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
              activeTab === 'ALL_SCHEDULES'
                ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                : 'bg-white/5 text-slate-400'
            }`}>
              {trains.length}
            </span>
          </button>

          {/* Tab 2: 사냥 레이더 */}
          <button
            onClick={() => setActiveTab('TARGET_RADAR')}
            className={`relative pb-3 px-3 text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'TARGET_RADAR'
                ? 'text-white border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>02 / 사냥 레이더</span>
            {radarBadgeCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                isMonitoringRunning
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {isMonitoringRunning ? 'LIVE ' : ''}{radarBadgeCount}대
              </span>
            )}
          </button>
        </div>

        {/* 우측 빠른 상태 지시자 */}
        <div className="pb-3 flex items-center gap-3 text-xs font-mono">
          {isMonitoringRunning ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                사냥 중: <strong className="text-white tabular-nums">{activeMonitor?.attempts || 0}회 시도</strong> ({activeMonitor?.lastResponseTimeMs || 0}ms)
              </span>
              <button
                onClick={() => setActiveTab('TARGET_RADAR')}
                className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold ml-1 transition-all"
              >
                레이더 이동 ➡️
              </button>
            </div>
          ) : (
            <span className="text-slate-500 text-[11px]">대기 중 (목록에서 열차를 선택 후 사냥을 시작하세요)</span>
          )}
        </div>
      </div>

      {/* 3. 메인 콘텐츠 영역 (탭 전환) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === 'ALL_SCHEDULES' ? (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-5 gap-4">
            {/* 검색 툴바 & 퀵 필터 */}
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

            {/* 열차 목록 테이블 (체크박스 & 다중 선택 사냥 바 포함) */}
            <TrainScheduleList
              trains={trains}
              searchDate={searchDate}
              isSearching={isSearching}
              activeMonitor={activeMonitor}
              selectedTrainNos={selectedTrainNos}
              onToggleSelectTrain={handleToggleSelectTrain}
              onSelectAllTrains={handleSelectAllTrains}
              onClearSelectedTrains={handleClearSelectedTrains}
              onManualReserve={handleManualReserve}
              onManualWait={handleManualWait}
              onStartMonitor={handleStartMonitor}
              onStartMultiMonitor={handleStartMultiMonitor}
              onStopMonitor={handleStopMonitor}
              onGoToRadarTab={() => setActiveTab('TARGET_RADAR')}
            />
          </div>
        ) : (
          /* Tab 2: 사냥 레이더 집중 뷰 */
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <SelectedRadarList
              activeMonitor={activeMonitor}
              selectedTrains={selectedTrains}
              onStopMonitor={handleStopMonitor}
              onRemoveTarget={handleRemoveTarget}
              onManualReserve={handleManualReserve}
              onManualWait={handleManualWait}
              onGoToSearchTab={() => setActiveTab('ALL_SCHEDULES')}
            />
          </div>
        )}
      </div>

      {/* 4. 코레일 로그인 모달 */}
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

      {/* 5. 성공 축하 모달 */}
      <ReservationSuccessModal
        isOpen={successModal.open}
        onClose={() => setSuccessModal({ open: false })}
        event={successModal.event}
      />
    </div>
  );
}
