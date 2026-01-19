import { useQuery } from '@tanstack/react-query';
import { btcApi, ethApi } from '../api';
import type { Chain } from '@/types/api';

export function useTransaction(chain: Chain, txHash: string) {
    const api = chain === 'btc' ? btcApi : ethApi;

    return useQuery<any>({
        queryKey: ['transaction', chain, txHash],
        queryFn: () => api.getTransaction(txHash),
        enabled: !!txHash,
        staleTime: Infinity, // Transactions don't change
    });
}
