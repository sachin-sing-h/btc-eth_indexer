# Blockchain Indexer

A production-ready backend blockchain indexer for Bitcoin (BTC) and Ethereum (ETH) with REST API interface.

## Features

- **Bitcoin Indexing**
  - Block and transaction indexing
  - Address transaction history
  - Input/output tracking
  - Real-time synchronization

- **Ethereum Indexing**
  - Block and transaction indexing
  - Address transaction history
  - Wallet balance tracking
  - ERC-20 token transfer indexing
  - Real-time synchronization

- **REST API**
  - Query blocks and transactions
  - Get address transaction history
  - Get wallet balances
  - Get token transfer history
  - Pagination support

- **Production Features**
  - PostgreSQL database with proper indexing
  - Idempotent indexing (prevents duplicates)
  - Retry logic with exponential backoff
  - Comprehensive logging
  - Graceful shutdown
  - Error handling

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Database**: PostgreSQL
- **API Framework**: Express.js
- **BTC Client**: Bitcoin RPC (JSON-RPC)
- **ETH Client**: ethers.js v6
- **Logging**: Winston

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- Bitcoin RPC node (for BTC indexing) or use a public RPC provider
- Ethereum RPC endpoint (Alchemy, Infura, or similar)

## Installation

1. **Clone and install dependencies**

```bash
cd /data/block&eth_indexer
npm install
```

2. **Configure environment variables**

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blockchain_indexer
DB_USER=postgres
DB_PASSWORD=your_password

# Bitcoin RPC
BTC_RPC_URL=http://localhost:8332
BTC_RPC_USER=bitcoin
BTC_RPC_PASSWORD=your_btc_password

# Ethereum RPC
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key

# API Server
API_PORT=3000
API_HOST=0.0.0.0

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Indexer
BTC_START_BLOCK=0
ETH_START_BLOCK=0
INDEXER_POLL_INTERVAL=10000
MAX_BLOCKS_PER_BATCH=100
```

3. **Setup PostgreSQL database**

Create the database:

```bash
createdb blockchain_indexer
```

Or using psql:

```sql
CREATE DATABASE blockchain_indexer;
```

4. **Run database migrations**

```bash
npm run migrate
```

## Running the Indexer

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start the application
npm start
```

The indexer will:
1. Connect to the database
2. Start the API server on port 3000 (or configured port)
3. Begin indexing both Bitcoin and Ethereum blockchains
4. Sync from the configured start blocks to the latest block
5. Continue polling for new blocks

## API Documentation

Base URL: `http://localhost:3000/api`

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-16T12:00:00.000Z"
}
```

### Sync Status

```bash
GET /api/status
```

Response:
```json
{
  "success": true,
  "data": {
    "btc": {
      "lastIndexedBlock": 825000,
      "lastIndexedHash": "00000000000000000002...",
      "isSyncing": true,
      "lastSyncAt": "2024-01-16T12:00:00.000Z"
    },
    "eth": {
      "lastIndexedBlock": 18900000,
      "lastIndexedHash": "0x1234...",
      "isSyncing": true,
      "lastSyncAt": "2024-01-16T12:00:00.000Z"
    }
  }
}
```

### Bitcoin Endpoints

#### Get Block by Hash

```bash
GET /api/btc/blocks/:blockHash
```

Example:
```bash
curl http://localhost:3000/api/btc/blocks/00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054
```

#### Get Transaction by Hash

```bash
GET /api/btc/transactions/:txHash
```

Example:
```bash
curl http://localhost:3000/api/btc/transactions/a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d
```

#### Get Address Transactions

```bash
GET /api/btc/addresses/:address/transactions?limit=50&offset=0
```

Example:
```bash
curl "http://localhost:3000/api/btc/addresses/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/transactions?limit=10&offset=0"
```

### Ethereum Endpoints

#### Get Block by Hash

```bash
GET /api/eth/blocks/:blockHash
```

Example:
```bash
curl http://localhost:3000/api/eth/blocks/0x1234567890abcdef...
```

#### Get Transaction by Hash

```bash
GET /api/eth/transactions/:txHash
```

Example:
```bash
curl http://localhost:3000/api/eth/transactions/0xabcdef1234567890...
```

#### Get Address Transactions

```bash
GET /api/eth/addresses/:address/transactions?limit=50&offset=0
```

Example:
```bash
curl "http://localhost:3000/api/eth/addresses/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/transactions?limit=10"
```

#### Get Address Balance

```bash
GET /api/eth/addresses/:address/balance
```

Example:
```bash
curl http://localhost:3000/api/eth/addresses/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/balance
```

Response:
```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "balance": "1234567890000000000"
  }
}
```

#### Get Token Transfers

```bash
GET /api/eth/tokens/:tokenAddress/transfers?limit=50&offset=0
```

Example:
```bash
curl "http://localhost:3000/api/eth/tokens/0xdac17f958d2ee523a2206206994597c13d831ec7/transfers?limit=10"
```

### Pagination

All list endpoints support pagination:
- `limit`: Number of results (1-100, default: 50)
- `offset`: Number of results to skip (default: 0)

Response includes pagination metadata:
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 1234,
      "hasMore": true
    }
  }
}
```

## Project Structure

```
/data/block&eth_indexer/
├── src/
│   ├── api/                    # REST API layer
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/             # API routes
│   │   └── server.ts           # Express server setup
│   ├── config/                 # Configuration
│   │   ├── index.ts            # Config loader
│   │   └── logger.ts           # Winston logger
│   ├── db/                     # Database layer
│   │   ├── repositories/       # Data access layer
│   │   ├── connection.ts       # DB connection pool
│   │   └── schema.sql          # PostgreSQL schema
│   ├── indexers/               # Blockchain indexers
│   │   ├── btc/                # Bitcoin indexer
│   │   └── eth/                # Ethereum indexer
│   ├── utils/                  # Utilities
│   │   ├── errors.ts           # Custom errors
│   │   └── retry.ts            # Retry logic
│   ├── scripts/                # Scripts
│   │   └── migrate.ts          # DB migration
│   └── index.ts                # Main entry point
├── logs/                       # Log files
├── .env                        # Environment config
├── .env.example                # Environment template
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── README.md                   # This file
```

## Database Schema

The indexer uses PostgreSQL with the following main tables:

- `btc_blocks` - Bitcoin blocks
- `btc_transactions` - Bitcoin transactions
- `btc_address_transactions` - BTC address-transaction mapping
- `eth_blocks` - Ethereum blocks
- `eth_transactions` - Ethereum transactions
- `eth_balances` - Ethereum address balances
- `eth_token_transfers` - ERC-20 token transfers
- `sync_status` - Indexing progress tracking

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | blockchain_indexer |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `BTC_RPC_URL` | Bitcoin RPC endpoint | http://localhost:8332 |
| `BTC_RPC_USER` | Bitcoin RPC username | bitcoin |
| `BTC_RPC_PASSWORD` | Bitcoin RPC password | - |
| `ETH_RPC_URL` | Ethereum RPC endpoint | - |
| `API_PORT` | API server port | 3000 |
| `API_HOST` | API server host | 0.0.0.0 |
| `LOG_LEVEL` | Logging level | info |
| `BTC_START_BLOCK` | BTC starting block | 0 |
| `ETH_START_BLOCK` | ETH starting block | 0 |
| `INDEXER_POLL_INTERVAL` | Poll interval (ms) | 10000 |
| `MAX_BLOCKS_PER_BATCH` | Blocks per batch | 100 |

## Development

### Build

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start dist/index.js --name blockchain-indexer
pm2 save
pm2 startup
```

3. Configure PostgreSQL for production
4. Setup monitoring and alerting
5. Configure log rotation
6. Use a reverse proxy (nginx) for the API

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists: `createdb blockchain_indexer`

### RPC Connection Issues

**Bitcoin:**
- Verify Bitcoin node is running and RPC is enabled
- Check `bitcoin.conf` for RPC credentials
- Test connection: `bitcoin-cli getblockchaininfo`

**Ethereum:**
- Verify RPC endpoint is accessible
- Check API key is valid
- Test with: `curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' YOUR_RPC_URL`

### Slow Indexing

- Reduce `MAX_BLOCKS_PER_BATCH` for slower connections
- Increase `INDEXER_POLL_INTERVAL` to reduce load
- Check database indexes are created
- Monitor database performance

## License

MIT

## Support

For issues and questions, please check the logs in the `logs/` directory for detailed error information.
