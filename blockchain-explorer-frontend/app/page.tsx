'use client';

import { Activity, Blocks as BlocksIcon, TrendingUp } from 'lucide-react';
import StatsCard from '@/components/shared/StatsCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';
import { useSyncStatus } from '@/lib/hooks/useStatus';
import { formatNumber, formatTimeAgo } from '@/lib/utils';

export default function Home() {
  const { data: status, isLoading, error, refetch } = useSyncStatus(15000); // Poll every 15s

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading blockchain data..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load blockchain status. Please check if the backend is running."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Blockchain Explorer</h1>
        <p className="text-gray-600">
          Real-time Bitcoin and Ethereum blockchain data
        </p>
      </div>

      {/* Bitcoin Stats */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-blue-600">₿</span> Bitcoin Network
        </h2>
        {status?.btc ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="Latest Block"
              value={formatNumber(status.btc.lastIndexedBlock)}
              icon={BlocksIcon}
              color="blue"
              subtitle={status.btc.lastIndexedHash?.slice(0, 16) + '...'}
            />
            <StatsCard
              title="Sync Status"
              value={status.btc.isSyncing ? 'Syncing' : 'Synced'}
              icon={Activity}
              color={status.btc.isSyncing ? 'orange' : 'green'}
            />
            <StatsCard
              title="Last Update"
              value={status.btc.lastSyncAt ? formatTimeAgo(new Date(status.btc.lastSyncAt).getTime() / 1000) : 'Never'}
              icon={TrendingUp}
              color="blue"
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Bitcoin indexer not available</p>
          </div>
        )}
      </section>

      {/* Ethereum Stats */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-purple-600">Ξ</span> Ethereum Network
        </h2>
        {status?.eth ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="Latest Block"
              value={formatNumber(status.eth.lastIndexedBlock)}
              icon={BlocksIcon}
              color="purple"
              subtitle={status.eth.lastIndexedHash?.slice(0, 16) + '...'}
            />
            <StatsCard
              title="Sync Status"
              value={status.eth.isSyncing ? 'Syncing' : 'Synced'}
              icon={Activity}
              color={status.eth.isSyncing ? 'orange' : 'green'}
            />
            <StatsCard
              title="Last Update"
              value={status.eth.lastSyncAt ? formatTimeAgo(new Date(status.eth.lastSyncAt).getTime() / 1000) : 'Never'}
              icon={TrendingUp}
              color="purple"
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Ethereum indexer not available</p>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
        <div className="space-y-3 text-gray-600">
          <p>• Use the search bar above to explore blocks, transactions, or addresses</p>
          <p>• Select BTC or ETH to search the respective blockchain</p>
          <p>• Enter a block hash, transaction hash, or wallet address</p>
          <p>• Data updates automatically every 15 seconds</p>
        </div>
      </section>
    </div>
  );
}
