import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export interface SummaryData {
  bokRate: number;
  fedRate: number;
  cpi: number;
  ppi: number;
  exchangeRate: number;
  seoulApartmentIndex: number;
  seoulApartmentChange: number;
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  totalRainfall: number;
  deliveryDemandIndex: number;
  totalRealEstateTxCount: number;
  highestTransactionApt: string;
  highestTransactionPrice: number;
  macroInsight: string;
  realEstateInsight: string;
  weatherInsight: string;
}

export interface CurrentWeather {
  stnId: string;
  stnName: string;
  regionName: string;
  currentTemp: number;
  sensoryTemp: number;
  minTemp: number;
  maxTemp: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  weatherCondition: 'SUNNY' | 'CLOUDY' | 'OVERCAST' | 'RAIN' | 'SNOW' | 'HEATWAVE';
  conditionLabel: string;
  airQuality: string;
  airQualityLabel: string;
  aqiValue: number;
  alertBadge: string;
  deliveryIndex: number;
  fnbIndex: number;
  fashionIndex: number;
  energyIndex: number;
  aiWeatherReport: string;
  observationTime: string;
}

export interface RealEstateTx {
  complexName: string;
  region: string;
  district: string;
  dong: string;
  area: string;
  areaM2?: number;
  pyeong?: number;
  floor: string;
  buildYear: number;
  propertyType: string;       // "APT", "OFFI", "VILLA"
  propertyTypeLabel: string;  // "아파트 🏢", "오피스텔 🏬", "빌라/다세대 🏡"
  dealCategory: string;       // "TRADE", "JEONSE", "RENT"
  tradePrice: number;         // 억 단위
  tradePriceWon: string;      // "32억 7,000만원" or "보증금 1억원 / 월 280만원"
  formattedPrice?: string;
  deposit?: number;
  monthlyRent?: number;
  tradeDate: string;          // "2024.08.24"
  tradeType: string;          // 매매 / 전세 / 월세
  status: string;             // 초고가/신고가, 우상향, 전세, 월세 등
  isLive?: boolean;           // 100% 국토교통부 실시간 OpenAPI 수신 여부

  // 동적 연동 필드
  direction?: string;
  parkingPerHousehold?: number;
  elevatorCount?: number;
  subwayInfo?: string;
  walkTimeToSubway?: number;
  buildingStructure?: string;
  safetyRating?: string;           // "SAFE", "CAUTION", "DANGER"
  seniorMortgageWon?: number;
  jeonseRatio?: number;
  isHugEligible?: boolean;
  safetyAnalysisReport?: string;
  districtAvgPrice?: number;
  districtMinPrice?: number;
  districtMaxPrice?: number;
  pricePercentile?: number;
  maintenanceFee?: number;
}

export interface WeatherPoint {
  date: string;
  temperature: number;
  minTemperature: number;
  maxTemperature: number;
  rainfall: number;
  hotDays: number;
  rainyDays: number;
  deliveryIndex: number;
  fnbIndex: number;
  fashionIndex: number;
}

export function usePublicData() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [weatherSeries, setWeatherSeries] = useState<WeatherPoint[]>([]);
  const [transactions, setTransactions] = useState<RealEstateTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  // Region & Filter State
  const [selectedLawdCd, setSelectedLawdCd] = useState<string>('11680');
  const [selectedRegionLabel, setSelectedRegionLabel] = useState<string>('서울 강남구');
  const [selectedTradeType, setSelectedTradeType] = useState<string>('ALL');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(5);
  const [totalElements, setTotalElements] = useState<number>(0);

  const loadSummary = useCallback(async () => {
    try {
      const res = await axios.get<SummaryData>('/api/v1/public-data/summary');
      setSummary(res.data);
    } catch (e) {
      console.error('Failed to load public data summary:', e);
    }
  }, []);

  const loadWeather = useCallback(async (lawdCd: string, regionName: string) => {
    try {
      const [curRes, seriesRes] = await Promise.all([
        axios.get<CurrentWeather>('/api/v1/public-data/weather/current', {
          params: { lawdCd, regionName }
        }),
        axios.get<WeatherPoint[]>('/api/v1/public-data/weather/series', {
          params: { lawdCd }
        })
      ]);
      setCurrentWeather(curRes.data);
      setWeatherSeries(seriesRes.data);
    } catch (e) {
      console.error('Failed to load live weather data:', e);
    }
  }, []);

  const loadTransactions = useCallback(async (
    district: string,
    tradeType: string = 'ALL',
    propType: string = 'ALL',
    page: number = 1
  ) => {
    setTxLoading(true);
    try {
      const res = await axios.get('/api/v1/public-data/real-estate/transactions', {
        params: {
          district,
          lawdCd: district,
          tradeType,
          propertyType: propType,
          page,
          size: 20
        }
      });

      const data = res.data;
      if (data && Array.isArray(data.content)) {
        setTransactions(data.content);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || data.content.length);
        setCurrentPage(data.currentPage || page);
      } else if (Array.isArray(data)) {
        setTransactions(data);
        setTotalPages(Math.ceil(data.length / 20) || 1);
        setTotalElements(data.length);
        setCurrentPage(page);
      }
    } catch (e) {
      console.error('Failed to load real estate transactions:', e);
      toast.error('실거래가 데이터를 불러오는데 실패했습니다.', { theme: 'dark' });
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadSummary(),
        loadWeather(selectedLawdCd, selectedRegionLabel),
        loadTransactions(selectedLawdCd, selectedTradeType, selectedPropertyType, 1)
      ]);
      setLoading(false);
    };
    init();
  }, [loadSummary, loadWeather, loadTransactions, selectedLawdCd, selectedRegionLabel, selectedTradeType, selectedPropertyType]);

  return {
    summary,
    currentWeather,
    weatherSeries,
    transactions,
    loading,
    txLoading,
    selectedLawdCd,
    setSelectedLawdCd,
    selectedRegionLabel,
    setSelectedRegionLabel,
    selectedTradeType,
    setSelectedTradeType,
    selectedPropertyType,
    setSelectedPropertyType,
    currentPage,
    setCurrentPage,
    totalPages,
    totalElements,
    loadSummary,
    loadWeather,
    loadTransactions,
  };
}
