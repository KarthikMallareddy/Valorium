'use client';

import { useState, useEffect, useCallback } from 'react';
import { backendService, WalletInfo, Transaction, Result } from '../services/backend';

export interface UseBackendReturn {
  // State
  isConnected: boolean;
  isAuthenticated: boolean;
  walletInfo: WalletInfo | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;

  // Actions
  connect: () => Promise<void>;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  createWallet: () => Promise<boolean>;
  getWalletInfo: () => Promise<void>;
  transfer: (to: string, amount: number) => Promise<boolean>;
  getTransactionHistory: () => Promise<void>;
}

export function useBackend(): UseBackendReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize connection
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await backendService.init();
      setIsConnected(success);
      
      if (success) {
        const authStatus = await backendService.isAuthenticated();
        setIsAuthenticated(authStatus);
      }
    } catch (err) {
      setError('Failed to connect to backend');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (): Promise<boolean> => {
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
    } catch (err) {
      setError('Failed to logout');
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create wallet function
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

  // Get wallet info function
  const getWalletInfo = useCallback(async () => {
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
  }, []);

  // Transfer function
  const transfer = useCallback(async (to: string, amount: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await backendService.transfer(to, amount);
      
      if ('Ok' in result) {
        // Refresh wallet info and transactions after transfer
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

  // Get transaction history function
  const getTransactionHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await backendService.getTransactionHistory();
      setTransactions(result);
    } catch (err) {
      setError('Failed to get transaction history');
      console.error('Transaction history error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize on mount
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

    // Actions
    connect,
    login,
    logout,
    createWallet,
    getWalletInfo,
    transfer,
    getTransactionHistory,
  };
}
