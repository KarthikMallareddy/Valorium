'use client';

import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { idlFactory } from '../../../declarations/backend/backend.did.js';
import { demoAccountManager, DemoAccount } from './demoAccounts';

// Replace with your actual canister ID
const BACKEND_CANISTER_ID = process.env.NEXT_PUBLIC_BACKEND_CANISTER_ID || 'bw4dl-smaaa-aaaaa-qaacq-cai';

// Demo mode flag - set to false to use real backend
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || false; // Use real backend by default

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
  private authClient: AuthClient | null = null;
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

    // For real backend, we need to get wallet info for current account
    const currentAccount = this.getCurrentRealAccount();
    if (!currentAccount) {
      return { Err: 'No account selected. Please create or select an account.' };
    }
    
    try {
      // Use the register function to get wallet info for current account
      const result = await this.actor.register();
      const walletInfo: WalletInfo = {
        user_principal: currentAccount.principal,
        balance: result.balance
      };
      return { Ok: walletInfo };
    } catch (error) {
      console.error('Error getting wallet info:', error);
      return { Err: 'Failed to get wallet info' };
    }
  }

  async transfer(to: string, amount: number): Promise<Result<string>> {
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

    if (!this.actor) {
      await this.init();
    }
    
    try {
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
    if (this.demoMode) {
      const history = demoAccountManager.getTransactionHistory();
      return history.map(tx => ({
        to: tx.to,
        from: tx.from,
        timestamp: BigInt(tx.timestamp * 1000000), // Convert to nanoseconds
        amount: BigInt(tx.amount)
      }));
    }

    if (!this.actor) {
      await this.init();
    }
    
    try {
      const result = await this.actor.get_transaction_history();
      return result;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  async login(): Promise<boolean> {
    if (this.demoMode) {
      console.log('🎭 Demo mode: Skipping Internet Identity login');
      return true;
    }

    // For real backend without authentication, just return true
    console.log('🚀 Real backend: No authentication required');
    return true;
  }

  async logout(): Promise<void> {
    if (this.demoMode) {
      demoAccountManager.switchAccount('');
      return;
    }
    
    // For real backend without authentication, just clear state
    console.log('🚀 Real backend: Logout (clearing local state)');
  }

  async isAuthenticated(): Promise<boolean> {
    if (this.demoMode) {
      return demoAccountManager.getCurrentAccount() !== null;
    }

    // For real backend without authentication, always return true if connected
    return this.actor !== null;
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
    if (this.demoMode) {
      return this.createDemoAccount(name, avatar);
    }

    if (!this.actor) {
      await this.init();
    }
    
    try {
      const result = await this.actor.create_account(name, avatar);
      
      if (result.success && result.account) {
        // Reload all accounts to include the new one
        await this.loadAllRealAccounts();
        
        // Switch to the newly created account
        const newAccountPrincipal = result.account.principal.toString();
        this.switchRealAccount(newAccountPrincipal);
        
        return {
          success: result.success,
          message: result.message,
          account: result.account
        };
      } else {
        return {
          success: result.success,
          message: result.message,
          account: undefined
        };
      }
    } catch (error) {
      console.error('Error creating account:', error);
      return { success: false, message: 'Failed to create account' };
    }
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

  private updateAgent() {
    if (this.authClient && this.agent) {
      const identity = this.authClient.getIdentity();
      this.agent.replaceIdentity(identity);
      
      // Recreate actor with new identity
      this.actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: BACKEND_CANISTER_ID,
      });
    }
  }
}

// Export singleton instance
export const backendService = new BackendService();
