import { Interface } from 'ethers';
import logger from '../../config/logger';

// ERC-20 Transfer event signature
// Transfer(address indexed from, address indexed to, uint256 value)
const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// ERC-20 ABI for Transfer event
const ERC20_ABI = [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
];

const erc20Interface = new Interface(ERC20_ABI);

export interface TokenTransfer {
    tokenAddress: string;
    from: string;
    to: string;
    value: string;
    logIndex: number;
}

/**
 * Decode ERC-20 Transfer event from log
 */
export function decodeTransferEvent(log: any): TokenTransfer | null {
    try {
        // Check if this is a Transfer event
        if (log.topics.length === 0 || log.topics[0] !== ERC20_TRANSFER_TOPIC) {
            return null;
        }

        // Transfer event has 3 topics: event signature, from, to
        if (log.topics.length !== 3) {
            return null;
        }

        // Decode the event
        const decoded = erc20Interface.parseLog({
            topics: log.topics,
            data: log.data,
        });

        if (!decoded) {
            return null;
        }

        return {
            tokenAddress: log.address.toLowerCase(),
            from: decoded.args.from.toLowerCase(),
            to: decoded.args.to.toLowerCase(),
            value: decoded.args.value.toString(),
            logIndex: log.logIndex,
        };
    } catch (error) {
        const err = error as Error;
        logger.debug('Failed to decode transfer event', { error: err.message });
        return null;
    }
}

/**
 * Extract all ERC-20 transfers from transaction logs
 */
export function extractTokenTransfers(logs: any[]): TokenTransfer[] {
    const transfers: TokenTransfer[] = [];

    for (const log of logs) {
        const transfer = decodeTransferEvent(log);
        if (transfer) {
            transfers.push(transfer);
        }
    }

    return transfers;
}
