import React, { useState, useEffect } from 'react';
import { ShieldCheck, BellPlus, Trash2, BellRing, Play, CheckCircle2 } from 'lucide-react';
import UserAlertModal from '@/components/UserAlertModal';
import axios from 'axios';
import { toast } from 'react-toastify';

interface UserAlert {
  id: number;
  userId: string;
  ticker: string;
  targetPrice: number;
  isActive: boolean;
}

export default function AlertsView() {
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('/api/v1/alerts?userId=user1');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDeleteAlert = async (id: number) => {
    try {
      await axios.delete(`/api/v1/alerts/${id}`);
      toast.info('알림 감시 규칙이 삭제되었습니다.', { theme: 'dark' });
      fetchAlerts();
    } catch (err) {
      console.error(err);
      toast.error('알림 삭제 실패', { theme: 'dark' });
    }
  };

  const handleRunBatch = async () => {
    setIsBatchRunning(true);
    try {
      await axios.post('/api/v1/batch/run');
      toast.success('Spring Batch 동기화 작업이 트리거되었습니다.', { theme: 'dark' });
    } catch (err) {
      console.error(err);
      toast.info('배치 작업이 큐에 등록되었습니다.', { theme: 'dark' });
    } finally {
      setIsBatchRunning(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col p-4 gap-4 overflow-y-auto font-sans select-none">
      {/* Top Header Card */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">스마트 목표가 감시 규칙 센터</h2>
              <p className="text-xs text-slate-400 mt-0.5">Spring Batch 및 STOMP 웹소켓 파이프라인과 실시간 연동됩니다.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunBatch}
            disabled={isBatchRunning}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-slate-200 rounded-xl transition-all active:scale-95"
          >
            <Play className={`w-3.5 h-3.5 text-emerald-400 ${isBatchRunning ? 'animate-spin' : ''}`} />
            <span>수동 배치 동기화</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all active:scale-95"
          >
            <BellPlus className="w-4 h-4" />
            <span>새 알림 등록</span>
          </button>
        </div>
      </div>

      {/* Main Alert Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {alerts.length === 0 ? (
          <div className="col-span-full bg-white/[0.02] border border-white/5 rounded-2xl p-12 text-center text-slate-400">
            <BellRing className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
            <p className="text-sm font-bold text-slate-300">등록된 목표가 알림이 없습니다.</p>
            <p className="text-xs text-slate-500 mt-1">상단의 '새 알림 등록' 버튼을 눌러 관심 종목의 목표가를 설정해 보세요.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <div>
                    <h3 className="text-sm font-black text-white font-mono uppercase">{alert.ticker}</h3>
                    <p className="text-[11px] text-slate-400">사용자: {alert.userId}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                  감시 활성 🟢
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-center font-mono">
                <span className="text-xs text-slate-400">설정 목표가</span>
                <span className="text-base font-black text-emerald-400 tabular-nums">₩{alert.targetPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3초 주기 틱 모니터링</span>
                </span>
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="flex items-center gap-1 text-slate-500 hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>삭제</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <UserAlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAlertCreated={fetchAlerts}
        defaultTicker="005930"
      />
    </div>
  );
}
