import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface UserAlert {
  id: number;
  userId: string;
  ticker: string;
  targetPrice: number;
  isActive: boolean;
}

export interface ChartTick {
  time: string;
  price: number;
}

export interface MarketQuote {
  ticker: string;
  name: string;
  market: string;
  price: number;
  changeAmount: number;
  changeRate: number;
  prevClose: number;
  high: number;
  low: number;
  open?: number;
  volume: number;
  tradeValue?: number;
  formattedChange: string;
}

export function useTradingDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  
  // Active selected entities
  const [selectedStock, setSelectedStock] = useState({ ticker: '005930', name: '삼성전자', market: 'KOSPI' });
  const [selectedCrypto, setSelectedCrypto] = useState({ ticker: 'KRW-BTC', name: '비트코인', market: 'CRYPTO' });
  const [activeTab, setActiveTab] = useState<'stock' | 'crypto' | 'news' | 'heatmap'>('stock');

  // Live Quote States directly from KIS / Upbit APIs
  const [stockQuote, setStockQuote] = useState<MarketQuote | null>(null);
  const [cryptoQuote, setCryptoQuote] = useState<MarketQuote | null>(null);

  // Real-time Tick Streams
  const [stockData, setStockData] = useState<ChartTick[]>([]);
  const [cryptoData, setCryptoData] = useState<ChartTick[]>([]);
  const [currentStockPrice, setCurrentStockPrice] = useState<number>(274500);
  const [currentCryptoPrice, setCurrentCryptoPrice] = useState<number>(88935000);

  // Micro flash states for pulse animation
  const [stockFlash, setStockFlash] = useState<'up' | 'down' | null>(null);
  const [cryptoFlash, setCryptoFlash] = useState<'up' | 'down' | null>(null);

  const prevStockPriceRef = useRef(currentStockPrice);
  const prevCryptoPriceRef = useRef(currentCryptoPrice);
  const selectedStockRef = useRef(selectedStock);
  const selectedCryptoRef = useRef(selectedCrypto);

  useEffect(() => {
    selectedStockRef.current = selectedStock;
  }, [selectedStock]);

  useEffect(() => {
    selectedCryptoRef.current = selectedCrypto;
  }, [selectedCrypto]);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('/api/v1/alerts?userId=user1');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const loadStockQuote = async (ticker: string, name?: string) => {
    try {
      const res = await axios.get<MarketQuote>(`/api/v1/market/quote?ticker=${ticker}${name ? `&name=${encodeURIComponent(name)}` : ''}`);
      const q = res.data;
      setStockQuote(q);
      setCurrentStockPrice(q.price);
      setStockData([
        { time: '17:00:00', price: q.prevClose || (q.price * 0.99) },
        { time: '17:01:00', price: q.price },
      ]);
    } catch (e) {
      console.error('Failed to load stock quote', e);
    }
  };

  const loadCryptoQuote = async (ticker: string, name?: string) => {
    try {
      const res = await axios.get<MarketQuote>(`/api/v1/market/quote?ticker=${ticker}${name ? `&name=${encodeURIComponent(name)}` : ''}`);
      const q = res.data;
      setCryptoQuote(q);
      setCurrentCryptoPrice(q.price);
      setCryptoData([
        { time: '17:00:00', price: q.prevClose || (q.price * 0.99) },
        { time: '17:01:00', price: q.price },
      ]);
    } catch (e) {
      console.error('Failed to load crypto quote', e);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAlerts();
    loadStockQuote('005930', '삼성전자');
    loadCryptoQuote('KRW-BTC', '비트코인');
  }, []);

  // Global search stock/crypto listener
  useEffect(() => {
    const handleSelectStock = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.ticker) {
        if (detail.market === 'CRYPTO' || detail.ticker.startsWith('KRW-')) {
          setSelectedCrypto({ ticker: detail.ticker, name: detail.name || detail.ticker, market: 'CRYPTO' });
          setActiveTab('crypto');
          loadCryptoQuote(detail.ticker, detail.name);
        } else {
          setSelectedStock({ ticker: detail.ticker, name: detail.name || detail.ticker, market: detail.market || 'KOSPI' });
          setActiveTab('stock');
          loadStockQuote(detail.ticker, detail.name);
        }
      }
    };

    window.addEventListener('select-stock', handleSelectStock);
    return () => window.removeEventListener('select-stock', handleSelectStock);
  }, []);

  // STOMP WebSocket for real-time tick streaming
  useEffect(() => {
    let stompClient: Client | null = null;
    try {
      stompClient = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onStompError: (frame) => {
          console.warn('Dashboard STOMP Error:', frame);
        },
        onWebSocketError: (event) => {
          console.warn('Dashboard WebSocket Error:', event);
        }
      });

      stompClient.onConnect = () => {
        stompClient?.subscribe('/topic/ticks', (message) => {
          if (message.body) {
            try {
              const tick = JSON.parse(message.body);
              
              // 1. Stock Tick Match
              if (selectedStockRef.current && tick.ticker === selectedStockRef.current.ticker) {
                const prev = prevStockPriceRef.current;
                const next = tick.price;
                if (next > prev) {
                  setStockFlash('up');
                  setTimeout(() => setStockFlash(null), 800);
                } else if (next < prev) {
                  setStockFlash('down');
                  setTimeout(() => setStockFlash(null), 800);
                }
                prevStockPriceRef.current = next;
                setCurrentStockPrice(next);

                setStockData((prevArr) => {
                  const updated = [...prevArr, { time: tick.time || new Date().toLocaleTimeString(), price: next }];
                  return updated.slice(-25);
                });
              }

              // 2. Crypto Tick Match
              if (selectedCryptoRef.current && tick.ticker === selectedCryptoRef.current.ticker) {
                const prev = prevCryptoPriceRef.current;
                const next = tick.price;
                if (next > prev) {
                  setCryptoFlash('up');
                  setTimeout(() => setCryptoFlash(null), 800);
                } else if (next < prev) {
                  setCryptoFlash('down');
                  setTimeout(() => setCryptoFlash(null), 800);
                }
                prevCryptoPriceRef.current = next;
                setCurrentCryptoPrice(next);

                setCryptoData((prevArr) => {
                  const updated = [...prevArr, { time: tick.time || new Date().toLocaleTimeString(), price: next }];
                  return updated.slice(-25);
                });
              }
            } catch (err) {
              console.error('Tick parse error:', err);
            }
          }
        });
      };

      stompClient.activate();
    } catch (e) {
      console.warn('Failed to initialize Dashboard WebSocket client:', e);
    }

    return () => {
      try {
        if (stompClient) stompClient.deactivate();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return {
    isModalOpen,
    setIsModalOpen,
    alerts,
    setAlerts,
    fetchAlerts,
    selectedStock,
    setSelectedStock,
    selectedCrypto,
    setSelectedCrypto,
    activeTab,
    setActiveTab,
    stockQuote,
    cryptoQuote,
    stockData,
    cryptoData,
    currentStockPrice,
    currentCryptoPrice,
    stockFlash,
    cryptoFlash,
    loadStockQuote,
    loadCryptoQuote,
  };
}
