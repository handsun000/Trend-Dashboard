# Trend-Dashboard 종합 개발 현황 및 명세서 (2026-09-10 최신화)

> **NotebookLM 소스 동기화용 공식 프로젝트 명세서**  
> 대상 Notebook ID: `b7753663-82ee-48be-a993-c1293c32b686`  
> 본 문서는 새로운 대화창이나 새 에이전트 세션에서도 즉시 프로젝트 전반을 파악하고 작업을 연속성 있게 이어갈 수 있도록 모든 아키텍처, 구현 내역, 로드맵, 그리고 최상위 UI/UX 디자인 철학을 총망라합니다.

---

## 1. 프로젝트 개요 (Project Overview)

* **프로젝트명**: Trend-Dashboard
* **핵심 목표**:
  1. **멀티 마켓 트레이딩 인텔리전스**: KIS(한국투자증권) 국내 주식, Upbit(업비트) 가상자산 실시간 시세, Gemini 1.5 Flash AI 감성 분석, 국토부 실거래가 및 기상청 날씨 공공데이터를 결합한 초고속 단일 창(Single-Pane 100vh) 대시보드
  2. **코레일(KTX/SRT) 스텔스 사냥기**: 코레일 모바일 공식 전산망과의 100% 실서버 통신 기반 취소표 낚아채기 및 2-Step 정규 예매대기(Waitlist) 자동화 시스템
* **기술 스택**:
  * **Backend**: Java 21, Spring Boot 3.3, Spring WebSocket (STOMP/SockJS), Spring Data JPA, H2 / PostgreSQL, RestClient, Google Gemini 1.5 Flash REST API, Resilience4j, Gradle
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

## 2.1 [절대 원칙] UI/UX 디자인 아이덴티티: Numa & ERA Residence 연속 조립 스크롤리텔링

* **Numa (numa.uprock.pro) 연속 조립 메커니즘 (단순 슬라이드 쇼 영구 금지)**:
  * **무(無)에서 유(有)로의 실시간 UI 프레임 조립**: 첫 화면(Progress 0.0)은 상단 헤더, 하단 전광판, 테두리 장식을 완전히 배제한 극도의 순수 여백(Pure Kinfolk Void)으로 시작. 스크롤 진행에 따라 상단 헤더가 내려앉고 하단 바가 상승 도킹.
  * **60fps 무지연 시네마틱 웜업 프리로더 (0% ➡️ 100%)**: 진입 시 750ms 동안 GPU 3D 가속 및 폰트 렌더링을 사전 예열하여 휠 조작 첫 프레임부터 버터 같은 부드러움 보장.
  * **사방 외곽에서 날아와 결합되는 자석 캡슐 클라우드 (Magnetic Assembly)**: 거치적거리는 중앙 더미 박스를 전면 배제하고, 6대 실시간 데이터 캡슐(1초 틱, 1분봉 캔들, 10호가창, Gemini 84% 감성 링, 환율, 코레일 스나이퍼) 자체가 3차원 공간에서 회전하며 날아와 중앙으로 자석 결합.
  * **수평 키네틱 타이포그래피 & AI 3줄 브리핑 도킹**: 거대 볼드 세리프 `SUB-SECOND LATENCY & COGNITIVE AI` 수평 유영 및 시차를 둔 수평 트랙 카드 스택.
  * **타임라인 룰러 스크럽 & 실시간 시계열 SVG 파형 모핑**: 상단 시간 룰러와 하단 국토부/코레일 실거래가 SVG 파동 곡선이 스크롤 위상에 따라 실시간 출렁이며 형태 모핑.
  * **스크롤 트래블 2.7배 확장 및 페이즈별 홀드(HOLD Zone) 구간 확보**: 성급하게 지나가지 않고 도킹된 데이터를 여유롭게 감상할 수 있는 안정적 정지 머무름 구간 구축.
* **Nothing.tech 감성 & 앰비언트 다크 메쉬**:
  * 단순 블랙을 배제한 `#080D1A` 딥 슬레이트 및 `#0B132B` 딥 네이비 베이스.
  * 에메랄드/시안/틸 네온 앰비언트 글로우 블러(`blur-[140px]~[180px]`) 및 초정밀 글래스모피즘(`bg-white/[0.03]`, `backdrop-blur-xl`, `border-white/10`).
* **100vh 스크롤 제로 레이아웃 (Single-Pane 100vh Layout)**:
  * 브라우저 전체 스크롤을 배제(`overflow: hidden`, `height: 100vh`)하여 모든 핵심 데이터와 차트가 단일 화면 내에서 한눈에 조망되는 고밀도 프로 뷰.
* **숫자 떨림 방지 (`tabular-nums`) & 미세 펄스 애니메이션 (`Micro Price Pulse`)**:
  * 1초 단위 틱 시세 요동 시 레이아웃 덜덜거림을 차단하는 고정폭 숫자(`font-variant-numeric: tabular-nums`).
  * 가격 변동 시 0.7초간 은은하게 번지는 에메랄드(`.flash-up`) 및 로즈(`.flash-down`) 잔상 트랜지션.

---

## 3. 최근 완료된 핵심 아키텍처 개편 내역 (2026-09)

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

### ⑤ WebSocket 단일 멀티플렉싱 및 지수 백오프 스마트 재연결 처리
* **단일 STOMP Client 멀티플렉싱** ([`WebSocketContext.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/contexts/WebSocketContext.tsx)):
  * `App.tsx`, `useTradingDashboard.ts`, `TrainMonitorPage.tsx`의 중복 소켓 인스턴스를 단일 물리적 연결로 일원화
  * 컴포넌트 생명주기와 연동된 선언적 구독 훅 `useStompSubscription<T>(topic, callback)` 제공
* **지수 백오프 (Exponential Backoff with Jitter) 재연결 엔진**:
  * 초기 1.5초 ➡️ 3초 ➡️ 6초 ➡️ 최대 30초 한도 (±20% 무작위 지터로 Thundering Herd 방지)
  * 브라우저 `online` 이벤트 즉시 복구, `visibilitychange`(탭 활성화/절전 모드 복귀) 연결 자동 검증
* **자동 재구독 (Auto-Resubscription) 보장**:
  * 네트워크 일시 단절 후 재연결 시 기존 모든 활성 토픽 구독 자동 복원
* **오류 투명성 UI 피드백** ([`ConnectionStatusBadge.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/common/ConnectionStatusBadge.tsx), [`ConnectionOfflineBanner.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/components/common/ConnectionOfflineBanner.tsx)):
  * 사이드바 하드코딩 제거 ➡️ 실시간 LIVE(활성 토픽 수), 재연결 중(N회차/초), OFFLINE 실제 상태 반영
  * 헤더 툴바 뱃지 및 상단 비간섭형 재연결 배너 + `[지금 재연결]` 원클릭 트리거

### ⑥ External API Client 계층 정리 및 표준화 (Backend)
* **독립 통신 계층 `com.trend.backend.client` 패키지 신설**:
  * `batch/`에 혼재되어 있던 외부 API 클라이언트들을 독립 계층으로 분리하여 아키텍처 계층 정합성 확립
* **표준 RestClient 및 타임아웃 방어 기제** ([`RestClientConfig.java`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/java/com/trend/backend/client/config/RestClientConfig.java)):
  * `ConnectTimeout(4s)`, `ReadTimeout(10s)` 표준 적용으로 외부 장애 시 백엔드 스레드 풀 고갈 방지
  * `User-Agent: Trend-Dashboard-Backend/1.0` 공통 헤더 자동 적용
* **타입 세이프 프로퍼티 계층화** ([`ExternalApiProperties.java`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/java/com/trend/backend/client/config/ExternalApiProperties.java)):
  * `@ConfigurationProperties` 기반 `KisProperties`, `UpbitProperties`, `PublicDataProperties`, `KorailProperties`, `GeminiProperties` 중앙 집중 관리
* **공통 인터페이스 및 상태 진단 체계** ([`ExternalApiClient.java`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/java/com/trend/backend/client/common/ExternalApiClient.java), [`ExternalApiStatusController.java`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/java/com/trend/backend/client/ExternalApiStatusController.java)):
  * 모든 외부 클라이언트(`KIS`, `UPBIT`, `EXCHANGE_RATE`, `MOLIT`, `KMA`, `KORAIL`, `GEMINI`)의 `checkHealth()` 표준화
### ⑦ Resilience4j 서킷 브레이커 & 지능형 재시도 기반 장애 격리 표준화 (Backend)
* **Resilience4j 인프라 도입 및 AOP 연동** ([`build.gradle`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/build.gradle), [`application.yml`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/resources/application.yml)):
  * `resilience4j-spring-boot3:2.2.0` 및 `spring-boot-starter-aop` 연동으로 선언적 장애 격리 인프라 구축
  * 카운트 기반 슬라이딩 윈도우(10), 최소 호출 수(4), 실패율 임계치(50%), OPEN 대기 시간(10~45초) 세분화 적용
* **금융/시세/환율/AI 외부 API 연동망 보호 및 Fallback 전략**:
  * **KIS (한국투자증권)**: 일시적 네트워크 순단 시 지수 백오프 3회 재시도(`@Retry`) + 서킷 OPEN 시 캐시된 최근 종가/시세로 안전 격리(`@CircuitBreaker`)
  * **Upbit**: 2회 재시도 + 장애 시 직전 실시간 체결가 스냅샷 폴백
  * **ExchangeRate (글로벌 환율)**: 2회 재시도 + 외부 ER-API 장애 시 업비트 USDT 테더 환율 자동 환산 폴백
  * **Gemini AI**: 서킷 OPEN 시 기본 기술적 분석 요약 메시지 안내로 AI 먹통 방지
* **[절대 원칙 준수] 코레일(Korail) 무가짜(No-Fake) 투명 장애 격리 (`AGENTS.md`)**:
  * 서킷 브레이커 연동 시에도 **절대로 가짜 PNR, 난수 잔여석, 가짜 예약 성공을 날조하지 않음**
  * 서킷 OPEN 전이 시 장애 상태와 쿨다운 정보를 날것 그대로 솔직하게 반환하여 스레드 고갈 및 코레일 본사 계정 블락 방지
* **실시간 서킷 브레이커 모니터링 체계** ([`ResilienceConfig.java`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/java/com/trend/backend/client/config/ResilienceConfig.java), [`ExternalApiStatusController.java`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/java/com/trend/backend/client/ExternalApiStatusController.java)):
  * `CircuitBreakerMonitor` 컴포넌트를 통해 프로바이더명 자동 매핑 및 실시간 서킷 상태(`CLOSED`, `OPEN`, `HALF_OPEN`), 실패율(`failureRate`) 산출
  * `/api/v1/system/external-apis` 엔드포인트 응답 DTO에 서킷 브레이커 상태를 실시간 노출하여 관측 가능성(Observability) 극대화

### ⑧ Development / Production 설정 분리 및 Full-Stack Docker 오케스트레이션 구축 (Infrastructure)
* **스프링 부트 다중 프로파일 분리** ([`application.yml`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/resources/application.yml), [`application-dev.yml`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/resources/application-dev.yml), [`application-prod.yml`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/resources/application-prod.yml)):
  * `application.yml`: 공통 설정 (Resilience4j, RestClient 타임아웃 등), 기본 활성 프로파일 `dev` 지정
  * `application-dev.yml`: H2 인메모리 DB, 웹 콘솔 활성화, JPA `create-drop`, SQL 포맷팅 및 상세 DEBUG 로깅, 로컬 포트 연동
  * `application-prod.yml`: PostgreSQL 연동, HikariCP 커넥션 풀 최적화(`TrendHikariPool`, max 10, idle 5, timeout 30s), JPA `update`, INFO 레벨 운영 로깅, Docker 내부 서비스 네트워크 연동
* **프론트엔드 환경변수 분리 및 리버스 프록시 연동**:
  * [`.env.development`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/.env.development) / [`.env.production`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/.env.production): `VITE_API_BASE_URL` 및 `VITE_WS_URL` 분리
  * [`apiClient.ts`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/lib/apiClient.ts) 및 [`WebSocketContext.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/contexts/WebSocketContext.tsx) 환경변수 동적 바인딩
  * [`nginx.conf`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/nginx.conf): HTML5 SPA History 라우팅, `/api/` REST 및 `/ws` STOMP WebSocket(Upgrade/Connection 헤더) 무중단 리버스 프록시
* **Multi-stage Dockerfile 및 원클릭 오케스트레이션**:
  * [`backend/Dockerfile`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/Dockerfile): Temurin 21 JDK 빌더 ➡️ JRE Alpine 경량 런타임, Python 3 및 코레일 모바일 스텔스 브릿지 스크립트 번들링
  * [`frontend/Dockerfile`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/Dockerfile): Node 20 빌더 ➡️ Nginx Alpine 서빙
  * [`docker-compose.yml`](file:///c:/dev/IdeaProjects/Trend-Dashboard/docker-compose.yml): 로컬 개발 인프라(PostgreSQL, Elasticsearch+nori, Redis) 헬스체크 연동
  * [`docker-compose.prod.yml`](file:///c:/dev/IdeaProjects/Trend-Dashboard/docker-compose.prod.yml): 풀스택 원클릭 오케스트레이션 (`db`, `redis`, `elasticsearch`, `backend`, `frontend`), `service_healthy` 선행 의존성, 헬스체크 진단 엔드포인트 연동
  * [`.env.docker.example`](file:///c:/dev/IdeaProjects/Trend-Dashboard/.env.docker.example): 프로덕션 환경변수 가이드 템플릿 제공

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

1. **[완료] WebSocket 재연결 처리 개선 (Frontend)**:
   * STOMP/SockJS 단일 소켓 멀티플렉싱, 지수 백오프 자동 재연결, 자동 재구독, 전역 연결 상태 UI 피드백 완료
2. **[완료] External API Client 계층 정리 (Backend)**:
   * `com.trend.backend.client` 패키지 신설, 표준 RestClient 타임아웃, ConfigurationProperties, ExternalApiClient 공통 헬스체크 인터페이스 및 `/api/v1/system/external-apis` 진단 엔드포인트 구축 완료
3. **[완료] 외부 API 장애 처리 표준화 (Backend)**:
   * Resilience4j 서킷 브레이커(`CircuitBreaker`) 및 지수 백오프 재시도(`Retry`) 적용 완료 (KIS, Upbit, 글로벌 환율, Gemini, 국토부/기상청, 코레일)
   * `/api/v1/system/external-apis` 실시간 서킷 상태(`CLOSED`/`OPEN`/`HALF_OPEN`) 및 실패율 모니터링 연동 완료
4. **[완료] Development / Production 설정 분리 (Infrastructure)**:
   * `application-dev.yml`과 `application-prod.yml` 환경 분리, 프론트엔드 `.env` 및 Nginx 리버스 프록시, Multi-stage Dockerfile 및 Full-Stack Docker Compose 오케스트레이션 완료
1. **[진행 예정] 홈 스크롤리텔링 페이즈별 순차 디테일 핀포인트 고도화 (Phase 1 ➡️ Phase 5)**:
   * **Phase 1 (The Kinfolk Void)**: 킨포크 타이포그래피 미세 자간, 초기 진입 트랜지션 및 앰비언트 글로우 극대화
   * **Phase 2 (Magnetic Cloud Assembly)**: 6대 실시간 데이터 캡슐 인터랙션, 3D 틸트 깊이감, 호버 마이크로 펄스 및 스프링 물리 강화
   * **Phase 3 (Kinetic Typography & AI)**: 수평 키네틱 타이포 궤적 및 Gemini AI 3줄 브리핑 카드 스택 고도화
   * **Phase 4 (Wave Morphing & PropTech)**: 타임라인 룰러 및 실시간 SVG 파형 출렁임과 코레일 사냥 핀 연동 극대화
   * **Phase 5 (Master Workspace Gateway)**: 최종 마스터 워크스페이스 그리드 도킹 및 룸 진입 트랜지션
2. **[진행 예정] 코레일 실시간 모바일 세션 핫 리프레시 및 알림 고도화 (Domain)**:
   * 코레일 세션 자동 갱신(Keep-Alive), 실시간 취소표/예매대기 체결 시 브라우저 Web Notification & 사운드 알림 연동




