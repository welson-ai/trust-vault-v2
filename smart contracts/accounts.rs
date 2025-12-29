#[derive(Accounts)]
pub struct CreateEscrow<'info> {
    #[account(init, payer = payer, space = 8 + 32 + 32 + 8 + 8 + 1)]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: recipient
    pub payee: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"vault", escrow.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Release<'info> {
    #[account(mut, has_one = payee)]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub payee: Signer<'info>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut, has_one = payer)]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
}
