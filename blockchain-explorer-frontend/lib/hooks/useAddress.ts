import { useQuery } from '@tanstack/react-query';
import { btcApi, ethApi } from '../api';
import type { Chain } from '@/types/api';

export function useAddressTransactions(
    chain: Chain,
    address: string,
    limit: number = 50,
    offset: number = 0
) {
    const api = chain === 'btc' ? btcApi : ethApi;

    return useQuery({
        queryKey: ['addressTransactions', chain, address, limit, offset],
        queryFn: () => api.getAddressTransactions(address, limit, offset),
        enabled: !!address,
        staleTime: 30000,
    });
}

export function useAddressBalance(address: string) {
    return useQuery({
        queryKey: ['addressBalance', address],
        queryFn: () => ethApi.getAddressBalance(address),
        enabled: !!address,
        staleTime: 30000,
    });
}

export function useTokenTransfers(
    tokenAddress: string,
    limit: number = 50,
    offset: number = 0
) {
    return useQuery({
        queryKey: ['tokenTransfers', tokenAddress, limit, offset],
        queryFn: () => ethApi.getTokenTransfers(tokenAddress, limit, offset),
        enabled: !!tokenAddress,
        staleTime: 30000,
    });
}
