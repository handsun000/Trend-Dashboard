# Trend-Dashboard 종합 개발 현황 및 아키텍처 명세서 (2026-08-14)

## 1. 프로젝트 개요 (Project Overview)
* **목표**: 한국투자증권(KIS) 국내 주식 및 업비트(Upbit) 가상화폐 실시간 시세, 공공데이터, 뉴스/공시 데이터를 통합 분석하는 하이엔드 단일 창(Single-Pane) 트레이딩 대시보드
* **기술 스택**:
  * **Backend**: Java 21, Spring Boot 3.3, Spring Batch, Spring WebSocket (STOMP/SockJS), Spring Data JPA, H2 Database, RestClient
  * **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Recharts, Base UI, Lucide Icons, React-Toastify

---

## 2. 시스템 아키텍처 및 데이터 흐름

```
[사용자 검색 & 종목 선택]
          │
          ▼
[1. GET /api/v1/search?q={query}] ──► 업비트 280+ KRW 코인 + 국내 주식 전 종목 실시간 인덱스 검색
          │
          ▼
[2. GET /api/v1/market/quote?ticker={ticker}] ──► 실시간 라이브 시세 통합 수집
    ├── [주식]: 한국투자증권(KIS) OpenAPI (`inquire-price`) ──► 현재가, 변동폭, 고가, 저가, 거래량
    └── [코인]: 업비트(Upbit) OpenAPI (`ticker?markets=`) ──► 현재가, 24h고가, 24h저가, 거래대금
          │
          ▼
[3. RealtimeTickStreamer] ──► 사용자가 조회한 종목을 실시간 감시 목록에 자동 등록 (3초 주기 `/topic/ticks` 웹소켓 푸시)
          │
          ▼
[4. Frontend Single-Pane Dashboard] ──► Tabular-nums 고정폭 렌더링, 100vh 스크롤 제로 뷰, 호가창 및 차트 실시간 갱신
```

---

## 3. 금일 완료된 주요 작업 내역 (2026-08-14)

### (1) 100% 동적 OpenAPI 연동 & 하드코딩 완전 제거
- 기존의 모든 정적 목업 맵(`STOCK_INFO_MAP`, `MOCK_STOCKS`)을 완전히 삭제.
- `UpbitApiClient.fetchAllMarkets()`를 통해 280여 개 전체 코인 실시간 적재.
- `MarketQuoteController`(`GET /api/v1/market/quote`)를 신설하여 어떤 종목 코드(예: `005930` 삼성전자, `000660` SK하이닉스, `035720` 카카오, `042700` 한미반도체, `KRW-BTC`, `KRW-XRP` 등)든 실시간 라이브 데이터를 즉시 반환.
- `RealtimeTickStreamer`가 조회된 종목을 스트리밍 셋에 자동 등록하여 3초 주기 WebSocket 틱 동적 전송.

### (2) 하이엔드 Nothing.tech 감성 'Single-Pane' UI/UX 리팩토링
- **스크롤 제로(Zero-Scroll) 100vh 레이아웃**: `h-screen w-screen overflow-hidden`과 `flex-1 min-h-0`의 유기적 그리드로 화면에 스크롤바가 전혀 생기지 않도록 고정.
- **Tabular Numeric 고정폭 타이포그래피**: `font-variant-numeric: tabular-nums` 및 `font-mono`를 적용하여 실시간 가격 갱신 시 숫자의 자릿수 변화로 인한 UI 흔들림(Jitter) 원천 방지.
- **마이크로 인터랙션(Micro Color Pulse)**: 실시간 가격 변동 시 부드러운 에메랄드/로즈 틴트 펄스(`flash-up`, `flash-down`) 애니메이션 적용.
- **고밀도 상단 요약 리본**: 헤더와 상단 카드를 콤팩트하게 압축하여 하단 메인 차트와 10호가창이 뷰포트의 75% 이상을 차지하도록 2:1 Bento Grid 구현.

---

## 4. 차기 작업 로드맵 (Next Action Items)

1. **메인 대시보드 3번째 탭 개편**:
   - 기존 `[공공 데이터]` 탭 ➡️ **`[실시간 종목 뉴스 & AI 분석]` (Live Market News)**으로 교체.
   - 검색/선택된 활성 종목(`한미반도체`, `카카오`, `비트코인` 등)과 직결된 최신 경제 기사, 실적 발표/공시, AI 호재·악재 태그 피드 렌더링.
2. **사이드바 메뉴에 `[공공데이터 포털 (Public Data Center)]` 독립 전용 페이지 구축**:
   - **부동산 섹션**: 국토교통부 아파트 매매 실거래가 및 한국부동산원 매매가격지수 추이.
   - **날씨 & 계절 소비 섹션**: 기상청 날씨 데이터 및 날씨 연계 소비 지표.
   - **거시경제 섹션**: 한국은행 기준금리, 생산자/소비자 물가지수(CPI).
