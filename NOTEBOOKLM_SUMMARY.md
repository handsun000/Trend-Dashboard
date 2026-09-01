# Trend-Dashboard 종합 개발 현황 및 차기 작업 명세서 (2026-09-01)

## 1. 프로젝트 개요 (Project Overview)
* **목표**: 한국투자증권(KIS) 국내 주식, 업비트(Upbit) 가상화폐 실시간 시세, 공공데이터(부동산/날씨/거시), 뉴스/공시 데이터를 통합 분석하는 하이엔드 단일 창(Single-Pane) 트레이딩 대시보드
* **기술 스택**:
  * **Backend**: Java 21, Spring Boot 3.3, Spring Batch, Spring WebSocket (STOMP/SockJS), Spring Data JPA, H2 Database, RestClient, Google Gemini REST API
  * **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Lightweight-Charts (TradingView), Recharts, Base UI, Lucide Icons, React-Toastify

---

## 2. 현재까지 완료된 주요 구축 현황
1. **100% 라이브 시세 데이터 파이프라인**: KIS 주식 및 Upbit 280+ 코인 실시간 OpenAPI 연동 & 3초 주기 WebSocket 틱 스트리밍
2. **카카오맵 프롭테크 & 공공데이터 센터**: 전국 국토교통부 아파트/오피스텔/연립다세대 실거래가 조회, 안티-콜리전 지오코딩 및 마커 클러스터링, 단지별 상세 Bento 모달
3. **Nothing.tech 감성 Single-Pane UI/UX**: 100vh 스크롤 제로 레이아웃, Tabular-nums 고정폭 렌더링, 실시간 가격 펄스 애니메이션

---

## 3. 차기 개발 목표: 트레이딩 & 금융 인텔리전스 (Trading & Finance AI)

### [Feature 1] TradingView / Lightweight-Charts 인터랙티브 차트 엔진 도입
- **차트 타입 토글**: 캔들스틱(Candlestick) ↔ 에어리어(Area/Line)
- **주기(Timeframe)**: 1분봉 / 5분봉 / 일봉 / 주봉
- **기술적 보조지표(Indicators) 원클릭 오버레이**:
  - MA (이동평균선): MA 5, MA 20, MA 60, MA 120
  - 볼린저 밴드 (Bollinger Bands): Upper, Middle, Lower
  - RSI (상대강도지수, 14): 서브 패널
  - 거래량(Volume) 히스토그램: 캔들과 연동된 볼륨 바
- **실시간 틱 연동**: STOMP `/topic/ticks` 수신 시 마지막 캔들 실시간 갱신(`series.update`)

### [Feature 2] Google Gemini API 기반 실시간 뉴스 요약 & 감성 분석 (Sentiment Score)
- **Gemini 1.5 Flash 무료 티어 연동**:
  - 최신 RSS 뉴스 기사 분석을 통한 **"AI 3줄 핵심 브리핑"** 생성
  - **호재/악재 감성 스코어 (-100 ~ +100)** 산출 및 호재 지수 게이지 표출
  - **관련 섹터/산업 영향도 태그** 자동 추출
- **무료 티어 보호 & 안정성 (Rate Limit & Fallback)**:
  - **15분 TTL 메모리 캐싱**으로 API 호출 최소화 및 초고속 응답
  - API Key 미설정 또는 호출 제한 시 기존 **규칙 기반 감성 사전(Fallback)**으로 자동 대체

### [Feature 3] 포트폴리오 & 손익(P&L) 시뮬레이터 & 시총 트리맵 (Heatmap)
- **Finviz / Coin360 스타일 시가총액 & 등락률 섹터 히트맵**:
  - 국내 주식 주요 섹터 및 주요 가상화폐(KRW) 시총 트리맵 시각화
  - 등락률에 따른 반응형 컬러링 및 클릭 시 해당 종목으로 즉시 대시보드 포커스
- **가상 포트폴리오 P&L 트래커**:
  - 보유 종목 등록(매수가, 수량) 시 실시간 평가손익(₩), 수익률(%), 총 평가금액 자동 계산
  - 자산 배분 비중 파이 차트 제공

---

## 4. 내일(Next Session) 즉시 착수할 작업 순서 (Action Items)
1. **Frontend**: `lightweight-charts` 패키지 설치 (`npm install lightweight-charts`)
2. **Backend**:
   - `application.yml`에 `gemini.api-key` 추가
   - `GeminiAiService` 및 DTO 구현 (Google REST API 연동, 15분 캐시, Fallback 로직)
   - `MarketNewsService`에 Gemini AI 파이프라인 통합
   - `MarketHeatmapController` (섹터/시총 트리맵 API) 신설
3. **Frontend**:
   - `LightweightTradingChart.tsx` 구현 및 지표/주기 컨트롤 연동
   - `MarketNewsPanel.tsx`에 AI 3줄 요약 & 섹터 영향도 렌더링
   - `MarketHeatmap.tsx` 및 `PortfolioTrackerModal.tsx` 구현
4. **통합 검증 & 테스트**: 차트 줌/팬 인터랙션, 뉴스 감성 분석, 히트맵 및 포트폴리오 계산 확인
