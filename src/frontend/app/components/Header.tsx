import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:text-blue-200 transition-colors">
          💎 Valorium
        </Link>
        <nav className="flex space-x-6">
          <Link href="/" className="hover:text-blue-200 transition-colors">
            Home
          </Link>
          <Link href="/dashboard" className="hover:text-blue-200 transition-colors">
            Dashboard
          </Link>
          <button className="bg-blue-700 px-4 py-2 rounded-md hover:bg-blue-800 transition-colors">
            Connect Wallet
          </button>
        </nav>
      </div>
    </header>
  );
}