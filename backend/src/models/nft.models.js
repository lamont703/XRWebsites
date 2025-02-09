import { getContainer } from "../database.js";

export const NFT = {
    async findByUserId(userId) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'nft' AND c.userId = @userId",
                parameters: [{ name: "@userId", value: userId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in findByUserId:", error);
            throw error;
        }
    }
}; 