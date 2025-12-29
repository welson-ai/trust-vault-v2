#[account]
pub struct Escrow {
    pub payer: Pubkey,
    pub payee: Pubkey,
    pub amount: u64,
    pub expiry: i64,
    pub released: bool,
}
