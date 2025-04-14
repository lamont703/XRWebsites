use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("RWD1111111111111111111111111111111111111111");

// Core interfaces
pub trait RewardRouter {
    fn initialize(&mut self, authority: &Pubkey) -> Result<()>;
    fn update_authority(&mut self, new_authority: &Pubkey) -> Result<()>;
    fn route_rewards(&mut self, amount: u64, destination: &Pubkey) -> Result<()>;
}

pub trait BountyManager {
    fn create_bounty(&mut self, amount: u64, description: String) -> Result<()>;
    fn submit_bounty(&mut self, bounty_id: &Pubkey, submission: String) -> Result<()>;
    fn approve_bounty(&mut self, bounty_id: &Pubkey) -> Result<()>;
}

pub trait ReferralManager {
    fn create_referral_code(&mut self, code: String) -> Result<()>;
    fn register_referral(&mut self, referrer: &Pubkey, code: String) -> Result<()>;
    fn claim_referral_reward(&mut self, code: String) -> Result<()>;
}

#[program]
pub mod reward_program_dapp {
    use super::*;

    // Simplified NFT minting function that doesn't rely on Metaplex
    pub fn mint_onboarding_nft(
        ctx: Context<MintOnboardingNft>,
        metadata: NftMetadata,
    ) -> Result<()> {
        // Initialize the mint
        token::initialize_mint(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::InitializeMint {
                    mint: ctx.accounts.mint.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            0, // 0 decimals for NFT
            ctx.accounts.payer.key,
            Some(ctx.accounts.payer.key),
        )?;

        // Create associated token account for recipient
        anchor_spl::associated_token::create(CpiContext::new(
            ctx.accounts.associated_token_program.to_account_info(),
            anchor_spl::associated_token::Create {
                payer: ctx.accounts.payer.to_account_info(),
                associated_token: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.recipient.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ))?;

        // Mint 1 token to the recipient's token account
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            1, // Mint exactly 1 token for an NFT
        )?;

        // Store metadata in our own PDA account
        ctx.accounts.metadata.set_inner(TokenMetadata {
            mint: ctx.accounts.mint.key(),
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            seller_fee_basis_points: metadata.seller_fee_basis_points,
            creator_address: metadata.creators.address,
            creator_verified: metadata.creators.verified,
            creator_share: metadata.creators.share,
        });

        Ok(())
    }

    // Implementation for other functions will go here
}

#[derive(Accounts)]
pub struct MintOnboardingNft<'info> {
    /// The recipient of the NFT - does NOT need to sign
    #[account(mut)]
    pub recipient: AccountInfo<'info>,

    /// The mint account for the NFT
    #[account(
        init,
        payer = payer,
        space = 82,
        mint::decimals = 0,
        mint::authority = payer,
    )]
    pub mint: Account<'info, Mint>,

    /// The token account to receive the NFT
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// The payer for the transaction - this DOES need to sign
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The metadata account to store NFT information
    #[account(
        init,
        payer = payer,
        space = 8 + TokenMetadata::SIZE,
        seeds = [b"metadata", mint.key().as_ref()],
        bump
    )]
    pub metadata: Account<'info, TokenMetadata>,

    /// The system program
    pub system_program: Program<'info, System>,

    /// The token program
    pub token_program: Program<'info, Token>,

    /// The associated token program
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

// Define our own metadata structure that doesn't rely on Metaplex
#[account]
pub struct TokenMetadata {
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub seller_fee_basis_points: u16,
    pub creator_address: Pubkey,
    pub creator_verified: bool,
    pub creator_share: u8,
}

impl TokenMetadata {
    pub const SIZE: usize = 32 + // mint
                           32 + // name (max)
                           10 + // symbol (max)
                           200 + // uri (max)
                           2 + // seller_fee_basis_points
                           32 + // creator_address
                           1 + // creator_verified
                           1; // creator_share
}

// Define the metadata structure for the instruction
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct NftMetadata {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub seller_fee_basis_points: u16,
    pub creators: Creator,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Creator {
    pub address: Pubkey,
    pub verified: bool,
    pub share: u8,
}