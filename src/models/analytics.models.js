/*Table Analytics {
  id               uuid [primary key]
  type             enum("UserActivity", "AssetPerformance", "JobBoardTrends") [not null]
  entity_id        uuid [not null]
  data             json [not null]
  timestamp        datetime [default: `now()`]
}*/

import { Schema } from "@azure/cosmos-schema";
import { CosmosClient } from "@azure/cosmos";

const analyticsSchema = new Schema({    
    type: { 
        type: String, 
        required: [true, "Type is required"], 
        enum: ["UserActivity", "AssetPerformance", "JobBoardTrends"] 
    },
    entity_id: { 
        type: String, 
        required: [true, "Entity ID is required"], 
        index: true, 
        trim: true 
    },
    data: { 
        type: Object, 
        required: [true, "Data is required"] 
    },
    timestamp: { 
        type: Date, 
        default: new Date() 
    }
}); 

export const Analytics = CosmosClient.model("Analytics", analyticsSchema);  