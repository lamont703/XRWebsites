/*Table Wallets {
  id               uuid [primary key]
  user_id          uuid [not null, ref: > Users.id]
  balance_xrw      decimal [default: 0.0]
  external_address string
  created_at       datetime [default: `now()`]
  updated_at       datetime [default: `now()`]
}*/

import { Schema } from "@azure/cosmos-schema";
import { CosmosClient } from "@azure/cosmos";

const walletSchema = new Schema({
    user_id: { 
            type: String, 
        required: [true, "User ID is required"], 
        index: true, 
        trim: true 
    },
    balance_xrw: { 
        type: Number, 
        default: 0 
    },
    external_address: { 
        type: String, 
        trim: true 
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

export const Wallet = CosmosClient.model("Wallet", walletSchema);