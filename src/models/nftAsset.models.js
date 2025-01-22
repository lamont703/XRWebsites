/*Table NFTAssets {
  id               uuid [primary key]
  owner_id         uuid [not null, ref: > Users.id]
  title            string [not null]
  description      text
  token_id         string [not null]
  blockchain       string [not null, default: "Solana"]
  preview_url      string
  created_at       datetime [default: `now()`]
}*/

import { Schema } from "@azure/cosmos-schema";
import { CosmosClient } from "@azure/cosmos";

const nftAssetSchema = new Schema({
    owner_id: { 
        type: String, 
        required: [true, "Owner ID is required"], 
        index: true, 
        trim: true 
    },
    title: { 
        type: String, 
        required: [true, "Title is required"], 
        trim: true 
    },
    description: { 
        type: String, 
        trim: true 
    },
    token_id: { 
        type: String, 
        required: [true, "Token ID is required"], 
        trim: true 
    },
    blockchain: { 
        type: String, 
        required: [true, "Blockchain is required"], 
        trim: true 
    },
    preview_url: { 
        type: String, 
        trim: true 
    },
    created_at: { 
        type: Date, 
        default: new Date() 
    }
});

export const NFTAsset = CosmosClient.model("NFTAsset", nftAssetSchema);