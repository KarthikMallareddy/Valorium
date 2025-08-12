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
    createAccount,
    deleteDemoAccount,
    getCustomDemoAccounts,
    isOwner,
    getAllTransactions,
    getSystemStats,
    mintTokens,
    burnTokens,
  } = useBackend();

  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  
  // Account creation state
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountAvatar, setNewAccountAvatar] = useState('👤');
  const [accountCreationLoading, setAccountCreationLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Force refresh when accounts change
  React.useEffect(() => {
    // This will force a re-render when accounts are created/deleted
  }, [refreshTrigger, demoAccounts.length]);

  const formatBalance = (balance: bigint) => {
    return balance.toString();
  };

  const formatPrincipal = (principal: Principal) => {
    const text = principal.toString();
    return `${text.slice(0, 5)}...${text.slice(-5)}`;
  };

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

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    
    setAccountCreationLoading(true);
    try {
      const result = await createAccount(newAccountName.trim(), newAccountAvatar);
      if (result.success) {
        setNewAccountName('');
        setNewAccountAvatar('👤');
        setShowCreateAccountModal(false);
        alert('Account created successfully!');
        // Refresh accounts and wallet info
        resetDemo();
        getWalletInfo();
        getTransactionHistory();
        // Trigger re-render
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(result.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Account creation error:', error);
      alert('Failed to create account');
    } finally {
      setAccountCreationLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert(`${label} copied to clipboard!`);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        alert('Unable to copy to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  const availableAvatars = ['👤', '🎭', '🚀', '💎', '🏆', '⭐', '🎨', '🔥', '💫', '🌟', '🎯', '💰', '🎪', '🎨', '🎬', '🎮', '🎸', '🎹', '🎺', '🎻'];

  const customAccounts = getCustomDemoAccounts();
  const remainingSlots = Math.max(0, 15 - customAccounts.length);

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800">Connecting to Backend...</h2>
          <p className="text-yellow-700">Please wait while we establish connection.</p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700 text-sm">Error: {error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Valorium Currency Dashboard</h1>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-green-600">Demo Mode: {isDemoMode ? 'ON' : 'OFF'}</span>
          
          <button
            onClick={resetDemo}
            className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            Refresh Accounts
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-3xl">🚀</span>
          <div>
            <h2 className="text-xl font-semibold text-blue-800">Welcome to Valorium Currency!</h2>
            <p className="text-blue-600">
              {isAuthenticated ? 
                "You're connected! Manage your VAL tokens below." : 
                "Connect to get started with VAL tokens"
              }
            </p>
          </div>
        </div>
        
        {!isAuthenticated ? (
          <button
            onClick={login}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="flex items-center space-x-4">
            <span className="text-green-600">✅ Connected</span>
            <button
              onClick={logout}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Demo Account Switcher */}
      {isDemoMode && isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-800">🎭 Demo Accounts</h2>
            <button
              onClick={() => setShowCreateAccountModal(true)}
              disabled={remainingSlots === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {remainingSlots === 0 ? 'Limit Reached' : `+ Create Account (${remainingSlots} left)`}
            </button>
          </div>
          <p className="text-blue-700 mb-4">
            Click on any account below to switch to it and start sending/receiving VAL tokens!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoAccounts.map((account) => (
              <div
                key={account.id}
                className={`p-4 rounded-lg border transition-all relative ${
                  currentDemoAccount?.id === account.id
                    ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                {/* Delete button for custom accounts */}
                {customAccounts.some(custom => custom.id === account.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete account "${account.name}"?`)) {
                        const result = deleteDemoAccount(account.id);
                        if (result.success) {
                          alert('Account deleted successfully!');
                          resetDemo();
                          getWalletInfo();
                          getTransactionHistory();
                          setRefreshTrigger(prev => prev + 1);
                        } else {
                          alert(result.message);
                        }
                      }
                    }}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                    title="Delete Account"
                  >
                    🗑️
                  </button>
                )}
                
                <div 
                  className="cursor-pointer"
                  onClick={() => switchDemoAccount(account.id)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{account.avatar}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{account.name}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-500">
                          {formatPrincipal(account.principal)}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(account.principal.toString(), 'Principal ID');
                          }}
                          className="text-blue-500 hover:text-blue-700 text-xs"
                          title="Copy Principal ID"
                        >
                          📋
                        </button>
                      </div>
                      <p className="text-sm font-medium text-green-600">
                        {account.initialBalance} VAL
                      </p>
                      {customAccounts.some(custom => custom.id === account.id) && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                          Custom
                        </span>
                      )}
                    </div>
                  </div>
                  {currentDemoAccount?.id === account.id && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      ✓ Currently Active
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallet Balance Card */}
      {isConnected && isAuthenticated && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Wallet</h2>
          
          {walletInfo ? (
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatBalance(walletInfo.balance)} VAL
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <p className="text-sm text-gray-500">
                  Principal: {formatPrincipal(walletInfo.user_principal)}
                </p>
                <button
                  onClick={() => copyToClipboard(walletInfo.user_principal.toString(), 'Your Principal ID')}
                  className="text-blue-500 hover:text-blue-700 text-xs"
                  title="Copy Your Principal ID"
                >
                  📋
                </button>
              </div>
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

      {/* Transfer Section */}
      {walletInfo && isAuthenticated && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Send VAL</h2>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Principal ID
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="Enter principal ID or select from accounts below..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    if (transferTo) {
                      copyToClipboard(transferTo, 'Recipient ID');
                    }
                  }}
                  disabled={!transferTo}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                  title="Copy Recipient ID"
                >
                  📋
                </button>
              </div>
              
              {/* Quick Select from Accounts */}
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Quick select recipient:</p>
                <div className="flex flex-wrap gap-2">
                  {demoAccounts
                    .filter(acc => acc.id !== currentDemoAccount?.id)
                    .map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setTransferTo(account.principal.toString())}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 flex items-center space-x-1"
                    >
                      <span>{account.avatar}</span>
                      <span>{account.name}</span>
                    </button>
                  ))}
                </div>
              </div>
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
      {isConnected && isAuthenticated && (
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

      {/* Account Creation Modal */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Account</h3>
              <button
                onClick={() => setShowCreateAccountModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Enter account name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={20}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-10 gap-2">
                  {availableAvatars.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setNewAccountAvatar(avatar)}
                      className={`text-2xl p-2 rounded-md border transition-all ${
                        newAccountAvatar === avatar
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-3">
                <p><strong>Note:</strong> New accounts start with 1000 VAL tokens for demo purposes.</p>
                <p>You can create up to {remainingSlots} more accounts.</p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={accountCreationLoading || !newAccountName.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {accountCreationLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
