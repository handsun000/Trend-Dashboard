import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, BellPlus, Trash2, ShieldAlert, Sparkles } from 'lucide-react';
import UserAlertModal from '@/components/UserAlertModal';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface UserAlert {
  id: number;
  userId: string;
  ticker: string;
  targetPrice: number;
  isActive: boolean;
}

interface ChartTick {
  time: string;
  price: number;
}

const initialStockData: ChartTick[] = [
  { time: '16:55:00', price: 82800 },
  { time: '16:56:00', price: 83000 },
  { time: '16:57:00', price: 82900 },
  { time: '16:58:00', price: 83100 },
  { time: '16:59:00', price: 83200 },
];

const initialCryptoData: ChartTick[] = [
  { time: '16:55:00', price: 89800000 },
  { time: '16:56:00', price: 89850000 },
  { time: '16:57:00', price: 89820000 },
  { time: '16:58:00', price: 89880000 },
  { time: '16:59:00', price: 89900000 },
];

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [stockData, setStockData] = useState<ChartTick[]>(initialStockData);
  const [cryptoData, setCryptoData] = useState<ChartTick[]>(initialCryptoData);
  const [currentStockPrice, setCurrentStockPrice] = useState<number>(83200);
  const [currentCryptoPrice, setCurrentCryptoPrice] = useState<number>(89900000);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('/api/v1/alerts?userId=user1');
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      client.subscribe('/topic/ticks', (message) => {
        if (message.body) {
          try {
            const tick = JSON.parse(message.body);
            if (tick.ticker === '005930') {
              setCurrentStockPrice(tick.price);
              setStockData((prev) => {
                const updated = [...prev, { time: tick.time, price: tick.price }];
                return updated.slice(-10);
              });
            } else if (tick.ticker === 'KRW-BTC') {
              setCurrentCryptoPrice(tick.price);
              setCryptoData((prev) => {
                const updated = [...prev, { time: tick.time, price: tick.price }];
                return updated.slice(-10);
              });
            }
          } catch (e) {
            console.error(e);
          }
        }
      });
    };

    client.activate();
    return () => {
      client.deactivate();
    };
  }, []);

  const handleDeleteAlert = async (id: number) => {
    try {
      await axios.delete(`/api/v1/alerts/${id}`);
      toast.info('알림이 삭제되었습니다.');
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto text-slate-300">
      
      {/* 2026 Bento UI Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Stock Price (Glassmorphism + Bento) */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">주요 주식 실시간 시세</p>
              <h3 className="text-2xl font-black text-white mt-1 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                <span>삼성전자</span>
                <span className="text-xs font-medium text-slate-400 font-mono">(005930)</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-white">₩{currentStockPrice.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">+4.26% ▲</span>
          </div>
        </div>

        {/* Card 2: Crypto Price (Glassmorphism + Bento) */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">업비트 실시간 시세</p>
              <h3 className="text-2xl font-black text-white mt-1 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                <span>비트코인</span>
                <span className="text-xs font-medium text-slate-400 font-mono">(BTC)</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-white">₩{currentCryptoPrice.toLocaleString()}</span>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">Upbit Live 🟢</span>
          </div>
        </div>

        {/* Card 3: Alert Customization (Glassmorphism + Gradient Button) */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 group flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">맞춤 알림 관리</p>
              <h3 className="text-2xl font-black text-white mt-1">목표가 알림</h3>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all duration-300"
            >
              <BellPlus className="w-4 h-4" />
              <span>알림 추가</span>
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">활성 알림 {alerts.length}개</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">감시 중 🟢</span>
          </div>
        </div>
      </div>

      {/* User Active Alerts Grid (Compact Bento Box) */}
      {alerts.length > 0 && (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <span>내 활성 목표가 알림 목록</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex justify-between items-center shadow-2xl hover:border-emerald-500/30 transition-all">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">{alert.ticker}</p>
                  <p className="text-base font-extrabold text-emerald-400 mt-0.5 font-mono">₩{alert.targetPrice.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                  title="알림 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tabs Container */}
      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="stock">
            주식 실시간 틱 (Stock Tick)
          </TabsTrigger>
          <TabsTrigger value="crypto">
            업비트 비트코인 틱 (Crypto Tick)
          </TabsTrigger>
          <TabsTrigger value="public">
            공공 데이터 트렌드
          </TabsTrigger>
        </TabsList>
        
        {/* Stock Chart Tab */}
        <TabsContent value="stock" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Bento Box (bg-slate-900/40 + backdrop-blur-xl + border-white/10) */}
            <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    삼성전자 (005930) 3초 실시간 스트리밍
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">WebSocket STOMP Live Feed Connected</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all"
                >
                  <BellPlus className="w-3.5 h-3.5" />
                  <span>목표가 추가</span>
                </button>
              </div>

              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stockData}>
                    <defs>
                      <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₩${val.toLocaleString()}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(16px)' }}
                      itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                      formatter={(value: any) => [`₩${Number(value).toLocaleString()}`, '현재가']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#emeraldGradient)" 
                      dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Orderbook Bento Box */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                <span>실시간 호가 정보</span>
                <span className="text-xs font-semibold text-slate-400">매도/매수 잔량</span>
              </h3>
              <div className="space-y-2">
                {[currentStockPrice + 400, currentStockPrice + 200, currentStockPrice + 100].map((price, i) => (
                  <div key={i} className="relative overflow-hidden flex justify-between items-center p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-semibold transition-transform hover:scale-[1.02]">
                    <div className="absolute right-0 top-0 bottom-0 bg-rose-500/10" style={{ width: `${(3 - i) * 25}%` }}></div>
                    <span className="z-10 font-mono">{price.toLocaleString()} 원</span>
                    <span className="text-xs z-10 font-bold bg-rose-500/20 px-2.5 py-0.5 rounded-lg">매도 {120 * (i + 1)} 주</span>
                  </div>
                ))}
                
                <div className="h-px bg-white/10 my-3"></div>

                {[currentStockPrice, currentStockPrice - 100, currentStockPrice - 200].map((price, i) => (
                  <div key={i} className="relative overflow-hidden flex justify-between items-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold transition-transform hover:scale-[1.02]">
                    <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10" style={{ width: `${(i + 1) * 30}%` }}></div>
                    <span className="z-10 font-mono">{price.toLocaleString()} 원</span>
                    <span className="text-xs z-10 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-lg">매수 {200 * (3 - i)} 주</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Crypto Chart Tab */}
        <TabsContent value="crypto" className="space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                  업비트 비트코인 (KRW-BTC) 3초 스트리밍 틱
                </h3>
                <p className="text-xs text-slate-400 mt-1">Upbit REST API Live 3-Second Interval Feed</p>
              </div>
              <div className="text-lg font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-2xl font-mono">
                ₩{currentCryptoPrice.toLocaleString()}
              </div>
            </div>

            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cryptoData}>
                  <defs>
                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₩${(val/1000000).toFixed(2)}M`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(16px)' }} />
                  <Area type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#cyanGradient)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* Public Data Tab */}
        <TabsContent value="public">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl text-center space-y-3 text-slate-300">
            <Sparkles className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-lg font-bold text-white">공공데이터 실시간 트렌드 분석 모듈</p>
            <p className="text-sm text-slate-400">Spring Batch 수집 파이프라인에서 데이터를 동기화 중입니다.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Alert Modal */}
      <UserAlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAlertCreated={fetchAlerts}
      />
    </div>
  );
}
