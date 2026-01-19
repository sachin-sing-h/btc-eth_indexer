// API Response Types

export interface BTCBlock {
    blockHash: string;
    blockHeight: number;
    previousBlockHash: string | null;
    timestamp: number;
    difficulty?: number;
    nonce?: number;
    merkleRoot?: string;
    transactionCount: number;
}

export interface BTCTransaction {
    txHash: string;
    blockHash: string;
    blockHeight: number;
    timestamp: number;
    size?: number;
    virtualSize?: number;
    weight?: number;
    version?: number;
    locktime?: number;
    inputs: any[];
    outputs: any[];
    totalInputValue?: number;
    totalOutputValue?: number;
    fee?: number;
}

export interface ETHBlock {
    blockHash: string;
    blockNumber: number;
    parentHash: string | null;
    timestamp: number;
    nonce?: string;
    difficulty?: string;
    totalDifficulty?: string;
    size?: number;
    gasLimit?: number;
    gasUsed?: number;
    miner?: string;
    extraData?: string;
    transactionCount: number;
}

export interface ETHTransaction {
    txHash: string;
    blockHash: string;
    blockNumber: number;
    timestamp: number;
    fromAddress: string;
    toAddress: string | null;
    value: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    gasLimit?: number;
    gasUsed?: number;
    nonce?: number;
    transactionIndex?: number;
    inputData?: string;
    status?: number;
    contractAddress?: string;
}

export interface ETHTokenTransfer {
    txHash: string;
    blockHash: string;
    blockNumber: number;
    timestamp: number;
    logIndex: number;
    tokenAddress: string;
    fromAddress: string;
    toAddress: string;
    value: string;
}

export interface AddressTransactionsResponse {
    success: boolean;
    data: {
        address: string;
        transactions: BTCTransaction[] | ETHTransaction[];
        pagination: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
        };
    };
}

export interface TokenTransfersResponse {
    success: boolean;
    data: {
        tokenAddress: string;
        transfers: ETHTokenTransfer[];
        pagination: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
        };
    };
}

export interface SyncStatus {
    success: boolean;
    data: {
        btc: {
            lastIndexedBlock: number;
            lastIndexedHash: string | null;
            isSyncing: boolean;
            lastSyncAt: string | null;
        } | null;
        eth: {
            lastIndexedBlock: number;
            lastIndexedHash: string | null;
            isSyncing: boolean;
            lastSyncAt: string | null;
        } | null;
    };
}

export type Chain = 'btc' | 'eth';
