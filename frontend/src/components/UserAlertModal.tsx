import React, { useState } from 'react';
import { X, BellPlus, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAlertCreated: () => void;
}

export default function UserAlertModal({ isOpen, onClose, onAlertCreated }: Props) {
  const [ticker, setTicker] = useState('005930');
  const [targetPrice, setTargetPrice] = useState<number | ''>(85000);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || targetPrice <= 0) {
      toast.error('유효한 목표가를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/v1/alerts', {
        userId: 'user1',
        ticker: ticker,
        targetPrice: Number(targetPrice),
      });

      toast.success(`🔔 [${ticker}] 목표가 ${Number(targetPrice).toLocaleString()}원 알림 등록 완료!`, {
        position: 'bottom-right',
        theme: 'dark',
        className: 'border border-emerald-500/40 bg-zinc-950 text-white rounded-2xl shadow-2xl',
      });
      onAlertCreated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('알림 등록 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <BellPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">목표가 알림 설정</h3>
            <p className="text-xs text-zinc-400">시세 도달 시 즉시 알림 팝업을 수신합니다.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              종목 선택
            </label>
            <select
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="w-full h-12 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="005930">삼성전자 (005930)</option>
              <option value="000660">SK하이닉스 (000660)</option>
              <option value="035420">NAVER (035420)</option>
              <option value="KRW-BTC">비트코인 (KRW-BTC)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              목표가 (Target Price)
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="예: 85000"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full h-12 pl-4 pr-12 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-zinc-600"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-semibold">원</span>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-xl transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>알림 등록</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
