# Trend-Dashboard 종합 개발 현황 및 명세서 (2026-09-08 최신화)

> **NotebookLM 소스 동기화용 공식 프로젝트 명세서**  
> 대상 Notebook ID: `b7753663-82ee-48be-a993-c1293c32b686`  
> 본 문서는 새로운 대화창이나 새 에이전트 세션에서도 즉시 프로젝트 전반을 파악하고 작업을 연속성 있게 이어갈 수 있도록 모든 아키텍처, 구현 내역, 로드맵을 총망라합니다.

---

## 1. 프로젝트 개요 (Project Overview)

* **프로젝트명**: Trend-Dashboard
* **핵심 목표**:
  1. **멀티 마켓 트레이딩 인텔리전스**: KIS(한국투자증권) 국내 주식, Upbit(업비트) 가상자산 실시간 시세, Gemini 1.5 Flash AI 감성 분석, 국토부 실거래가 및 기상청 날씨 공공데이터를 결합한 초고속 단일 창(Single-Pane 100vh) 대시보드
  2. **코레일(KTX/SRT) 스텔스 사냥기**: 코레일 모바일 공식 전산망과의 100% 실서버 통신 기반 취소표 낚아채기 및 2-Step 정규 예매대기(Waitlist) 자동화 시스템
* **기술 스택**:
  * **Backend**: Java 21, Spring Boot 3.3, Spring WebSocket (STOMP/SockJS), Spring Data JPA, H2 / PostgreSQL, RestClient, Google Gemini 1.5 Flash REST API, Gradle
  * **Frontend**: React 19, TypeScript 5.8, Vite 8.2, TailwindCSS, TanStack Query v5 (@tanstack/react-query), Lightweight-Charts 5.2 (TradingView), Lucide Icons, React-Toastify

---

## 2. [절대 원칙] 오류 투명성 및 가짜 데이터 영구 금지

* **오류 투명성의 원칙 (Transparency First)**:
  * 통신 실패, 세션 만료, 파라미터 불일치 등 어떤 상황에서도 가짜 데이터, 난수 PNR, 가짜 성공 메시지로 포장하지 않는다.
  * 오류 발생 시 `success: false`와 함께 코레일 및 실서버의 실제 에러코드(`errCode`), 상태코드, 응답 메시지(`h_msg_txt`)를 사용자 화면과 로그에 날것 그대로 정직하게 표출한다.
* **하드코딩 및 모의 데이터 일체 엄금**:
  * 가짜 시간표 리스트 하드코딩 금지
  * `Math.random()` 등을 이용한 가짜 잔여석/대기자 수 날조 금지
  * `fallbackPnr` 등 가짜 예약/예매대기 번호 발급 금지
  * 100% 코레일 본사 실서버 전산망과의 라이브 통신 결과만으로 동작

---

## 3. 최근 완료된 4대 핵심 아키텍처 개편 내역 (2026-09)

### ① API /v1 표준 버저닝 및 공통 에러 응답 규격화
* **Backend 표준 응답 규격**:
  * [`ErrorCode.java`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/java/com/trend/backend/config/common/ErrorCode.java): 표준 비즈니스 에러 코드 정의
  * [`ApiResponse.java`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/java/com/trend/backend/config/common/ApiResponse.java): `success`, `data`, `error`, `systemStatus`(`LIVE/DEGRADED/ERROR`), `timestamp`를 포함하는 통일된 DTO
  * [`GlobalExceptionHandler.java`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/java/com/trend/backend/config/common/GlobalExceptionHandler.java): `@RestControllerAdvice`를 통한 전역 예외 처리
  * [`KorailController.java`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/java/com/trend/backend/domain/korail/KorailController.java): `@RequestMapping({"/api/v1/korail", "/api/korail"})` 하위 호환 및 v1 표준 일원화
* **Frontend 통신 일원화**:
  * [`apiClient.ts`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/lib/apiClient.ts): Axios 인터셉터 기반 공통 에러 파싱 및 `/api/v1` 기본 경로 바인딩

### ② 대형 대시보드 컴포넌트 모듈 분리 (SRP 리팩토링)
* **`Dashboard.tsx` 경량화 (312줄 ➡️ 195줄)**:
  * [`DashboardSummaryRibbon.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/trading/dashboard/DashboardSummaryRibbon.tsx): 상단 4대 메트릭 요약 리본 (주식/코인 시세 및 체결 플래시, 포트폴리오 P&L 퀵진입, 목표가 알림 엔진 상태)
  * [`ActiveAlertsBar.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/trading/dashboard/ActiveAlertsBar.tsx): 실시간 등록된 목표가 알림 칩 목록 가로 스크롤 및 원클릭 삭제
* **`TrainMonitorPage.tsx` 대폭 경량화 (984줄 ➡️ 298줄, -668줄 절감)**:
  * [`types/korail.ts`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/types/korail.ts): `TrainSchedule`, `LoginSession`, `MonitorEvent`, `BookingMode` 타입 전용 분리
  * [`SniperRadarCard.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/korail/SniperRadarCard.tsx): 스나이퍼 모니터링 활성 펄스 레이더 카드 (시도 횟수, 실시간 레이턴시, 사냥 중지)
  * [`TrainSearchBar.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/korail/TrainSearchBar.tsx): 역 스왑, 네이티브 달력 + 퀵 날짜(오늘/내일/+2일/+7일), 시간대 선택, 사냥 모드 필터, 주요역 퀵 태그
  * [`TrainScheduleList.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/korail/TrainScheduleList.tsx): 실시간 열차 목록 테이블, 좌석 상태 뱃지, 즉시예약/대기신청/스나이핑 및 `[⏳ 대기만 사냥]` 버튼
  * [`KorailLoginModal.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/korail/KorailLoginModal.tsx): 코레일 모바일 세션 핫 연결 모달 (비밀키 원클릭 연결 + 직접 계정 입력)
  * [`ReservationSuccessModal.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/korail/ReservationSuccessModal.tsx): 예약/대기 성공 시 팡파레 축하 팝업

### ③ Loading / Empty / Error 상태 표준화 및 ErrorBoundary 구축
* **공통 상태 컴포넌트 (`components/common/`)**:
  * [`LoadingState.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/common/LoadingState.tsx): `spinner`, `skeleton-cards`, `skeleton-table`, `radar`, `inline` 5대 모드
  * [`EmptyState.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/common/EmptyState.tsx): 감각적인 빈 화면 + Call-To-Action (CTA) 버튼
  * [`ErrorState.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/common/ErrorState.tsx): 오류 투명성 준수(에러코드, 실서버 메시지, 상세 로그 아코디언, `[다시 시도]` 버튼)
  * [`ErrorBoundary.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/common/ErrorBoundary.tsx): 런타임 렌더링 예외 전파 차단 및 개별 위젯 격리 복구
  * [`StatusContainer.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/common/StatusContainer.tsx): `isLoading`, `isError`, `isEmpty` 고수준 선언적 래퍼
* **전역 적용**: `MarketNewsPanel`, `TrainScheduleList`, `AlertsView`, `RealEstateListPanel`, `Dashboard`(4대 탭 위젯 에러 바운더리 격리)

### ④ TanStack Query v5 기반 서버 상태 관리 및 스마트 캐싱
* **전역 QueryClient 설정** ([`queryClient.ts`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/lib/queryClient.ts)):
  * 2분 staleTime, 10분 gcTime, `refetchOnWindowFocus: true`, `refetchOnReconnect: true`
* **AI 금융 뉴스 캐싱** ([`useMarketNews.ts`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/hooks/useMarketNews.ts)):
  * `useQuery(['market-news', ticker, name])`, 5분 캐시로 탭 전환 시 0ms 즉시 렌더링 및 Gemini API 중복 호출 차단
* **목표가 알림 훅 및 자동 무효화** ([`useAlerts.ts`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/hooks/useAlerts.ts)):
  * `useQuery(['alerts', userId])` + `useMutation`
  * 알림 등록/삭제 즉시 `queryClient.invalidateQueries({ queryKey: ['alerts'] })` 자동 실행으로 리본, 칩 바, 알림 화면 전역 동기화
* **공공데이터 국토부 실거래가 & 날씨 다층 캐싱** ([`usePublicData.ts`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/hooks/usePublicData.ts)):
  * 지역/거래유형/페이지별 스마트 캐싱 적용으로 시군구 전환 시 0초 렌더링

---

## 4. 핵심 도메인 아키텍처

### 1) 코레일 스텔스 사냥기 (Korail Sniper)
```text
[Frontend: TrainMonitorPage]
    │ (STOMP WebSocket /topic/train-monitor & REST /api/v1/korail/*)
    ▼
[KorailController] ──> [KorailMonitorService]
                             │
                             ├─ 1) 실시간 좌석 폴링 (2.8s~4.5s 인간형 지터)
                             ├─ 2) 취소표 발견 시 ──> 즉시 예약 (txtJobId: 1101)
                             └─ 3) 좌석 매진 & 대기석 오픈 시 ──> 2-Step 정규 예매대기
                                      ├─ Step 1: TicketReservation (txtJobId: 1102) ➡️ PNR 발급
                                      └─ Step 2: ReservationWait (SMS 알림 Y) ➡️ 최종 확정
```

### 2) 실시간 트레이딩 & AI 인텔리전스
```text
[KIS / Upbit API] ──> [RealtimeTickStreamer] ──(STOMP 1s)──> [TradingChart / OrderBook]
[RSS 금융 뉴스]   ──> [NewsCollector] ──> [Gemini 1.5 Flash] ──> [MarketNewsPanel (TanStack Query)]
```

### 3) 프롭테크 공공데이터 허브
```text
[국토교통부 실거래가 API] + [기상청 날씨 API] ──> [PublicDataService] ──(TanStack Query 5m Cache)──> [PublicDataCenter]
```

---

## 5. 차기 로드맵 과제 (우선순위 순)

1. **[진행 예정] WebSocket 재연결 처리 개선 (Frontend)**:
   * 네트워크 순단, 절전 모드 복귀 시 STOMP/SockJS 자동 지수 백오프(Exponential Backoff) 재연결 안정화
2. **[진행 예정] External API Client 계층 정리 (Backend)**:
   * KIS, Upbit, Korail 외부 클라이언트 계층의 통일된 인터페이스 추상화 및 설정 분리
3. **[진행 예정] 외부 API 장애 처리 표준화 (Backend)**:
   * 타임아웃, 점검 시간, Rate Limit 등에 대한 일관된 Resilience4j / 서킷 브레이커 패턴 도입
4. **[진행 예정] Development / Production 설정 분리 (Infrastructure)**:
   * `application-dev.yml`과 `application-prod.yml` 환경 분리 및 Docker 컨테이너 프로파일링
