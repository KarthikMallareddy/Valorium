'use client';

import React, { useState, useEffect } from 'react';
import { useBackend } from '../hooks/useBackend';
import { Header } from '../components/Header';
import { WelcomeSection } from '../components/WelcomeSection';
import { AccountSelector } from '../components/AccountSelector';
import { WalletOverview } from '../components/WalletOverview';
import { TransferSection } from '../components/TransferSection';
import { TransactionHistory } from '../components/TransactionHistory';
import { CreateAccountModal } from '../components/CreateAccountModal';
import { Card, Button } from '../components/ui';

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

  // Modal and UI state
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [accountCreationLoading, setAccountCreationLoading] = useState(false);
  
  // Admin state
  const [userIsOwner, setUserIsOwner] = useState(false);

  // Load wallet info when authenticated
  useEffect(() => {
    if (isAuthenticated && isConnected) {
      getWalletInfo();
      getTransactionHistory();
    }
  }, [isAuthenticated, isConnected, getWalletInfo, getTransactionHistory]);

  // Check owner status when authenticated
  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (isAuthenticated) {
        const ownerStatus = await isOwner();
        setUserIsOwner(ownerStatus);
      } else {
        setUserIsOwner(false);
      }
    };
    
    checkOwnerStatus();
  }, [isAuthenticated, isOwner]);

  const handleCreateWallet = async () => {
    if (!isAuthenticated) {
      const loginSuccess = await login();
      if (!loginSuccess) return;
    }
    
    await createWallet();
  };

  const handleTransfer = async (to: string, amount: number): Promise<boolean> => {
    try {
      const success = await transfer(to, amount);
      if (success) {
        // Refresh data after successful transfer
        getWalletInfo();
        getTransactionHistory();
      }
      return success;
    } catch (error) {
      console.error('Transfer error:', error);
      return false;
    }
  };

  const handleCreateAccount = async (name: string, avatar: string) => {
    setAccountCreationLoading(true);
    try {
      const result = await createAccount(name, avatar);
      if (result.success && result.account) {
        // Switch to the newly created account
        switchDemoAccount(result.account.id);
        // Refresh wallet info
        getWalletInfo();
        getTransactionHistory();
      } else {
        throw new Error(result.message);
      }
    } finally {
      setAccountCreationLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      deleteDemoAccount(accountId);
      // Refresh data if current account was deleted
      if (currentDemoAccount?.id === accountId) {
        getWalletInfo();
        getTransactionHistory();
      }
    }
  };

  const formatBalance = (balance: bigint | number): string => {
    return typeof balance === 'bigint' ? balance.toString() : balance.toString();
  };

  const customAccounts = getCustomDemoAccounts();
  const remainingSlots = 15 - customAccounts.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        isAuthenticated={isAuthenticated}
        currentAccount={currentDemoAccount}
        balance={walletInfo ? `${formatBalance(walletInfo.balance)}` : undefined}
        onConnect={login}
        onLogout={logout}
        loading={loading}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">⚠️</span>
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        )}

        {/* Welcome Section (shown when not authenticated) */}
        <WelcomeSection
          isAuthenticated={isAuthenticated}
          loading={loading}
          onConnect={login}
        />

        {/* Authenticated Content */}
        {isAuthenticated && (
          <div className="space-y-8">
            {/* Account Selector */}
            <AccountSelector
              accounts={demoAccounts}
              currentAccount={currentDemoAccount}
              customAccounts={customAccounts}
              onSelectAccount={switchDemoAccount}
              onDeleteAccount={handleDeleteAccount}
              onCreateAccount={() => setShowCreateAccountModal(true)}
              onResetDemo={resetDemo}
            />

            {/* Wallet Overview */}
            <WalletOverview
              walletInfo={walletInfo}
              currentAccount={currentDemoAccount}
              loading={loading}
              onRefresh={() => {
                getWalletInfo();
                getTransactionHistory();
              }}
              onCreateWallet={handleCreateWallet}
            />

            {/* Transfer Section */}
            {walletInfo && (
              <TransferSection
                accounts={demoAccounts}
                currentAccount={currentDemoAccount}
                onTransfer={handleTransfer}
                loading={loading}
              />
            )}

            {/* Transaction History */}
            <TransactionHistory
              transactions={transactions}
              accounts={demoAccounts}
              currentAccount={currentDemoAccount}
              loading={loading}
            />

            {/* Admin Panel - Only show for owner */}
            {userIsOwner && (
              <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-3xl">👑</span>
                  <div>
                    <h2 className="text-xl font-semibold text-purple-900">Owner Admin Panel</h2>
                    <p className="text-purple-700">Manage the Valorium ecosystem</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <h3 className="font-medium text-gray-900 mb-2">Token Management</h3>
                    <p className="text-sm text-gray-600 mb-4">Mint or burn VAL tokens as needed</p>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline">View System Stats</Button>
                      <Button size="sm" variant="outline">Manage Supply</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border">
                    <h3 className="font-medium text-gray-900 mb-2">User Management</h3>
                    <p className="text-sm text-gray-600 mb-4">Monitor user accounts and activity</p>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline">All Transactions</Button>
                      <Button size="sm" variant="outline">Account Analytics</Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={showCreateAccountModal}
        onClose={() => setShowCreateAccountModal(false)}
        onCreateAccount={handleCreateAccount}
        remainingSlots={remainingSlots}
        loading={accountCreationLoading}
      />
    </div>
  );
}
