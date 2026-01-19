export interface BTCBlockResponse {
    hash: string;
    height: number;
    previousblockhash?: string;
    time: number;
    difficulty: number;
    nonce: number;
    merkleroot: string;
    tx: string[] | BTCTransactionResponse[];
    size?: number;
    weight?: number;
}

export interface BTCTransactionResponse {
    txid: string;
    hash: string;
    version: number;
    size: number;
    vsize: number;
    weight: number;
    locktime: number;
    vin: BTCInput[];
    vout: BTCOutput[];
    time?: number;
    blocktime?: number;
    blockhash?: string;
}

export interface BTCInput {
    txid?: string;
    vout?: number;
    scriptSig?: {
        asm: string;
        hex: string;
    };
    sequence: number;
    coinbase?: string;
    txinwitness?: string[];
}

export interface BTCOutput {
    value: number;
    n: number;
    scriptPubKey: {
        asm: string;
        hex: string;
        type: string;
        address?: string;
        addresses?: string[];
    };
}
