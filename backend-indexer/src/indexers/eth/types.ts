export interface ETHBlockData {
    hash: string;
    number: number;
    parentHash: string;
    timestamp: number;
    nonce: string;
    difficulty: bigint;
    gasLimit: bigint;
    gasUsed: bigint;
    miner: string;
    extraData: string;
    transactions: string[];
}

export interface ETHTransactionData {
    hash: string;
    blockHash: string;
    blockNumber: number;
    from: string;
    to: string | null;
    value: bigint;
    gasPrice: bigint | null;
    maxFeePerGas: bigint | null;
    maxPriorityFeePerGas: bigint | null;
    gasLimit: bigint;
    nonce: number;
    data: string;
    chainId: bigint | null;
}

export interface ETHTransactionReceipt {
    transactionHash: string;
    blockHash: string;
    blockNumber: number;
    from: string;
    to: string | null;
    gasUsed: bigint;
    status: number | null;
    contractAddress: string | null;
    logs: ETHLog[];
}

export interface ETHLog {
    address: string;
    topics: string[];
    data: string;
    blockNumber: number;
    transactionHash: string;
    transactionIndex: number;
    blockHash: string;
    logIndex: number;
    removed: boolean;
}
