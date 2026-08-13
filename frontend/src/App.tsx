import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

function App() {
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
    <div className="relative flex h-screen bg-slate-950 text-slate-300 overflow-hidden font-sans selection:bg-emerald-400 selection:text-slate-950">
      {/* 1. 진짜 오로라 배경 (Aurora Background) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[35rem] h-[35rem] rounded-full bg-emerald-500/20 blur-[120px]"></div>
        <div className="absolute top-1/3 -right-32 w-[35rem] h-[35rem] rounded-full bg-indigo-500/20 blur-[120px]"></div>
        <div className="absolute -bottom-32 left-1/3 w-[40rem] h-[40rem] rounded-full bg-teal-500/15 blur-[120px]"></div>
      </div>

      {/* Main Layout */}
      <Sidebar />
      <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden bg-slate-900/20 backdrop-blur-md">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Dashboard />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
