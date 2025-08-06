'use client';

import { Principal } from '@dfinity/principal';

// Demo accounts for testing
export interface DemoAccount {
  id: string;
  name: string;
  principal: Principal;
  initialBalance: number;
  avatar: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'owner',
    name: 'Karthik Mallareddy (Owner)',
    principal: Principal.fromText('rdmx6-jaaaa-aaaaa-aaadq-cai'),
    initialBalance: 100000, // 100,000 VAL - Enough to fund 1000 new accounts
    avatar: '👑'
  },
  {
    id: '1',
    name: 'Alice Johnson', 
    principal: Principal.fromText('be2us-64aaa-aaaaa-qaabq-cai'),
    initialBalance: 1000,
    avatar: '👩‍💼'
  },
  {
    id: '2', 
    name: 'Bob Smith',
    principal: Principal.fromText('bkyz2-fmaaa-aaaaa-qaaaq-cai'),
    initialBalance: 750,
    avatar: '👨‍💻'
  },
  {
    id: '3',
    name: 'Charlie Davis',
    principal: Principal.fromText('bd3sg-teaaa-aaaaa-qaaba-cai'),
    initialBalance: 500,
    avatar: '👨‍🎨'
  },
  {
    id: '4',
    name: 'Diana Wilson',
    principal: Principal.fromText('bw4dl-smaaa-aaaaa-qaacq-cai'),
    initialBalance: 1250,
    avatar: '👩‍🔬'
  },
  {
    id: '5',
    name: 'Eva Martinez',
    principal: Principal.fromText('br5f7-7uaaa-aaaaa-qaaca-cai'),
    initialBalance: 300,
    avatar: '👩‍🎓'
  }
];

export class DemoAccountManager {
  private currentAccount: DemoAccount | null = null;
  private balances: Map<string, number> = new Map();
  private transactions: Array<{
    id: string;
    from: Principal;
    to: Principal;
    amount: number;
    timestamp: number;
    description: string;
  }> = [];
  private customAccounts: DemoAccount[] = [];
  private storageKey = 'valorium_demo_data';

  constructor() {
    // Load from localStorage if available
    this.loadFromStorage();
    
    // Initialize balances for default accounts
    DEMO_ACCOUNTS.forEach(account => {
      if (!this.balances.has(account.principal.toString())) {
        this.balances.set(account.principal.toString(), account.initialBalance);
      }
    });

    // Add some sample transactions if none exist
    if (this.transactions.length === 0) {
      this.addSampleTransactions();
    }

    // Test Principal ID generation to ensure it works
    try {
      const testId = this.generatePrincipalId();
      Principal.fromText(testId);
      console.log('Principal ID generation test passed:', testId);
    } catch (error) {
      console.error('Principal ID generation test failed:', error);
    }

    // Save initial state
    this.saveToStorage();
  }

  private addSampleTransactions() {
    const now = Date.now();
    
    this.transactions = [
      {
        id: '1',
        from: DEMO_ACCOUNTS[0].principal,
        to: DEMO_ACCOUNTS[1].principal,
        amount: 100,
        timestamp: now - 86400000, // 1 day ago
        description: 'Payment for services'
      },
      {
        id: '2',
        from: DEMO_ACCOUNTS[2].principal,
        to: DEMO_ACCOUNTS[0].principal,
        amount: 50,
        timestamp: now - 43200000, // 12 hours ago
        description: 'Freelance work payment'
      },
      {
        id: '3',
        from: DEMO_ACCOUNTS[1].principal,
        to: DEMO_ACCOUNTS[3].principal,
        amount: 200,
        timestamp: now - 21600000, // 6 hours ago
        description: 'Investment return'
      }
    ];
  }

  // Storage methods for persistence
  private saveToStorage() {
    if (typeof window !== 'undefined') {
      const data = {
        balances: Array.from(this.balances.entries()),
        transactions: this.transactions,
        customAccounts: this.customAccounts,
        currentAccountId: this.currentAccount?.id || null
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          this.balances = new Map(data.balances || []);
          this.transactions = data.transactions || [];
          this.customAccounts = data.customAccounts || [];
          
          // Restore current account
          if (data.currentAccountId) {
            const allAccounts = [...DEMO_ACCOUNTS, ...this.customAccounts];
            this.currentAccount = allAccounts.find(acc => acc.id === data.currentAccountId) || null;
          }
        }
      } catch (error) {
        console.warn('Failed to load demo data from storage:', error);
      }
    }
  }

  // Generate a unique Principal ID for new accounts
  private generatePrincipalId(): string {
    // Use a pre-validated set of Principal IDs to avoid checksum issues
    // These are all valid Principal IDs that we can safely use for demo accounts
    const availablePrincipalIds = [
      'rrkah-fqaaa-aaaaa-aaaaq-cai',
      'rno2w-sqaaa-aaaaa-aaaaq-cai',
      'rdmx6-jaaaa-aaaaa-aaaaq-cai',
      'rcyqb-siaaa-aaaaa-aaaaq-cai',
      'rastt-hiaaa-aaaaa-aaaaq-cai',
      'r7inp-6aaaa-aaaaa-aaaaq-cai',
      'qvhpv-4qaaa-aaaaa-aaaaq-cai',
      'qsgjb-riaaa-aaaaa-aaaaq-cai',
      'qoctq-giaaa-aaaaa-aaaaq-cai',
      'qjdve-lqaaa-aaaaa-aaaaq-cai',
      'qdhpv-kiaaa-aaaaa-aaaaq-cai',
      'q4eej-kyaaa-aaaaa-aaaaq-cai',
      'pzp6e-ekaaa-aaaaa-aaaaq-cai',
      'pwctb-byaaa-aaaaa-aaaaq-cai',
      'pvlon-siaaa-aaaaa-aaaaq-cai',
      'ptbq6-liaaa-aaaaa-aaaaq-cai',
      'prpte-eyaaa-aaaaa-aaaaq-cai',
      'pqafw-uyaaa-aaaaa-aaaaq-cai',
      'pmhly-uqaaa-aaaaa-aaaaq-cai',
      'pljqf-tiaaa-aaaaa-aaaaq-cai',
      'pj6a4-xiaaa-aaaaa-aaaaq-cai',
      'piqdn-gyaaa-aaaaa-aaaaq-cai',
      'pfgej-wiaaa-aaaaa-aaaaq-cai',
      'pe2qe-jyaaa-aaaaa-aaaaq-cai',
      'pcrsq-4iaaa-aaaaa-aaaaq-cai',
      'pb3vg-bqaaa-aaaaa-aaaaq-cai',
      'p6mtu-uyaaa-aaaaa-aaaaq-cai',
      'p5ilm-xiaaa-aaaaa-aaaaq-cai',
      'p4bbn-aqaaa-aaaaa-aaaaq-cai',
      'p22dk-gqaaa-aaaaa-aaaaq-cai'
    ];

    // Get already used Principal IDs
    const usedIds = new Set();
    DEMO_ACCOUNTS.forEach(acc => usedIds.add(acc.principal.toString()));
    this.customAccounts.forEach(acc => usedIds.add(acc.principal.toString()));

    // Find an unused Principal ID
    for (const id of availablePrincipalIds) {
      if (!usedIds.has(id)) {
        // Validate it works
        try {
          Principal.fromText(id);
          return id;
        } catch (error) {
          console.warn(`Principal ID ${id} validation failed:`, error);
          continue;
        }
      }
    }

    // If all pre-defined IDs are used, generate a simple incremental one
    // This is a fallback that should rarely be needed
    const baseId = 'u';
    const counter = this.customAccounts.length + 1000; // Start from 1000 to avoid conflicts
    const paddedCounter = counter.toString().padStart(4, '0');
    const generatedId = `${baseId}${paddedCounter}-aaaaa-aaaaa-aaaaq-cai`;
    
    try {
      Principal.fromText(generatedId);
      return generatedId;
    } catch (error) {
      // Last resort: use a timestamp-based approach
      const timestamp = Date.now().toString(36);
      const fallbackId = `u${timestamp.slice(-4)}-aaaaa-aaaaa-aaaaq-cai`;
      return fallbackId;
    }
  }

  // Create a new demo account
  createAccount(name: string, avatar: string = '👤'): { success: boolean; account?: DemoAccount; message: string } {
    try {
      // Validate inputs
      if (!name || name.trim().length === 0) {
        return { success: false, message: 'Account name is required' };
      }

      // Check if name already exists
      const allAccounts = [...DEMO_ACCOUNTS, ...this.customAccounts];
      if (allAccounts.some(acc => acc.name.toLowerCase() === name.trim().toLowerCase())) {
        return { success: false, message: 'Account name already exists' };
      }

      // Check if we've reached the limit of 15 free accounts
      if (this.customAccounts.length >= 15) {
        return { success: false, message: 'Maximum of 15 free accounts reached. Contact admin for more accounts.' };
      }

      // Fixed initial balance of 100 VAL for first 15 accounts
      const initialBalance = 100;

      // Generate unique ID and Principal
      const accountId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let principalId: string;
      let principal: Principal;
      
      try {
        principalId = this.generatePrincipalId();
        principal = Principal.fromText(principalId);
      } catch (error) {
        console.error('Failed to generate valid Principal ID:', error);
        return { 
          success: false, 
          message: 'Failed to generate account identifier. Please try again.' 
        };
      }

      // Create new account
      const newAccount: DemoAccount = {
        id: accountId,
        name: name.trim(),
        principal: principal,
        initialBalance: initialBalance,
        avatar: avatar
      };

      // Add to custom accounts and set balance
      this.customAccounts.push(newAccount);
      this.balances.set(principal.toString(), initialBalance);

      // Transfer tokens from owner to new account (owner funds the new accounts)
      const ownerPrincipal = DEMO_ACCOUNTS[0].principal;
      const ownerBalance = this.getBalance(ownerPrincipal);
      
      if (ownerBalance >= initialBalance) {
        // Transfer tokens from owner to new account
        this.balances.set(ownerPrincipal.toString(), ownerBalance - initialBalance);
        
        // Add transaction record
        this.transactions.unshift({
          id: Date.now().toString(),
          from: ownerPrincipal,
          to: principal,
          amount: initialBalance,
          timestamp: Date.now(),
          description: `Welcome bonus: ${initialBalance} VAL for new account: ${name}`
        });
      } else {
        console.warn('Owner has insufficient balance to fund new account');
      }

      // Save to storage
      this.saveToStorage();

      return { 
        success: true, 
        account: newAccount, 
        message: `Account "${name}" created successfully with ${initialBalance} VAL welcome bonus! (${15 - this.customAccounts.length} free accounts remaining)` 
      };

    } catch (error) {
      console.error('Account creation error:', error);
      return { 
        success: false, 
        message: `Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  switchAccount(accountId: string): DemoAccount | null {
    const allAccounts = [...DEMO_ACCOUNTS, ...this.customAccounts];
    const account = allAccounts.find(acc => acc.id === accountId);
    if (account) {
      this.currentAccount = account;
      this.saveToStorage(); // Save current account selection
      return account;
    }
    return null;
  }

  getCurrentAccount(): DemoAccount | null {
    return this.currentAccount;
  }

  getBalance(principal?: Principal): number {
    const principalStr = principal ? principal.toString() : this.currentAccount?.principal.toString();
    if (!principalStr) return 0;
    return this.balances.get(principalStr) || 0;
  }

  transfer(to: Principal, amount: number): { success: boolean; message: string } {
    if (!this.currentAccount) {
      return { success: false, message: 'No account selected' };
    }

    const fromPrincipal = this.currentAccount.principal.toString();
    const toPrincipal = to.toString();
    
    if (fromPrincipal === toPrincipal) {
      return { success: false, message: 'Cannot transfer to yourself' };
    }

    const currentBalance = this.getBalance();
    if (currentBalance < amount) {
      return { success: false, message: 'Insufficient balance' };
    }

    // Update balances
    this.balances.set(fromPrincipal, currentBalance - amount);
    const toBalance = this.balances.get(toPrincipal) || 0;
    this.balances.set(toPrincipal, toBalance + amount);

    // Add transaction
    this.transactions.unshift({
      id: Date.now().toString(),
      from: this.currentAccount.principal,
      to: to,
      amount: amount,
      timestamp: Date.now(),
      description: `Transfer to ${this.getAccountByPrincipal(to)?.name || 'Unknown'}`
    });

    // Save to storage
    this.saveToStorage();

    return { success: true, message: 'Transfer successful' };
  }

  getTransactionHistory(principal?: Principal): Array<{
    id: string;
    from: Principal;
    to: Principal;
    amount: number;
    timestamp: number;
    description: string;
  }> {
    const accountPrincipal = principal || this.currentAccount?.principal;
    if (!accountPrincipal) return [];

    return this.transactions.filter(tx => 
      tx.from.toString() === accountPrincipal.toString() || 
      tx.to.toString() === accountPrincipal.toString()
    );
  }

  getAccountByPrincipal(principal: Principal): DemoAccount | undefined {
    const allAccounts = [...DEMO_ACCOUNTS, ...this.customAccounts];
    return allAccounts.find(acc => acc.principal.toString() === principal.toString());
  }

  getAllAccounts(): DemoAccount[] {
    return [...DEMO_ACCOUNTS, ...this.customAccounts];
  }

  getCustomAccounts(): DemoAccount[] {
    return this.customAccounts;
  }

  // Delete a custom account (only custom accounts can be deleted, not default ones)
  deleteAccount(accountId: string): { success: boolean; message: string } {
    // Prevent deletion of default accounts
    if (DEMO_ACCOUNTS.some(acc => acc.id === accountId)) {
      return { success: false, message: 'Cannot delete default accounts' };
    }

    const accountIndex = this.customAccounts.findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) {
      return { success: false, message: 'Account not found' };
    }

    const account = this.customAccounts[accountIndex];
    
    // If this is the current account, clear it
    if (this.currentAccount?.id === accountId) {
      this.currentAccount = null;
    }

    // Remove account and its balance
    this.customAccounts.splice(accountIndex, 1);
    this.balances.delete(account.principal.toString());

    // Save to storage
    this.saveToStorage();

    return { success: true, message: `Account "${account.name}" deleted successfully` };
  }

  // Owner/Admin specific functions
  isOwner(principal?: Principal): boolean {
    const checkPrincipal = principal || this.currentAccount?.principal;
    if (!checkPrincipal) return false;
    return DEMO_ACCOUNTS[0].principal.toString() === checkPrincipal.toString();
  }

  getAllTransactions(): Array<{
    id: string;
    from: Principal;
    to: Principal;
    amount: number;
    timestamp: number;
    description: string;
  }> {
    return this.transactions;
  }

  getTotalSupply(): number {
    let total = 0;
    this.balances.forEach(balance => {
      total += balance;
    });
    return total;
  }

  getSystemStats(): {
    totalSupply: number;
    totalAccounts: number;
    totalTransactions: number;
    ownerBalance: number;
    circulatingSupply: number;
  } {
    const totalSupply = this.getTotalSupply();
    const ownerBalance = this.getBalance(DEMO_ACCOUNTS[0].principal);
    const circulatingSupply = totalSupply - ownerBalance;
    const totalAccounts = DEMO_ACCOUNTS.length + this.customAccounts.length;
    
    return {
      totalSupply,
      totalAccounts,
      totalTransactions: this.transactions.length,
      ownerBalance,
      circulatingSupply
    };
  }

  // Owner-only functions
  mintTokens(amount: number): { success: boolean; message: string } {
    if (!this.isOwner()) {
      return { success: false, message: 'Only owner can mint tokens' };
    }

    const ownerPrincipal = DEMO_ACCOUNTS[0].principal.toString();
    const currentBalance = this.getBalance(DEMO_ACCOUNTS[0].principal);
    this.balances.set(ownerPrincipal, currentBalance + amount);

    // Add minting transaction
    this.transactions.unshift({
      id: Date.now().toString(),
      from: DEMO_ACCOUNTS[0].principal, // Minting from owner
      to: DEMO_ACCOUNTS[0].principal,   // To owner
      amount: amount,
      timestamp: Date.now(),
      description: `Minted ${amount} VAL tokens`
    });

    // Save to storage
    this.saveToStorage();

    return { success: true, message: `Successfully minted ${amount} VAL tokens` };
  }

  burnTokens(amount: number): { success: boolean; message: string } {
    if (!this.isOwner()) {
      return { success: false, message: 'Only owner can burn tokens' };
    }

    const ownerBalance = this.getBalance(DEMO_ACCOUNTS[0].principal);
    if (ownerBalance < amount) {
      return { success: false, message: 'Insufficient balance to burn' };
    }

    const ownerPrincipal = DEMO_ACCOUNTS[0].principal.toString();
    this.balances.set(ownerPrincipal, ownerBalance - amount);

    // Add burning transaction
    this.transactions.unshift({
      id: Date.now().toString(),
      from: DEMO_ACCOUNTS[0].principal,
      to: DEMO_ACCOUNTS[0].principal,
      amount: amount,
      timestamp: Date.now(),
      description: `Burned ${amount} VAL tokens`
    });

    // Save to storage
    this.saveToStorage();

    return { success: true, message: `Successfully burned ${amount} VAL tokens` };
  }

  // Reset demo to initial state
  resetDemo() {
    DEMO_ACCOUNTS.forEach(account => {
      this.balances.set(account.principal.toString(), account.initialBalance);
    });
    this.customAccounts = [];
    this.currentAccount = null;
    this.addSampleTransactions();
    this.saveToStorage();
  }
}

// Export singleton instance
export const demoAccountManager = new DemoAccountManager();
