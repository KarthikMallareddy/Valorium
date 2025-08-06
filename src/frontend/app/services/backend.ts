'use client';

import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { idlFactory } from '../../../declarations/backend/backend.did.js';
import { demoAccountManager, DemoAccount } from './demoAccounts';

// Replace with your actual canister ID
const BACKEND_CANISTER_ID = process.env.NEXT_PUBLIC_BACKEND_CANISTER_ID || 'bw4dl-smaaa-aaaaa-qaacq-cai';

// Demo mode flag
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || true; // Enable demo mode by default

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

  async init() {
    try {
      if (this.demoMode) {
        console.log('🎭 Demo mode enabled - using mock data');
        return true;
      }

      // Initialize auth client
      this.authClient = await AuthClient.create();
      
      // Create agent
      this.agent = new HttpAgent({
        host: process.env.NODE_ENV === 'production' 
          ? 'https://ic0.app' 
          : 'http://127.0.0.1:4943',
      });

      // Fetch root key for local development
      if (process.env.NODE_ENV !== 'production') {
        await this.agent.fetchRootKey();
      }

      // Create actor
      this.actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: BACKEND_CANISTER_ID,
      });

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
      const result = await this.actor.create_wallet();
      return result;
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
    
    try {
      const result = await this.actor.get_wallet_info();
      return result;
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
      return result;
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

    if (!this.authClient) {
      await this.init();
    }

    console.log('Starting login process...');
    
    return new Promise((resolve) => {
      this.authClient?.login({
        identityProvider: process.env.NODE_ENV === 'production' 
          ? 'https://identity.ic0.app/#authorize'
          : 'http://127.0.0.1:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai#authorize',
        onSuccess: () => {
          console.log('Login successful!');
          this.updateAgent();
          resolve(true);
        },
        onError: (error) => {
          console.error('Login failed:', error);
          resolve(false);
        },
      });
    });
  }

  async logout(): Promise<void> {
    if (this.demoMode) {
      demoAccountManager.switchAccount('');
      return;
    }
    
    await this.authClient?.logout();
    this.updateAgent();
  }

  async isAuthenticated(): Promise<boolean> {
    if (this.demoMode) {
      return demoAccountManager.getCurrentAccount() !== null;
    }

    if (!this.authClient) {
      return false;
    }
    return await this.authClient.isAuthenticated();
  }

  // Demo-specific methods
  switchDemoAccount(accountId: string): DemoAccount | null {
    if (!this.demoMode) return null;
    return demoAccountManager.switchAccount(accountId);
  }

  getDemoAccounts(): DemoAccount[] {
    return demoAccountManager.getAllAccounts();
  }

  getCurrentDemoAccount(): DemoAccount | null {
    return demoAccountManager.getCurrentAccount();
  }

  createDemoAccount(name: string, avatar: string = '👤'): { success: boolean; account?: DemoAccount; message: string } {
    if (!this.demoMode) {
      return { success: false, message: 'Account creation only available in demo mode' };
    }
    return demoAccountManager.createAccount(name, avatar);
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
  isOwner(): boolean {
    if (!this.demoMode) return false;
    return demoAccountManager.isOwner();
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

    // In real mode, this would require special backend permission
    return this.getTransactionHistory();
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

    // In real mode, implement backend call for system stats
    return {
      totalSupply: 0,
      totalAccounts: 0,
      totalTransactions: 0,
      ownerBalance: 0,
      circulatingSupply: 0
    };
  }

  async mintTokens(amount: number): Promise<{ success: boolean; message: string }> {
    if (this.demoMode) {
      return demoAccountManager.mintTokens(amount);
    }

    // In real mode, implement backend call for minting
    return { success: false, message: 'Minting not available in production mode' };
  }

  async burnTokens(amount: number): Promise<{ success: boolean; message: string }> {
    if (this.demoMode) {
      return demoAccountManager.burnTokens(amount);
    }

    // In real mode, implement backend call for burning
    return { success: false, message: 'Burning not available in production mode' };
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
