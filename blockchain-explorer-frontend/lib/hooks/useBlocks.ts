import { useQuery } from '@tanstack/react-query';
import { btcApi, ethApi } from '../api';
import type { Chain } from '@/types/api';

export function useBlock(chain: Chain, blockHash: string) {
    const api = chain === 'btc' ? btcApi : ethApi;

    return useQuery<any>({
        queryKey: ['block', chain, blockHash],
        queryFn: () => api.getBlock(blockHash),
        enabled: !!blockHash,
        staleTime: Infinity, // Blocks don't change
    });
}
