use candid::{CandidType, Principal};
use ic_cdk::{query, update, init, post_upgrade, caller, api::time};
use ic_cdk_timers::TimerId;
use serde::Deserialize;
use std::cell::RefCell;
use std::collections::HashMap;
use std::time::Duration;

type Balances = HashMap<Principal, u64>;

#[derive(CandidType, Clone, Deserialize)]
struct Transaction {
    from: Principal,
    to: Principal,
    amount: u64,
    timestamp: u64,
}

#[derive(CandidType, Deserialize, Default)]
struct State {
    balances: Balances,
    registered_users: Vec<Principal>,
    transaction_log: Vec<Transaction>,
    weekly_timer_id: Option<TimerId>,
}

#[derive(CandidType)]
struct WalletInfo {
    principal: Principal,
    balance: u64,
}

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State::default());
}

const AIRDROP_COUNT: usize = 20;
const AIRDROP_AMOUNT: u64 = 100;
const WEEKLY_MINT_AMOUNT: u64 = 10;

fn start_weekly_timer() {
    let weekly_interval = Duration::from_secs(60 * 60 * 24 * 7);
    let timer_id = ic_cdk_timers::set_timer_interval(weekly_interval, || {
        ic_cdk::spawn(mint_new_coins());
    });
    STATE.with(|s| s.borrow_mut().weekly_timer_id = Some(timer_id));
}

#[init]
fn init() { start_weekly_timer(); }

#[post_upgrade]
fn post_upgrade() { start_weekly_timer(); }

async fn mint_new_coins() {
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        for principal in &state.registered_users {
            let balance = state.balances.entry(*principal).or_insert(0);
            *balance += WEEKLY_MINT_AMOUNT;
        }
    });
}

#[update]
fn register() -> WalletInfo {
    let caller_principal = caller();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        if let Some(balance) = state.balances.get(&caller_principal) {
            return WalletInfo { principal: caller_principal, balance: *balance };
        }
        state.registered_users.push(caller_principal);
        let user_index = state.registered_users.len();
        let mut initial_balance = 0;
        if user_index <= AIRDROP_COUNT {
            initial_balance = AIRDROP_AMOUNT;
        }
        state.balances.insert(caller_principal, initial_balance);
        WalletInfo { principal: caller_principal, balance: initial_balance }
    })
}

#[update]
fn transfer(to: Principal, amount: u64) -> Result<String, String> {
    let from = caller();
    if to == from { return Err("Cannot transfer to yourself.".to_string()); }

    STATE.with(|s| {
        let mut state = s.borrow_mut();
        let from_balance = state.balances.get_mut(&from).ok_or("Your account does not exist.".to_string())?;
        if *from_balance < amount { return Err("Insufficient funds.".to_string()); }

        *from_balance -= amount;
        let to_balance = state.balances.entry(to).or_insert(0);
        *to_balance += amount;

        let transaction = Transaction { from, to, amount, timestamp: time() };
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
            Some(balance) => Ok(WalletInfo { principal, balance: *balance }),
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

candid::export_service!();