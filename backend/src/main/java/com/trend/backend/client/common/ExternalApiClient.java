package com.trend.backend.client.common;

/**
 * 외부 시스템(증권, 가상자산, 공공데이터, 코레일, AI 등) 통신 클라이언트 표준 인터페이스
 */
public interface ExternalApiClient {

    /**
     * 외부 제공자 식별 명칭 (예: KIS, UPBIT, MOLIT, KMA, KORAIL, GEMINI)
     */
    String getProviderName();

    /**
     * 필수 인증키/자격증명 설정 여부
     */
    boolean isConfigured();

    /**
     * 실시간 연동 상태 및 헬스 체크
     */
    ExternalApiHealth checkHealth();
}
