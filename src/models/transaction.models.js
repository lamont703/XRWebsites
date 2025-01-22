/*Table Transactions {
  id               uuid [primary key]
  wallet_id        uuid [not null, ref: > Wallets.id]
  type             enum("Deposit", "Withdrawal", "Purchase") [not null]
  amount_xrw       decimal [not null]
  created_at       datetime [default: `now()`]
  status           enum("Pending", "Completed", "Failed") [default: "Pending"]
  details          text
}*/

import { Schema } from "@azure/cosmos-schema";
import { CosmosClient } from "@azure/cosmos";

const transactionSchema = new Schema({
    wallet_id: { 
        type: String, 
        required: [true, "Wallet ID is required"], 
        index: true, 
        trim: true 
    },
    type: { 
        type: String, 
        trim: true 
    },
    amount_xrw: { 
        type: Number, 
        required: [true, "Amount is required"], 
    },
    created_at: { 
        type: Date, 
        default: new Date() 
    },
    status: { 
        type: String, 
        required: [true, "Status is required"], 
        trim: true 
    },
    details: { type: String, trim: true }
});

export const Transaction = CosmosClient.model("Transaction", transactionSchema);