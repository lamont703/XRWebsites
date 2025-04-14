import { getContainer } from "../database.js";
import ApiError from "../utils/ApiError.js";

const OnboardingNFT = {
    async create(userData) {
        try {
            const container = await getContainer();
            
            const nftDocument = {
                id: `onboarding-nft-${Date.now()}`,
                type: 'onboarding-nft',
                name: "Key To The New Earth",
                description: `Official proof of onboarding for ${userData.username}`,
                owner_wallet_id: userData.walletAddress,
                creator_id: 'system',
                status: 'active',
                soulbound: true,
                created_at: new Date().toISOString(),
                metadata: {
                    name: "Key To The New Earth",
                    description: "This digital key represents more than access—it marks your entrance into a new realm of co-creation. As a holder of the Key to the New Earth, you are recognized as a visionary, a builder, and a divine collaborator in the unfolding reality of Heaven on Earth.<br><br>This NFT is your spiritual and technological passport, unlocking tools, spaces, and opportunities within a decentralized, extended-reality ecosystem shaped by faith, freedom, and higher intelligence. You are not joining a platform—you are crossing into a new dimension of purpose.",
                    dateJoined: new Date().toISOString(),
                    walletAddress: userData.walletAddress,
                    platformRole: userData.role || 'Developer',
                    attributes: [
                        {
                            trait_type: "Type",
                            value: "Soulbound"
                        },
                        {
                            trait_type: "Platform Role",
                            value: userData.role || "Developer"
                        },
                        {
                            trait_type: "Join Date",
                            value: new Date().toISOString().split('T')[0]
                        }
                    ]
                }
            };

            const { resource } = await container.items.create(nftDocument);
            return resource;
        } catch (error) {
            console.error("Error creating onboarding NFT:", error);
            throw new ApiError(500, "Failed to create onboarding NFT");
        }
    }
};

export default OnboardingNFT; 