'use client';

import { useState, useEffect, useCallback } from 'react';
import { backendService, WalletInfo, Transaction, Result } from '../services/backend';
import { DemoAccount } from '../services/demoAccounts';

export interface UseBackendReturn {
  // State
  isConnected: boolean;
  isAuthenticated: boolean;
  walletInfo: WalletInfo | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
  currentDemoAccount: DemoAccount | null;
  demoAccounts: DemoAccount[];

  // Actions
  connect: () => Promise<void>;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  createWallet: () => Promise<boolean>;
  getWalletInfo: () => Promise<void>;
  transfer: (to: string, amount: number) => Promise<boolean>;
  getTransactionHistory: () => Promise<void>;
  
  // Demo actions
  switchDemoAccount: (accountId: string) => void;
  resetDemo: () => void;
  toggleDemoMode: () => void;
}

export function useBackend(): UseBackendReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(backendService.isDemoMode());
  const [currentDemoAccount, setCurrentDemoAccount] = useState<DemoAccount | null>(null);
  const [demoAccounts] = useState<DemoAccount[]>(backendService.getDemoAccounts());

  // Initialize connection
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await backendService.init();
      setIsConnected(success);
      
      if (success && isDemoMode) {
        // In demo mode, check if we have a current account
        const currentAccount = backendService.getCurrentDemoAccount();
        setCurrentDemoAccount(currentAccount);
        setIsAuthenticated(currentAccount !== null);
      } else if (success) {
        const authStatus = await backendService.isAuthenticated();
        setIsAuthenticated(authStatus);
      }
    } catch (err) {
      setError('Failed to connect to backend');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  // Login function
  const login = useCallback(async (): Promise<boolean> => {
    if (isDemoMode) {
      // In demo mode, just select first account if none selected
      if (!currentDemoAccount) {
        const firstAccount = backendService.switchDemoAccount('1');
        if (firstAccount) {
          setCurrentDemoAccount(firstAccount);
          setIsAuthenticated(true);
          return true;
        }
      }
      return true;
    }

    setLoading(true);
    setError(null);
    
    try {
      const success = await backendService.login();
      setIsAuthenticated(success);
      return success;
    } catch (err) {
      setError('Failed to login');
      console.error('Login error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, currentDemoAccount]);

  // Logout function
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await backendService.logout();
      setIsAuthenticated(false);
      setWalletInfo(null);
      setTransactions([]);
      setCurrentDemoAccount(null);
    } catch (err) {
      setError('Failed to logout');
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create wallet
  const createWallet = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await backendService.createWallet();
      
      if ('Ok' in result) {
        setWalletInfo(result.Ok);
        return true;
      } else {
        setError(result.Err);
        return false;
      }
    } catch (err) {
      setError('Failed to create wallet');
      console.error('Create wallet error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get wallet info
  const getWalletInfo = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await backendService.getWalletInfo();
      
      if ('Ok' in result) {
        setWalletInfo(result.Ok);
      } else {
        setError(result.Err);
      }
    } catch (err) {
      setError('Failed to get wallet info');
      console.error('Get wallet info error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Transfer function
  const transfer = useCallback(async (to: string, amount: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await backendService.transfer(to, amount);
      
      if ('Ok' in result) {
        // Refresh wallet info and transaction history
        await getWalletInfo();
        await getTransactionHistory();
        return true;
      } else {
        setError(result.Err);
        return false;
      }
    } catch (err) {
      setError('Failed to transfer');
      console.error('Transfer error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [getWalletInfo]);

  // Get transaction history
  const getTransactionHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const history = await backendService.getTransactionHistory();
      setTransactions(history);
    } catch (err) {
      console.error('Get transaction history error:', err);
    }
  }, [isAuthenticated]);

  // Demo-specific functions
  const switchDemoAccount = useCallback((accountId: string) => {
    if (!isDemoMode) return;
    
    const account = backendService.switchDemoAccount(accountId);
    setCurrentDemoAccount(account);
    setIsAuthenticated(account !== null);
    
    if (account) {
      // Immediately refresh wallet info and transactions for new account
      getWalletInfo();
      getTransactionHistory();
    } else {
      setWalletInfo(null);
      setTransactions([]);
    }
  }, [isDemoMode, getWalletInfo, getTransactionHistory]);

  const resetDemo = useCallback(() => {
    if (!isDemoMode) return;
    
    backendService.resetDemo();
    // Refresh current account data
    if (currentDemoAccount) {
      getWalletInfo();
      getTransactionHistory();
    }
  }, [isDemoMode, currentDemoAccount, getWalletInfo, getTransactionHistory]);

  const toggleDemoMode = useCallback(() => {
    const newDemoMode = !isDemoMode;
    backendService.setDemoMode(newDemoMode);
    setIsDemoMode(newDemoMode);
    
    // Reset states when switching modes
    setIsAuthenticated(false);
    setWalletInfo(null);
    setTransactions([]);
    setCurrentDemoAccount(null);
    
    // Reconnect with new mode
    connect();
  }, [isDemoMode, connect]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  return {
    // State
    isConnected,
    isAuthenticated,
    walletInfo,
    transactions,
    loading,
    error,
    isDemoMode,
    currentDemoAccount,
    demoAccounts,

    // Actions
    connect,
    login,
    logout,
    createWallet,
    getWalletInfo,
    transfer,
    getTransactionHistory,
    
    // Demo actions
    switchDemoAccount,
    resetDemo,
    toggleDemoMode,
  };
}
