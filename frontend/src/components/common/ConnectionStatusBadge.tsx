import React from 'react';
import { useWebSocket, type ConnectionStatus } from '../../contexts/WebSocketContext';
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle2 } from 'lucide-react';


interface ConnectionStatusBadgeProps {
  mode?: 'compact' | 'full';
  showTopics?: boolean;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  mode = 'compact',
  showTopics = true,
}) => {
  const { status, retryCount, nextRetryDelay, activeSubscriptionCount, reconnect } = useWebSocket();

  const renderContent = () => {
    switch (status) {
      case 'CONNECTED':
        return (
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider">LIVE</span>
            {showTopics && activeSubscriptionCount > 0 && (
              <span className="text-[10px] text-emerald-500/80 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                {activeSubscriptionCount} pipes
              </span>
            )}
          </div>
        );

      case 'RECONNECTING':
        return (
          <div className="flex items-center gap-1.5 text-amber-400 font-mono">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold">
              재연결 #{retryCount}
              {nextRetryDelay ? ` (${Math.round(nextRetryDelay / 1000)}s)` : ''}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                reconnect();
              }}
              title="지금 즉시 재연결"
              className="ml-1 text-[9px] px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded border border-amber-500/40 transition-colors font-sans"
            >
              재시도
            </button>
          </div>
        );

      case 'CONNECTING':
        return (
          <div className="flex items-center gap-1.5 text-sky-400 font-mono">
            <RefreshCw className="w-3 h-3 animate-spin text-sky-400 shrink-0" />
            <span className="text-[11px] font-bold">연결 중...</span>
          </div>
        );

      case 'DISCONNECTED':
      default:
        return (
          <div className="flex items-center gap-1.5 text-rose-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0"></span>
            <span className="text-[11px] font-bold">OFFLINE</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                reconnect();
              }}
              title="네트워크 재연결"
              className="ml-1 text-[9px] px-1.5 py-0.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded border border-rose-500/40 transition-colors font-sans"
            >
              연결
            </button>
          </div>
        );
    }
  };

  if (mode === 'full') {
    return (
      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === 'CONNECTED' ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : status === 'DISCONNECTED' ? (
            <WifiOff className="w-4 h-4 text-rose-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">STOMP 파이프라인</span>
            <span className="text-[11px] text-slate-200 font-medium">
              {status === 'CONNECTED'
                ? '실시간 시세 & 알림 정상 수신 중'
                : status === 'RECONNECTING'
                ? `재연결 대기 중 (지수 백오프 #${retryCount})`
                : status === 'CONNECTING'
                ? '웹소켓 핸드셰이크 진행 중'
                : '네트워크 연결이 끊겼습니다'}
            </span>
          </div>
        </div>
        <div>{renderContent()}</div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center px-2 py-1 rounded-lg bg-white/[0.03] border border-white/5">
      {renderContent()}
    </div>
  );
};

export default ConnectionStatusBadge;
