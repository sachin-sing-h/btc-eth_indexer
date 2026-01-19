import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

/**
 * Format a blockchain address (truncate middle)
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
    if (!address) return '';
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format a transaction or block hash
 */
export function formatHash(hash: string, startChars: number = 10, endChars: number = 6): string {
    if (!hash) return '';
    if (hash.length <= startChars + endChars) return hash;
    return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format time ago
 */
export function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Format BTC amount from satoshis
 */
export function formatBTC(satoshis: number): string {
    return (satoshis / 100000000).toFixed(8) + ' BTC';
}

/**
 * Format ETH amount from wei
 */
export function formatETH(wei: string): string {
    const ethValue = BigInt(wei) / BigInt(10 ** 18);
    const remainder = BigInt(wei) % BigInt(10 ** 18);
    const decimals = remainder.toString().padStart(18, '0').slice(0, 8);
    return `${ethValue}.${decimals} ETH`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
    return num.toLocaleString();
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * Detect search input type
 */
export function detectSearchType(input: string): 'block' | 'transaction' | 'address' | 'hash' | null {
    if (!input) return null;

    // Block height (numbers only)
    if (/^\d+$/.test(input)) {
        return 'block';
    }

    // Bitcoin address (starts with 1, 3, or bc1)
    if (/^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(input)) {
        return 'address';
    }

    // Ethereum address (0x + 40 hex chars)
    if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
        return 'address';
    }


    // Bitcoin transaction hash or Block hash (64 hex chars) - Ambiguous
    if (/^[a-fA-F0-9]{64}$/.test(input)) {
        return 'hash';
    }

    // Ethereum transaction hash (0x + 64 hex chars)
    if (/^0x[a-fA-F0-9]{64}$/.test(input)) {
        return 'transaction';
    }

    return null;
}

/**
 * Validate chain input
 */
export function isValidChain(chain: string): chain is 'btc' | 'eth' {
    return chain === 'btc' || chain === 'eth';
}
