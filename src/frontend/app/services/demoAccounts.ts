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
    initialBalance: 10000000, // 10 Million VAL - Founder's supply
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

  constructor() {
    // Initialize balances
    DEMO_ACCOUNTS.forEach(account => {
      this.balances.set(account.principal.toString(), account.initialBalance);
    });

    // Add some sample transactions
    this.addSampleTransactions();
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

  switchAccount(accountId: string): DemoAccount | null {
    const account = DEMO_ACCOUNTS.find(acc => acc.id === accountId);
    if (account) {
      this.currentAccount = account;
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
    return DEMO_ACCOUNTS.find(acc => acc.principal.toString() === principal.toString());
  }

  getAllAccounts(): DemoAccount[] {
    return DEMO_ACCOUNTS;
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
    
    return {
      totalSupply,
      totalAccounts: DEMO_ACCOUNTS.length,
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

    return { success: true, message: `Successfully burned ${amount} VAL tokens` };
  }

  // Reset demo to initial state
  resetDemo() {
    DEMO_ACCOUNTS.forEach(account => {
      this.balances.set(account.principal.toString(), account.initialBalance);
    });
    this.addSampleTransactions();
  }
}

// Export singleton instance
export const demoAccountManager = new DemoAccountManager();
