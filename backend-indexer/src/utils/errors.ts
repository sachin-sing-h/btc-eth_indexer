/**
 * Custom error classes for better error handling
 */

export class IndexerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IndexerError';
        Error.captureStackTrace(this, this.constructor);
    }
}

export class DatabaseError extends IndexerError {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class RPCError extends IndexerError {
    public statusCode?: number;

    constructor(message: string, statusCode?: number) {
        super(message);
        this.name = 'RPCError';
        this.statusCode = statusCode;
    }
}

export class ValidationError extends IndexerError {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends IndexerError {
    constructor(resource: string) {
        super(`${resource} not found`);
        this.name = 'NotFoundError';
    }
}
