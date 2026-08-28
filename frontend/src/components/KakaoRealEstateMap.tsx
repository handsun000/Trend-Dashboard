import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  Navigation
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

// 전국 주요 핵심 지역 기본 좌표 매핑
const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'ALL': { lat: 37.5665, lng: 126.9780 }, // 서울시청 중심
  '11620': { lat: 37.4784, lng: 126.9516 }, // 관악구 (봉천/신림/서울대입구)
  '11680': { lat: 37.4979, lng: 127.0276 }, // 강남구
  '11650': { lat: 37.4837, lng: 127.0324 }, // 서초구
  '11710': { lat: 37.5145, lng: 127.1065 }, // 송파구
  '11170': { lat: 37.5326, lng: 126.9900 }, // 용산구
  '11560': { lat: 37.5264, lng: 126.9248 }, // 영등포구(여의도)
  '11440': { lat: 37.5663, lng: 126.9016 }, // 마포구
  '11200': { lat: 37.5634, lng: 127.0368 }, // 성동구(성수)
  '11350': { lat: 37.6542, lng: 127.0568 }, // 노원구
  '41135': { lat: 37.3827, lng: 127.1189 }, // 분당구(판교)
  '41117': { lat: 37.2849, lng: 127.0469 }, // 수원 영통구(광교)
  '41590': { lat: 37.2005, lng: 127.0982 }, // 화성시(동탄)
  '28185': { lat: 37.3888, lng: 126.6534 }, // 인천 연수구(송도)
  '41450': { lat: 37.5393, lng: 127.2148 }, // 하남시(미사)
  '41290': { lat: 37.4293, lng: 126.9877 }, // 과천시
  '26350': { lat: 35.1631, lng: 129.1636 }, // 부산 해운대구
  '27260': { lat: 35.8580, lng: 128.6305 }, // 대구 수성구
  '36110': { lat: 36.4800, lng: 127.2890 }, // 세종시
  '30200': { lat: 36.3622, lng: 127.3563 }, // 대전 유성구
  '29150': { lat: 35.1460, lng: 126.9231 }, // 광주 남구
};

// 동별 정밀 기준 좌표 사전 (신림역, 봉천역, 사당역, 여의도, 강남역 등)
const DONG_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // 관악구
  '신림동': { lat: 37.4842, lng: 126.9298 }, // 신림역 / 당곡역 중심
  '봉천동': { lat: 37.4812, lng: 126.9527 }, // 서울대입구역 / 봉천역 중심
  '남현동': { lat: 37.4725, lng: 126.9815 }, // 사당역 남측
  
  // 영등포구
  '여의도동': { lat: 37.5218, lng: 126.9242 },
  '당산동': { lat: 37.5340, lng: 126.9020 },
  '문래동': { lat: 37.5180, lng: 126.8970 },
  '영등포동': { lat: 37.5170, lng: 126.9080 },
  '신길동': { lat: 37.5050, lng: 126.9120 },
  '대림동': { lat: 37.4930, lng: 126.8980 },

  // 강남구
  '역삼동': { lat: 37.5006, lng: 127.0365 },
  '대치동': { lat: 37.4932, lng: 127.0628 },
  '개포동': { lat: 37.4795, lng: 127.0600 },
  '삼성동': { lat: 37.5140, lng: 127.0565 },
  '압구정동': { lat: 37.5300, lng: 127.0300 },
  '청담동': { lat: 37.5250, lng: 127.0500 },
  '논현동': { lat: 37.5110, lng: 127.0280 },
  '도곡동': { lat: 37.4880, lng: 127.0450 },

  // 서초구
  '서초동': { lat: 37.4918, lng: 127.0135 },
  '반포동': { lat: 37.5045, lng: 127.0050 },
  '방배동': { lat: 37.4830, lng: 126.9930 },
  '잠원동': { lat: 37.5150, lng: 127.0120 },

  // 송파구
  '잠실동': { lat: 37.5130, lng: 127.0850 },
  '가락동': { lat: 37.4950, lng: 127.1200 },
  '문정동': { lat: 37.4850, lng: 127.1250 },
  '신천동': { lat: 37.5180, lng: 127.1000 },
  '송파동': { lat: 37.5020, lng: 127.1120 },

  // 마포구
  '상암동': { lat: 37.5775, lng: 126.8915 },
  '공덕동': { lat: 37.5440, lng: 126.9515 },
  '서교동': { lat: 37.5550, lng: 126.9215 },
  '아현동': { lat: 37.5570, lng: 126.9560 },
  '염리동': { lat: 37.5470, lng: 126.9450 },

  // 성동구
  '성수동': { lat: 37.5445, lng: 127.0555 },
  '옥수동': { lat: 37.5410, lng: 127.0170 },
  '금호동': { lat: 37.5500, lng: 127.0220 },
  '행당동': { lat: 37.5580, lng: 127.0350 },

  // 분당구
  '삼평동': { lat: 37.4015, lng: 127.1115 },
  '백현동': { lat: 37.3930, lng: 127.1120 },
  '정자동': { lat: 37.3660, lng: 127.1080 },
  '서현동': { lat: 37.3850, lng: 127.1280 },
  '이매동': { lat: 37.3960, lng: 127.1270 },
};

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY || '';

interface ComplexGroup {
  complexName: string;
  dong: string;
  representativeTx: MapTransaction;
  items: MapTransaction[];
  count: number;
  lat: number;
  lng: number;
}

interface DongCluster {
  dongName: string;
  count: number;
  lat: number;
  lng: number;
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
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'normal' | 'skyview'>('normal');
  const [zoomLevel, setZoomLevel] = useState<number>(4);
  const [showSearchHereBtn, setShowSearchHereBtn] = useState<boolean>(false);
  const [isSearchingHere, setIsSearchingHere] = useState<boolean>(false);

  // 1. 단지별 매물 그룹화 (동별 정밀 좌표 매핑 & 마커 겹침 방지)
  const complexGroups = useMemo<ComplexGroup[]>(() => {
    const baseCoords = REGION_COORDINATES[lawdCd] || REGION_COORDINATES['ALL'];
    const map = new Map<string, MapTransaction[]>();

    transactions.forEach((tx) => {
      const key = `${tx.dong || ''}_${tx.complexName}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(tx);
    });

    const groups: ComplexGroup[] = [];

    map.forEach((items, key) => {
      const rep = items[0];
      const dong = (rep.dong || '').trim();

      // 동별 정밀 좌표 우선 매핑 (신림동 -> 신림역 인근, 봉천동 -> 서울대입구역 인근)
      const dongCenter = DONG_COORDINATES[dong] || baseCoords;
      
      // 단지명 기반 고유 해시 좌표 오프셋 (단지별 약 80~300m 미세 분산)
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        hash = (hash << 5) - hash + key.charCodeAt(i);
        hash |= 0;
      }
      const latOffset = ((Math.abs(hash) % 100) - 50) * 0.00012;
      const lngOffset = ((Math.abs(hash * 3) % 100) - 50) * 0.00016;

      groups.push({
        complexName: rep.complexName,
        dong: dong,
        representativeTx: rep,
        items: items,
        count: items.length,
        lat: dongCenter.lat + latOffset,
        lng: dongCenter.lng + lngOffset,
      });
    });

    return groups;
  }, [transactions, lawdCd]);

  // 2. 동별 클러스터 그룹화 (줌 아웃 시 표시용)
  const dongClusters = useMemo<DongCluster[]>(() => {
    const baseCoords = REGION_COORDINATES[lawdCd] || REGION_COORDINATES['ALL'];
    const map = new Map<string, number>();

    transactions.forEach((tx) => {
      const dong = (tx.dong || '주요동').trim();
      map.set(dong, (map.get(dong) || 0) + 1);
    });

    const clusters: DongCluster[] = [];

    map.forEach((count, dongName) => {
      const dongCenter = DONG_COORDINATES[dongName] || baseCoords;
      clusters.push({
        dongName,
        count,
        lat: dongCenter.lat,
        lng: dongCenter.lng,
      });
    });

    return clusters;
  }, [transactions, lawdCd]);

  // 3. 카카오맵 SDK 동적 주입 및 초기화 파이프라인
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
            level: 4, // 1~14 (4: 단지 뷰)
          };

          const map = new window.kakao.maps.Map(container, options);
          mapInstanceRef.current = map;
          setIsMapLoaded(true);
          setLoadError(null);

          map.setMaxLevel(8);
          map.setMinLevel(1);

          // 줌 레벨 변경 리스너
          window.kakao.maps.event.addListener(map, 'zoom_changed', () => {
            const lvl = map.getLevel();
            setZoomLevel(lvl);
          });

          // 드래그 종료 리스너 (현재 영역 재검색 버튼 표시)
          window.kakao.maps.event.addListener(map, 'dragend', () => {
            setShowSearchHereBtn(true);
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
          setLoadError('카카오맵 로딩 타임아웃. 카카오 콘솔 Web 플랫폼에 http://localhost:15173 등록 여부를 확인해주세요.');
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

  // 4. 지역 변경 시 중심좌표 PanTo
  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao) return;
    const coords = REGION_COORDINATES[lawdCd] || REGION_COORDINATES['ALL'];
    const moveLatLon = new window.kakao.maps.LatLng(coords.lat, coords.lng);
    mapInstanceRef.current.panTo(moveLatLon);
    setShowSearchHereBtn(false);
  }, [lawdCd]);

  // 5. 선택된 매물 또는 호버된 매물로 중심 이동 및 강조
  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao || !selectedTx) return;
    const foundGroup = complexGroups.find(g => g.complexName === selectedTx.complexName);
    if (foundGroup) {
      const pos = new window.kakao.maps.LatLng(foundGroup.lat, foundGroup.lng);
      mapInstanceRef.current.panTo(pos);
    }
  }, [selectedTx]);

  // 6. 마커 오버레이 렌더링 (단지별 컴팩트/익스팬딩 마커 or 줌아웃 동별 클러스터)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao || !isMapLoaded) return;

    // 기존 오버레이 초기화
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    // [MODE A] 줌 레벨 6 이상: 동별 네온 글래스 클러스터 뱃지
    if (zoomLevel >= 6) {
      dongClusters.forEach((cluster) => {
        const position = new window.kakao.maps.LatLng(cluster.lat, cluster.lng);
        const clusterEl = document.createElement('div');
        clusterEl.className = 'kakao-dong-cluster cursor-pointer select-none';
        clusterEl.innerHTML = `
          <div style="
            background: radial-gradient(circle at center, rgba(14, 165, 233, 0.95), rgba(30, 27, 75, 0.95));
            border: 2px solid #38BDF8;
            box-shadow: 0 0 25px rgba(56, 189, 248, 0.6), inset 0 0 10px rgba(56, 189, 248, 0.4);
            border-radius: 50%;
            width: 72px;
            height: 72px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            transform: scale(1);
          ">
            <span style="font-size: 11px; font-weight: 800; letter-spacing: -0.3px;">${cluster.dongName}</span>
            <span style="font-size: 12px; font-weight: 900; font-family: monospace; color: #FDE047;">${cluster.count}건</span>
          </div>
        `;

        clusterEl.onclick = () => {
          mapInstanceRef.current.setLevel(4);
          mapInstanceRef.current.panTo(position);
        };

        const overlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: clusterEl,
          zIndex: 20,
        });

        overlay.setMap(mapInstanceRef.current);
        overlaysRef.current.push(overlay);
      });

      return;
    }

    // [MODE B] 줌 레벨 5 이하: 단지별 컴팩트 & 익스팬딩 칩 마커 (단지 묶음 렌더링)
    complexGroups.forEach((group) => {
      const position = new window.kakao.maps.LatLng(group.lat, group.lng);
      const tx = group.representativeTx;
      const isSelected = selectedTx?.complexName === group.complexName;
      const isHovered = hoveredTxKey === group.complexName;
      const isHighlighted = isSelected || isHovered;

      const isJeonse = tx.dealCategory === 'JEONSE' || tx.tradeType?.includes('전세');
      const isRent = tx.dealCategory === 'RENT' || tx.tradeType?.includes('월세');

      // 가격 표시
      const priceText = tx.formattedPrice || tx.tradePriceWon || '시세정보';

      // 가격 추이 칩
      let trendLabel = '실거래';
      let trendBg = 'rgba(255,255,255,0.1)';
      let trendColor = '#E2E8F0';

      if (tx.tradePrice && tx.tradePrice >= 25.0) {
        trendLabel = '▲ 신고가';
        trendBg = 'rgba(244, 63, 94, 0.25)';
        trendColor = '#FDA4AF';
      } else if (isRent) {
        trendLabel = '월세 🔶';
        trendBg = 'rgba(245, 158, 11, 0.25)';
        trendColor = '#FDE68A';
      } else if (isJeonse) {
        trendLabel = '전세 🔷';
        trendBg = 'rgba(6, 182, 212, 0.25)';
        trendColor = '#A5F3FC';
      } else {
        trendLabel = '우상향 📈';
        trendBg = 'rgba(16, 185, 129, 0.25)';
        trendColor = '#6EE7B7';
      }

      const markerEl = document.createElement('div');
      markerEl.className = 'kakao-compact-marker-wrapper cursor-pointer select-none';
      
      // 초경량 캡슐 + 호버 시 익스팬딩(Expanding) 디자인
      markerEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; position: relative;">
          
          <!-- Marker Capsule Box -->
          <div style="
            background: ${isHighlighted ? '#1E1B4B' : 'rgba(11, 19, 43, 0.94)'};
            backdrop-filter: blur(16px);
            border: 1.5px solid ${isHighlighted ? '#2DD4BF' : 'rgba(255, 255, 255, 0.2)'};
            border-radius: ${isHighlighted ? '14px' : '10px'};
            padding: ${isHighlighted ? '6px 10px' : '4px 8px'};
            box-shadow: ${isHighlighted ? '0 0 25px rgba(45, 212, 191, 0.6), 0 10px 20px rgba(0,0,0,0.8)' : '0 4px 15px rgba(0,0,0,0.5)'};
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            transform: ${isHighlighted ? 'scale(1.12)' : 'scale(1)'};
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 80px;
          ">
            <!-- Top Header: Complex Name & Count Badge -->
            <div style="display: flex; align-items: center; gap: 4px; width: 100%; justify-content: space-between;">
              <span style="font-size: 11px; font-weight: 800; color: #FFFFFF; max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${group.complexName}
              </span>
              ${group.count > 1 ? `
                <span style="font-size: 9px; font-family: monospace; font-weight: 900; background: rgba(99, 102, 241, 0.3); color: #C7D2FE; padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(99, 102, 241, 0.4);">
                  +${group.count}
                </span>
              ` : ''}
            </div>

            <!-- Price Typography -->
            <div style="font-size: ${isHighlighted ? '13px' : '11px'}; font-weight: 900; font-family: monospace; color: ${isHighlighted ? '#5EEAD4' : '#38BDF8'}; letter-spacing: -0.5px; line-height: 1.2;">
              ${priceText}
            </div>

            <!-- Expanding Sub-info on Highlight/Hover -->
            ${isHighlighted ? `
              <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 3px; width: 100%; justify-content: space-between;">
                <span style="font-size: 9px; font-weight: bold; padding: 1px 4px; border-radius: 4px; background: ${trendBg}; color: ${trendColor};">
                  ${trendLabel}
                </span>
                <span style="font-size: 9px; color: #94A3B8; font-family: monospace;">
                  ${tx.floor || '일반층'} · ${tx.pyeong || 34}평
                </span>
              </div>
            ` : ''}
          </div>

          <!-- Bottom Pin Arrow -->
          <div style="
            width: 0; 
            height: 0; 
            border-left: 5px solid transparent; 
            border-right: 5px solid transparent; 
            border-top: 6px solid ${isHighlighted ? '#2DD4BF' : 'rgba(11, 19, 43, 0.94)'}; 
            margin-top: -1px;
          "></div>
        </div>
      `;

      markerEl.onmouseenter = () => {
        if (onHoverTx) onHoverTx(group.complexName);
      };

      markerEl.onmouseleave = () => {
        if (onHoverTx) onHoverTx(null);
      };

      markerEl.onclick = () => {
        onSelectTx(tx);
      };

      const overlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: markerEl,
        yAnchor: 1.15,
        zIndex: isHighlighted ? 40 : 15,
      });

      overlay.setMap(mapInstanceRef.current);
      overlaysRef.current.push(overlay);
    });

  }, [complexGroups, dongClusters, zoomLevel, selectedTx, hoveredTxKey, isMapLoaded]);

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

  // 7. 현재 지도 중심 위치 기반 역지오코딩 & 실시간 재검색
  const handleSearchHere = () => {
    if (!mapInstanceRef.current || !window.kakao) return;
    setIsSearchingHere(true);
    setShowSearchHereBtn(false);

    const center = mapInstanceRef.current.getCenter();
    const lat = center.getLat();
    const lng = center.getLng();

    // 카카오 services.Geocoder로 행정동/법정동 코드 역조회
    if (window.kakao.maps.services && window.kakao.maps.services.Geocoder) {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.coord2RegionCode(lng, lat, (result: any[], status: any) => {
        setIsSearchingHere(false);
        if (status === window.kakao.maps.services.Status.OK && result && result.length > 0) {
          const bRegion = result.find((r: any) => r.region_type === 'B') || result[0];
          const lawdCd = bRegion.code ? bRegion.code.substring(0, 5) : '11620';
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
          // 좌표 기반 최근접 지역 매핑 폴백
          fallbackSearchInBounds(lat, lng);
        }
      });
    } else {
      setIsSearchingHere(false);
      fallbackSearchInBounds(lat, lng);
    }
  };

  const fallbackSearchInBounds = (lat: number, lng: number) => {
    let closestCode = '11620';
    let closestName = '서울특별시 관악구';
    let minDist = 999999;

    Object.entries(REGION_COORDINATES).forEach(([code, c]) => {
      const dist = Math.pow(c.lat - lat, 2) + Math.pow(c.lng - lng, 2);
      if (dist < minDist) {
        minDist = dist;
        closestCode = code;
      }
    });

    // 신림역/봉천역 주변 판별
    if (lat > 37.47 && lat < 37.49 && lng > 126.91 && lng < 126.96) {
      closestCode = '11620';
      closestName = '서울특별시 관악구 신림·봉천';
    }

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
          {zoomLevel >= 6 ? `동별 묶음 ${dongClusters.length}개` : `단지 앵커 ${complexGroups.length}개`}
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

      {/* Bottom Zoom / Mode Indicator */}
      <div className="absolute bottom-2 left-2 z-20 pointer-events-none">
        <span className="text-[9px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-white/5">
          {zoomLevel >= 6 ? '🔍 동 단위 클러스터 모드' : '📍 개별 단지 마커 모드'}
        </span>
      </div>

      {/* Bottom Watermark Badge */}
      <div className="absolute bottom-2 right-2 z-20 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-white/5">
          Kakao Maps Pro PropTech
        </span>
      </div>
    </div>
  );
}
