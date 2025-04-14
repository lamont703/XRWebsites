import { getContainer } from "../database.js";
import ApiError from "../utils/ApiError.js";

const OnboardingStatus = {
    async create(userData) {
        try {
            const container = await getContainer();
            
            const onboardingDocument = {
                id: `onboarding-${Date.now()}`,
                type: 'onboarding',
                user_id: userData.userId,
                wallet_address: userData.walletAddress,
                role: userData.role,
                status: 'completed',
                completed_at: new Date().toISOString(),
                steps_completed: [
                    'registration',
                    'wallet_connection'
                ],
                referral_code: userData.referralCode || null
            };

            const { resource } = await container.items.create(onboardingDocument);
            return resource;
        } catch (error) {
            console.error("Error creating onboarding status:", error);
            throw new ApiError(500, "Failed to create onboarding status");
        }
    },

    async getStatus(userId) {
        try {
            const container = await getContainer();
            const { resources } = await container.items
                .query({
                    query: "SELECT * FROM c WHERE c.type = 'onboarding' AND c.user_id = @userId",
                    parameters: [{ name: "@userId", value: userId }]
                })
                .fetchAll();
            
            return resources[0] || null;
        } catch (error) {
            console.error("Error fetching onboarding status:", error);
            throw new ApiError(500, "Failed to fetch onboarding status");
        }
    }
};

export default OnboardingStatus; 