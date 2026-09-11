# Trend-Dashboard 🚀

> **실시간 금융 트레이딩 · AI 뉴스 인텔리전스 · 프롭테크 실거래가 · 코레일(KTX/SRT) 스텔스 사냥기를 아우르는 All-in-One 데이터 플랫폼**

[![Java](https://img.shields.io/badge/Java-21-orange.svg?style=flat-square&logo=openjdk)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-purple.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-ff4154.svg?style=flat-square&logo=reactquery)](https://tanstack.com/query)
[![TradingView](https://img.shields.io/badge/TradingView-Lightweight_Charts-black.svg?style=flat-square)](https://tradingview.github.io/lightweight-charts/)

---

## 📌 목차 (Table of Contents)
1. [프로젝트 소개](#-프로젝트-소개)
2. [사전 준비 요구사항](#-사전-준비-요구사항-prerequisites)
3. [초고속 3분 원클릭 실행 가이드 (Quick Start)](#-초고속-3분-원클릭-실행-가이드-quick-start)
4. [환경 설정(.env) 파일 완벽 가이드](#-환경-설정env-파일-완벽-가이드)
5. [시스템 접속 포트 및 주요 URL](#-시스템-접속-포트-및-주요-url)
6. [핵심 기능 안내](#-핵심-기능-안내)
7. [자주 묻는 질문 및 트러블슈팅 (FAQ)](#-자주-묻는-질문-및-트러블슈팅-faq)
8. [프로젝트 구조 및 기술 아키텍처](#-프로젝트-구조-및-기술-아키텍처)
9. [라이선스 및 면책 조항](#-면책-조항-disclaimer)

---

## 💡 프로젝트 소개

**Trend-Dashboard**는 분산되어 있는 다양한 실시간 데이터(주식, 가상자산, 공공데이터, 철도 예매, AI 뉴스 분석)를 단일 웹 애플리케이션에서 완벽하게 조망하고 자동화하기 위해 설계된 **Full-Stack 고성능 대시보드**입니다.

* **🚅 코레일(KTX/SRT) 스텔스 사냥기**: WAF 차단 0%의 단일 쿼리 기반 3~5대 동시 감시(Single-Win) 및 취소표/예매대기 0초 즉시 선점 + 텔레그램 스마트폰 긴급 푸시.
* **📈 멀티 마켓 트레이딩 룸**: KIS 국내 주식과 Upbit 코인 시세를 Spring WebSocket(STOMP) 1초 스트리밍으로 수신하며 TradingView 인터랙티브 차트 및 실시간 호가창 제공.
* **🤖 AI 금융 뉴스 인텔리전스**: 실시간 RSS 뉴스를 Google Gemini 1.5 Flash AI가 자동 요약하고 호재/악재 감성 점수를 분석하여 매매 인사이트 도출.
* **🏢 프롭테크 실거래가 허브**: 국토교통부 아파트/오피스텔 매매 실거래가와 기상청 날씨를 카카오맵 클러스터링과 TanStack Query 캐시로 0초 렌더링.
* **🌌 시네마틱 에디토리얼 쿠튀르 (Numa Lookbook)**: 단순 슬라이드 쇼를 배제한 자석 캡슐 클라우드 조립(Magnetic Assembly)과 60fps 무지연 100vh Single-Pane 인터랙션.

---

## 💻 사전 준비 요구사항 (Prerequisites)

프로젝트 실행을 위해 컴퓨터에 다음 도구들이 설치되어 있어야 합니다:

| 요구 도구 | 권장 버전 | 확인 명령어 | 다운로드 링크 |
| :--- | :--- | :--- | :--- |
| **Java JDK** | **21 LTS** | `java -version` | [Oracle JDK 21](https://www.oracle.com/java/technologies/downloads/#java21) 또는 [Azul Zulu 21](https://www.azul.com/downloads/?version=java-21-lts) |
| **Node.js** | **18.x ~ 22.x** | `node -v` | [Node.js 공식 홈페이지](https://nodejs.org/) |
| **Python** | **3.10 ~ 3.12** | `python --version` | [Python 공식 홈페이지](https://www.python.org/) *(코레일 모바일 암호화 브릿지 구동용)* |
| **Git** | 최신 버전 | `git --version` | [Git 공식 홈페이지](https://git-scm.com/) |
| **Docker** *(선택)* | 최신 버전 | `docker -v` | [Docker Desktop](https://www.docker.com/) *(운영 배포 또는 DB 직접 실행 시)* |

> [!NOTE]
> 로컬 개발 모드 실행 시 백엔드에 **경량 인메모리 데이터베이스(H2)**가 기본 내장되어 있어, 별도의 PostgreSQL이나 Docker 없이도 소스 코드 복제 즉시 바로 실행할 수 있습니다.

---

## 🚀 초고속 3분 원클릭 실행 가이드 (Quick Start)

처음 프로젝트를 클론받은 분도 아래 순서대로 터미널에 붙여넣기만 하면 바로 실행할 수 있습니다.

### 1단계: 저장소 클론 (Clone)
```bash
git clone https://github.com/handsun000/Trend-Dashboard.git
cd Trend-Dashboard
```

---

### 2단계: 필수 환경 설정 파일 2개 배치 (복사)

프로젝트에는 예시 템플릿 파일이 이미 준비되어 있습니다. 아래 명령어로 복사합니다.

#### Windows (PowerShell):
```powershell
# 1. 백엔드 시크릿 설정 복사
Copy-Item backend/src/main/resources/application-secret.yml.example backend/src/main/resources/application-secret.yml

# 2. 프론트엔드 환경변수 복사
Copy-Item frontend/.env.example frontend/.env
```

#### Mac / Linux (Bash):
```bash
# 1. 백엔드 시크릿 설정 복사
cp backend/src/main/resources/application-secret.yml.example backend/src/main/resources/application-secret.yml

# 2. 프론트엔드 환경변수 복사
cp frontend/.env.example frontend/.env
```

> [!TIP]
> **API 키가 아직 없으신가요?**  
> 파일만 복사해 두면 기본 더미 값으로도 백엔드/프론트엔드가 에러 없이 즉시 실행되며, 업비트 가상자산 시세, 차트, UI 등은 키 없이도 100% 정상 작동합니다! (추후 필요한 키만 입력하시면 됩니다.)

---

### 3단계: 파이썬 의존성 설치 (코레일 브릿지용)
코레일 실서버 패킷 암호화 엔진에 필요한 2개 라이브러리를 설치합니다.
```bash
pip install -r backend/requirements.txt
```
*(또는 `pip install requests cryptography`)*

---

### 4단계: 백엔드(Spring Boot) 실행

새 터미널 창을 열고 프로젝트 루트에서 다음 명령을 실행합니다:

#### Windows:
```powershell
cd backend
.\gradlew.bat bootRun
```

#### Mac / Linux:
```bash
cd backend
./gradlew bootRun
```

> **백엔드 기동 완료 기준**:  
> 로그 마지막에 `Started BackendApplication in X.XXX seconds` 및 `HikariPool` 연결 완료가 출력되면 정상 기동된 것입니다. (`http://localhost:18080`)

---

### 5단계: 프론트엔드(React + Vite) 실행

또 다른 새 터미널 창을 열고 프론트엔드를 실행합니다:

```bash
cd frontend
npm install
npm run dev
```

> **프론트엔드 기동 완료 기준**:  
> `➜ Local: http://localhost:15173/` 안내가 출력됩니다.

---

### 6단계: 브라우저 접속 🎉
브라우저를 열고 다음 주소로 접속합니다!
* **통합 대시보드 및 랜딩 룩북**: [`http://localhost:15173`](http://localhost:15173)
* **코레일 스텔스 사냥기**: [`http://localhost:15173/train-monitor`](http://localhost:15173/train-monitor)

---

## 🔑 환경 설정(.env) 파일 완벽 가이드

프로젝트 구동에 필요한 설정 파일의 정확한 위치와 작성 방법입니다.

### 1. 백엔드 비공개 설정
* **파일 위치**: [`backend/src/main/resources/application-secret.yml`](file:///c:/dev/IdeaProjects/Trend-Dashboard/backend/src/main/resources/application-secret.yml)
* **템플릿 파일**: `backend/src/main/resources/application-secret.yml.example`

```yaml
# 1. 한국투자증권(KIS) OpenAPI (국내 주식 실시간 시세/차트)
# 발급: https://apiportal.koreainvestment.com (모의계좌 무료 발급)
kis:
  open-api:
    app-key: "YOUR_KIS_APP_KEY"
    app-secret: "YOUR_KIS_APP_SECRET"
    domain: "https://openapivts.koreainvestment.com:29443" # 모의투자 도메인

# 2. 공공데이터포털 (국토부 아파트/오피스텔 실거래가 및 기상청 날씨)
# 발급: https://www.data.go.kr (일반 인증키 - Encoding 또는 Decoding)
public-data:
  service-key: "YOUR_DATA_GO_KR_SERVICE_KEY"

# 3. Google Gemini 1.5 Flash (AI 금융 뉴스 요약 및 감성 분석)
# 발급: https://aistudio.google.com/app/apikey (무료 발급)
gemini:
  api-key: "YOUR_GEMINI_API_KEY"

# 4. 코레일 모바일 세션 (원클릭 자동 로그인 및 SMS 알림용)
korail:
  member-no: "YOUR_KORAIL_MEMBER_NO"  # 코레일 멤버십 번호 10자리
  password: "YOUR_KORAIL_PASSWORD"   # 코레일 비밀번호
  phone-no: "01012345678"            # 예매대기 안내받을 휴대폰 번호

# 5. 스마트폰 텔레그램 알림 봇 (취소표/예매대기 선점 즉시 스마트폰 푸시)
# 발급: 텔레그램 검색창에 @BotFather 검색 -> /newbot 으로 봇 생성 후 토큰 수신
# 내 Chat ID 확인: 텔레그램 @userinfobot 검색 후 대화 시작
telegram:
  bot-token: "YOUR_TELEGRAM_BOT_TOKEN"
  chat-id: "YOUR_TELEGRAM_CHAT_ID"
  enabled: true
```

---

### 2. 프론트엔드 환경변수
* **파일 위치**: [`frontend/.env`](file:///c:/dev/IdeaProjects/Trend-Dashboard/frontend/.env)
* **템플릿 파일**: `frontend/.env.example`

```ini
# 1. 백엔드 API & WebSocket 프록시 (로컬 개발 시 비워두면 Vite 프록시가 18080으로 자동 연결)
VITE_API_BASE_URL=
VITE_WS_URL=/ws

# 2. 카카오맵 JavaScript 앱 키 (프롭테크 국토부 실거래가 지도 연동용)
# 발급 방법 (1분 소요):
# 1) https://developers.kakao.com 로그인
# 2) [내 애플리케이션] -> [애플리케이션 추가하기]
# 3) [앱 키] 메뉴 중 'JavaScript 키'를 복사하여 아래에 입력
# 4) [플랫폼] -> [Web] 메뉴로 이동하여 사이트 도메인에 'http://localhost:15173' 등록 필수!
VITE_KAKAO_MAP_APP_KEY=your_kakao_javascript_key_here
```

---

### 3. Docker 프로덕션 원클릭 오케스트레이션 (선택 사항)
PostgreSQL, Redis, Elasticsearch(nori 한국어 형태소 분석기 포함), 백엔드, 프론트엔드(Nginx)를 한 번에 컨테이너로 배포할 때 사용합니다.

```bash
# 1. 프로덕션 환경변수 복사
cp .env.docker.example .env.docker

# 2. 풀스택 컨테이너 일괄 빌드 및 기동
docker compose -f docker-compose.prod.yml up -d --build

# 3. 컨테이너 헬스체크 상태 확인
docker compose -f docker-compose.prod.yml ps
```

---

## 🌐 시스템 접속 포트 및 주요 URL

| 서비스 | URL | 설명 |
| :--- | :--- | :--- |
| **웹 대시보드 (Frontend)** | [`http://localhost:15173`](http://localhost:15173) | 통합 트레이딩룸, AI 뉴스, 프롭테크, 스크롤리텔링 |
| **코레일 스텔스 사냥기** | [`http://localhost:15173/train-monitor`](http://localhost:15173/train-monitor) | 실시간 열차 다중 사냥 레이더 및 예매 통제소 |
| **백엔드 REST API** | [`http://localhost:18080/api/v1`](http://localhost:18080/api/v1) | v1 표준화된 REST API 루트 엔드포인트 |
| **실시간 WebSocket STOMP** | `ws://localhost:18080/ws` | 1초 틱 스트리밍, 목표가 알림, 사냥 이벤트 브로드캐스트 |
| **외부 API 헬스체크 진단** | [`http://localhost:18080/api/v1/system/external-apis`](http://localhost:18080/api/v1/system/external-apis) | KIS, Upbit, Gemini, Korail, Telegram 서킷브레이커 상태 관측 |
| **H2 인메모리 DB 콘솔** | [`http://localhost:18080/h2-console`](http://localhost:18080/h2-console) | JDBC URL: `jdbc:h2:mem:trend_db` (ID: `sa`, PW: 공란) |

---

## 🎯 핵심 기능 안내

### 1. 🚄 KTX/SRT 스텔스 멀티 사냥기 (Korail Sniper)
* **WAF 방어 스마트 배치 스캔 (Single-Flight Multi-Target)**:
  - 여러 열차를 감시할 때 스레드를 여러 개 띄우지 않고, **1회의 코레일 시간표 조회(10건 반환) 안에서 선택된 3~5대 열차를 메모리 상에서 동시 대조(WAF 트래픽 1x 유지)**합니다.
* **Single-Win 원칙 & Failover**:
  - 선택한 열차 중 어느 하나라도 취소석(즉시예약) 또는 예매대기 자리가 발생하면 **즉시 0초 타격으로 선점 후 사냥을 안전 자동 종료**하여 계정 제재 및 중복 예약을 원천 차단합니다.
  - 1순위 열차 경합 실패 시 동일 루프 내 차순위 열차를 즉시 백업 타격합니다.
* **100vh Single-Pane 탭 분리 UI**:
  - `[01 / 전체 열차 검색]`: 다중 선택 체크박스와 하단 플로팅 마스터 사냥 바 제공.
  - `[02 / 사냥 레이더]`: 선택된 열차들만 고밀도로 집중 조망하는 전용 트레이딩 뷰.
* **스마트폰 텔레그램 긴급 푸시**:
  - 선점 즉시 PNR 예약 번호, 열차 정보, 결제 기한을 스마트폰으로 자동 전송.

### 2. 📈 실시간 멀티 마켓 트레이딩룸
* 국내 주식(한국투자증권)과 암호화폐(Upbit)를 단일 인터페이스에서 1초 틱 단위 실시간 동기화.
* TradingView Lightweight-Charts 인터랙티브 캔들 차트 (이동평균선, 볼린저밴드, RSI, 거래량).
* 숫자 떨림 방지 고정폭(`tabular-nums`) 및 가격 변동 시 미세 펄스 애니메이션(`.flash-up`, `.flash-down`).

### 3. 🤖 Google Gemini 1.5 Flash AI 금융 뉴스 분석
* 최신 금융 RSS 뉴스를 실시간 파싱하고 Gemini AI가 3줄 핵심 요약.
* 뉴스 본문의 호재/악재 감성 스코어링(0~100%) 및 관련 종목 자동 맵핑.

### 4. 🏢 국토교통부 실거래가 프롭테크 지도
* 전국 아파트/오피스텔/연립다세대 실거래가 공공데이터 시각화.
* 카카오맵 기반 마커 클러스터링 및 단지별 매매가 추이 그래프.
* TanStack Query v5 기반 스마트 캐싱으로 시군구 전환 시 0초 무지연 렌더링.

---

## ❓ 자주 묻는 질문 및 트러블슈팅 (FAQ)

### Q1. `Port 18080 is already in use` 오류가 발생합니다.
> **해결 방법**: 이전에 실행했던 백엔드 프로세스가 남아있을 때 발생합니다.
> * **Windows (PowerShell)**:
>   ```powershell
>   Get-Process -Id (Get-NetTCPConnection -LocalPort 18080).OwningProcess | Stop-Process -Force
>   ```
> * **Mac / Linux**:
>   ```bash
>   kill -9 $(lsof -t -i:18080)
>   ```

### Q2. 카카오 지도가 화면에 나오지 않고 하얗게 보입니다.
> **해결 방법**: `VITE_KAKAO_MAP_APP_KEY`를 넣었음에도 지도가 나오지 않는다면, [카카오 개발자 콘솔](https://developers.kakao.com) ➡️ **[내 애플리케이션] ➡️ [플랫폼] ➡️ [Web]**에 사이트 도메인 `http://localhost:15173`을 등록했는지 확인하세요.

### Q3. 파이썬 `ModuleNotFoundError: No module named 'cryptography'` 오류가 납니다.
> **해결 방법**: 코레일 실서버 암호화 브릿지 모듈에 필요한 파이썬 패키지가 설치되지 않은 경우입니다.
> 터미널에서 `pip install requests cryptography`를 실행하세요.

### Q4. 모든 API 키를 다 발급받아야만 실행할 수 있나요?
> **답변**: **아닙니다!** 키 없이도 기본 인메모리 DB로 서버와 프론트엔드가 즉시 뜹니다.
> * 업비트 가상자산 시세, 실시간 차트, 스크롤리텔링 UI는 **키 발급 없이 100% 동작**합니다.
> * 코레일 스텔스 사냥기는 화면 우측 상단 `[코레일 계정 연결]` 모달에서 본인 계정으로 직접 로그인하여 즉시 사용할 수 있습니다.
> * 주식 시세, AI 뉴스 분석, 카카오 지도는 각각 필요할 때 키를 `application-secret.yml`과 `frontend/.env`에 추가하시면 됩니다.

---

## 🏛️ 프로젝트 구조 및 기술 아키텍처

```text
Trend-Dashboard/
├── backend/                              # Spring Boot 3.3.5 백엔드
│   ├── src/main/java/com/trend/backend/
│   │   ├── client/                       # 외부 API 통합 클라이언트 (KIS, Upbit, Gemini, Telegram 등)
│   │   │   ├── config/                   # Resilience4j 서킷브레이커 & RestClient 타임아웃
│   │   │   └── telegram/                 # 스마트폰 푸시 알림 클라이언트
│   │   ├── domain/                       # 핵심 비즈니스 도메인 (코레일 사냥기, 주식, 코인, 부동산)
│   │   │   └── korail/                   # 스텔스 단일 쿼리 배치 모니터링 엔진
│   │   └── config/common/                # GlobalExceptionHandler, ErrorCode, ApiResponse 표준
│   └── src/main/resources/
│       ├── application.yml               # 기본 설정 및 서킷브레이커 파라미터
│       ├── application-dev.yml           # 로컬 개발 환경 (H2 DB)
│       ├── application-secret.yml.example# [중요] API 키 템플릿
│       └── korail_bridge.py              # 코레일 모바일 암호화 브릿지 (Python Engine)
│
├── frontend/                             # React 19 + TypeScript + Vite 프론트엔드
│   ├── src/
│   │   ├── components/korail/            # 열차 검색, 사냥 레이더 뷰, 성공 모달
│   │   ├── components/common/            # LoadingState, EmptyState, ErrorBoundary
│   │   ├── contexts/                     # WebSocketContext (STOMP 단일 멀티플렉싱 & 지수 백오프)
│   │   ├── pages/                        # TrainMonitorPage, Dashboard, HomeScrollytelling
│   │   └── types/                        # DTO 타입 정의 (korail.ts 등)
│   ├── .env.example                      # [중요] 프론트엔드 환경변수 템플릿
│   └── vite.config.ts                    # Vite 빌드 설정 및 18080 백엔드 리버스 프록시
│
├── docker-compose.yml                    # 로컬 인프라 실행용 (Postgres, Redis, ES)
├── docker-compose.prod.yml               # 운영환경 1-Click 풀스택 오케스트레이션
├── AGENTS.md                             # AI 에이전트 인수인계 및 절대 원칙 지침서
└── NOTEBOOKLM_SUMMARY.md                 # NotebookLM 소스 동기화용 종합 명세서
```

---

## ⚖️ 면책 조항 (Disclaimer)

* 본 프로젝트는 개인 연구, 소프트웨어 엔지니어링 학습 및 실시간 시스템 아키텍처 연구 목적으로 제작되었습니다.
* 제공되는 모든 금융 및 투자 데이터는 정보 제공 목적이며, 실제 투자 권유나 거래 체결의 책임을 지지 않습니다.
* 코레일 및 외부 서비스 연동 시 각 제공사의 운영정책과 이용약관을 준수해야 하며, 시스템 남용으로 인한 책임은 사용자 본인에게 있습니다.

---

<div align="center">
  <sub>Built with high-density engineering & cinematic aesthetics.</sub>
</div>
