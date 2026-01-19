import Link from 'next/link';
import { Blocks } from 'lucide-react';
import SearchBar from './SearchBar';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Blocks className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Blockchain Explorer</h1>
                <p className="text-xs text-gray-500">Bitcoin & Ethereum</p>
              </div>
            </Link>
          </div>
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
