import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import config from '../config';
import logger from '../config/logger';
import { errorHandler } from './middleware/errorHandler';
import btcRoutes from './routes/btc';
import ethRoutes from './routes/eth';
import statusRoutes from './routes/status';

/**
 * Create and configure Express server
 */
export function createServer(): Express {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request logging
    app.use((req: Request, _res: Response, next) => {
        logger.debug('API request', {
            method: req.method,
            path: req.path,
            query: req.query,
        });
        next();
    });

    // Health check endpoint
    app.get('/health', (_req: Request, res: Response) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API routes
    app.use('/api/btc', btcRoutes);
    app.use('/api/eth', ethRoutes);
    app.use('/api/status', statusRoutes);

    // 404 handler
    app.use((req: Request, res: Response) => {
        res.status(404).json({
            error: 'Not Found',
            message: `Route ${req.method} ${req.path} not found`,
        });
    });

    // Error handler (must be last)
    app.use(errorHandler);

    return app;
}

/**
 * Start the API server
 */
export async function startServer(): Promise<void> {
    const app = createServer();

    return new Promise((resolve) => {
        app.listen(config.api.port, config.api.host, () => {
            logger.info('API server started', {
                host: config.api.host,
                port: config.api.port,
                url: `http://${config.api.host}:${config.api.port}`,
            });
            resolve();
        });
    });
}
