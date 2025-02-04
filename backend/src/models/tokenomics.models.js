import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";
import ApiError from "../utils/ApiError.js";
import { getContainer } from "../database.js";

dotenv.config();

const TokenMetrics = {
    async findByTokenId(tokenId) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'tokenMetrics' AND c.tokenId = @tokenId",
                parameters: [{ name: "@tokenId", value: tokenId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0] || null;
        } catch (error) {
            console.error("Error in findByTokenId:", error);
            throw error;
        }
    },

    async create(metricsData) {
        try {
            const container = await getContainer();
            metricsData.id = `tokenMetrics-${Date.now()}`;
            metricsData.type = 'tokenMetrics';
            metricsData.created_at = new Date();
            metricsData.updated_at = new Date();
            
            const { resource } = await container.items.create(metricsData);
            return resource;
        } catch (error) {
            console.error("Error in create:", error);
            throw error;
        }
    },

    async updateMetrics(tokenId, updates) {
        try {
            const container = await getContainer();
            const metrics = await this.findByTokenId(tokenId);
            if (!metrics) return null;

            const updatedMetrics = {
                ...metrics,
                ...updates,
                updated_at: new Date()
            };

            const { resource } = await container.items.upsert(updatedMetrics);
            return resource;
        } catch (error) {
            console.error("Error in updateMetrics:", error);
            throw error;
        }
    }
};

export default TokenMetrics;