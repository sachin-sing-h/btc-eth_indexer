import { useQuery } from '@tanstack/react-query';
import { statusApi } from '../api';

export function useSyncStatus(refetchInterval?: number) {
    return useQuery({
        queryKey: ['syncStatus'],
        queryFn: () => statusApi.getSyncStatus(),
        refetchInterval: refetchInterval || false,
        staleTime: 30000,
    });
}
