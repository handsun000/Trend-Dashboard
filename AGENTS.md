# Antigravity 에이전트 작업 지침

## 1. 기본 언어 규칙 (Language)
- 사용자와의 모든 대화, 코드 설명, 브리핑, 커밋 메시지 제안 등은 **반드시 자연스러운 한국어**로 작성한다.
- 불필요하게 영어로 답변하지 않는다.

## 2. 프로젝트 기본 정보
- 프로젝트명: Trend-Dashboard (Java 21, Spring Boot 3, React 18, Tailwind CSS)
- 목표 Notebook ID: `b7753663-82ee-48be-a993-c1293c32b686`

## 3. MCP 및 CLI 실행 규칙 (삽질 방지)
- 등록된 `notebooklm-mcp` 도구를 직접 호출하여 Notebook ID(`b7753663-82ee-48be-a993-c1293c32b686`)의 문서를 조회한다.

## 4. 작업 재개 시 규칙
- 사용자가 "작업 시작", "현황 브리핑", "이어서 하자" 등의 요청을 하면 CLI 명령어를 헤매지 말고 즉시 다음을 수행한다:
  1. NotebookLM MCP를 통해 프로젝트 명세서(System_Architecture, Backend_Logic_Spec, Frontend_UI_Spec) 확인
  2. 현재 작업 공간의 `backend/` 및 `frontend/` 코드 상태 스캔
  3. 현재까지의 구현 상태를 한국어로 3~4줄로 핵심만 요약 브리핑 후 대기