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
      // STOMP WebSocket connection using Vite proxy path
      const client = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        debug: function (str) {
          console.log(str);
        },
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
                className: "border border-emerald-500/40 bg-zinc-950/90 text-white rounded-2xl shadow-2xl backdrop-blur-xl font-bold",
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
    <div className="flex h-screen bg-black overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950/90 backdrop-blur-2xl rounded-l-[2rem] border-l border-zinc-800/60 shadow-2xl ml-[-1rem] z-20">
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
