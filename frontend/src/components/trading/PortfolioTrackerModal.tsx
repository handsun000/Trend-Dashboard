import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, PieChart as PieIcon, TrendingUp, DollarSign, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import { toast } from 'react-toastify';

export interface PortfolioPosition {
  id: string;
  ticker: string;
  name: string;
  market: string;
  buyPrice: number;
  quantity: number;
  createdAt: number;
}

interface PortfolioTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity: (entity: { ticker: string; name: string; market: string }) => void;
}

const DEFAULT_POPULAR_OPTIONS = [
  { ticker: '005930', name: '삼성전자', market: 'KOSPI', defaultPrice: 78500 },
  { ticker: '000660', name: 'SK하이닉스', market: 'KOSPI', defaultPrice: 194500 },
  { ticker: '042700', name: '한미반도체', market: 'KOSPI', defaultPrice: 148000 },
  { ticker: '035720', name: '카카오', market: 'KOSPI', defaultPrice: 37800 },
  { ticker: 'KRW-BTC', name: '비트코인', market: 'CRYPTO', defaultPrice: 88935000 },
  { ticker: 'KRW-ETH', name: '이더리움', market: 'CRYPTO', defaultPrice: 3820000 },
  { ticker: 'KRW-SOL', name: '솔라나', market: 'CRYPTO', defaultPrice: 215000 },
  { ticker: 'KRW-XRP', name: '리플', market: 'CRYPTO', defaultPrice: 820 },
];

const COLORS = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6', '#14B8A6'];

export default function PortfolioTrackerModal({ isOpen, onClose, onSelectEntity }: PortfolioTrackerModalProps) {
  const [positions, setPositions] = useState<PortfolioPosition[]>(() => {
    const saved = localStorage.getItem('trenddash_portfolio');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: '1', ticker: '005930', name: '삼성전자', market: 'KOSPI', buyPrice: 75000, quantity: 50, createdAt: Date.now() },
      { id: '2', ticker: 'KRW-BTC', name: '비트코인', market: 'CRYPTO', buyPrice: 82000000, quantity: 0.15, createdAt: Date.now() },
    ];
  });

  // Live quotes map for calculating real-time P&L
  const [livePrices, setLivePrices] = useState<Record<string, number>>({
    '005930': 78500,
    '000660': 194500,
    '042700': 148000,
    '035720': 37800,
    'KRW-BTC': 88935000,
    'KRW-ETH': 3820000,
    'KRW-SOL': 215000,
    'KRW-XRP': 820,
  });

  // Form states for adding a new position
  const [selectedOpt, setSelectedOpt] = useState(DEFAULT_POPULAR_OPTIONS[0]);
  const [buyPrice, setBuyPrice] = useState<number>(DEFAULT_POPULAR_OPTIONS[0].defaultPrice);
  const [quantity, setQuantity] = useState<number>(10);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('trenddash_portfolio', JSON.stringify(positions));
  }, [positions]);

  // Fetch live prices for positions
  useEffect(() => {
    if (!isOpen) return;

    positions.forEach(async (pos) => {
      try {
        const res = await axios.get(`/api/v1/market/quote?ticker=${pos.ticker}&name=${encodeURIComponent(pos.name)}`);
        if (res.data?.price) {
          setLivePrices((prev) => ({ ...prev, [pos.ticker]: res.data.price }));
        }
      } catch (e) {
        // use default fallback price
      }
    });
  }, [isOpen, positions]);

  if (!isOpen) return null;

  const handleAddPosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (buyPrice <= 0 || quantity <= 0) {
      toast.warning('올바른 매수가와 수량을 입력해주세요.');
      return;
    }

    const newPos: PortfolioPosition = {
      id: Date.now().toString(),
      ticker: selectedOpt.ticker,
      name: selectedOpt.name,
      market: selectedOpt.market,
      buyPrice,
      quantity,
      createdAt: Date.now(),
    };

    setPositions([...positions, newPos]);
    toast.success(`[${selectedOpt.name}] 포트폴리오에 추가되었습니다.`);
  };

  const handleDelete = (id: string) => {
    setPositions(positions.filter((p) => p.id !== id));
    toast.info('포지션이 삭제되었습니다.');
  };

  // Calculations
  let totalInvested = 0;
  let totalEvaluation = 0;

  const enrichedPositions = positions.map((pos) => {
    const currentPrice = livePrices[pos.ticker] || pos.buyPrice;
    const invested = pos.buyPrice * pos.quantity;
    const evalValue = currentPrice * pos.quantity;
    const pnlAmount = evalValue - invested;
    const pnlRate = invested > 0 ? (pnlAmount / invested) * 100 : 0;

    totalInvested += invested;
    totalEvaluation += evalValue;

    return {
      ...pos,
      currentPrice,
      invested,
      evalValue,
      pnlAmount,
      pnlRate,
    };
  });

  const totalPnlAmount = totalEvaluation - totalInvested;
  const totalPnlRate = totalInvested > 0 ? (totalPnlAmount / totalInvested) * 100 : 0;
  const isTotalProfit = totalPnlAmount >= 0;

  const pieData = enrichedPositions.map((p) => ({
    name: p.name,
    value: Math.round(p.evalValue),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none font-sans">
      <div className="bg-[#0B132B]/95 border border-white/10 w-full max-w-4xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Wallet className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>포트폴리오 & 손익(P&L) 시뮬레이터</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                  REALTIME LIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">가상 매수 포지션 등록 및 실시간 평가손익 추적</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-4 pr-1 custom-scrollbar">
          
          {/* 1. Summary Ribbon Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">총 매수 원금</span>
              <p className="text-lg font-black text-white font-mono tabular-nums mt-1">
                ₩{Math.round(totalInvested).toLocaleString()}
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">총 평가 금액</span>
              <p className="text-lg font-black text-white font-mono tabular-nums mt-1">
                ₩{Math.round(totalEvaluation).toLocaleString()}
              </p>
            </div>

            <div className={`border rounded-2xl p-3.5 flex flex-col justify-between ${isTotalProfit ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">총 평가 손익 (수익률)</span>
                {isTotalProfit ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-black font-mono tabular-nums">
                  {isTotalProfit ? `+₩${Math.round(totalPnlAmount).toLocaleString()}` : `-₩${Math.round(Math.abs(totalPnlAmount)).toLocaleString()}`}
                </span>
                <span className="text-xs font-black font-mono tabular-nums">
                  ({isTotalProfit ? `+${totalPnlRate.toFixed(2)}%` : `${totalPnlRate.toFixed(2)}%`})
                </span>
              </div>
            </div>
          </div>

          {/* 2. Donut Chart & Add Position Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Donut Chart */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5 self-start">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                자산 포트폴리오 비중
              </span>
              <div className="w-full h-44 relative">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.4)" strokeWidth={1.5} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any) => [`₩${Number(val).toLocaleString()}`, '평가금액']}
                        contentStyle={{ backgroundColor: '#0B132B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-500">포지션 없음</div>
                )}
              </div>
            </div>

            {/* Add Position Form */}
            <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                신규 매수 포지션 추가
              </span>
              
              <form onSubmit={handleAddPosition} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Select Stock / Crypto */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-400">종목 선택</label>
                  <select
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                    value={selectedOpt.ticker}
                    onChange={(e) => {
                      const opt = DEFAULT_POPULAR_OPTIONS.find((o) => o.ticker === e.target.value);
                      if (opt) {
                        setSelectedOpt(opt);
                        setBuyPrice(opt.defaultPrice);
                      }
                    }}
                  >
                    {DEFAULT_POPULAR_OPTIONS.map((o) => (
                      <option key={o.ticker} value={o.ticker}>
                        {o.name} ({o.ticker})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Buy Price */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-400">매수가 (₩)</label>
                  <input
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(Number(e.target.value))}
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400 tabular-nums"
                  />
                </div>

                {/* Quantity */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-400">보유 수량</label>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400 tabular-nums"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end mt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    포트폴리오에 추가
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 3. Position List Table */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <span className="text-xs font-bold text-slate-300 mb-3 block">보유 포지션 상세 현황</span>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono tabular-nums">
                <thead>
                  <tr className="text-[10px] text-slate-400 border-b border-white/5">
                    <th className="pb-2">종목</th>
                    <th className="pb-2 text-right">매수가</th>
                    <th className="pb-2 text-right">현재가</th>
                    <th className="pb-2 text-right">수량</th>
                    <th className="pb-2 text-right">평가금액</th>
                    <th className="pb-2 text-right">평가손익 (수익률)</th>
                    <th className="pb-2 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {enrichedPositions.map((pos) => {
                    const isProfit = pos.pnlAmount >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5">
                          <button
                            onClick={() => {
                              onSelectEntity({ ticker: pos.ticker, name: pos.name, market: pos.market });
                              onClose();
                            }}
                            className="font-black text-white hover:text-emerald-400 flex items-center gap-1.5 text-left"
                          >
                            <span>{pos.name}</span>
                            <span className="text-[10px] text-slate-500 font-normal">({pos.ticker})</span>
                          </button>
                        </td>
                        <td className="py-2.5 text-right text-slate-300">₩{pos.buyPrice.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-slate-100 font-bold">₩{pos.currentPrice.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-slate-300">{pos.quantity}</td>
                        <td className="py-2.5 text-right text-white font-bold">₩{Math.round(pos.evalValue).toLocaleString()}</td>
                        <td className={`py-2.5 text-right font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <span>{isProfit ? `+₩${Math.round(pos.pnlAmount).toLocaleString()}` : `-₩${Math.round(Math.abs(pos.pnlAmount)).toLocaleString()}`}</span>
                          <span className="ml-1 text-[10px]">({isProfit ? `+${pos.pnlRate.toFixed(2)}%` : `${pos.pnlRate.toFixed(2)}%`})</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => handleDelete(pos.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
