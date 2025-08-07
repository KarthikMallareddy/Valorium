'use client';

import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from '../../../declarations/backend/backend.did.js';
import { demoAccountManager, DemoAccount } from './demoAccounts';

// Replace with your actual canister ID
const BACKEND_CANISTER_ID = process.env.NEXT_PUBLIC_BACKEND_CANISTER_ID || 'bw4dl-smaaa-aaaaa-qaacq-cai';

// Demo mode is now the only mode - fully integrated with backend
const DEMO_MODE = true; // Demo mode is the default and only mode

// Types from generated declarations
export interface WalletInfo {
  user_principal: Principal;
  balance: bigint;
}

export interface Transaction {
  to: Principal;
  from: Principal;
  timestamp: bigint;
  amount: bigint;
}

export type Result<T> = { Ok: T } | { Err: string };

class BackendService {
  private actor: any = null;
  private agent: HttpAgent | null = null;
  private demoMode: boolean = DEMO_MODE;
  private currentAccount: any = null; // For real backend account tracking
  private allRealAccounts: any[] = []; // Cache of all real accounts

  async init() {
    try {
      if (this.demoMode) {
        console.log('🎭 Demo mode enabled - using mock data');
        return true;
      }

      // Create agent without authentication for simplified flow
      this.agent = new HttpAgent({
        host: process.env.NODE_ENV === 'production' 
          ? 'https://ic0.app' 
          : 'http://127.0.0.1:4943',
      });

      // Fetch root key for local development
      if (process.env.NODE_ENV !== 'production') {
        await this.agent.fetchRootKey();
      }

      // Create actor without authentication
      this.actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: BACKEND_CANISTER_ID,
      });

      // Load all real accounts
      await this.loadAllRealAccounts();

      console.log('🚀 Real backend connected - no authentication required');
      return true;
    } catch (error) {
      console.error('Failed to initialize backend service:', error);
      return false;
    }
  }

  async createWallet(): Promise<Result<WalletInfo>> {
    if (this.demoMode) {
      const currentAccount = demoAccountManager.getCurrentAccount();
      if (!currentAccount) {
        return { Err: 'No demo account selected' };
      }
      
      const walletInfo: WalletInfo = {
        user_principal: currentAccount.principal,
        balance: BigInt(demoAccountManager.getBalance())
      };
      
      return { Ok: walletInfo };
    }

    if (!this.actor) {
      await this.init();
    }
    
    try {
      const result = await this.actor.register();
      const walletInfo: WalletInfo = {
        user_principal: result.user_principal,
        balance: result.balance
      };
      return { Ok: walletInfo };
    } catch (error) {
      console.error('Error creating wallet:', error);
      return { Err: 'Failed to create wallet' };
    }
  }

  async getWalletInfo(): Promise<Result<WalletInfo>> {
    // Always use demo account manager for account selection
    const currentAccount = demoAccountManager.getCurrentAccount();
    if (!currentAccount) {
      return { Err: 'No demo account selected' };
    }
    
    if (this.demoMode) {
      const walletInfo: WalletInfo = {
        user_principal: currentAccount.principal,
        balance: BigInt(demoAccountManager.getBalance())
      };
      
      return { Ok: walletInfo };
    }

    // For backend integration - create account on blockchain if it doesn't exist
    if (!this.actor) {
      await this.init();
    }
    
    try {
      // Create account on blockchain for this demo account principal
      await this.ensureAccountExists(currentAccount);
      
      // Get balance from backend using the demo account principal
      const result = await this.actor.get_wallet_info();
      if ('Ok' in result) {
        return { Ok: result.Ok };
      } else {
        return { Err: result.Err };
      }
    } catch (error) {
      console.error('Error getting wallet info:', error);
      return { Err: 'Failed to get wallet info' };
    }
  }

  // Helper method to ensure a demo account exists on the blockchain
  private async ensureAccountExists(demoAccount: DemoAccount): Promise<void> {
    if (!this.actor) {
      throw new Error('Backend not initialized');
    }

    try {
      // Try to get wallet info for this principal
      const walletInfo = await this.actor.get_wallet_info();
      if ('Err' in walletInfo) {
        // Account doesn't exist, create it by calling register
        await this.actor.register();
      }
    } catch (error) {
      console.log('Creating account on blockchain for:', demoAccount.name);
      // If we get an error, try to register the account
      await this.actor.register();
    }
  }

  async transfer(to: string, amount: number): Promise<Result<string>> {
    const currentAccount = demoAccountManager.getCurrentAccount();
    if (!currentAccount) {
      return { Err: 'No demo account selected' };
    }

    if (this.demoMode) {
      try {
        const toPrincipal = Principal.fromText(to);
        const result = demoAccountManager.transfer(toPrincipal, amount);
        
        if (result.success) {
          return { Ok: 'Transfer successful' };
        } else {
          return { Err: result.message };
        }
      } catch (error) {
        return { Err: 'Invalid recipient address' };
      }
    }

    // For backend integration - use the demo account to make real blockchain transfers
    if (!this.actor) {
      await this.init();
    }
    
    try {
      await this.ensureAccountExists(currentAccount);
      const toPrincipal = Principal.fromText(to);
      const result = await this.actor.transfer(toPrincipal, BigInt(amount));
      if ('Ok' in result) {
        return { Ok: result.Ok };
      } else {
        return { Err: result.Err };
      }
    } catch (error) {
      console.error('Error transferring:', error);
      return { Err: 'Failed to transfer' };
    }
  }

  async getTransactionHistory(): Promise<Transaction[]> {
    const currentAccount = demoAccountManager.getCurrentAccount();
    if (!currentAccount) {
      return [];
    }

    if (this.demoMode) {
      const history = demoAccountManager.getTransactionHistory();
      return history.map(tx => ({
        to: tx.to,
        from: tx.from,
        timestamp: BigInt(tx.timestamp * 1000000), // Convert to nanoseconds
        amount: BigInt(tx.amount)
      }));
    }

    // For backend integration - get transaction history from blockchain
    if (!this.actor) {
      await this.init();
    }
    
    try {
      await this.ensureAccountExists(currentAccount);
      const result = await this.actor.get_transaction_history();
      return result;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  async login(): Promise<boolean> {
    // Always return true since we don't need authentication
    // Users just create accounts directly
    console.log('🚀 No authentication required - users create accounts directly');
    return true;
  }

  async logout(): Promise<void> {
    // Just clear current account selection
    this.currentAccount = null;
    localStorage.removeItem('currentRealAccount');
    console.log('🚀 Logged out - cleared account selection');
  }

  async isAuthenticated(): Promise<boolean> {
    // Always return true since no authentication is required
    return true;
  }

  // Real backend account management
  async loadAllRealAccounts(): Promise<void> {
    if (this.demoMode || !this.actor) return;
    
    try {
      this.allRealAccounts = await this.actor.get_all_accounts();
    } catch (error) {
      console.error('Error loading real accounts:', error);
      this.allRealAccounts = [];
    }
  }

  switchRealAccount(accountPrincipal: string): any | null {
    if (this.demoMode) return null;
    
    const account = this.allRealAccounts.find(acc => acc.principal.toString() === accountPrincipal);
    if (account) {
      this.currentAccount = account;
      localStorage.setItem('currentRealAccount', accountPrincipal);
      return account;
    }
    return null;
  }

  getCurrentRealAccount(): any | null {
    if (this.demoMode) return null;
    
    // Try to restore from localStorage
    if (!this.currentAccount) {
      const stored = localStorage.getItem('currentRealAccount');
      if (stored && this.allRealAccounts.length > 0) {
        this.currentAccount = this.allRealAccounts.find(acc => acc.principal.toString() === stored);
      }
    }
    return this.currentAccount;
  }

  getRealAccounts(): any[] {
    return this.allRealAccounts;
  }
  switchDemoAccount(accountId: string): DemoAccount | null {
    if (!this.demoMode) return null;
    return demoAccountManager.switchAccount(accountId);
  }

  getDemoAccounts(): DemoAccount[] {
    return demoAccountManager.getAllAccounts();
  }

  async getAllAccounts(): Promise<any[]> {
    if (this.demoMode) {
      return this.getDemoAccounts();
    }

    if (!this.actor) {
      await this.init();
    }
    
    try {
      return await this.actor.get_all_accounts();
    } catch (error) {
      console.error('Error getting all accounts:', error);
      return [];
    }
  }

  getCurrentDemoAccount(): DemoAccount | null {
    return demoAccountManager.getCurrentAccount();
  }

  // Universal account switching (works for both demo and real)
  switchAccount(accountId: string): any | null {
    if (this.demoMode) {
      return this.switchDemoAccount(accountId);
    } else {
      return this.switchRealAccount(accountId);
    }
  }

  // Universal current account getter
  getCurrentAccount(): any | null {
    if (this.demoMode) {
      return demoAccountManager.getCurrentAccount();
    } else {
      return this.getCurrentRealAccount();
    }
  }

  // Universal get all accounts
  getAccounts(): any[] {
    if (this.demoMode) {
      return demoAccountManager.getAllAccounts();
    } else {
      return this.getRealAccounts();
    }
  }

  createDemoAccount(name: string, avatar: string = '👤'): { success: boolean; account?: DemoAccount; message: string } {
    if (!this.demoMode) {
      return { success: false, message: 'Account creation only available in demo mode' };
    }
    return demoAccountManager.createAccount(name, avatar);
  }

  async createAccount(name: string, avatar: string = '👤'): Promise<{ success: boolean; account?: any; message: string }> {
    // First create the demo account locally
    const demoResult = demoAccountManager.createAccount(name, avatar);
    
    if (!demoResult.success) {
      return demoResult;
    }
    
    // If not in demo mode, also create the account on the blockchain
    if (!this.demoMode) {
      if (!this.actor) {
        await this.init();
      }
      
      try {
        const result = await this.actor.create_account(name, avatar);
        
        if (!result.success) {
          // If blockchain creation fails, remove the demo account
          if (demoResult.account) {
            demoAccountManager.deleteAccount(demoResult.account.id);
          }
          return {
            success: false,
            message: `Blockchain error: ${result.message}`,
            account: undefined
          };
        }
        
        // Return success with both demo and blockchain account created
        return {
          success: true,
          message: `Account "${name}" created successfully on blockchain with 100 VAL welcome bonus!`,
          account: demoResult.account
        };
      } catch (error) {
        console.error('Error creating blockchain account:', error);
        // If blockchain creation fails, remove the demo account
        if (demoResult.account) {
          demoAccountManager.deleteAccount(demoResult.account.id);
        }
        return {
          success: false,
          message: 'Failed to create account on blockchain',
          account: undefined
        };
      }
    }
    
    // Pure demo mode - return demo account result
    return demoResult;
  }

  deleteDemoAccount(accountId: string): { success: boolean; message: string } {
    if (!this.demoMode) {
      return { success: false, message: 'Account deletion only available in demo mode' };
    }
    return demoAccountManager.deleteAccount(accountId);
  }

  getCustomDemoAccounts(): DemoAccount[] {
    if (!this.demoMode) return [];
    return demoAccountManager.getCustomAccounts();
  }

  resetDemo(): void {
    if (this.demoMode) {
      demoAccountManager.resetDemo();
    }
  }

  isDemoMode(): boolean {
    return this.demoMode;
  }

  setDemoMode(enabled: boolean): void {
    this.demoMode = enabled;
  }

  // Owner/Admin functions
  async isOwner(): Promise<boolean> {
    if (this.demoMode) {
      return demoAccountManager.isOwner();
    }

    if (!this.actor) {
      await this.init();
    }
    
    try {
      return await this.actor.is_owner();
    } catch (error) {
      console.error('Error checking owner status:', error);
      return false;
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    if (this.demoMode) {
      const allTransactions = demoAccountManager.getAllTransactions();
      return allTransactions.map(tx => ({
        to: tx.to,
        from: tx.from,
        timestamp: BigInt(tx.timestamp * 1000000),
        amount: BigInt(tx.amount)
      }));
    }

    if (!this.actor) {
      await this.init();
    }
    
    try {
      return await this.actor.get_all_transactions();
    } catch (error) {
      console.error('Error getting all transactions:', error);
      return [];
    }
  }

  async getSystemStats(): Promise<{
    totalSupply: number;
    totalAccounts: number;
    totalTransactions: number;
    ownerBalance: number;
    circulatingSupply: number;
  }> {
    if (this.demoMode) {
      return demoAccountManager.getSystemStats();
    }

    if (!this.actor) {
      await this.init();
    }
    
    try {
      const result = await this.actor.get_system_stats();
      return {
        totalSupply: Number(result.total_supply),
        totalAccounts: Number(result.total_accounts),
        totalTransactions: Number(result.total_transactions),
        ownerBalance: Number(result.owner_balance),
        circulatingSupply: Number(result.circulating_supply)
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return {
        totalSupply: 0,
        totalAccounts: 0,
        totalTransactions: 0,
        ownerBalance: 0,
        circulatingSupply: 0
      };
    }
  }

  async mintTokens(amount: number): Promise<{ success: boolean; message: string }> {
    if (this.demoMode) {
      return demoAccountManager.mintTokens(amount);
    }

    if (!this.actor) {
      await this.init();
    }
    
    try {
      const result = await this.actor.mint_tokens(BigInt(amount));
      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      console.error('Error minting tokens:', error);
      return { success: false, message: 'Failed to mint tokens' };
    }
  }

  async burnTokens(amount: number): Promise<{ success: boolean; message: string }> {
    if (this.demoMode) {
      return demoAccountManager.burnTokens(amount);
    }

    if (!this.actor) {
      await this.init();
    }
    
    try {
      const result = await this.actor.burn_tokens(BigInt(amount));
      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      console.error('Error burning tokens:', error);
      return { success: false, message: 'Failed to burn tokens' };
    }
  }
}

// Export singleton instance
export const backendService = new BackendService();
