# Trend-Dashboard 종합 개발 현황 및 명세서 (2026-09-04)

## 1. 프로젝트 개요 (Project Overview)
* **목표**: 
  1. 한국투자증권(KIS) 국내 주식, 업비트(Upbit) 가상화폐 실시간 시세, 공공데이터(부동산/날씨/거시), Gemini AI 금융 인텔리전스를 통합 분석하는 하이엔드 단일 창(Single-Pane) 트레이딩 대시보드
  2. 코레일(KTX/SRT) 실서버 100% 라이브 연동 기반의 스텔스 스나이퍼(취소표 감시 및 2단계 예매대기 자동 접수) 시스템
* **기술 스택**:
  * **Backend**: Java 21, Spring Boot 3.3, Spring WebSocket (STOMP/SockJS), Spring Data JPA, H2 Database, RestClient, Google Gemini REST API
  * **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Lightweight-Charts (TradingView), Lucide Icons, React-Toastify

---

## 2. 완료된 주요 구축 현황

### [모듈 1] 코레일(KTX/SRT) 스텔스 사냥기 (Sniper Bot)
1. **100% 실서버 라이브 통신 (하드코딩 & 가짜 모의데이터 영구 금지 원칙 준수)**:
   - 가짜 잔여석/대기자 수 날조, 가짜 PNR 발급 일체 배제
   - 코레일 모바일 Dynapath 난독화 파라미터 및 암호화(AES, HMAC-SHA256) 프로토콜을 그대로 재현
   - 오류 발생 시 실서버 메시지(`h_msg_txt`, `errCode`)를 날것 그대로 투명하게 화면 표출
2. **2-Step 정규 예약대기 (Waitlist) 파이프라인**:
   - **1단계**: `TicketReservation` (`txtJobId: 1102`) 가신청 ➡️ 코레일 실서버 PNR 접수번호 발급
   - **2단계**: `ReservationWait` (`txtPnrNo`, `txtCpNo`, `txtSmsSndFlg: Y`) ➡️ 코레일 SMS 알림 자동 등록 및 최종 확정
3. **인간형 스마트 지터 (2.8s ~ 4.5s)**:
   - 비정형 랜덤 인터벌 폴링을 통한 탐지 회피
   - 잔여석/취소표/대기석 오픈 즉시 0초 타격

### [모듈 2] 실시간 멀티 마켓 트레이딩 & AI 인텔리전스
1. **실시간 시세 파이프라인**: KIS 주식 및 Upbit 280+ 코인 실시간 OpenAPI 연동 & 3초 주기 WebSocket 틱 스트리밍
2. **Lightweight-Charts 인터랙티브 차트**: 캔들스틱/에어리어, 1분/5분/일봉/주봉, 기술적 보조지표(MA, BB, RSI, Volume)
3. **Gemini AI 뉴스 감성 분석**: 금융 RSS 뉴스 3줄 요약 및 호재/악재 감성 스코어링(-100 ~ +100), 15분 캐싱
4. **포트폴리오 P&L & 섹터 히트맵**: Finviz/Coin360 스타일 시총 트리맵 및 가상 포트폴리오 손익 계산

### [모듈 3] 카카오맵 프롭테크 & 홈 스크롤리텔링
1. **공공데이터 부동산 센터**: 국토교통부 아파트/오피스텔/연립다세대 실거래가 지오코딩 및 마커 클러스터링
2. **풀스크린 시네마틱 에디토리얼 & 핀 스크롤리텔링**: Bento 인텔리전스 허브 레이아웃

---

## 3. 차기 작업 계획 (Next Action Items)
1. **예약대기 실사용 UX 고도화**:
   - 이미 마감된 열차에 대해서도 '대기 모니터링(WAIT_ONLY)'을 원클릭으로 가동할 수 있는 UI 진입점 강화
   - 실시간 세션 만료 시 원클릭 재인증 및 Hot 세션 유지 강화
2. **배포 및 통합 테스트**: 실시간 시세 및 코레일 라이브 모니터링 종합 E2E 동작 검증
