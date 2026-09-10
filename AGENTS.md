# Antigravity 에이전트 작업 지침

## 1. 기본 언어 규칙 (Language)
- 사용자와의 모든 대화, 코드 설명, 브리핑, 커밋 메시지 제안 등은 **반드시 자연스러운 한국어**로 작성한다.
- 불필요하게 영어로 답변하지 않는다.

## 2. 프로젝트 기본 정보
- **프로젝트명**: Trend-Dashboard (Java 21, Spring Boot 3.3, React 19, TypeScript, Tailwind CSS, TanStack Query v5)
- **목표 Notebook ID**: `b7753663-82ee-48be-a993-c1293c32b686`
- **프로젝트 종합 명세서**: 프로젝트 루트의 [`NOTEBOOKLM_SUMMARY.md`](file:///c:/dev/IdeaProjects/Trend-Dashboard/NOTEBOOKLM_SUMMARY.md) (NotebookLM 소스 동기화 문서)

## 3. 새로운 대화창/작업 재개 시 지침 (인수인계 보장)
새로운 대화 세션이 시작되거나 사용자가 "작업 시작", "현황 브리핑", "이어서 하자" 등의 요청을 하면 CLI 명령어를 헤매지 말고 즉시 다음을 수행한다:
1. [`NOTEBOOKLM_SUMMARY.md`](file:///c:/dev/IdeaProjects/Trend-Dashboard/NOTEBOOKLM_SUMMARY.md)와 [`README.md`](file:///c:/dev/IdeaProjects/Trend-Dashboard/README.md)의 로드맵을 확인하여 지금까지 완료된 내역과 프로젝트 상태를 파악한다.
2. 현재까지 완료된 핵심 개편 내역 인지:
   - **API /v1 표준 버저닝 및 공통 에러 규격화**: `ErrorCode`, `ApiResponse`, `@RestControllerAdvice`, `apiClient.ts`
   - **대형 Dashboard 컴포넌트 모듈 분리**: `Dashboard.tsx` ➡️ `DashboardSummaryRibbon`, `ActiveAlertsBar` / `TrainMonitorPage.tsx` ➡️ 5대 서브모듈 및 `types/korail.ts`
   - **Loading / Empty / Error 상태 표준화**: `components/common/` (`LoadingState`, `EmptyState`, `ErrorState`, `ErrorBoundary`, `StatusContainer`)
   - **서버 상태 관리 개선**: TanStack Query v5 (`queryClient.ts`, `useAlerts`, `useMarketNews`, `usePublicData` 스마트 캐싱)
3. 현재 작업 공간의 `git status`를 확인하여 워킹 트리 청결 상태를 확인한다.
4. **차기 로드맵 1순위 과제인 `WebSocket 재연결 처리 개선`** 또는 사용자가 지정하는 과제를 파악한 뒤, 현재 구현 상태와 다음 진행 방향을 **한국어로 3~4줄로 핵심만 명쾌하게 요약 브리핑하고 사용자 지시를 대기**한다.

## 4. [절대 원칙] 하드코딩 및 가짜 성공(Fake Fallback) 영구 금지 (오류 투명성 보장)
- **오류 투명성의 원칙**: 통신 실패, 세션 만료, 파라미터 오류 등 어떤 상황에서도 **절대로 가짜 데이터나 난수 PNR, 가짜 성공 메시지로 포장하여 성공한 척 속이지 않는다.**
- **오류는 오류 그대로 표출**: 오류가 발생하면 즉시 `success: false`로 처리하고, 코레일 실서버의 실제 응답 메시지(`h_msg_txt`, `errCode`, HTTP 상태 코드 등)를 사용자 화면과 로그에 날것 그대로 정직하게 보여주어야 한다. (그래야 사용자와 개발자가 원인을 즉각 파악하고 정확하게 고칠 수 있다.)
- **하드코딩 및 모의 데이터 작성 일체 엄금**:
  - `masterList.add(...)`와 같은 가짜 열차 시간표 하드코딩 금지
  - 난수/해시 시드(`Math.random()`, `dateSeed`)를 이용한 가짜 잔여석/대기자 수 날조 금지
  - `fallbackPnr` 같은 가짜 예약/예매대기 번호 발급 금지
- **100% 실서버 라이브 통신만 허용**: 모든 열차 조회, 예약, 예매대기는 오직 코레일 본사 실서버 전산망과의 실제 통신 결과만으로 동작해야 한다.

## 5. [절대 원칙] UI/UX 디자인 아이덴티티: 시네마틱 에디토리얼 쿠튀르 & 100vh Single-Pane
- **럭셔리 시네마틱 에디토리얼 (Editorial Couture / ERA Residence 스타일)**:
  - **타이포그래피 대비**: 보그(Vogue)·킨포크(Kinfolk) 매거진 감성의 대담한 볼드 세리프(`font-serif font-black`)와 슬릭한 이탤릭 산세리프(`font-sans italic font-light`)의 극적 교차.
  - **건축학적 인덱스 넘버링**: `01 / SUB-SECOND LATENCY`, `02 / GENERATIVE INTELLIGENCE` 등 모노스페이스 챕터 인덱스.
  - **Numa & ERA Residence 연속 조립 스크롤리텔링**: 단순 슬라이드 페이드 쇼 영구 금지. 히어로 캡슐 축소 모핑, 사방 외곽에서 부품들이 날아와 자석 결합되는 캡슐 클라우드(Magnetic Assembly), 수평 키네틱 타이포 도킹, 실시간 시계열 SVG 파형 모핑([`HomeScrollytelling.tsx`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/src/pages/HomeScrollytelling.tsx)).
- **Nothing.tech & 앰비언트 다크 테마**:
  - 미드나잇 딥 네이비(`0B132B`) / 딥 슬레이트(`080D1A`), 에메랄드/시안 앰비언트 글로우, 미세 도트 그리드, 초정밀 글래스모피즘(`bg-white/[0.03]`, `backdrop-blur-xl`, `border-white/10`).
- **100vh 스크롤 제로 (Single-Pane 100vh Layout)**:
  - 브라우저 전체 스크롤을 배제(`overflow: hidden`, `height: 100vh`)하고 단일 화면에서 모든 데이터가 조망되는 고밀도 프로 트레이딩 레이아웃.
- **숫자 떨림 방지 고정폭(`tabular-nums`) & 미세 펄스 애니메이션(`.flash-up`, `.flash-down`)**:
  - 실시간 틱 수신 시 레이아웃 흔들림 방지(`tnum`) 및 0.7초 절제된 가격 변동 잔상 트랜지션.