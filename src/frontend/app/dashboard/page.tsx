'use client';

import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Example function to create wallet
  const createWallet = async () => {
    setLoading(true);
    try {
      // This will connect to your backend canister
      console.log('Creating wallet...');
      // Add actual backend integration here
      setBalance(100); // Mock initial balance
    } catch (error) {
      console.error('Error creating wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-blue-600">Valorium Currency Dashboard</h1>
      
      {/* Wallet Balance Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Wallet</h2>
        <div className="text-3xl font-bold text-green-600 mb-4">
          {balance} VAL
        </div>
        <button 
          onClick={createWallet}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Wallet'}
        </button>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx, index) => (
              <div key={index} className="border-b py-2">
                <p>Transaction {index + 1}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}