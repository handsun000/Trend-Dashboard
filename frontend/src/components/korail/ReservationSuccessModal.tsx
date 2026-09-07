import React from 'react';
import { Sparkles } from 'lucide-react';
import type { MonitorEvent } from '@/types/korail';

interface ReservationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: MonitorEvent;
}

export const ReservationSuccessModal: React.FC<ReservationSuccessModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  if (!isOpen) return null;

  return (
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
            {event?.status === 'SUCCESS_RESERVE'
              ? '취소표 좌석 예약 완료'
              : '예매대기 신청 완료'}
          </p>
        </div>

        <div className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left text-xs space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">열차 정보</span>
            <span className="text-white font-bold">
              {event?.trainType} {event?.trainNo}호
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">구간 / 시각</span>
            <span className="text-cyan-300 font-bold">
              {event?.route} ({event?.departureTime})
            </span>
          </div>
          <div className="flex justify-between border-t border-white/5 pt-2">
            <span className="text-slate-400">결과 안내</span>
            <span className="text-emerald-400 font-bold text-right">
              {event?.message}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default ReservationSuccessModal;
