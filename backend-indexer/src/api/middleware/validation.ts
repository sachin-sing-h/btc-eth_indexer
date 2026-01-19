import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../utils/errors';

/**
 * Validate pagination parameters
 */
export function validatePagination(req: Request, _res: Response, next: NextFunction): void {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
    }

    if (offset < 0) {
        throw new ValidationError('Offset must be non-negative');
    }

    // Attach validated values to request
    req.query.limit = limit.toString();
    req.query.offset = offset.toString();

    next();
}

/**
 * Validate Bitcoin address format (basic validation)
 */
export function validateBTCAddress(address: string): boolean {
    // Basic validation - starts with 1, 3, or bc1
    return /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(address);
}

/**
 * Validate Ethereum address format
 */
export function validateETHAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate Bitcoin transaction hash
 */
export function validateBTCTxHash(hash: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate Ethereum transaction hash
 */
export function validateETHTxHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate Bitcoin block hash
 */
export function validateBTCBlockHash(hash: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate Ethereum block hash
 */
export function validateETHBlockHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
}
