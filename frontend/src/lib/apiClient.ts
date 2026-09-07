import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

/**
 * 백엔드 표준 공통 응답 스키마
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  error?: {
    errorCode: string;
    systemStatus?: 'LIVE' | 'STALE' | 'DEGRADED' | 'ERROR';
    originalError?: string;
    details?: unknown;
  };
  timestamp?: string;
}

/**
 * 전사 표준 Axios API 클라이언트
 * - /api/v1 표준 버저닝 준수
 * - 외부 API 타임아웃 및 네트워크 장애 시 투명한 에러 핸들링
 */
export const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 향후 인증 토큰 또는 글로벌 추적 헤더 주입 가능
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    let formattedMessage = '서버 통신 중 오류가 발생했습니다.';

    if (error.response?.data) {
      const apiErr = error.response.data;
      if (apiErr.message) {
        formattedMessage = apiErr.message;
      }
      if (apiErr.error?.originalError) {
        formattedMessage += ` (${apiErr.error.originalError})`;
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      formattedMessage = '외부 서비스 응답 대기 시간이 초과되었습니다 (Timeout).';
    } else if (error.message === 'Network Error') {
      formattedMessage = '네트워크 연결이 원활하지 않습니다. 서버 상태를 확인해 주세요.';
    }

    // 커스텀 에러 메시지 프로퍼티 부여
    error.message = formattedMessage;
    return Promise.reject(error);
  }
);

export default apiClient;
