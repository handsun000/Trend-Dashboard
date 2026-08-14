import React, { useState } from 'react';
import { X, BellPlus, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAlertCreated: () => void;
  defaultTicker?: string;
}

export default function UserAlertModal({ isOpen, onClose, onAlertCreated, defaultTicker = '005930' }: Props) {
  const [ticker, setTicker] = useState(defaultTicker);
  const [targetPrice, setTargetPrice] = useState<number | ''>(defaultTicker === '000660' ? 1700000 : defaultTicker === 'KRW-BTC' ? 95000000 : 280000);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (defaultTicker) {
      setTicker(defaultTicker);
      if (defaultTicker === '000660') setTargetPrice(1700000);
      else if (defaultTicker === '005930') setTargetPrice(280000);
      else if (defaultTicker === '035420') setTargetPrice(230000);
      else if (defaultTicker === 'KRW-BTC') setTargetPrice(95000000);
    }
  }, [defaultTicker]);

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
        className: 'border border-white/10 bg-slate-900/90 text-slate-100 rounded-2xl shadow-2xl backdrop-blur-xl font-medium',
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
    <div className="fixed inset-0 bg-[#0B132B]/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#0B132B]/95 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-6 relative text-slate-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <BellPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">목표가 맞춤 알림</h3>
            <p className="text-xs text-slate-400 mt-0.5">시세 도달 시 실시간 웹소켓 팝업을 수신합니다.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              종목 선택
            </label>
            <select
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="w-full h-12 px-4 bg-[#0B132B]/80 border border-white/10 rounded-2xl text-white font-semibold focus:outline-none focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              <option value="005930" className="bg-[#0B132B] text-white">삼성전자 (005930)</option>
              <option value="000660" className="bg-[#0B132B] text-white">SK하이닉스 (000660)</option>
              <option value="035420" className="bg-[#0B132B] text-white">NAVER (035420)</option>
              <option value="KRW-BTC" className="bg-[#0B132B] text-white">비트코인 (KRW-BTC)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              목표가 (Target Price)
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="예: 280000"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full h-12 pl-4 pr-12 bg-[#0B132B]/80 border border-white/10 rounded-2xl text-white font-bold focus:outline-none focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 transition-all font-mono"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">원</span>
            </div>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 font-bold rounded-2xl transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-2xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
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
