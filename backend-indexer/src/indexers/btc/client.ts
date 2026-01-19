import axios, { AxiosInstance } from 'axios';
import config from '../../config';
import logger from '../../config/logger';
import { RPCError } from '../../utils/errors';
import { retry } from '../../utils/retry';
import { BTCBlockResponse, BTCTransactionResponse } from './types';

/**
 * Bitcoin RPC Client
 */
export class BTCClient {
    private client: AxiosInstance;
    private requestId: number = 0;

    constructor() {
        this.client = axios.create({
            baseURL: config.btc.rpcUrl,
            auth: {
                username: config.btc.rpcUser,
                password: config.btc.rpcPassword,
            },
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
    }

    /**
     * Make a JSON-RPC call
     */
    private async rpcCall<T>(method: string, params: any[] = []): Promise<T> {
        return retry(
            async () => {
                try {
                    const response = await this.client.post('', {
                        jsonrpc: '1.0',
                        id: ++this.requestId,
                        method,
                        params,
                    });

                    if (response.data.error) {
                        throw new RPCError(
                            `BTC RPC error: ${response.data.error.message}`,
                            response.data.error.code
                        );
                    }

                    return response.data.result;
                } catch (error: any) {
                    if (error instanceof RPCError) {
                        throw error;
                    }

                    const message = error.response?.data?.error?.message || error.message;
                    logger.error('BTC RPC call failed', { method, error: message });
                    throw new RPCError(`BTC RPC call failed: ${message}`);
                }
            },
            {
                maxAttempts: 3,
                initialDelay: 1000,
            }
        );
    }

    /**
     * Get blockchain info
     */
    async getBlockchainInfo(): Promise<any> {
        return this.rpcCall('getblockchaininfo');
    }

    /**
     * Get best block hash
     */
    async getBestBlockHash(): Promise<string> {
        return this.rpcCall('getbestblockhash');
    }

    /**
     * Get block count
     */
    async getBlockCount(): Promise<number> {
        return this.rpcCall('getblockcount');
    }

    /**
     * Get block hash by height
     */
    async getBlockHash(height: number): Promise<string> {
        return this.rpcCall('getblockhash', [height]);
    }

    /**
     * Get block by hash
     */
    async getBlock(blockHash: string, verbosity: number = 2): Promise<BTCBlockResponse> {
        return this.rpcCall('getblock', [blockHash, verbosity]);
    }

    /**
     * Get raw transaction
     */
    async getRawTransaction(
        txHash: string,
        verbose: boolean = true,
        blockHash?: string
    ): Promise<BTCTransactionResponse> {
        const params = blockHash ? [txHash, verbose, blockHash] : [txHash, verbose];
        return this.rpcCall('getrawtransaction', params);
    }

    /**
     * Test connection
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.getBlockCount();
            logger.info('BTC RPC connection successful');
            return true;
        } catch (error) {
            const err = error as Error;
            logger.error('BTC RPC connection failed', { error: err.message });
            return false;
        }
    }
}

export default new BTCClient();
