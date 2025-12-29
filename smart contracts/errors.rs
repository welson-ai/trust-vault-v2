#[error_code]
pub enum EscrowError {
    #[msg("Escrow already released")]
    AlreadyReleased,
    #[msg("Escrow has not expired yet")]
    NotExpired,
}
