import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';


export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

export interface WebSocketContextValue {
  status: ConnectionStatus;
  retryCount: number;
  lastConnectedTime: Date | null;
  nextRetryDelay: number | null;
  activeSubscriptionCount: number;
  reconnect: () => void;
  subscribe: (destination: string, callback: (message: IMessage) => void) => () => void;
  publish: (destination: string, body: any) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const INITIAL_RECONNECT_DELAY = 1500; // 1.5초
const MAX_RECONNECT_DELAY = 30000;    // 최대 30초
const BACKOFF_FACTOR = 2;             // 2배수 증가
const JITTER_FACTOR = 0.2;            // ±20% 무작위 분산

function calculateBackoffDelay(attempt: number): number {
  const base = Math.min(MAX_RECONNECT_DELAY, INITIAL_RECONNECT_DELAY * Math.pow(BACKOFF_FACTOR, attempt));
  const jitter = base * JITTER_FACTOR * (Math.random() * 2 - 1);
  return Math.max(1000, Math.round(base + jitter));
}

interface ActiveSubEntry {
  destination: string;
  callback: (msg: IMessage) => void;
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('CONNECTING');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastConnectedTime, setLastConnectedTime] = useState<Date | null>(null);
  const [nextRetryDelay, setNextRetryDelay] = useState<number | null>(null);
  const [activeSubCount, setActiveSubCount] = useState<number>(0);

  const clientRef = useRef<Client | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const isExplicitDeactivateRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);

  // 활성 구독 목록 (id -> { destination, callback })
  const activeSubsRef = useRef<Map<string, ActiveSubEntry>>(new Map());
  // 실제 stomp 클라이언트에 등록된 구독 객체 (id -> StompSubscription)
  const stompSubsRef = useRef<Map<string, StompSubscription>>(new Map());

  // 모든 활성 구독을 실제 STOMP client에 등록
  const resubscribeAll = useCallback(() => {
    const client = clientRef.current;
    if (!client || !client.connected) return;

    // 기존 구독 정리
    stompSubsRef.current.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch {
        // ignore
      }
    });
    stompSubsRef.current.clear();

    // 재구독 실행
    activeSubsRef.current.forEach((entry, id) => {
      try {
        const stompSub = client.subscribe(entry.destination, (message) => {
          entry.callback(message);
        });
        stompSubsRef.current.set(id, stompSub);
      } catch (err) {
        console.error(`Failed to subscribe to ${entry.destination}:`, err);
      }
    });
    setActiveSubCount(activeSubsRef.current.size);
  }, []);

  // 재연결 스케줄러 (지수 백오프)
  const scheduleReconnect = useCallback(() => {
    if (isExplicitDeactivateRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('DISCONNECTED');
      setNextRetryDelay(null);
      return;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    const currentAttempt = retryCountRef.current;
    const delay = calculateBackoffDelay(currentAttempt);
    retryCountRef.current = currentAttempt + 1;
    setRetryCount(retryCountRef.current);
    setNextRetryDelay(delay);
    setStatus('RECONNECTING');

    console.info(`[WebSocket] Scheduling reconnect attempt #${retryCountRef.current} in ${delay}ms`);

    retryTimeoutRef.current = window.setTimeout(() => {
      if (isExplicitDeactivateRef.current) return;
      console.info(`[WebSocket] Executing reconnect attempt #${retryCountRef.current}...`);
      if (clientRef.current) {
        clientRef.current.activate();
      }
    }, delay);
  }, []);

  // 즉시 재연결 실행 (수동 트리거 또는 online 이벤트)
  const reconnect = useCallback(() => {
    console.info('[WebSocket] Manual/Instant reconnect triggered');
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    retryCountRef.current = 0;
    setRetryCount(0);
    setNextRetryDelay(null);
    setStatus('CONNECTING');

    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch {
        // ignore
      }
      setTimeout(() => {
        if (!isExplicitDeactivateRef.current && clientRef.current) {
          clientRef.current.activate();
        }
      }, 200);
    }
  }, []);

  // STOMP Client 초기화
  useEffect(() => {
    isExplicitDeactivateRef.current = false;
    retryCountRef.current = 0;

    const wsUrl = import.meta.env.VITE_WS_URL || '/ws';
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      // stompjs 자체의 자동 재연결은 끄고 지수 백오프로 정밀 제어
      reconnectDelay: 0,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.info('[WebSocket] STOMP connected successfully');
        setStatus('CONNECTED');
        setRetryCount(0);
        retryCountRef.current = 0;
        setNextRetryDelay(null);
        setLastConnectedTime(new Date());

        // 재연결 시 기존 모든 구독 자동 복원
        resubscribeAll();
      },
      onDisconnect: () => {
        console.warn('[WebSocket] STOMP disconnected');
        if (!isExplicitDeactivateRef.current) {
          scheduleReconnect();
        }
      },
      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame.headers['message'], frame.body);
        if (!isExplicitDeactivateRef.current) {
          scheduleReconnect();
        }
      },
      onWebSocketClose: (evt) => {
        console.warn('[WebSocket] Underlying WebSocket closed:', evt);
        if (!isExplicitDeactivateRef.current) {
          scheduleReconnect();
        }
      },
      onWebSocketError: (evt) => {
        console.error('[WebSocket] Underlying WebSocket error:', evt);
        if (!isExplicitDeactivateRef.current) {
          scheduleReconnect();
        }
      },
    });

    clientRef.current = client;
    setStatus('CONNECTING');
    client.activate();

    // 네트워크 이벤트 (Online/Offline) 및 탭 활성화 감지
    const handleOnline = () => {
      console.info('[WebSocket] Network is ONLINE, initiating instant reconnect');
      reconnect();
    };

    const handleOffline = () => {
      console.warn('[WebSocket] Network is OFFLINE');
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      setStatus('DISCONNECTED');
      setNextRetryDelay(null);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentClient = clientRef.current;
        if (!currentClient || !currentClient.connected) {
          console.info('[WebSocket] Tab became visible and connection is inactive. Reconnecting...');
          reconnect();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isExplicitDeactivateRef.current = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      stompSubsRef.current.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch {
          // ignore
        }
      });
      stompSubsRef.current.clear();
      activeSubsRef.current.clear();

      try {
        client.deactivate();
      } catch {
        // ignore
      }
      clientRef.current = null;
    };
  }, [resubscribeAll, scheduleReconnect, reconnect]);

  // 구독 등록 함수
  const subscribe = useCallback((destination: string, callback: (message: IMessage) => void) => {
    const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    activeSubsRef.current.set(subId, { destination, callback });
    setActiveSubCount(activeSubsRef.current.size);

    const client = clientRef.current;
    if (client && client.connected) {
      try {
        const stompSub = client.subscribe(destination, callback);
        stompSubsRef.current.set(subId, stompSub);
      } catch (err) {
        console.error(`Error subscribing to ${destination}:`, err);
      }
    }

    // Unsubscribe cleanup 반환
    return () => {
      activeSubsRef.current.delete(subId);
      setActiveSubCount(activeSubsRef.current.size);
      const stompSub = stompSubsRef.current.get(subId);
      if (stompSub) {
        try {
          stompSub.unsubscribe();
        } catch {
          // ignore
        }
        stompSubsRef.current.delete(subId);
      }
    };
  }, []);

  // 메시지 발행 (Publish)
  const publish = useCallback((destination: string, body: any) => {
    const client = clientRef.current;
    if (client && client.connected) {
      client.publish({
        destination,
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
    } else {
      console.warn(`[WebSocket] Cannot publish to ${destination}: client is not connected`);
    }
  }, []);

  const value: WebSocketContextValue = {
    status,
    retryCount,
    lastConnectedTime,
    nextRetryDelay,
    activeSubscriptionCount: activeSubCount,
    reconnect,
    subscribe,
    publish,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * 전역 웹소켓 상태 및 컨트롤 훅
 */
export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

/**
 * 선언적 STOMP 토픽 구독 훅
 * - 컴포넌트 마운트 시 자동 구독
 * - 컴포넌트 언마운트 시 자동 해제
 * - 소켓 재연결 시 자동 재구독 보장
 * - JSON 페이로드 자동 역직렬화
 */
export function useStompSubscription<T = any>(
  destination: string,
  onMessage: (data: T, rawMessage: IMessage) => void,
  enabled: boolean = true
) {
  const { subscribe } = useWebSocket();
  const callbackRef = useRef(onMessage);

  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || !destination) return;

    const unsubscribe = subscribe(destination, (rawMessage) => {
      try {
        const parsed = rawMessage.body ? JSON.parse(rawMessage.body) : null;
        callbackRef.current(parsed, rawMessage);
      } catch (err) {
        console.warn(`[WebSocket] Failed to parse message body for ${destination}:`, err, rawMessage.body);
        callbackRef.current(rawMessage.body as unknown as T, rawMessage);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [destination, enabled, subscribe]);
}
