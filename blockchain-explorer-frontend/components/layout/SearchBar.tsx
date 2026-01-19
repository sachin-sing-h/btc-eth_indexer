'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { detectSearchType } from '@/lib/utils';
import { btcApi, ethApi } from '@/lib/api';
import type { Chain } from '@/types/api';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [chain, setChain] = useState<Chain>('btc');
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const type = detectSearchType(query.trim());
    
    if (!type) {
      alert('Invalid input. Please enter a valid block hash, transaction hash, or address.');
      return;
    }

    if (type === 'hash') {
      // Disambiguate between block and transaction hash
      // Try block first
      try {
        const api = chain === 'btc' ? btcApi : ethApi;
        await api.getBlock(query.trim());
        router.push(`/blocks/${chain}/${query.trim()}`);
      } catch (error) {
        // If block fetch fails, assume it's a transaction
        router.push(`/transactions/${chain}/${query.trim()}`);
      }
      setQuery('');
      return;
    }

    switch (type) {
      case 'block':
        router.push(`/blocks/${chain}/${query.trim()}`);
        break;
      case 'transaction':
        router.push(`/transactions/${chain}/${query.trim()}`);
        break;
      case 'address':
        router.push(`/address/${chain}/${query.trim()}`);
        break;
    }

    setQuery('');
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 w-full max-w-3xl">
      <div className="flex gap-2 flex-1">
        <select
          value={chain}
          onChange={(e) => setChain(e.target.value as Chain)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="btc">BTC</option>
          <option value="eth">ETH</option>
        </select>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by block hash, tx hash, or address..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <Search className="h-4 w-4" />
        Search
      </button>
    </form>
  );
}
