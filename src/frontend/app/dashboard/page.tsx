'use client';

import React, { useState, useEffect } from 'react';
import { useBackend } from '../hooks/useBackend';
import { Principal } from '@dfinity/principal';

export default function Dashboard() {
  const {
    isConnected,
    isAuthenticated,
    walletInfo,
    transactions,
    loading,
    error,
    isDemoMode,
    currentDemoAccount,
    demoAccounts,
    login,
    logout,
    createWallet,
    getWalletInfo,
    transfer,
    getTransactionHistory,
    switchDemoAccount,
    resetDemo,
    toggleDemoMode,
    isOwner,
    getAllTransactions,
    getSystemStats,
    mintTokens,
    burnTokens,
  } = useBackend();

  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  
  // Admin state
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Load wallet info when authenticated
  useEffect(() => {
    if (isAuthenticated && isConnected) {
      getWalletInfo();
      getTransactionHistory();
    }
  }, [isAuthenticated, isConnected, getWalletInfo, getTransactionHistory]);

  const handleCreateWallet = async () => {
    if (!isAuthenticated) {
      const loginSuccess = await login();
      if (!loginSuccess) return;
    }
    
    await createWallet();
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTo || !transferAmount) return;
    
    setTransferLoading(true);
    try {
      const success = await transfer(transferTo, parseInt(transferAmount));
      if (success) {
        setTransferTo('');
        setTransferAmount('');
        alert('Transfer successful!');
      }
    } finally {
      setTransferLoading(false);
    }
  };

  const formatBalance = (balance: bigint) => {
    return balance.toString();
  };

  const formatPrincipal = (principal: Principal) => {
    const text = principal.toString();
    return `${text.slice(0, 5)}...${text.slice(-5)}`;
  };

  // Admin functions
  const loadSystemStats = async () => {
    setAdminLoading(true);
    try {
      const stats = await getSystemStats();
      setSystemStats(stats);
    } finally {
      setAdminLoading(false);
    }
  };

  const loadAllTransactions = async () => {
    setAdminLoading(true);
    try {
      const txs = await getAllTransactions();
      setAllTransactions(txs);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleMintTokens = async () => {
    if (!mintAmount || isNaN(Number(mintAmount))) return;
    
    setAdminLoading(true);
    try {
      const result = await mintTokens(Number(mintAmount));
      if (result.success) {
        setMintAmount('');
        await loadSystemStats();
      }
      alert(result.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleBurnTokens = async () => {
    if (!burnAmount || isNaN(Number(burnAmount))) return;
    
    setAdminLoading(true);
    try {
      const result = await burnTokens(Number(burnAmount));
      if (result.success) {
        setBurnAmount('');
        await loadSystemStats();
      }
      alert(result.message);
    } finally {
      setAdminLoading(false);
    }
  };

  // Load admin data when authenticated as owner
  useEffect(() => {
    if (isAuthenticated && isOwner()) {
      loadSystemStats();
    }
  }, [isAuthenticated]);

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800">Connecting to Backend...</h2>
          <p className="text-yellow-700">Please wait while we establish connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Valorium Currency Dashboard</h1>
        
        {/* Demo Mode Toggle */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isDemoMode}
              onChange={toggleDemoMode}
              className="rounded"
            />
            <span className="text-sm">Demo Mode</span>
          </label>
          
          {isDemoMode && (
            <button
              onClick={resetDemo}
              className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              Reset Demo
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Demo Account Switcher */}
      {isDemoMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">🎭 Demo Accounts</h2>
          <p className="text-blue-700 mb-4">
            Switch between demo accounts to test transfers and see different wallet balances!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoAccounts.map((account) => (
              <div
                key={account.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  currentDemoAccount?.id === account.id
                    ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => switchDemoAccount(account.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{account.avatar}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{account.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatPrincipal(account.principal)}
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      {account.initialBalance} VAL
                    </p>
                  </div>
                </div>
                {currentDemoAccount?.id === account.id && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    ✓ Currently Active
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Authentication Section */}
      {!isAuthenticated ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {isDemoMode ? 'Select Demo Account' : 'Connect Your Internet Identity'}
          </h2>
          <p className="text-gray-600 mb-4">
            {isDemoMode 
              ? 'Choose a demo account above to start using Valorium Currency!' 
              : 'To use Valorium Currency, you need to authenticate with Internet Identity.'
            }
          </p>
          <button 
            onClick={login}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Connecting...' : isDemoMode ? 'Use Demo Account' : 'Connect Internet Identity'}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <p className="text-green-700">
                ✅ {isDemoMode ? `Connected as ${currentDemoAccount?.name}` : 'Connected to Internet Identity'}
              </p>
              {isDemoMode && currentDemoAccount && (
                <span className="text-2xl">{currentDemoAccount.avatar}</span>
              )}
            </div>
            <button 
              onClick={logout}
              className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              {isDemoMode ? 'Switch Account' : 'Logout'}
            </button>
          </div>
        </div>
      )}

      {/* Owner Admin Panel */}
      {isAuthenticated && isOwner() && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-3xl">👑</span>
            <div>
              <h2 className="text-xl font-semibold text-purple-800">Owner Admin Panel</h2>
              <p className="text-purple-600">System administration and token management</p>
            </div>
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {systemStats && (
              <>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{systemStats.totalSupply.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Supply</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{systemStats.totalAccounts}</p>
                  <p className="text-sm text-gray-600">Total Accounts</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{systemStats.totalTransactions}</p>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{systemStats.ownerBalance.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Owner Balance</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{systemStats.circulatingSupply.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Circulating Supply</p>
                </div>
              </>
            )}
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Mint Tokens */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-green-700 mb-3">💰 Mint Tokens</h3>
              <div className="space-y-2">
                <input
                  type="number"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  placeholder="Amount to mint"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <button
                  onClick={handleMintTokens}
                  disabled={adminLoading || !mintAmount}
                  className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {adminLoading ? 'Minting...' : 'Mint Tokens'}
                </button>
              </div>
            </div>

            {/* Burn Tokens */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-red-700 mb-3">🔥 Burn Tokens</h3>
              <div className="space-y-2">
                <input
                  type="number"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  placeholder="Amount to burn"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <button
                  onClick={handleBurnTokens}
                  disabled={adminLoading || !burnAmount}
                  className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {adminLoading ? 'Burning...' : 'Burn Tokens'}
                </button>
              </div>
            </div>

            {/* System Actions */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-blue-700 mb-3">⚙️ System Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={loadSystemStats}
                  disabled={adminLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {adminLoading ? 'Loading...' : 'Refresh Stats'}
                </button>
                <button
                  onClick={loadAllTransactions}
                  disabled={adminLoading}
                  className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {adminLoading ? 'Loading...' : 'View All Transactions'}
                </button>
              </div>
            </div>
          </div>

          {/* All Transactions View */}
          {allTransactions.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-4">📊 All System Transactions ({allTransactions.length})</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {allTransactions.map((tx, index) => {
                  const fromAccount = demoAccounts.find(acc => acc.principal.toString() === tx.from.toString());
                  const toAccount = demoAccounts.find(acc => acc.principal.toString() === tx.to.toString());
                  
                  return (
                    <div key={index} className="border-b pb-2 last:border-b-0">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                          {fromAccount && <span>{fromAccount.avatar}</span>}
                          <span className="font-medium">
                            {fromAccount ? fromAccount.name : formatPrincipal(tx.from)}
                          </span>
                          <span>→</span>
                          {toAccount && <span>{toAccount.avatar}</span>}
                          <span className="font-medium">
                            {toAccount ? toAccount.name : formatPrincipal(tx.to)}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{formatBalance(tx.amount)} VAL</p>
                          <p className="text-xs text-gray-500">
                            {new Date(Number(tx.timestamp) / 1000000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wallet Balance Card */}
      {isAuthenticated && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Wallet</h2>
          
          {walletInfo ? (
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatBalance(walletInfo.balance)} VAL
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Principal: {formatPrincipal(walletInfo.user_principal)}
              </p>
              <button 
                onClick={getWalletInfo}
                disabled={loading}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Balance'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">No wallet found. Create one to get started!</p>
              <button 
                onClick={handleCreateWallet}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Wallet'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Transfer to Demo Accounts */}
      {isAuthenticated && walletInfo && isDemoMode && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Transfer to Demo Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoAccounts
              .filter(account => account.id !== currentDemoAccount?.id)
              .map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{account.avatar}</span>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-gray-500">{formatPrincipal(account.principal)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTransferTo(account.principal.toString())}
                    className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-200"
                  >
                    Select
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Transfer Section */}
      {isAuthenticated && walletInfo && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Send VAL</h2>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Principal ID
              </label>
              <input
                type="text"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="Enter principal ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (VAL)
              </label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Enter amount..."
                min="1"
                max={formatBalance(walletInfo.balance)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={transferLoading || !transferTo || !transferAmount}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {transferLoading ? 'Sending...' : 'Send VAL'}
            </button>
          </form>
        </div>
      )}

      {/* Transaction History */}
      {isAuthenticated && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Transaction History</h2>
            <button 
              onClick={getTransactionHistory}
              disabled={loading}
              className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, index) => {
                const isOutgoing = walletInfo && tx.from.toString() === walletInfo.user_principal.toString();
                const otherParty = isOutgoing ? tx.to : tx.from;
                const otherAccount = isDemoMode ? demoAccounts.find(acc => acc.principal.toString() === otherParty.toString()) : null;
                
                return (
                  <div key={index} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        {otherAccount && <span className="text-lg">{otherAccount.avatar}</span>}
                        <div>
                          <p className="font-medium">
                            {isOutgoing ? '📤 Sent' : '📥 Received'} {formatBalance(tx.amount)} VAL
                          </p>
                          <p className="text-sm text-gray-500">
                            {isOutgoing ? 'To: ' : 'From: '}
                            {otherAccount ? otherAccount.name : formatPrincipal(otherParty)}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(Number(tx.timestamp) / 1000000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}