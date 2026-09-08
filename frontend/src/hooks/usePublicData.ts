import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

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
  tradeDate: string;
  dealYear: number;
  dealMonth: number;
  dealDay: number;
  tradePriceWon: string;
  pricePerPyeong: string;
  exclusiveArea: number;
  pricePerExclusiveArea: number;
  tradePrice?: number;
  propertyType?: string;
  propertyTypeLabel?: string;
  dealCategory?: string;
  tradeType?: string;
  monthlyRent?: number;
  status?: string;
  buyerGubun?: string;
  sellerGubun?: string;
  roadName?: string;
  bonbun?: string;
  bubun?: string;
  formattedPrice?: string;
  [key: string]: any;
}

export interface WeatherPoint {
  time: string;
  temperature: number;
  humidity: number;
  rainfall: number;
}

export function usePublicData() {
  // Region & Filter State
  const [selectedLawdCd, setSelectedLawdCd] = useState<string>('11680');
  const [selectedRegionLabel, setSelectedRegionLabel] = useState<string>('서울 강남구');
  const [selectedTradeType, setSelectedTradeType] = useState<string>('ALL');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 1. 거시경제 & 부동산 지표 요약 (10분 캐시)
  const {
    data: summary = null,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery<SummaryData | null>({
    queryKey: ['public-data-summary'],
    queryFn: async () => {
      const res = await axios.get<SummaryData>('/api/v1/public-data/summary');
      return res.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // 2. 실시간 날씨 및 시계열 (5분 캐시)
  const {
    data: weatherData = null,
    isLoading: isWeatherLoading,
    refetch: refetchWeather,
  } = useQuery<{ current: CurrentWeather | null; series: WeatherPoint[] }>({
    queryKey: ['public-data-weather', selectedLawdCd, selectedRegionLabel],
    queryFn: async () => {
      const [curRes, seriesRes] = await Promise.all([
        axios.get<CurrentWeather>('/api/v1/public-data/weather/current', {
          params: { lawdCd: selectedLawdCd, regionName: selectedRegionLabel },
        }),
        axios.get<WeatherPoint[]>('/api/v1/public-data/weather/series', {
          params: { lawdCd: selectedLawdCd },
        }),
      ]);
      return { current: curRes.data, series: seriesRes.data };
    },
    staleTime: 1000 * 60 * 5,
  });

  // 3. 국토교통부 실시간 실거래가 (지역/거래유형/페이지별 5분 스마트 캐시)
  const {
    data: txResponse = null,
    isLoading: isTxQueryLoading,
    isFetching: isTxFetching,
    refetch: refetchTx,
  } = useQuery<{
    content: RealEstateTx[];
    totalPages: number;
    totalElements: number;
    currentPage: number;
  }>({
    queryKey: ['public-data-real-estate', selectedLawdCd, selectedTradeType, selectedPropertyType, currentPage],
    queryFn: async () => {
      const res = await axios.get('/api/v1/public-data/real-estate/transactions', {
        params: {
          district: selectedLawdCd,
          lawdCd: selectedLawdCd,
          tradeType: selectedTradeType,
          propertyType: selectedPropertyType,
          page: currentPage,
          size: 20,
        },
      });
      const data = res.data;
      if (data && Array.isArray(data.content)) {
        return {
          content: data.content,
          totalPages: data.totalPages || 1,
          totalElements: data.totalElements || data.content.length,
          currentPage: data.currentPage || currentPage,
        };
      } else if (Array.isArray(data)) {
        return {
          content: data,
          totalPages: Math.ceil(data.length / 20) || 1,
          totalElements: data.length,
          currentPage,
        };
      }
      return { content: [], totalPages: 1, totalElements: 0, currentPage: 1 };
    },
    staleTime: 1000 * 60 * 5, // 5분 캐싱: 지역 전환 후 복귀 시 0ms 즉시 표시
  });

  const loading = isSummaryLoading || isWeatherLoading;
  const txLoading = isTxQueryLoading || isTxFetching;

  return {
    summary,
    currentWeather: weatherData?.current ?? null,
    weatherSeries: weatherData?.series ?? [],
    transactions: txResponse?.content ?? [],
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
    totalPages: txResponse?.totalPages ?? 1,
    totalElements: txResponse?.totalElements ?? 0,
    loadSummary: () => refetchSummary(),
    loadWeather: () => refetchWeather(),
    loadTransactions: (district?: string, tradeType?: string, propType?: string, page?: number) => {
      if (district) setSelectedLawdCd(district);
      if (tradeType) setSelectedTradeType(tradeType);
      if (propType) setSelectedPropertyType(propType);
      if (page) setCurrentPage(page);
      return refetchTx();
    },
  };
}
