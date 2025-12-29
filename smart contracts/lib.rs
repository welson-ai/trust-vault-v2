use anchor_lang::prelude::*;

declare_id!("EscroW1111111111111111111111111111111111");

#[program]
pub mod trust_vault_escrow {
    use super::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        amount: u64,
        expiry: i64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.payer = ctx.accounts.payer.key();
        escrow.payee = ctx.accounts.payee.key();
        escrow.amount = amount;
        escrow.expiry = expiry;
        escrow.released = false;

        // Move funds into vault PDA
        **ctx.accounts.payer.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? += amount;

        Ok(())
    }

    pub fn release(ctx: Context<Release>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(!escrow.released, EscrowError::AlreadyReleased);

        escrow.released = true;

        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= escrow.amount;
        **ctx.accounts.payee.to_account_info().try_borrow_mut_lamports()? += escrow.amount;

        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        let clock = Clock::get()?;

        require!(clock.unix_timestamp > escrow.expiry, EscrowError::NotExpired);

        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= escrow.amount;
        **ctx.accounts.payer.to_account_info().try_borrow_mut_lamports()? += escrow.amount;

        Ok(())
    }
}
