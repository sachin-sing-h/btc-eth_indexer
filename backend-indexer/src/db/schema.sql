-- Database schema for blockchain indexer

-- ============================================
-- Bitcoin Tables
-- ============================================

-- Bitcoin blocks
CREATE TABLE IF NOT EXISTS btc_blocks (
    id SERIAL PRIMARY KEY,
    block_hash VARCHAR(64) UNIQUE NOT NULL,
    block_height BIGINT UNIQUE NOT NULL,
    previous_block_hash VARCHAR(64),
    timestamp BIGINT NOT NULL,
    difficulty NUMERIC,
    nonce BIGINT,
    merkle_root VARCHAR(64),
    transaction_count INTEGER DEFAULT 0,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT btc_blocks_height_check CHECK (block_height >= 0)
);

CREATE INDEX IF NOT EXISTS idx_btc_blocks_height ON btc_blocks(block_height DESC);
CREATE INDEX IF NOT EXISTS idx_btc_blocks_timestamp ON btc_blocks(timestamp DESC);

-- Bitcoin transactions
CREATE TABLE IF NOT EXISTS btc_transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(64) UNIQUE NOT NULL,
    block_hash VARCHAR(64) NOT NULL,
    block_height BIGINT NOT NULL,
    timestamp BIGINT NOT NULL,
    size INTEGER,
    virtual_size INTEGER,
    weight INTEGER,
    version INTEGER,
    locktime BIGINT,
    inputs JSONB NOT NULL,
    outputs JSONB NOT NULL,
    total_input_value BIGINT,
    total_output_value BIGINT,
    fee BIGINT,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (block_hash) REFERENCES btc_blocks(block_hash) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_btc_tx_block_hash ON btc_transactions(block_hash);
CREATE INDEX IF NOT EXISTS idx_btc_tx_block_height ON btc_transactions(block_height DESC);
CREATE INDEX IF NOT EXISTS idx_btc_tx_timestamp ON btc_transactions(timestamp DESC);

-- Bitcoin address index (for quick lookups)
CREATE TABLE IF NOT EXISTS btc_address_transactions (
    id SERIAL PRIMARY KEY,
    address VARCHAR(64) NOT NULL,
    tx_hash VARCHAR(64) NOT NULL,
    block_height BIGINT NOT NULL,
    is_input BOOLEAN NOT NULL,
    amount BIGINT NOT NULL,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tx_hash) REFERENCES btc_transactions(tx_hash) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_btc_addr_tx_address ON btc_address_transactions(address, block_height DESC);
CREATE INDEX IF NOT EXISTS idx_btc_addr_tx_hash ON btc_address_transactions(tx_hash);

-- ============================================
-- Ethereum Tables
-- ============================================

-- Ethereum blocks
CREATE TABLE IF NOT EXISTS eth_blocks (
    id SERIAL PRIMARY KEY,
    block_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT UNIQUE NOT NULL,
    parent_hash VARCHAR(66),
    timestamp BIGINT NOT NULL,
    nonce VARCHAR(18),
    difficulty NUMERIC,
    total_difficulty NUMERIC,
    size INTEGER,
    gas_limit BIGINT,
    gas_used BIGINT,
    miner VARCHAR(42),
    extra_data TEXT,
    transaction_count INTEGER DEFAULT 0,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT eth_blocks_number_check CHECK (block_number >= 0)
);

CREATE INDEX IF NOT EXISTS idx_eth_blocks_number ON eth_blocks(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_eth_blocks_timestamp ON eth_blocks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_eth_blocks_miner ON eth_blocks(miner);

-- Ethereum transactions
CREATE TABLE IF NOT EXISTS eth_transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp BIGINT NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    value VARCHAR(78) NOT NULL,
    gas_price VARCHAR(78),
    max_fee_per_gas VARCHAR(78),
    max_priority_fee_per_gas VARCHAR(78),
    gas_limit BIGINT,
    gas_used BIGINT,
    nonce BIGINT,
    transaction_index INTEGER,
    input_data TEXT,
    status INTEGER,
    contract_address VARCHAR(42),
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (block_hash) REFERENCES eth_blocks(block_hash) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_eth_tx_block_hash ON eth_transactions(block_hash);
CREATE INDEX IF NOT EXISTS idx_eth_tx_block_number ON eth_transactions(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_eth_tx_from ON eth_transactions(from_address, block_number DESC);
CREATE INDEX IF NOT EXISTS idx_eth_tx_to ON eth_transactions(to_address, block_number DESC);
CREATE INDEX IF NOT EXISTS idx_eth_tx_timestamp ON eth_transactions(timestamp DESC);

-- Ethereum address balances (snapshot at each block)
CREATE TABLE IF NOT EXISTS eth_balances (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL,
    block_number BIGINT NOT NULL,
    balance VARCHAR(78) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(address, block_number)
);

CREATE INDEX IF NOT EXISTS idx_eth_balances_address ON eth_balances(address, block_number DESC);

-- ERC-20 token transfers
CREATE TABLE IF NOT EXISTS eth_token_transfers (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp BIGINT NOT NULL,
    log_index INTEGER NOT NULL,
    token_address VARCHAR(42) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value VARCHAR(78) NOT NULL,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tx_hash) REFERENCES eth_transactions(tx_hash) ON DELETE CASCADE,
    UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_eth_token_transfers_token ON eth_token_transfers(token_address, block_number DESC);
CREATE INDEX IF NOT EXISTS idx_eth_token_transfers_from ON eth_token_transfers(from_address, block_number DESC);
CREATE INDEX IF NOT EXISTS idx_eth_token_transfers_to ON eth_token_transfers(to_address, block_number DESC);
CREATE INDEX IF NOT EXISTS idx_eth_token_transfers_block ON eth_token_transfers(block_number DESC);

-- ============================================
-- Sync Status Table
-- ============================================

CREATE TABLE IF NOT EXISTS sync_status (
    id SERIAL PRIMARY KEY,
    chain VARCHAR(10) UNIQUE NOT NULL,
    last_indexed_block BIGINT NOT NULL DEFAULT 0,
    last_indexed_hash VARCHAR(66),
    is_syncing BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial sync status for both chains
INSERT INTO sync_status (chain, last_indexed_block) 
VALUES ('BTC', 0), ('ETH', 0)
ON CONFLICT (chain) DO NOTHING;

-- ============================================
-- Functions and Triggers
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sync_status_updated_at BEFORE UPDATE ON sync_status
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
