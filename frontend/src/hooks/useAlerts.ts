import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

export interface UserAlert {
  id: number;
  userId: string;
  ticker: string;
  targetPrice: number;
  isActive: boolean;
  [key: string]: any;
}

export function useAlerts(userId: string = 'user1') {
  const queryClient = useQueryClient();

  // 1. 알림 목록 조회 (Stale-While-Revalidate 자동 캐싱)
  const {
    data: alerts = [],
    isLoading,
    error,
    refetch: refetchAlerts,
  } = useQuery<UserAlert[]>({
    queryKey: ['alerts', userId],
    queryFn: async () => {
      const res = await axios.get<UserAlert[]>(`/api/v1/alerts?userId=${encodeURIComponent(userId)}`);
      return res.data;
    },
    staleTime: 1000 * 30, // 30초간 신선한 데이터로 간주
  });

  // 2. 알림 삭제 뮤테이션 (자동 캐시 무효화)
  const deleteAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/v1/alerts/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.info('알림 감시 규칙이 삭제되었습니다.', { theme: 'dark' });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (err: any) => {
      console.error('Failed to delete alert:', err);
      toast.error('알림 삭제 실패', { theme: 'dark' });
    },
  });

  // 3. 알림 추가 후 자동 무효화 헬퍼
  const invalidateAlerts = () => {
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  };

  return {
    alerts,
    isLoading,
    error,
    refetchAlerts,
    deleteAlert: (id: number) => deleteAlertMutation.mutate(id),
    isDeleting: deleteAlertMutation.isPending,
    invalidateAlerts,
  };
}

export default useAlerts;
