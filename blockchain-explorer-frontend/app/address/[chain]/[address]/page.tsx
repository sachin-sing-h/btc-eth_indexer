'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, ArrowUpRight, Clock } from 'lucide-react';
import { useAddressTransactions, useAddressBalance } from '@/lib/hooks/useAddress';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';
import CopyButton from '@/components/shared/CopyButton';
import Pagination from '@/components/shared/Pagination';
import {
  formatAddress,
  formatHash,
  formatTimestamp,
  formatBTC,
  formatETH,
  isValidChain,
} from '@/lib/utils';
import type { Chain } from '@/types/api';

export default function AddressPage({
  params,
}: {
  params: Promise<{ chain: string; address: string }>;
}) {
  const { chain, address } = use(params);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (!isValidChain(chain)) {
    return <ErrorMessage message="Invalid blockchain. Please select BTC or ETH." />;
  }

  const {
    data: txData,
    isLoading: txLoading,
    error: txError,
    refetch: refetchTx,
  } = useAddressTransactions(
    chain as Chain,
    address,
    itemsPerPage,
    (currentPage - 1) * itemsPerPage
  );

  const {
    data: balanceData,
    isLoading: balanceLoading,
  } = useAddressBalance(chain === 'eth' ? address : '');

  const isBTC = chain === 'btc';

  if (txLoading && currentPage === 1) {
    return <LoadingSpinner size="lg" text="Loading address details..." />;
  }

  if (txError) {
    return (
      <ErrorMessage
        message={`Failed to load address data. ${txError instanceof Error ? txError.message : 'Unknown error'}`}
        onRetry={() => refetchTx()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Address Header */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className={`h-8 w-8 ${isBTC ? 'text-blue-600' : 'text-purple-600'}`} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isBTC ? 'Bitcoin' : 'Ethereum'} Address
            </h1>
            <p className="text-gray-600">Wallet Details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Address</label>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-mono text-gray-900 break-all flex-1">{address}</p>
              <CopyButton text={address} />
            </div>
          </div>

          {!isBTC && balanceData && (
            <div>
              <label className="text-sm font-medium text-gray-600">Balance</label>
              <p className="text-2xl font-bold text-gray-900">
                {formatETH(balanceData.balance)}
              </p>
            </div>
          )}

          {txData && (
            <div>
              <label className="text-sm font-medium text-gray-600">Total Transactions</label>
              <p className="text-lg font-semibold text-gray-900">
                {txData.pagination.total.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
        </div>

        {txLoading ? (
          <div className="p-6">
            <LoadingSpinner text="Loading transactions..." />
          </div>
        ) : txData && txData.transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Block
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    {!isBTC && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          From
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {txData.transactions.map((tx: any) => (
                    <tr key={tx.txHash} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/transactions/${chain}/${tx.txHash}`}
                          className="text-blue-600 hover:text-blue-700 font-mono text-sm"
                        >
                          {formatHash(tx.txHash)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/blocks/${chain}/${tx.blockHash}`}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          {isBTC ? tx.blockHeight : tx.blockNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {formatTimestamp(tx.timestamp)}
                        </div>
                      </td>
                      {!isBTC && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-gray-900">
                              {formatAddress(tx.fromAddress)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <ArrowUpRight className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-mono text-gray-900">
                                {tx.toAddress ? formatAddress(tx.toAddress) : 'Contract'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatETH(tx.value)}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={txData.pagination.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="p-6 text-center text-gray-500">No transactions found</div>
        )}
      </div>
    </div>
  );
}
