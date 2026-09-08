import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2분 동안 데이터를 신선한 것으로 간주 (불필요한 네트워크 재호출 방지)
      gcTime: 1000 * 60 * 10, // 10분 동안 메모리에 캐시 보존
      refetchOnWindowFocus: true, // 사용자가 다른 창에서 돌아오면 백그라운드 최신화
      refetchOnReconnect: true, // 네트워크 재연결 시 자동 갱신
      retry: 1, // 실패 시 1회 자동 재시도
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;
