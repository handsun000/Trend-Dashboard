import React, { useState, useEffect, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { RefreshCw } from 'lucide-react';

// Code-splitting via Dynamic Import (React.lazy)
const HomeScrollytelling = lazy(() => import('./pages/HomeScrollytelling'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TrainMonitorPage = lazy(() => import('./pages/TrainMonitorPage'));
const PublicDataCenter = lazy(() => import('./pages/PublicDataCenter'));
const AlertsView = lazy(() => import('./pages/AlertsView'));
const SettingsView = lazy(() => import('./pages/SettingsView'));

function ViewLoadingSkeleton() {
  return (
    <div className="flex-1 min-h-0 h-full flex flex-col items-center justify-center p-8 text-slate-400 gap-3">
      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-xl">
        <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
      </div>
      <p className="text-xs font-mono font-bold text-slate-300 tracking-wider">LOADING MODULE...</p>
    </div>
  );
}

function App() {
  const [activeView, setActiveView] = useState('home');

  useEffect(() => {
    try {
      const client = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onStompError: (frame) => {
          console.warn('STOMP Error:', frame);
        },
        onWebSocketError: (event) => {
          console.warn('WebSocket Error:', event);
        }
      });

      client.onConnect = function () {
        client.subscribe('/topic/alerts', (message) => {
          if (message.body) {
            try {
              const alertData = JSON.parse(message.body);
              toast.success(`🔔 [${alertData.ticker}] 목표가 ${alertData.price?.toLocaleString() || alertData.price}원 도달!`, {
                position: "bottom-right",
                theme: "dark",
                className: "border border-white/10 bg-slate-900/90 text-slate-100 rounded-2xl shadow-2xl backdrop-blur-xl font-medium",
              });
            } catch (e) {
              console.error(e);
            }
          }
        });
      };

      client.activate();

      return () => {
        try {
          client.deactivate();
        } catch (e) {
          // ignore cleanup error
        }
      };
    } catch (e) {
      console.warn('Failed to initialize WebSocket client:', e);
    }
  }, []);

  return (
    <div className="relative flex h-screen bg-[#0B132B] text-slate-200 overflow-hidden font-sans selection:bg-emerald-400 selection:text-slate-950">
      {/* Deep Navy to Cyan Ambient Mesh Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[45rem] h-[45rem] rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent blur-[140px]"></div>
        <div className="absolute top-1/4 -right-40 w-[45rem] h-[45rem] rounded-full bg-gradient-to-bl from-cyan-500/20 via-blue-600/10 to-transparent blur-[140px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-[50rem] h-[50rem] rounded-full bg-gradient-to-tr from-teal-500/15 via-indigo-600/10 to-transparent blur-[150px]"></div>
        {/* Subtle dynamic geometric grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] opacity-40"></div>
      </div>

      {/* Main Layout: If activeView is 'home', full-screen cinematic without sidebar */}
      {activeView === 'home' ? (
        <main className="relative z-10 w-screen h-screen min-h-0 overflow-hidden flex flex-col">
          <Suspense fallback={<ViewLoadingSkeleton />}>
            <HomeScrollytelling onNavigate={setActiveView} />
          </Suspense>
        </main>
      ) : (
        <>
          <Sidebar activeView={activeView} onViewChange={setActiveView} />
          <div className="relative z-10 flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-white/[0.01]">
            <Header />
            <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <Suspense fallback={<ViewLoadingSkeleton />}>
                {activeView === 'dashboard' && <Dashboard />}
                {activeView === 'train' && <TrainMonitorPage />}
                {activeView === 'public-data' && <PublicDataCenter />}
                {activeView === 'alerts' && <AlertsView />}
                {activeView === 'settings' && <SettingsView />}
              </Suspense>
            </main>
          </div>
        </>
      )}
      <ToastContainer />
    </div>
  );
}

export default App;


