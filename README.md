# Trend-Dashboard 🚀
> **실시간 금융/프롭테크 인텔리전스 & KTX/SRT 스텔스 스나이퍼 통합 대시보드**

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

---

## 📌 주요 핵심 기능 (Key Features)

### 1. 🚄 KTX/SRT 스텔스 사냥기 (Sniper Bot)
* **100% 실서버 라이브 통신 (하드코딩 & 가짜 모의데이터 영구 배제 원칙)**
  * 코레일 모바일 Dynapath 난독화 파라미터 및 암호화(AES, HMAC-SHA256) 프로토콜을 그대로 재현
  * 가짜 난수 잔여석이나 임의 성공 PNR 조작 없이, 실시간 코레일 전산망 응답을 날것 그대로 투명하게 표출
* **인간형 스마트 지터 (2.8s ~ 4.5s)**
  * 코레일 실서버의 IP 차단 및 감지 매커니즘을 회피하는 비정형 랜덤 인터벌 폴링
* **2-Step 정규 예약대기 (Waitlist) 파이프라인**
  * **1단계**: `TicketReservation` (`txtJobId: 1102`) 가신청 ➡️ 실서버 PNR 접수번호 채번
  * **2단계**: `ReservationWait` (`txtPnrNo`, `txtCpNo`, `txtSmsSndFlg: Y`) ➡️ 코레일 SMS 알림 자동 등록 및 최종 확정
* **0초 낚아채기 자동 모니터링 데몬**
  * 취소표/대기석 오픈 즉시 `reserveSeat` 또는 `reserveWaitlist` 자동 타격

---

### 2. 📈 멀티 마켓 트레이딩 & AI 인텔리전스
* **실시간 라이브 시세 스트리밍**
  * 한국투자증권(KIS) 국내 주식 및 업비트(Upbit) 280+ 가상자산 OpenAPI 연동
  * Spring WebSocket (STOMP/SockJS) 기반 3초 주기 인메모리 틱 브로드캐스팅
* **Lightweight-Charts 고성능 인터랙티브 차트**
  * 캔들스틱 / 에어리어 차트 전환 및 1분봉/5분봉/일봉/주봉 타임프레임
  * 기술적 보조지표(MA 5/20/60/120, 볼린저 밴드, RSI, 볼륨 히스토그램) 원클릭 오버레이
* **Google Gemini AI 실시간 뉴스 브리핑 & 감성 분석**
  * 최신 금융/경제 RSS 뉴스 기반 AI 3줄 요약 및 호재/악재 감성 지수(-100 ~ +100) 산출
* **포트폴리오 P&L 트래커 & 섹터 히트맵**
  * Finviz/Coin360 스타일 시가총액 트리맵 및 보유 자산 평가손익 실시간 계산기

---

### 3. 🏢 카카오맵 프롭테크 & 공공데이터 센터
* 국토교통부 아파트/오피스텔/연립다세대 실거래가 공공데이터 연동
* 안티-콜리전 지오코딩 및 마커 클러스터링
* 단지별 시세 변동 추이 Bento 모달

---

## 🏗️ 시스템 아키텍처 (Architecture)

```
[ Frontend: React 19 + TypeScript + Vite + TailwindCSS ]
    │
    ├── REST API (Axios) ──► [ Spring Boot 3.3 REST Controllers ]
    │                            ├── KorailController (조회, 예약, 예매대기)
    │                            ├── MarketDataController (주식/가상자산)
    │                            └── PropTechController (부동산 실거래가)
    │
    └── STOMP WebSocket ────► [ Spring STOMP Broker (/topic) ]
                                 ├── /topic/train-monitor (스나이퍼 실시간 이벤트)
                                 └── /topic/ticks (실시간 금융 틱 스트림)

[ Backend Engine ]
    ├── KorailClient & MonitorService (Dynapath, 암호화, 2-Step 예약대기)
    ├── GeminiAiService (뉴스 요약 및 감성 분석, 15분 캐싱)
    └── RealtimeTickStreamer & UpbitClient (실시간 시세 수집기)
```

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 스택 |
| :--- | :--- |
| **Backend** | Java 21, Spring Boot 3.3, Spring WebSocket (STOMP), Spring Data JPA, H2 Database, RestClient, Jackson, Slf4j |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lightweight-Charts, Lucide React, React-Toastify, SockJS, StompJS |
| **Data & AI** | Google Gemini REST API, 한국투자증권 OpenAPI, 업비트 OpenAPI, 국토교통부 실거래가 공공데이터, 코레일 실서버 전산망 |

---

## 🚀 시작하기 (Getting Started)

### 1. 사전 요구사항
* Java 21+
* Node.js 18+ & npm
* Git

### 2. 백엔드 실행 (Backend)
```bash
cd backend
./gradlew bootRun
# 포트 8080에서 실행 (http://localhost:8080)
```

### 3. 프론트엔드 실행 (Frontend)
```bash
cd frontend
npm install
npm run dev
# Vite 개발 서버 실행 (http://localhost:5173)
```

---

## 📄 저작권 및 라이선스
This project is developed for personal research, educational intelligence, and high-performance dashboard engineering.
