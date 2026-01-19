import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import { ValidationError, NotFoundError, RPCError, DatabaseError } from '../../utils/errors';

/**
 * Global error handler middleware
 */
export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    logger.error('API error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
    });

    // Handle specific error types
    if (error instanceof ValidationError) {
        res.status(400).json({
            error: 'Validation Error',
            message: error.message,
        });
        return;
    }

    if (error instanceof NotFoundError) {
        res.status(404).json({
            error: 'Not Found',
            message: error.message,
        });
        return;
    }

    if (error instanceof RPCError) {
        res.status(502).json({
            error: 'RPC Error',
            message: 'Blockchain RPC service unavailable',
        });
        return;
    }

    if (error instanceof DatabaseError) {
        res.status(500).json({
            error: 'Database Error',
            message: 'Internal database error',
        });
        return;
    }

    // Default error response
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
    });
}
