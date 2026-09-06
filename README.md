# Trend-Dashboard 🚀

> **실시간 금융 · AI 인텔리전스 · 프롭테크 · 교통 데이터를 하나의 화면에서 탐색하는 통합 데이터 대시보드**

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

---

## 📌 프로젝트 소개

**Trend-Dashboard**는 금융시장, 뉴스, 부동산, 교통 데이터를 하나의 서비스에서 조회하고 분석할 수 있도록 구성한 **Full-Stack 실시간 데이터 대시보드 프로젝트**입니다.

단순히 외부 데이터를 화면에 표시하는 것을 넘어,

* 다양한 외부 API 연동
* 실시간 데이터 스트리밍
* 금융 데이터 시각화
* AI 기반 뉴스 분석
* 부동산 공공데이터 처리
* 검색 및 캐싱
* 사용자 알림
* 실시간 이벤트 전달

등 실제 데이터 서비스에서 발생할 수 있는 문제를 하나의 시스템에서 다루는 것을 목표로 합니다.

### 핵심 키워드

`Real-time Data` · `Spring Boot` · `React` · `WebSocket` · `AI` · `Financial Data` · `Public Data` · `Elasticsearch` · `Redis` · `Docker`

---

# ✨ 주요 기능

## 1. 🚄 KTX/SRT 실시간 모니터링

실제 철도 서비스와 연동하여 열차 조회 및 예약 관련 상태를 모니터링하는 기능입니다.

### 주요 기능

* 실서버 기반 열차 조회
* 좌석 상태 모니터링
* 취소표 및 대기 상태 모니터링
* 예약 / 예약대기 관련 처리
* 실시간 이벤트 WebSocket 전달
* 외부 서비스 응답을 기반으로 한 상태 표시

### 처리 흐름

```text
External Railway Service
        ↓
   KorailClient
        ↓
  MonitorService
        ↓
 Reservation / Waitlist
        ↓
 WebSocket Event
        ↓
 React Dashboard
```

> 실제 서비스 이용 시 해당 서비스의 이용약관 및 운영정책을 준수해야 합니다.

---

# 2. 📈 멀티 마켓 트레이딩

국내 주식과 가상자산 데이터를 통합하여 시장 상황을 한눈에 확인할 수 있도록 구성했습니다.

### 지원 데이터

* 한국투자증권(KIS) 국내 주식
* Upbit 가상자산
* 실시간 시세
* 거래량
* 캔들 데이터
* 기간별 가격 데이터

### 실시간 데이터 처리

Spring WebSocket(STOMP/SockJS)을 활용하여 서버에서 수집한 시장 데이터를 클라이언트로 전달합니다.

```text
KIS / Upbit
     ↓
Data Collector
     ↓
Normalization
     ↓
Realtime Tick Streamer
     ↓
Spring WebSocket
     ↓
React Dashboard
```

### 차트

`Lightweight Charts`를 사용하여 인터랙티브 금융 차트를 제공합니다.

지원 기능:

* Candlestick Chart
* Area Chart
* 1분 / 5분 / 일 / 주 단위 데이터
* MA 5 / 20 / 60 / 120
* Bollinger Bands
* RSI
* Volume

---

# 3. 🤖 AI 금융 뉴스 인텔리전스

최신 금융 및 경제 뉴스를 수집하고 Google Gemini API를 활용하여 핵심 내용을 분석합니다.

### 주요 기능

* 금융 / 경제 뉴스 수집
* RSS 기반 뉴스 처리
* 뉴스 데이터 정제
* AI 기반 뉴스 요약
* 긍정 / 부정 감성 분석
* 시장 영향도 분석
* 종목과 뉴스 데이터 연결

### 처리 파이프라인

```text
News Source
    ↓
News Collector
    ↓
Parser / Normalizer
    ↓
AI Analysis
   ↙      ↘
Summary  Sentiment
   ↘      ↙
  Market Intelligence
        ↓
    Dashboard
```

뉴스 분석 결과는 대시보드에서 활용할 수 있도록 구조화된 데이터로 변환합니다.

---

# 4. 💼 포트폴리오 & 알림

사용자가 보유 자산과 관심 종목을 관리하고 가격 변동에 따른 알림을 받을 수 있도록 구성했습니다.

### 주요 기능

* 보유 자산 관리
* 평가금액 계산
* 손익 / 수익률 계산
* 관심 종목 관리
* 가격 알림
* 실시간 알림
* WebSocket 기반 이벤트 전달

```text
Market Data
     ↓
Alert Condition
     ↓
Alert Service
     ↓
WebSocket
     ↓
React Notification
```

---

# 5. 🏢 프롭테크 & 공공데이터

국토교통부 공공데이터를 활용하여 부동산 실거래 정보를 지도 기반으로 탐색할 수 있습니다.

### 주요 기능

* 아파트 실거래가
* 오피스텔 실거래가
* 연립 / 다세대 실거래가
* 지역 기반 조회
* 위치 기반 검색
* Kakao Map 연동
* 마커 클러스터링
* 단지별 거래 정보
* 가격 변동 추이

### 처리 흐름

```text
국토교통부 공공데이터
        ↓
   Backend API
        ↓
 Data Normalization
        ↓
      REST API
        ↓
    Kakao Map
        ↓
 Interactive Dashboard
```

---

# 🏗️ 시스템 아키텍처

```text
┌────────────────────────────────────────────────────┐
│                     Frontend                       │
│                                                    │
│ React 19 + TypeScript + Vite + Tailwind CSS       │
│                                                    │
│ Dashboard / Trading / News / PropTech / Alerts    │
└───────────────────────┬────────────────────────────┘
                        │
             ┌──────────┴──────────┐
             │                     │
          REST API             WebSocket
           Axios              STOMP/SockJS
             │                     │
             ▼                     ▼
┌────────────────────────────────────────────────────┐
│                  Spring Boot                      │
│                                                    │
│ Controllers                                        │
│   ├── Market Data                                  │
│   ├── News                                         │
│   ├── Portfolio                                    │
│   ├── Alert                                        │
│   ├── PropTech                                     │
│   └── Railway                                      │
│                                                    │
│ Services                                           │
│   ├── Market Data                                  │
│   ├── News / AI                                    │
│   ├── Public Data                                  │
│   ├── Realtime Streaming                           │
│   └── Reservation / Monitoring                     │
└───────────────┬────────────────────────────────────┘
                │
        ┌───────┼───────────────┐
        │       │               │
        ▼       ▼               ▼
   PostgreSQL  Redis      Elasticsearch
        │       │               │
        └───────┴───────┬───────┘
                        │
                        ▼
              External Data Sources
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
      KIS             Upbit           Public Data
        │                                │
        ├── News / Gemini                │
        │                                │
        └──────────── Railway ───────────┘
```

---

# ⚡ REST API + WebSocket

모든 데이터를 하나의 통신 방식으로 처리하지 않고 데이터 특성에 따라 REST API와 WebSocket을 구분합니다.

### REST API

조회 및 상태 변경과 같은 Request / Response 기반 작업에 사용합니다.

```text
/api/v1/market/*
/api/v1/news/*
/api/v1/alerts/*
/api/v1/portfolio/*
/api/v1/public-data/*
/api/v1/korail/*
```

### WebSocket

실시간으로 변경되는 데이터와 이벤트를 전달합니다.

```text
/topic/ticks
/topic/alerts
/topic/train-monitor
```

---

# 🧠 데이터 처리 원칙

## 1. 실제 데이터 우선

가능한 경우 실제 외부 데이터와 API 응답을 기반으로 동작합니다.

임의의 성공 응답이나 가짜 데이터를 실제 데이터처럼 표시하지 않는 것을 원칙으로 합니다.

## 2. 장애를 숨기지 않기

외부 API가 실패했을 때 정상 데이터처럼 보이는 임의의 fallback을 생성하기보다 데이터 상태와 오류를 명확하게 전달하는 방향을 지향합니다.

```text
LIVE
STALE
DEGRADED
ERROR
```

## 3. 외부 API와 내부 도메인 분리

외부 API의 응답 형식이 내부 서비스 전체에 전파되지 않도록 Client / Service 계층에서 데이터를 변환합니다.

## 4. 실시간성과 안정성의 균형

모든 데이터를 WebSocket으로 처리하거나 모든 데이터를 Polling하는 대신 데이터 특성에 따라 적절한 통신 방식을 선택합니다.

---

# 🛠️ Tech Stack

## Backend

| Category      | Technology               |
| :------------ | :----------------------- |
| Language      | Java 21                  |
| Framework     | Spring Boot 3.3          |
| API           | Spring MVC / REST        |
| Realtime      | Spring WebSocket / STOMP |
| Persistence   | Spring Data JPA          |
| HTTP Client   | Spring RestClient        |
| Serialization | Jackson                  |
| Logging       | SLF4J                    |
| Build         | Gradle                   |

## Frontend

| Category     | Technology         |
| :----------- | :----------------- |
| Framework    | React 19           |
| Language     | TypeScript         |
| Build Tool   | Vite               |
| Styling      | Tailwind CSS       |
| HTTP Client  | Axios              |
| Chart        | Lightweight Charts |
| Realtime     | SockJS / STOMP.js  |
| Icons        | Lucide React       |
| Notification | React Toastify     |

## Data / Infrastructure

| Category        | Technology              |
| :-------------- | :---------------------- |
| Database        | PostgreSQL / H2         |
| Cache           | Redis                   |
| Search          | Elasticsearch           |
| Search Analyzer | Nori                    |
| Container       | Docker / Docker Compose |

## External Services

| Service           | Purpose           |
| :---------------- | :---------------- |
| 한국투자증권 OpenAPI    | 국내 주식 데이터         |
| Upbit OpenAPI     | 가상자산 데이터          |
| Google Gemini API | 뉴스 요약 / AI 분석     |
| Google News RSS   | 금융 / 경제 뉴스        |
| 국토교통부 공공데이터       | 부동산 실거래 데이터       |
| Kakao Maps        | 지도 / 위치 데이터       |
| Railway Service   | 열차 조회 / 예약 관련 데이터 |

---

# 📁 프로젝트 구조

```text
Trend-Dashboard/
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/trend/backend/
│   │   │   │       ├── config/
│   │   │   │       ├── batch/
│   │   │   │       ├── domain/
│   │   │   │       ├── elasticsearch/
│   │   │   │       └── search/
│   │   │   │
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   │
│   │   └── test/
│   │
│   └── build.gradle
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   └── package.json
│
├── docker-compose.yml
├── AGENTS.md
├── NOTEBOOKLM_SUMMARY.md
└── README.md
```

---

# 🚀 Getting Started

## 1. Requirements

* Java 21+
* Node.js 18+
* npm
* Git
* Docker / Docker Compose

외부 API 및 AI 기능을 사용하려면 각 서비스의 API 인증 정보가 필요합니다.

---

## 2. Infrastructure 실행

PostgreSQL, Redis, Elasticsearch 등의 인프라를 Docker Compose로 실행할 수 있습니다.

```bash
docker compose up -d
```

상태 확인:

```bash
docker compose ps
```

---

## 3. Backend 실행

```bash
cd backend
./gradlew bootRun
```

Windows:

```bash
cd backend
gradlew.bat bootRun
```

Backend:

```text
http://localhost:8080
```

---

## 4. Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🔐 Environment Variables

API Key 및 Secret은 소스 코드에 직접 저장하지 않고 환경변수 또는 별도의 개발환경 설정으로 관리합니다.

예시:

```bash
KIS_APP_KEY=your_app_key
KIS_APP_SECRET=your_app_secret

UPBIT_ACCESS_KEY=your_access_key
UPBIT_SECRET_KEY=your_secret_key

GEMINI_API_KEY=your_api_key
```

> ⚠️ 실제 API Key, Secret, Password 등의 민감정보는 Git repository에 commit하지 마세요.

---

# 🧪 Testing

외부 API 의존성이 높은 시스템인 만큼 다음 영역을 중심으로 테스트를 확장하고 있습니다.

* Domain Service Test
* Controller Test
* External API Client Test
* Data Parser Test
* News Processing Test
* WebSocket Event Test
* Database Integration Test
* External API Failure Test

특히 다음과 같은 실패 상황을 중요하게 다룹니다.

```text
External API Timeout
        ↓
     Retry / Error
        ↓
Service Failure Handling
        ↓
Meaningful API Response
        ↓
Frontend Error State
```

---

# 🔭 Roadmap

## Backend

* [ ] External API Client 계층 정리
* [ ] Service 책임 분리
* [ ] 공통 Error Response 정의
* [ ] 외부 API 장애 처리 표준화
* [ ] 비동기 작업 관리 개선
* [ ] 금융 데이터 정밀도 개선
* [ ] Integration Test 확대

## Frontend

* [ ] 대형 Dashboard Component 분리
* [ ] API Client 모듈화
* [ ] 서버 상태 관리 개선
* [ ] Loading / Empty / Error 상태 표준화
* [ ] WebSocket 재연결 처리 개선

## Infrastructure

* [ ] Development / Production 설정 분리
* [ ] PostgreSQL 기반 운영환경 통일
* [ ] Redis 활용 영역 확대
* [ ] Elasticsearch 검색 구조 개선
* [ ] Docker Production Profile
* [ ] CI/CD Pipeline

## Documentation

* [ ] API Specification
* [ ] Database ERD
* [ ] Architecture Diagram
* [ ] External API Integration Guide
* [ ] Deployment Guide

---

# 💡 프로젝트에서 해결하고자 하는 문제

Trend-Dashboard는 단순히 여러 데이터를 한 화면에 표시하는 것을 목표로 하지 않습니다.

실제 데이터 서비스를 구성할 때 발생하는 다음 문제를 하나의 프로젝트에서 경험하고 해결하는 것을 목표로 합니다.

```text
External API Integration
        +
Data Normalization
        +
Realtime Streaming
        +
Database
        +
Caching
        +
Search
        +
AI Processing
        +
Data Visualization
        +
Failure Handling
```

즉,

> **외부 데이터가 수집되고 → 가공되고 → 저장/분석되고 → 실시간으로 전달되어 → 사용자에게 의미 있는 정보로 표현되는 전체 과정을 직접 구현하는 것**

이 프로젝트의 핵심입니다.

---

# 📊 Project Status

> 🚧 **Active Development**

현재 기능 구현과 함께 아키텍처 개선, 코드 품질 개선, 테스트 및 운영환경 구성을 지속적으로 진행하고 있습니다.

---

# ⚠️ Disclaimer

본 프로젝트는 개인적인 학습, 연구 및 시스템 설계 경험을 목적으로 개발되었습니다.

금융 데이터는 투자 판단의 근거로 사용하기 위한 것이 아니며, 실제 투자 또는 거래에 대한 책임을 지지 않습니다.

외부 서비스와 공공데이터의 이용은 각 서비스 제공자의 이용약관, API 정책 및 관련 법규를 준수해야 합니다.

---

# 📄 License

This project is developed for personal research, educational purposes, and high-performance dashboard engineering.

외부 API 및 데이터의 이용은 각 서비스 제공자의 이용약관과 정책을 따릅니다.
