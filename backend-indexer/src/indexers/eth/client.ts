import { JsonRpcProvider, WebSocketProvider } from 'ethers';
import config from '../../config';
import logger from '../../config/logger';

/**
 * Ethereum Provider Client
 */
export class ETHClient {
    private provider: JsonRpcProvider | WebSocketProvider;

    constructor() {
        if (config.eth.rpcUrl.startsWith('ws')) {
            this.provider = new WebSocketProvider(config.eth.rpcUrl);
        } else {
            this.provider = new JsonRpcProvider(config.eth.rpcUrl);
        }
    }

    /**
     * Get the provider instance
     */
    getProvider(): JsonRpcProvider | WebSocketProvider {
        return this.provider;
    }

    /**
     * Get current block number
     */
    async getBlockNumber(): Promise<number> {
        return await this.provider.getBlockNumber();
    }

    /**
     * Get block with transactions
     */
    async getBlock(blockNumber: number, includeTransactions: boolean = true): Promise<any> {
        return await this.provider.getBlock(blockNumber, includeTransactions);
    }

    /**
     * Get transaction
     */
    async getTransaction(txHash: string): Promise<any> {
        return await this.provider.getTransaction(txHash);
    }

    /**
     * Get transaction receipt
     */
    async getTransactionReceipt(txHash: string): Promise<any> {
        return await this.provider.getTransactionReceipt(txHash);
    }

    /**
     * Get balance
     */
    async getBalance(address: string, blockNumber?: number): Promise<bigint> {
        if (blockNumber !== undefined) {
            return await this.provider.getBalance(address, blockNumber);
        }
        return await this.provider.getBalance(address);
    }

    /**
     * Test connection
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.getBlockNumber();
            logger.info('ETH RPC connection successful');
            return true;
        } catch (error) {
            const err = error as Error;
            logger.error('ETH RPC connection failed', { error: err.message });
            return false;
        }
    }
}

export default new ETHClient();
