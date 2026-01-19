import axios from 'axios';
import type {
    BTCBlock,
    BTCTransaction,
    ETHBlock,
    ETHTransaction,
    AddressTransactionsResponse,
    TokenTransfersResponse,
    SyncStatus,
    Chain,
} from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
});

// Bitcoin API
export const btcApi = {
    getBlock: async (blockHash: string): Promise<BTCBlock> => {
        const { data } = await api.get(`/btc/blocks/${blockHash}`);
        return data.data;
    },

    getTransaction: async (txHash: string): Promise<BTCTransaction> => {
        const { data } = await api.get(`/btc/transactions/${txHash}`);
        return data.data;
    },

    getAddressTransactions: async (
        address: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<AddressTransactionsResponse['data']> => {
        const { data } = await api.get(`/btc/addresses/${address}/transactions`, {
            params: { limit, offset },
        });
        return data.data;
    },
};

// Ethereum API
export const ethApi = {
    getBlock: async (blockHash: string): Promise<ETHBlock> => {
        const { data } = await api.get(`/eth/blocks/${blockHash}`);
        return data.data;
    },

    getTransaction: async (txHash: string): Promise<ETHTransaction> => {
        const { data } = await api.get(`/eth/transactions/${txHash}`);
        return data.data;
    },

    getAddressTransactions: async (
        address: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<AddressTransactionsResponse['data']> => {
        const { data } = await api.get(`/eth/addresses/${address}/transactions`, {
            params: { limit, offset },
        });
        return data.data;
    },

    getAddressBalance: async (address: string): Promise<{ address: string; balance: string }> => {
        const { data } = await api.get(`/eth/addresses/${address}/balance`);
        return data.data;
    },

    getTokenTransfers: async (
        tokenAddress: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<TokenTransfersResponse['data']> => {
        const { data } = await api.get(`/eth/tokens/${tokenAddress}/transfers`, {
            params: { limit, offset },
        });
        return data.data;
    },
};

// Status API
export const statusApi = {
    getSyncStatus: async (): Promise<SyncStatus['data']> => {
        const { data } = await api.get('/status');
        return data.data;
    },
};

// Helper function to get API based on chain
export const getChainApi = (chain: Chain) => {
    return chain === 'btc' ? btcApi : ethApi;
};

export default api;
