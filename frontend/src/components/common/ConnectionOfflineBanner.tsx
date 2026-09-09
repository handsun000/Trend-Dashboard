import React from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

export const ConnectionOfflineBanner: React.FC = () => {
  const { status, retryCount, nextRetryDelay, reconnect } = useWebSocket();

  if (status === 'CONNECTED' || status === 'CONNECTING') {
    return null;
  }

  const isReconnecting = status === 'RECONNECTING';

  return (
    <div className={`w-full px-4 py-2 text-xs flex items-center justify-between transition-all duration-300 z-30 shrink-0 border-b ${
      isReconnecting 
        ? 'bg-amber-950/70 border-amber-500/30 text-amber-200' 
        : 'bg-rose-950/70 border-rose-500/30 text-rose-200'
    } backdrop-blur-md`}>
      <div className="flex items-center gap-2 max-w-[80%] truncate">
        {isReconnecting ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        ) : (
          <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
        )}
        <span className="font-medium truncate">
          {isReconnecting
            ? `실시간 스트림 연결이 일시 중단되었습니다. 지수 백오프로 자동 재연결 중입니다 (시도 #${retryCount}${nextRetryDelay ? `, 약 ${Math.round(nextRetryDelay / 1000)}초 후 재시도` : ''}).`
            : '오프라인 상태입니다. 네트워크 연결을 확인해 주세요.'}
        </span>
      </div>

      <button
        onClick={reconnect}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] shadow-sm transition-all active:scale-95 shrink-0 ${
          isReconnecting
            ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-100'
            : 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-100'
        }`}
      >
        <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
        <span>지금 재연결</span>
      </button>
    </div>
  );
};

export default ConnectionOfflineBanner;
