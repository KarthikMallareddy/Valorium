use candid::{CandidType, Principal};
use ic_cdk::{query, update, caller, api::time, init};
use serde::Deserialize;
use std::cell::RefCell;
use std::collections::HashMap;

type Balances = HashMap<Principal, u64>;

#[derive(CandidType, Clone, Deserialize)]
struct Transaction {
    from: Principal,
    to: Principal,
    amount: u64,
    timestamp: u64,
}

#[derive(CandidType, Clone, Deserialize)]
struct Account {
    principal: Principal,
    name: String,
    avatar: String,
    created_at: u64,
    is_custom: bool,
}

#[derive(CandidType, Deserialize, Default)]
struct State {
    balances: Balances,
    accounts: HashMap<Principal, Account>,
    transaction_log: Vec<Transaction>,
    owner: Option<Principal>,
    custom_account_count: u32,
}

#[derive(CandidType)]
struct WalletInfo {
    user_principal: Principal,
    balance: u64,
}

#[derive(CandidType)]
struct CreateAccountResult {
    success: bool,
    message: String,
    account: Option<Account>,
}

#[derive(CandidType)]
struct SystemStats {
    total_supply: u64,
    total_accounts: u32,
    total_transactions: u32,
    owner_balance: u64,
    circulating_supply: u64,
}

#[derive(CandidType)]
struct SimpleResult {
    success: bool,
    message: String,
}

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State::default());
}

const WELCOME_BONUS: u64 = 100;
const MAX_FREE_ACCOUNTS: u32 = 15;
const OWNER_INITIAL_BALANCE: u64 = 100_000;

#[init]
fn init() {
    let owner_principal = caller();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.owner = Some(owner_principal);
        
        // Create owner account
        let owner_account = Account {
            principal: owner_principal,
            name: "Karthik Mallareddy (Owner)".to_string(),
            avatar: "👑".to_string(),
            created_at: time(),
            is_custom: false,
        };
        
        state.accounts.insert(owner_principal, owner_account);
        state.balances.insert(owner_principal, OWNER_INITIAL_BALANCE);
        
        // Create some demo accounts
        create_demo_accounts(&mut state);
    });
}

fn create_demo_accounts(state: &mut State) {
    let demo_accounts = vec![
        ("Alice Johnson", "👩‍💼", 1000),
        ("Bob Smith", "👨‍💻", 750),
        ("Charlie Davis", "👨‍🎨", 500),
        ("Diana Wilson", "👩‍🔬", 1250),
        ("Eva Martinez", "👩‍🎓", 300),
    ];
    
    for (name, avatar, balance) in demo_accounts {
        // Generate a pseudo-principal for demo accounts
        let principal_bytes = format!("demo_{}", name).as_bytes();
        let mut padded_bytes = vec![0u8; 29];
        let copy_len = std::cmp::min(principal_bytes.len(), 29);
        padded_bytes[..copy_len].copy_from_slice(&principal_bytes[..copy_len]);
        
        if let Ok(principal) = Principal::try_from_slice(&padded_bytes) {
            let account = Account {
                principal,
                name: name.to_string(),
                avatar: avatar.to_string(),
                created_at: time(),
                is_custom: false,
            };
            
            state.accounts.insert(principal, account);
            state.balances.insert(principal, balance);
        }
    }
}

#[update]
fn register() -> WalletInfo {
    let caller_principal = caller();
    STATE.with(|s| {
        let state = s.borrow();
        match state.balances.get(&caller_principal) {
            Some(balance) => WalletInfo { 
                user_principal: caller_principal, 
                balance: *balance 
            },
            None => WalletInfo { 
                user_principal: caller_principal, 
                balance: 0 
            },
        }
    })
}

#[update]
fn create_account(name: String, avatar: String) -> CreateAccountResult {
    let caller_principal = caller();
    
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        
        // Check if caller already has an account
        if state.accounts.contains_key(&caller_principal) {
            return CreateAccountResult {
                success: false,
                message: "Account already exists for this principal".to_string(),
                account: None,
            };
        }
        
        // Check name uniqueness
        for account in state.accounts.values() {
            if account.name.to_lowercase() == name.to_lowercase() {
                return CreateAccountResult {
                    success: false,
                    message: "Account name already exists".to_string(),
                    account: None,
                };
            }
        }
        
        // Check custom account limit
        if state.custom_account_count >= MAX_FREE_ACCOUNTS {
            return CreateAccountResult {
                success: false,
                message: "Maximum of 15 free accounts reached. Contact admin for more accounts.".to_string(),
                account: None,
            };
        }
        
        // Create new account
        let account = Account {
            principal: caller_principal,
            name: name.clone(),
            avatar: avatar.clone(),
            created_at: time(),
            is_custom: true,
        };
        
        state.accounts.insert(caller_principal, account.clone());
        state.balances.insert(caller_principal, WELCOME_BONUS);
        state.custom_account_count += 1;
        
        // Transfer welcome bonus from owner if owner has enough balance
        if let Some(owner) = state.owner {
            if let Some(owner_balance) = state.balances.get_mut(&owner) {
                if *owner_balance >= WELCOME_BONUS {
                    *owner_balance -= WELCOME_BONUS;
                    
                    // Record transaction
                    let transaction = Transaction {
                        from: owner,
                        to: caller_principal,
                        amount: WELCOME_BONUS,
                        timestamp: time(),
                    };
                    state.transaction_log.push(transaction);
                }
            }
        }
        
        CreateAccountResult {
            success: true,
            message: format!(
                "Account \"{}\" created successfully with {} VAL welcome bonus! ({} free accounts remaining)",
                name,
                WELCOME_BONUS,
                MAX_FREE_ACCOUNTS - state.custom_account_count
            ),
            account: Some(account),
        }
    })
}

#[update]
fn transfer(to: Principal, amount: u64) -> Result<String, String> {
    let from = caller();
    if to == from { 
        return Err("Cannot transfer to yourself.".to_string()); 
    }

    STATE.with(|s| {
        let mut state = s.borrow_mut();
        let from_balance = state.balances.get_mut(&from)
            .ok_or("Your account does not exist.".to_string())?;
        
        if *from_balance < amount { 
            return Err("Insufficient funds.".to_string()); 
        }

        *from_balance -= amount;
        let to_balance = state.balances.entry(to).or_insert(0);
        *to_balance += amount;

        let transaction = Transaction { 
            from, 
            to, 
            amount, 
            timestamp: time() 
        };
        state.transaction_log.push(transaction);

        Ok("Transfer successful.".to_string())
    })
}

#[query]
fn get_wallet_info() -> Result<WalletInfo, String> {
    let principal = caller();
    STATE.with(|s| {
        let state = s.borrow();
        match state.balances.get(&principal) {
            Some(balance) => Ok(WalletInfo { 
                user_principal: principal, 
                balance: *balance 
            }),
            None => Err("User not found.".to_string()),
        }
    })
}

#[query]
fn get_transaction_history() -> Vec<Transaction> {
    let principal = caller();
    STATE.with(|s| {
        s.borrow().transaction_log.iter()
            .filter(|tx| tx.from == principal || tx.to == principal)
            .cloned()
            .collect()
    })
}

#[query]
fn get_all_accounts() -> Vec<Account> {
    STATE.with(|s| {
        s.borrow().accounts.values().cloned().collect()
    })
}

#[query]
fn is_owner() -> bool {
    let principal = caller();
    STATE.with(|s| {
        let state = s.borrow();
        state.owner == Some(principal)
    })
}

#[query]
fn get_all_transactions() -> Vec<Transaction> {
    let principal = caller();
    STATE.with(|s| {
        let state = s.borrow();
        // Only owner can see all transactions
        if state.owner == Some(principal) {
            state.transaction_log.clone()
        } else {
            // Regular users only see their own transactions
            state.transaction_log.iter()
                .filter(|tx| tx.from == principal || tx.to == principal)
                .cloned()
                .collect()
        }
    })
}

#[query]
fn get_system_stats() -> SystemStats {
    let principal = caller();
    STATE.with(|s| {
        let state = s.borrow();
        
        // Only owner can see system stats
        if state.owner != Some(principal) {
            return SystemStats {
                total_supply: 0,
                total_accounts: 0,
                total_transactions: 0,
                owner_balance: 0,
                circulating_supply: 0,
            };
        }
        
        let total_supply: u64 = state.balances.values().sum();
        let owner_balance = state.owner
            .and_then(|owner| state.balances.get(&owner))
            .copied()
            .unwrap_or(0);
        let circulating_supply = total_supply.saturating_sub(owner_balance);
        
        SystemStats {
            total_supply,
            total_accounts: state.accounts.len() as u32,
            total_transactions: state.transaction_log.len() as u32,
            owner_balance,
            circulating_supply,
        }
    })
}

#[update]
fn mint_tokens(amount: u64) -> SimpleResult {
    let principal = caller();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        
        // Only owner can mint tokens
        if state.owner != Some(principal) {
            return SimpleResult {
                success: false,
                message: "Only owner can mint tokens".to_string(),
            };
        }
        
        let owner_balance = state.balances.entry(principal).or_insert(0);
        *owner_balance += amount;
        
        // Record minting transaction
        let transaction = Transaction {
            from: principal,
            to: principal,
            amount,
            timestamp: time(),
        };
        state.transaction_log.push(transaction);
        
        SimpleResult {
            success: true,
            message: format!("Successfully minted {} VAL tokens", amount),
        }
    })
}

#[update]
fn burn_tokens(amount: u64) -> SimpleResult {
    let principal = caller();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        
        // Only owner can burn tokens
        if state.owner != Some(principal) {
            return SimpleResult {
                success: false,
                message: "Only owner can burn tokens".to_string(),
            };
        }
        
        let owner_balance = match state.balances.get_mut(&principal) {
            Some(balance) => balance,
            None => return SimpleResult {
                success: false,
                message: "Owner account not found".to_string(),
            },
        };
        
        if *owner_balance < amount {
            return SimpleResult {
                success: false,
                message: "Insufficient balance to burn".to_string(),
            };
        }
        
        *owner_balance -= amount;
        
        // Record burning transaction
        let transaction = Transaction {
            from: principal,
            to: principal,
            amount,
            timestamp: time(),
        };
        state.transaction_log.push(transaction);
        
        SimpleResult {
            success: true,
            message: format!("Successfully burned {} VAL tokens", amount),
        }
    })
}

candid::export_service!();