'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Hash, Layers } from 'lucide-react';
import { useBlock } from '@/lib/hooks/useBlocks';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';
import CopyButton from '@/components/shared/CopyButton';
import { formatTimestamp, formatNumber, isValidChain } from '@/lib/utils';
import type { Chain } from '@/types/api';

export default function BlockPage({
  params,
}: {
  params: Promise<{ chain: string; hash: string }>;
}) {
  const { chain, hash } = use(params);

  if (!isValidChain(chain)) {
    return <ErrorMessage message="Invalid blockchain. Please select BTC or ETH." />;
  }

  const { data: block, isLoading, error, refetch } = useBlock(chain as Chain, hash);

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading block details..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={`Failed to load block. ${error instanceof Error ? error.message : 'Unknown error'}`}
        onRetry={() => refetch()}
      />
    );
  }

  if (!block) {
    return <ErrorMessage message="Block not found" />;
  }

  const isBTC = chain === 'btc';
  const blockHeight = isBTC ? (block as any).blockHeight : (block as any).blockNumber;
  const blockHash = isBTC ? (block as any).blockHash : (block as any).blockHash;

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Layers className={`h-8 w-8 ${isBTC ? 'text-blue-600' : 'text-purple-600'}`} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isBTC ? 'Bitcoin' : 'Ethereum'} Block
            </h1>
            <p className="text-gray-600">Block #{formatNumber(blockHeight)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Block Height</label>
              <p className="text-lg font-mono text-gray-900">{formatNumber(blockHeight)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Timestamp</label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <p className="text-lg text-gray-900">{formatTimestamp((block as any).timestamp)}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Block Hash</label>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <Hash className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-mono text-gray-900 break-all flex-1">{blockHash}</p>
              <CopyButton text={blockHash} />
            </div>
          </div>

          {isBTC && (block as any).previousBlockHash && (
            <div>
              <label className="text-sm font-medium text-gray-600">Previous Block Hash</label>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <Hash className="h-4 w-4 text-gray-400" />
                <Link
                  href={`/blocks/btc/${(block as any).previousBlockHash}`}
                  className="text-sm font-mono text-blue-600 hover:text-blue-700 break-all flex-1"
                >
                  {(block as any).previousBlockHash}
                </Link>
                <CopyButton text={(block as any).previousBlockHash} />
              </div>
            </div>
          )}

          {!isBTC && (block as any).parentHash && (
            <div>
              <label className="text-sm font-medium text-gray-600">Parent Hash</label>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <Hash className="h-4 w-4 text-gray-400" />
                <Link
                  href={`/blocks/eth/${(block as any).parentHash}`}
                  className="text-sm font-mono text-blue-600 hover:text-blue-700 break-all flex-1"
                >
                  {(block as any).parentHash}
                </Link>
                <CopyButton text={(block as any).parentHash} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Transaction Count</label>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber((block as any).transactionCount)}
              </p>
            </div>

            {isBTC && (block as any).difficulty && (
              <div>
                <label className="text-sm font-medium text-gray-600">Difficulty</label>
                <p className="text-lg text-gray-900">{(block as any).difficulty.toExponential(2)}</p>
              </div>
            )}

            {!isBTC && (block as any).gasUsed && (
              <div>
                <label className="text-sm font-medium text-gray-600">Gas Used</label>
                <p className="text-lg text-gray-900">
                  {formatNumber((block as any).gasUsed)} / {formatNumber((block as any).gasLimit || 0)}
                </p>
              </div>
            )}
          </div>

          {!isBTC && (block as any).miner && (
            <div>
              <label className="text-sm font-medium text-gray-600">Miner</label>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-mono text-gray-900 break-all flex-1">
                  {(block as any).miner}
                </p>
                <CopyButton text={(block as any).miner} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
