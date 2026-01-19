'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Hash, CheckCircle, XCircle } from 'lucide-react';
import { useTransaction } from '@/lib/hooks/useTransactions';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';
import CopyButton from '@/components/shared/CopyButton';
import { formatTimestamp, formatBTC, formatETH, isValidChain } from '@/lib/utils';
import type { Chain } from '@/types/api';

export default function TransactionPage({
  params,
}: {
  params: Promise<{ chain: string; hash: string }>;
}) {
  const { chain, hash } = use(params);

  if (!isValidChain(chain)) {
    return <ErrorMessage message="Invalid blockchain. Please select BTC or ETH." />;
  }

  const { data: tx, isLoading, error, refetch } = useTransaction(chain as Chain, hash);

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading transaction details..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={`Failed to load transaction. ${error instanceof Error ? error.message : 'Unknown error'}`}
        onRetry={() => refetch()}
      />
    );
  }

  if (!tx) {
    return <ErrorMessage message="Transaction not found" />;
  }

  const isBTC = chain === 'btc';

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
          <ArrowRight className={`h-8 w-8 ${isBTC ? 'text-blue-600' : 'text-purple-600'}`} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isBTC ? 'Bitcoin' : 'Ethereum'} Transaction
            </h1>
            <p className="text-gray-600">Transaction Details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Transaction Hash</label>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <Hash className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-mono text-gray-900 break-all flex-1">{(tx as any).txHash}</p>
              <CopyButton text={(tx as any).txHash} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Block Hash</label>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <Hash className="h-4 w-4 text-gray-400" />
              <Link
                href={`/blocks/${chain}/${(tx as any).blockHash}`}
                className="text-sm font-mono text-blue-600 hover:text-blue-700 break-all flex-1"
              >
                {(tx as any).blockHash}
              </Link>
              <CopyButton text={(tx as any).blockHash} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Block Height</label>
              <p className="text-lg font-mono text-gray-900">
                {isBTC ? (tx as any).blockHeight : (tx as any).blockNumber}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Timestamp</label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <p className="text-lg text-gray-900">{formatTimestamp((tx as any).timestamp)}</p>
              </div>
            </div>
          </div>

          {!isBTC && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-600">From</label>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-mono text-gray-900 break-all flex-1">
                    {(tx as any).fromAddress}
                  </p>
                  <CopyButton text={(tx as any).fromAddress} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">To</label>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-mono text-gray-900 break-all flex-1">
                    {(tx as any).toAddress || 'Contract Creation'}
                  </p>
                  {(tx as any).toAddress && <CopyButton text={(tx as any).toAddress} />}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Value</label>
                <p className="text-lg font-semibold text-gray-900">
                  {formatETH((tx as any).value)}
                </p>
              </div>

              {(tx as any).status !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="flex items-center gap-2">
                    {(tx as any).status === 1 ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-700 font-medium">Success</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-700 font-medium">Failed</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Gas Used</label>
                  <p className="text-lg text-gray-900">{(tx as any).gasUsed?.toLocaleString()}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Gas Price</label>
                  <p className="text-lg text-gray-900">
                    {(tx as any).gasPrice ? `${BigInt((tx as any).gasPrice) / BigInt(10 ** 9)} Gwei` : 'N/A'}
                  </p>
                </div>
              </div>
            </>
          )}

          {isBTC && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(tx as any).totalInputValue && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Input</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatBTC((tx as any).totalInputValue)}
                    </p>
                  </div>
                )}

                {(tx as any).totalOutputValue && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Output</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatBTC((tx as any).totalOutputValue)}
                    </p>
                  </div>
                )}
              </div>

              {(tx as any).fee && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Transaction Fee</label>
                  <p className="text-lg text-gray-900">{formatBTC((tx as any).fee)}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
