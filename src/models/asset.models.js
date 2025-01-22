/*Table Assets {
  id               uuid [primary key]
  creator_id       uuid [not null, ref: > Users.id]
  title            string [not null]
  description      text
  category         string
  tags             string[]
  file_url         string [not null]
  preview_url      string
  price_xrw        decimal
  is_tokenized     boolean [default: false]
  token_id         string
  views            int [default: 0]
  downloads        int [default: 0]
  created_at       datetime [default: `now()`]
  updated_at       datetime [default: `now()`]
}*/

import { Schema } from "@azure/cosmos-schema";
import { CosmosClient } from "@azure/cosmos";

const assetSchema = new Schema({
    creator_id: { 
        type: String, 
        required: [true, "Creator ID is required"], 
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
    category: { 
        type: String, 
        trim: true 
    },
    tags: { 
        type: [String], 
        default: [] 
    },
    file_url: { 
        type: String, 
        required: [true, "File URL is required"], 
        trim: true 
    },
    preview_url: { 
        type: String, 
        trim: true 
    },
    price_xrw: { 
        type: Number, 
    },
    is_tokenized: { 
        type: Boolean, 
        default: false 
    },
    token_id: { 
        type: String, 
        trim: true 
    },
    views: { 
        type: Number, 
        default: 0 
    },
    downloads: { 
        type: Number, 
        default: 0 
    },
    created_at: { 
        type: Date, 
        default: new Date() 
    },
    updated_at: { 
        type: Date, 
        default: new Date() 
    }
});

export const Asset = CosmosClient.model("Asset", assetSchema);