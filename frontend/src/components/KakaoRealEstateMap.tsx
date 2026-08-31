import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  MapPin, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle,
  Building2,
  ChevronRight,
  Eye,
  Navigation,
  X,
  ChevronUp
} from 'lucide-react';

export interface MapTransaction {
  complexName: string;
  region: string;
  district?: string;
  dong?: string;
  area?: string;
  areaM2?: number;
  pyeong?: number;
  floor?: string;
  buildYear?: number;
  propertyType?: string;
  propertyTypeLabel?: string;
  dealCategory?: string;
  tradePrice?: number;
  tradePriceWon?: string;
  formattedPrice?: string;
  tradeDate?: string;
  tradeType?: string;
  status?: string;
  isLive?: boolean;
  pricePercentile?: number;
  safetyRating?: string;
  direction?: string;
  subwayInfo?: string;
}

export interface SearchInBoundsPayload {
  lawdCd: string;
  regionName: string;
  lat: number;
  lng: number;
  dong?: string;
}

interface KakaoRealEstateMapProps {
  lawdCd: string;
  regionName: string;
  transactions: MapTransaction[];
  selectedTx: MapTransaction | null;
  hoveredTxKey: string | null;
  onSelectTx: (tx: MapTransaction) => void;
  onHoverTx?: (txKey: string | null) => void;
  onSearchInBounds?: (payload: SearchInBoundsPayload) => void;
}

// 전국 주요 핵심 지역 기본 중심 좌표
const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'ALL': { lat: 37.5665, lng: 126.9780 },
  '11110': { lat: 37.5730, lng: 126.9794 }, // 종로구
  '11140': { lat: 37.5636, lng: 126.9975 }, // 중구
  '11170': { lat: 37.5326, lng: 126.9900 }, // 용산구
  '11200': { lat: 37.5634, lng: 127.0368 }, // 성동구
  '11440': { lat: 37.5663, lng: 126.9016 }, // 마포구
  '11560': { lat: 37.5264, lng: 126.9248 }, // 영등포구
  '11620': { lat: 37.4784, lng: 126.9516 }, // 관악구
  '11650': { lat: 37.4837, lng: 127.0324 }, // 서초구
  '11680': { lat: 37.4979, lng: 127.0276 }, // 강남구
  '11710': { lat: 37.5145, lng: 127.1065 }, // 송파구
  '11350': { lat: 37.6542, lng: 127.0568 }, // 노원구
  '41135': { lat: 37.3827, lng: 127.1189 }, // 분당구
  '41117': { lat: 37.2849, lng: 127.0469 }, // 광교
  '41590': { lat: 37.2005, lng: 127.0982 }, // 동탄
  '28185': { lat: 37.3888, lng: 126.6534 }, // 송도
  '41450': { lat: 37.5393, lng: 127.2148 }, // 하남
  '41290': { lat: 37.4293, lng: 126.9877 }, // 과천
  '26350': { lat: 35.1631, lng: 129.1636 }, // 해운대
  '27260': { lat: 35.8580, lng: 128.6305 }, // 대구 수성
  '36110': { lat: 36.4800, lng: 127.2890 }, // 세종
  '30200': { lat: 36.3622, lng: 127.3563 }, // 대전 유성
  '29150': { lat: 35.1460, lng: 126.9231 }, // 광주 남구
};

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY || '';

// 전역 영구 지오코딩 캐시
const GLOBAL_GEOCODE_CACHE = new Map<string, { lat: number; lng: number }>();

// 단지 정보 구조체
interface GeocodedComplex {
  complexName: string;
  dong: string;
  district: string;
  representativeTx: MapTransaction;
  items: MapTransaction[];
  count: number;
  lat: number;
  lng: number;
  isExactGeocoded: boolean;
}

// 화면 픽셀 클러스터 구조체
interface RenderCluster {
  id: string;
  isSingle: boolean;
  complex?: GeocodedComplex;
  complexes: GeocodedComplex[];
  totalCount: number;
  lat: number;
  lng: number;
  title: string;
  avgPriceWon: string;
  highestPriceWon: string;
}

export default function KakaoRealEstateMap({
  lawdCd,
  regionName,
  transactions,
  selectedTx,
  hoveredTxKey,
  onSelectTx,
  onHoverTx,
  onSearchInBounds,
}: KakaoRealEstateMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  
  const [geocodedVersion, setGeocodedVersion] = useState<number>(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'normal' | 'skyview'>('normal');
  const [zoomLevel, setZoomLevel] = useState<number>(4);
  const [mapBoundsVersion, setMapBoundsVersion] = useState<number>(0);
  const [showSearchHereBtn, setShowSearchHereBtn] = useState<boolean>(false);
  const [isSearchingHere, setIsSearchingHere] = useState<boolean>(false);

  // 복수 매물 팝오버 카드 상태 (동일 단지/클러스터 클릭 시)
  const [activeClusterModal, setActiveClusterModal] = useState<RenderCluster | null>(null);

  // 1. 단지별 그룹화
  const rawComplexes = useMemo<GeocodedComplex[]>(() => {
    const baseCoords = REGION_COORDINATES[lawdCd] || REGION_COORDINATES['ALL'];
    const map = new Map<string, MapTransaction[]>();

    transactions.forEach((tx) => {
      const dong = (tx.dong || '주요동').trim();
      const complex = (tx.complexName || '미지정단지').trim();
      const key = `${dong}_${complex}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(tx);
    });

    const result: GeocodedComplex[] = [];

    map.forEach((items) => {
      const rep = items[0];
      const dong = (rep.dong || '').trim();
      const district = (rep.district || regionName || '').trim();
      const complexName = rep.complexName.trim();
      const cacheKey = `${district}_${dong}_${complexName}`;

      const cached = GLOBAL_GEOCODE_CACHE.get(cacheKey) || GLOBAL_GEOCODE_CACHE.get(`${district}_${dong}`);
      let lat: number;
      let lng: number;
      let isExact = false;

      if (cached) {
        lat = cached.lat;
        lng = cached.lng;
        isExact = true;
      } else {
        lat = baseCoords.lat;
        lng = baseCoords.lng;
      }

      result.push({
        complexName,
        dong,
        district,
        representativeTx: rep,
        items,
        count: items.length,
        lat,
        lng,
        isExactGeocoded: isExact,
      });
    });

    return result;
  }, [transactions, lawdCd, regionName, geocodedVersion]);

  // 2. 카카오 Places & Geocoder를 통한 실제 아파트/빌라 단지 정밀 위치 비동기 조회
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) return;

    const places = new window.kakao.maps.services.Places();
    const geocoder = new window.kakao.maps.services.Geocoder();

    const unlocated = rawComplexes.filter(c => !c.isExactGeocoded);
    if (unlocated.length === 0) return;

    // 최대 40개 단지까지 순차 지오코딩
    unlocated.slice(0, 40).forEach((c, idx) => {
      setTimeout(() => {
        const cacheKey = `${c.district}_${c.dong}_${c.complexName}`;
        if (GLOBAL_GEOCODE_CACHE.has(cacheKey)) return;

        // 1차: 키워드 검색 ("서울 종로구 신교동 신교빌라", "서울 강남구 압구정동 신현대9차")
        const keyword = `${c.district} ${c.dong} ${c.complexName}`.trim();
        places.keywordSearch(keyword, (data: any[], status: any) => {
          if (status === window.kakao.maps.services.Status.OK && data && data.length > 0) {
            const exactLat = parseFloat(data[0].y);
            const exactLng = parseFloat(data[0].x);
            GLOBAL_GEOCODE_CACHE.set(cacheKey, { lat: exactLat, lng: exactLng });
            setGeocodedVersion(v => v + 1);
          } else {
            // 2차: 주소 검색 (지번/동 검색)
            const addrKeyword = `${c.district} ${c.dong} ${c.complexName}`.trim();
            geocoder.addressSearch(addrKeyword, (addrData: any[], addrStatus: any) => {
              if (addrStatus === window.kakao.maps.services.Status.OK && addrData && addrData.length > 0) {
                const exactLat = parseFloat(addrData[0].y);
                const exactLng = parseFloat(addrData[0].x);
                GLOBAL_GEOCODE_CACHE.set(cacheKey, { lat: exactLat, lng: exactLng });
                setGeocodedVersion(v => v + 1);
              } else {
                // 3차: 법정동 단위 검색
                const dongKeyword = `${c.district} ${c.dong}`.trim();
                geocoder.addressSearch(dongKeyword, (dongData: any[], dongStatus: any) => {
                  if (dongStatus === window.kakao.maps.services.Status.OK && dongData && dongData.length > 0) {
                    const dongLat = parseFloat(dongData[0].y);
                    const dongLng = parseFloat(dongData[0].x);
                    GLOBAL_GEOCODE_CACHE.set(`${c.district}_${c.dong}`, { lat: dongLat, lng: dongLng });
                    GLOBAL_GEOCODE_CACHE.set(cacheKey, { lat: dongLat, lng: dongLng });
                    setGeocodedVersion(v => v + 1);
                  }
                });
              }
            });
          }
        });
      }, idx * 50);
    });
  }, [rawComplexes]);

  // 3. 화면 픽셀 거리 기반 안티-콜리전 렌더링 연산
  // ⭐ 핵심: 줌 레벨 1~3 (근접 뷰)에서는 클러스터링을 100% 해제하고 모든 단지를 개별 핀으로 방사형(Spiderfy) 분산!
  const renderClusters = useMemo<RenderCluster[]>(() => {
    if (!mapInstanceRef.current || !window.kakao) {
      return rawComplexes.map((c, i) => ({
        id: `single-${i}`,
        isSingle: true,
        complex: c,
        complexes: [c],
        totalCount: c.count,
        lat: c.lat,
        lng: c.lng,
        title: c.complexName,
        avgPriceWon: c.representativeTx.formattedPrice || c.representativeTx.tradePriceWon || '',
        highestPriceWon: c.representativeTx.formattedPrice || c.representativeTx.tradePriceWon || '',
      }));
    }

    const projection = mapInstanceRef.current.getProjection();
    if (!projection) return [];

    // [줌 레벨 1~3: 근접 뷰 -> 클러스터링 완전 해제 (모든 단지 100% 개별 핀 노출)]
    if (zoomLevel <= 3) {
      // 동일 좌표에 모여있는 단지들을 부채꼴/원형 방사형(Spiderfy)으로 미세 분산
      const coordGroupMap = new Map<string, GeocodedComplex[]>();
      rawComplexes.forEach((c) => {
        const coordKey = `${c.lat.toFixed(5)}_${c.lng.toFixed(5)}`;
        if (!coordGroupMap.has(coordKey)) {
          coordGroupMap.set(coordKey, []);
        }
        coordGroupMap.get(coordKey)!.push(c);
      });

      const dispersedList: RenderCluster[] = [];

      coordGroupMap.forEach((complexList) => {
        const total = complexList.length;
        complexList.forEach((c, idx) => {
          let finalLat = c.lat;
          let finalLng = c.lng;

          if (total > 1) {
            // 동일 좌표 단지들을 20m 반경 원형으로 부드럽게 펼쳐 개별 핀 표시 (Spiderfy)
            const angle = (idx / total) * 2 * Math.PI;
            const radius = 0.00022; // 위도 약 24미터 분산
            finalLat = c.lat + radius * Math.sin(angle);
            finalLng = c.lng + (radius * 1.3) * Math.cos(angle);
          }

          dispersedList.push({
            id: `single-${c.dong}_${c.complexName}_${idx}`,
            isSingle: true,
            complex: c,
            complexes: [c],
            totalCount: c.count,
            lat: finalLat,
            lng: finalLng,
            title: c.complexName,
            avgPriceWon: c.representativeTx.formattedPrice || c.representativeTx.tradePriceWon || '',
            highestPriceWon: c.representativeTx.formattedPrice || c.representativeTx.tradePriceWon || '',
          });
        });
      });

      return dispersedList;
    }

    // [줌 레벨 4 이상: 원거리 뷰 -> 화면 픽셀 거리 65px/95px 병합 클러스터링]
    const mergePixelDist = zoomLevel >= 6 ? 90 : 60;
    const clusters: RenderCluster[] = [];
    const pixelPoints: { x: number; y: number; complex: GeocodedComplex }[] = [];

    rawComplexes.forEach((c) => {
      const latlng = new window.kakao.maps.LatLng(c.lat, c.lng);
      const pt = projection.pointFromCoords(latlng);
      pixelPoints.push({ x: pt.x, y: pt.y, complex: c });
    });

    const visited = new Set<number>();

    for (let i = 0; i < pixelPoints.length; i++) {
      if (visited.has(i)) continue;
      visited.add(i);

      const target = pixelPoints[i];
      const memberComplexes: GeocodedComplex[] = [target.complex];
      let sumLat = target.complex.lat;
      let sumLng = target.complex.lng;

      for (let j = i + 1; j < pixelPoints.length; j++) {
        if (visited.has(j)) continue;
        const other = pixelPoints[j];
        const dx = target.x - other.x;
        const dy = target.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= mergePixelDist) {
          visited.add(j);
          memberComplexes.push(other.complex);
          sumLat += other.complex.lat;
          sumLng += other.complex.lng;
        }
      }

      const count = memberComplexes.reduce((acc, c) => acc + c.count, 0);
      const avgLat = sumLat / memberComplexes.length;
      const avgLng = sumLng / memberComplexes.length;

      if (memberComplexes.length === 1) {
        const c = memberComplexes[0];
        clusters.push({
          id: `single-${c.complexName}`,
          isSingle: true,
          complex: c,
          complexes: memberComplexes,
          totalCount: c.count,
          lat: c.lat,
          lng: c.lng,
          title: c.complexName,
          avgPriceWon: c.representativeTx.formattedPrice || c.representativeTx.tradePriceWon || '',
          highestPriceWon: c.representativeTx.formattedPrice || c.representativeTx.tradePriceWon || '',
        });
      } else {
        const topPriceTx = memberComplexes
          .map(c => c.representativeTx)
          .sort((a, b) => (b.tradePrice || 0) - (a.tradePrice || 0))[0];

        const clusterTitle = memberComplexes[0].dong 
          ? `${memberComplexes[0].dong}`
          : `${memberComplexes[0].complexName} 외 ${memberComplexes.length - 1}개`;

        clusters.push({
          id: `cluster-${i}`,
          isSingle: false,
          complexes: memberComplexes,
          totalCount: count,
          lat: avgLat,
          lng: avgLng,
          title: clusterTitle,
          avgPriceWon: `${memberComplexes.length}개 단지`,
          highestPriceWon: topPriceTx?.formattedPrice || topPriceTx?.tradePriceWon || '',
        });
      }
    }

    return clusters;
  }, [rawComplexes, zoomLevel, mapBoundsVersion, isMapLoaded]);

  // 4. 카카오맵 SDK 초기화
  useEffect(() => {
    let isCancelled = false;

    const initializeKakaoMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        setLoadError('카카오맵 SDK 초기화 실패');
        return;
      }

      window.kakao.maps.load(() => {
        if (isCancelled) return;
        const container = mapContainerRef.current;
        if (!container) return;

        try {
          const coords = REGION_COORDINATES[lawdCd] || REGION_COORDINATES['ALL'];
          const options = {
            center: new window.kakao.maps.LatLng(coords.lat, coords.lng),
            level: 4,
          };

          const map = new window.kakao.maps.Map(container, options);
          mapInstanceRef.current = map;
          setIsMapLoaded(true);
          setLoadError(null);

          map.setMaxLevel(8);
          map.setMinLevel(1);

          window.kakao.maps.event.addListener(map, 'zoom_changed', () => {
            setZoomLevel(map.getLevel());
            setMapBoundsVersion(v => v + 1);
          });

          window.kakao.maps.event.addListener(map, 'dragend', () => {
            setShowSearchHereBtn(true);
            setMapBoundsVersion(v => v + 1);
          });

          window.kakao.maps.event.addListener(map, 'bounds_changed', () => {
            setMapBoundsVersion(v => v + 1);
          });

        } catch (e: any) {
          console.error('Failed to create Kakao Map instance:', e);
          setLoadError(e?.message || '지도 인스턴스 생성 오류');
        }
      });
    };

    if (window.kakao && window.kakao.maps) {
      initializeKakaoMap();
      return;
    }

    const existingScript = document.getElementById('kakao-map-sdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'kakao-map-sdk';
      script.type = 'text/javascript';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false&libraries=services,clusterer`;
      script.async = true;

      script.onload = () => {
        if (!isCancelled) initializeKakaoMap();
      };

      script.onerror = () => {
        if (!isCancelled) {
          setLoadError('카카오맵 SDK 스크립트 로드 실패. (도메인 등록: http://localhost:15173 확인 필요)');
        }
      };

      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkInterval);
          if (!isCancelled) initializeKakaoMap();
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (!isMapLoaded && !isCancelled) {
          setLoadError('카카오맵 로딩 타임아웃.');
        }
      }, 5000);

      return () => {
        isCancelled = true;
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  // 5. 지역 변경 시 중심좌표 이동
  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao) return;
    const coords = REGION_COORDINATES[lawdCd] || REGION_COORDINATES['ALL'];
    const moveLatLon = new window.kakao.maps.LatLng(coords.lat, coords.lng);
    mapInstanceRef.current.panTo(moveLatLon);
    setShowSearchHereBtn(false);
    setActiveClusterModal(null);
  }, [lawdCd]);

  // 6. 선택된 매물로 이동
  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao || !selectedTx) return;
    const found = rawComplexes.find(c => c.complexName === selectedTx.complexName);
    if (found) {
      const pos = new window.kakao.maps.LatLng(found.lat, found.lng);
      mapInstanceRef.current.panTo(pos);
    }
  }, [selectedTx, rawComplexes]);

  // 7. 커스텀 오버레이 렌더링
  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao || !isMapLoaded) return;

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    renderClusters.forEach((cluster) => {
      const position = new window.kakao.maps.LatLng(cluster.lat, cluster.lng);

      if (!cluster.isSingle) {
        // [CASE A] 원거리 클러스터 뱃지
        const clusterEl = document.createElement('div');
        clusterEl.className = 'kakao-smart-cluster cursor-pointer select-none';
        clusterEl.innerHTML = `
          <div style="
            background: radial-gradient(circle at center, rgba(13, 148, 136, 0.95), rgba(15, 23, 42, 0.95));
            border: 2px solid #2DD4BF;
            box-shadow: 0 0 20px rgba(45, 212, 191, 0.5), 0 4px 12px rgba(0,0,0,0.8);
            border-radius: 24px;
            padding: 5px 12px;
            display: flex;
            align-items: center;
            gap: 6px;
            color: #FFFFFF;
            white-space: nowrap;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            transform: scale(1);
          ">
            <span style="font-size: 11px; font-weight: 800; color: #FFFFFF;">${cluster.title}</span>
            <span style="font-size: 11px; font-weight: 900; font-family: monospace; color: #5EEAD4; background: rgba(0,0,0,0.3); padding: 1px 6px; border-radius: 12px; border: 1px solid rgba(45,212,191,0.3);">
              ${cluster.totalCount}건
            </span>
          </div>
        `;

        clusterEl.onmouseenter = () => { clusterEl.style.transform = 'scale(1.1)'; };
        clusterEl.onmouseleave = () => { clusterEl.style.transform = 'scale(1)'; };

        clusterEl.onclick = () => {
          const currentLvl = mapInstanceRef.current.getLevel();
          if (currentLvl > 2) {
            mapInstanceRef.current.setLevel(Math.max(1, currentLvl - 2));
            mapInstanceRef.current.panTo(position);
          } else {
            // 이미 줌 레벨 1~2일 때는 매물 리스트 팝오버 노출
            setActiveClusterModal(cluster);
          }
        };

        const overlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: clusterEl,
          zIndex: 25,
        });

        overlay.setMap(mapInstanceRef.current);
        overlaysRef.current.push(overlay);

      } else {
        // [CASE B] 개별 단지/건물 정밀 핀포인트 뱃지
        const c = cluster.complex!;
        const tx = c.representativeTx;
        const isSelected = selectedTx?.complexName === c.complexName;
        const isHovered = hoveredTxKey === c.complexName;
        const isHighlighted = isSelected || isHovered;

        const isJeonse = tx.dealCategory === 'JEONSE' || tx.tradeType?.includes('전세');
        const isRent = tx.dealCategory === 'RENT' || tx.tradeType?.includes('월세');

        let typeBg = 'rgba(16, 185, 129, 0.25)';
        let typeBorder = 'rgba(16, 185, 129, 0.5)';
        let typeColor = '#6EE7B7';
        let typeLabel = '매매';

        if (isRent) {
          typeBg = 'rgba(245, 158, 11, 0.25)';
          typeBorder = 'rgba(245, 158, 11, 0.5)';
          typeColor = '#FDE68A';
          typeLabel = '월세';
        } else if (isJeonse) {
          typeBg = 'rgba(6, 182, 212, 0.25)';
          typeBorder = 'rgba(6, 182, 212, 0.5)';
          typeColor = '#A5F3FC';
          typeLabel = '전세';
        }

        const priceText = tx.formattedPrice || tx.tradePriceWon || '시세정보';

        const markerEl = document.createElement('div');
        markerEl.className = 'kakao-pinpoint-marker cursor-pointer select-none';

        markerEl.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; position: relative;">
            <div style="
              background: ${isHighlighted ? '#131B38' : 'rgba(11, 19, 43, 0.94)'};
              backdrop-filter: blur(16px);
              border: 1.5px solid ${isHighlighted ? '#2DD4BF' : 'rgba(255, 255, 255, 0.2)'};
              border-radius: ${isHighlighted ? '14px' : '10px'};
              padding: ${isHighlighted ? '5px 10px' : '3px 8px'};
              box-shadow: ${isHighlighted ? '0 0 25px rgba(45, 212, 191, 0.7), 0 8px 20px rgba(0,0,0,0.9)' : '0 3px 12px rgba(0,0,0,0.6)'};
              display: flex;
              align-items: center;
              gap: 5px;
              white-space: nowrap;
              transform: ${isHighlighted ? 'scale(1.15)' : 'scale(1)'};
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            ">
              <span style="font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 4px; background: ${typeBg}; color: ${typeColor}; border: 1px solid ${typeBorder};">
                ${typeLabel}
              </span>
              <span style="font-size: 11px; font-weight: 800; color: #FFFFFF; max-width: 95px; overflow: hidden; text-overflow: ellipsis;">
                ${c.complexName}
              </span>
              <span style="font-size: 11px; font-weight: 900; font-family: monospace; color: ${isHighlighted ? '#5EEAD4' : '#38BDF8'};">
                ${priceText}
              </span>
              ${c.count > 1 ? `
                <span style="font-size: 8px; font-family: monospace; font-weight: 900; background: rgba(99, 102, 241, 0.35); color: #C7D2FE; padding: 0 3px; border-radius: 3px;">
                  +${c.count}
                </span>
              ` : ''}
            </div>

            <div style="
              width: 0; 
              height: 0; 
              border-left: 4.5px solid transparent; 
              border-right: 4.5px solid transparent; 
              border-top: 5px solid ${isHighlighted ? '#2DD4BF' : 'rgba(11, 19, 43, 0.94)'}; 
              margin-top: -1px;
            "></div>
          </div>
        `;

        markerEl.onmouseenter = () => { if (onHoverTx) onHoverTx(c.complexName); };
        markerEl.onmouseleave = () => { if (onHoverTx) onHoverTx(null); };
        markerEl.onclick = () => {
          onSelectTx(tx);
          if (c.items.length > 1) {
            setActiveClusterModal(cluster);
          }
        };

        const overlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: markerEl,
          yAnchor: 1.15,
          zIndex: isHighlighted ? 60 : 15,
        });

        overlay.setMap(mapInstanceRef.current);
        overlaysRef.current.push(overlay);
      }
    });

  }, [renderClusters, selectedTx, hoveredTxKey, isMapLoaded]);

  // 줌 컨트롤 함수
  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setLevel(mapInstanceRef.current.getLevel() - 1);
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setLevel(mapInstanceRef.current.getLevel() + 1);
  };

  const handleToggleMapType = () => {
    if (!mapInstanceRef.current || !window.kakao) return;
    if (mapType === 'normal') {
      mapInstanceRef.current.setMapTypeId(window.kakao.maps.MapTypeId.SKYVIEW);
      setMapType('skyview');
    } else {
      mapInstanceRef.current.setMapTypeId(window.kakao.maps.MapTypeId.ROADMAP);
      setMapType('normal');
    }
  };

  // 8. 현재 지도 중심 위치 기반 실시간 재검색
  const handleSearchHere = () => {
    if (!mapInstanceRef.current || !window.kakao) return;
    setIsSearchingHere(true);
    setShowSearchHereBtn(false);

    const center = mapInstanceRef.current.getCenter();
    const lat = center.getLat();
    const lng = center.getLng();

    if (window.kakao.maps.services && window.kakao.maps.services.Geocoder) {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.coord2RegionCode(lng, lat, (result: any[], status: any) => {
        setIsSearchingHere(false);
        if (status === window.kakao.maps.services.Status.OK && result && result.length > 0) {
          const bRegion = result.find((r: any) => r.region_type === 'B') || result[0];
          const lawdCd = bRegion.code ? bRegion.code.substring(0, 5) : '11110';
          const fullLabel = `${bRegion.region_1depth_name} ${bRegion.region_2depth_name} ${bRegion.region_3depth_name || ''}`.trim();
          
          if (onSearchInBounds) {
            onSearchInBounds({
              lawdCd,
              regionName: fullLabel,
              lat,
              lng,
              dong: bRegion.region_3depth_name,
            });
          }
        } else {
          fallbackSearchInBounds(lat, lng);
        }
      });
    } else {
      setIsSearchingHere(false);
      fallbackSearchInBounds(lat, lng);
    }
  };

  const fallbackSearchInBounds = (lat: number, lng: number) => {
    let closestCode = '11110';
    let closestName = '서울특별시 종로구';
    let minDist = 999999;

    Object.entries(REGION_COORDINATES).forEach(([code, c]) => {
      const dist = Math.pow(c.lat - lat, 2) + Math.pow(c.lng - lng, 2);
      if (dist < minDist) {
        minDist = dist;
        closestCode = code;
      }
    });

    if (onSearchInBounds) {
      onSearchInBounds({
        lawdCd: closestCode,
        regionName: closestName,
        lat,
        lng,
      });
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-[#0B132B] shadow-2xl">
      {/* Kakao Map Canvas */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full transition-all duration-300"
        style={{
          filter: mapType === 'normal' 
            ? 'grayscale(35%) contrast(105%) brightness(95%)' 
            : 'brightness(95%) contrast(105%)'
        }}
      />

      {/* Loading or Error Overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-[#0B132B]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30 text-center">
          {loadError ? (
            <div className="max-w-md bg-slate-900 border border-amber-500/30 p-4 rounded-2xl shadow-2xl space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>카카오맵 SDK 연결 안내</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {loadError}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-slate-900/90 border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl">
              <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
              <span className="text-xs font-bold text-white">카카오맵 로드 중...</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Map Status Chip (Top-Left) */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-[#0B132B]/85 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-bold text-white">{regionName}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {zoomLevel <= 3 ? `개별 단지 핀포인트 ${renderClusters.length}개` : `화면 내 ${renderClusters.length}개 그룹 (총 ${transactions.length}건)`}
        </span>
      </div>

      {/* Floating 'Search Here' Pill Button (Center Top) */}
      {showSearchHereBtn && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <button
            onClick={handleSearchHere}
            disabled={isSearchingHere}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl border border-teal-400/50 backdrop-blur-md transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-300 ${isSearchingHere ? 'animate-spin' : ''}`} />
            <span>{isSearchingHere ? '현재 영역 매물 검색 중...' : '이 지도 영역에서 재검색 🔄'}</span>
          </button>
        </div>
      )}

      {/* Floating Map Action Controls (Top-Right) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        <button
          onClick={handleToggleMapType}
          className="p-2 rounded-xl bg-[#0B132B]/80 hover:bg-[#0B132B] backdrop-blur-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all shadow-xl active:scale-95 cursor-pointer"
          title="스카이뷰 전환"
        >
          <Layers className="w-4 h-4 text-teal-400" />
        </button>

        <div className="bg-[#0B132B]/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col overflow-hidden shadow-xl">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="확대"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-px bg-white/10" />
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="축소"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Popover Detail Modal for Multi-Deal Cluster (단지/클러스터 클릭 시 세부 매물 목록) */}
      {activeClusterModal && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 max-h-72 bg-slate-900/95 backdrop-blur-2xl border border-teal-500/30 rounded-2xl p-3.5 shadow-2xl z-30 flex flex-col gap-2 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-400" />
              <h4 className="text-xs font-black text-white">{activeClusterModal.title}</h4>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-300 font-bold">
                {activeClusterModal.totalCount}건
              </span>
            </div>
            <button 
              onClick={() => setActiveClusterModal(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
            {activeClusterModal.complexes.flatMap(c => c.items).map((tx, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  onSelectTx(tx);
                  setActiveClusterModal(null);
                }}
                className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      tx.dealCategory === 'RENT' ? 'bg-amber-500/15 text-amber-300' :
                      tx.dealCategory === 'JEONSE' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-emerald-500/15 text-emerald-300'
                    }`}>
                      {tx.dealCategory === 'RENT' ? '월세' : tx.dealCategory === 'JEONSE' ? '전세' : '매매'}
                    </span>
                    <span className="font-bold text-white text-[11px]">{tx.complexName}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{tx.area || '전용'} · {tx.floor || '일반층'}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-teal-300">
                    {tx.formattedPrice || tx.tradePriceWon}
                  </span>
                  <p className="text-[9px] text-slate-500">{tx.tradeDate || ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Zoom Indicator */}
      <div className="absolute bottom-2 left-2 z-20 pointer-events-none">
        <span className="text-[9px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-white/5">
          {zoomLevel <= 3 ? '📍 100% 정밀 단지 핀포인트 모드 (클러스터 해제)' : `🌐 광역 묶음 모드 (레벨 ${zoomLevel})`}
        </span>
      </div>

      {/* Bottom Watermark */}
      <div className="absolute bottom-2 right-2 z-20 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-white/5">
          Kakao Precision Real-Estate Engine
        </span>
      </div>
    </div>
  );
}
