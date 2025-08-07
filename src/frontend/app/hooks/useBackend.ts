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
  allAccounts: any[];

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
  createDemoAccount: (name: string, avatar?: string) => { success: boolean; account?: DemoAccount; message: string };
  createAccount: (name: string, avatar?: string) => Promise<{ success: boolean; account?: any; message: string }>;
  deleteDemoAccount: (accountId: string) => { success: boolean; message: string };
  getCustomDemoAccounts: () => DemoAccount[];

  // Admin actions
  isOwner: () => Promise<boolean>;
  getAllTransactions: () => Promise<Transaction[]>;
  getSystemStats: () => Promise<{
    totalSupply: number;
    totalAccounts: number;
    totalTransactions: number;
    ownerBalance: number;
    circulatingSupply: number;
  }>;
  mintTokens: (amount: number) => Promise<{ success: boolean; message: string }>;
  burnTokens: (amount: number) => Promise<{ success: boolean; message: string }>;
}

export function useBackend(): UseBackendReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode] = useState(true); // Demo mode is now the only mode
  const [currentDemoAccount, setCurrentDemoAccount] = useState<DemoAccount | null>(null);
  const [demoAccounts] = useState<DemoAccount[]>(backendService.getDemoAccounts());
  const [allAccounts, setAllAccounts] = useState<any[]>([]); // For both demo and real accounts

  // Initialize connection and set authenticated immediately
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await backendService.init();
      setIsConnected(success);
      
      if (success) {
        // Load accounts for both modes
        const accounts = backendService.getAccounts();
        setAllAccounts(accounts);
        
        // Check current account
        const currentAccount = backendService.getCurrentAccount();
        setCurrentDemoAccount(currentAccount); // This works for both demo and real accounts
        
        // Always set authenticated to true since no auth is required
        setIsAuthenticated(true);
      }
    } catch (err) {
      setError('Failed to connect to backend');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  // Login function - always succeeds since no auth needed
  const login = useCallback(async (): Promise<boolean> => {
    console.log('🚀 Login called - no authentication required');
    setIsAuthenticated(true);
    return true;
  }, []);

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
    const account = backendService.switchAccount(accountId); // Use universal function
    setCurrentDemoAccount(account);
    setIsAuthenticated(account !== null);
    
    // Update accounts list for real mode
    if (!isDemoMode) {
      const accounts = backendService.getAccounts();
      setAllAccounts(accounts);
    }
    
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

  // Admin functions
  const isOwner = useCallback(async () => {
    return await backendService.isOwner();
  }, []);

  const getAllTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allTransactions = await backendService.getAllTransactions();
      return allTransactions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get all transactions');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getSystemStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const stats = await backendService.getSystemStats();
      return stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get system stats');
      return {
        totalSupply: 0,
        totalAccounts: 0,
        totalTransactions: 0,
        ownerBalance: 0,
        circulatingSupply: 0
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const mintTokens = useCallback(async (amount: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await backendService.mintTokens(amount);
      if (result.success) {
        // Refresh wallet info and transactions after minting
        await getWalletInfo();
        await getTransactionHistory();
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mint tokens');
      return { success: false, message: 'Failed to mint tokens' };
    } finally {
      setLoading(false);
    }
  }, [getWalletInfo, getTransactionHistory]);

  const burnTokens = useCallback(async (amount: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await backendService.burnTokens(amount);
      if (result.success) {
        // Refresh wallet info and transactions after burning
        await getWalletInfo();
        await getTransactionHistory();
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to burn tokens');
      return { success: false, message: 'Failed to burn tokens' };
    } finally {
      setLoading(false);
    }
  }, [getWalletInfo, getTransactionHistory]);

  // Demo account management
  const createDemoAccount = useCallback((name: string, avatar: string = '👤') => {
    const result = backendService.createDemoAccount(name, avatar);
    if (result.success) {
      // Refresh demo accounts list
      const updatedAccounts = backendService.getDemoAccounts();
      // Force re-render by updating state if needed
    }
    return result;
  }, []);

  const createAccount = useCallback(async (name: string, avatar: string = '👤') => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await backendService.createAccount(name, avatar);
      if (result.success) {
        // Refresh wallet info and transaction history after account creation
        await getWalletInfo();
        await getTransactionHistory();
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      return { success: false, message: 'Failed to create account' };
    } finally {
      setLoading(false);
    }
  }, [getWalletInfo, getTransactionHistory]);

  const deleteDemoAccount = useCallback((accountId: string) => {
    const result = backendService.deleteDemoAccount(accountId);
    if (result.success) {
      // If deleted account was current, clear current account
      const currentAccount = backendService.getCurrentDemoAccount();
      if (!currentAccount) {
        setCurrentDemoAccount(null);
        setIsAuthenticated(false);
        setWalletInfo(null);
        setTransactions([]);
      }
    }
    return result;
  }, []);

  const getCustomDemoAccounts = useCallback(() => {
    return backendService.getCustomDemoAccounts();
  }, []);

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
    allAccounts,

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
    createDemoAccount,
    createAccount,
    deleteDemoAccount,
    getCustomDemoAccounts,

    // Admin actions
    isOwner,
    getAllTransactions,
    getSystemStats,
    mintTokens,
    burnTokens,
  };
}
