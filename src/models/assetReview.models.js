/*Table AssetReviews {
  id               uuid [primary key]
  asset_id         uuid [not null, ref: > Assets.id]
  user_id          uuid [not null, ref: > Users.id]
  rating           int [not null, default: 0]
  comment          text
  created_at       datetime [default: `now()`]
}*/

import { Schema } from "@azure/cosmos-schema";
import { CosmosClient } from "@azure/cosmos";

const assetReviewSchema = new Schema({
    asset_id: { 
        type: String, 
        required: [true, "Asset ID is required"], 
        index: true, 
        trim: true 
    },
    user_id: { 
        type: String, 
        required: [true, "User ID is required"], 
        index: true, 
        trim: true 
    },
    rating: { 
        type: Number, 
        required: [true, "Rating is required"], 
        default: 0 
    },
    comment: { 
        type: String, 
        trim: true 
    },
    created_at: { 
        type: Date, 
        default: new Date() 
    }
});

export const AssetReview = CosmosClient.model("AssetReview", assetReviewSchema);