import { getContainer } from "../database.js";
import { Wallet } from "../models/wallet.models.js";
import { ReferralCode } from "../models/referral.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import OnboardingStatus from '../models/onboarding.models.js';

const completeOnboarding = asyncHandler(async (req, res) => {
    try {
        const { walletAddress, referralCode } = req.body;
        const userId = req.user.id;
        const container = await getContainer();

        // 1. Update user with wallet
        const { resource: user } = await container.item(userId, 'user').patch([
            {
                op: "set",
                path: "/walletAddress",
                value: walletAddress
            },
            {
                op: "set",
                path: "/onboardingComplete",
                value: true
            }
        ]);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // 2. Create or get wallet record
        const { resources: existingWallets } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.type = 'wallet' AND c.address = @address",
                parameters: [{ name: "@address", value: walletAddress }]
            })
            .fetchAll();

        let wallet;
        if (existingWallets.length === 0) {
            const newWallet = new Wallet({
                address: walletAddress,
                user_id: userId
            });
            const { resource: createdWallet } = await container.items.create(newWallet);
            wallet = createdWallet;
        }

        // 3. Process referral if exists
        if (referralCode) {
            const { resources: referrals } = await container.items
                .query({
                    query: "SELECT * FROM c WHERE c.type = 'referral' AND c.code = @code",
                    parameters: [{ name: "@code", value: referralCode }]
                })
                .fetchAll();

            if (referrals.length > 0) {
                const referral = referrals[0];
                await container.item(referral.id, referral.type).patch([
                    { op: "incr", path: "/timesUsed", value: 1 },
                    { op: "add", path: "/usedBy/-", value: userId }
                ]);
            }
        }

        // 4. Create onboarding status record
        const onboardingStatus = await OnboardingStatus.create({
            userId,
            walletAddress,
            role: user.role,
            referralCode
        });

        return res.json(
            new ApiResponse(200, {
                wallet,
                onboardingStatus
            }, "Onboarding completed successfully")
        );

    } catch (error) {
        console.error('Error in completeOnboarding:', error);
        throw new ApiError(500, "Failed to complete onboarding process");
    }
});

export { completeOnboarding }; 