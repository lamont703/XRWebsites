/*Table JobPostings {
  id               uuid [primary key]
  business_id      uuid [not null, ref: > Users.id]
  title            string [not null]
  description      text
  requirements     text
  category         string
  budget_xrw       decimal
  created_at       datetime [default: `now()`]
  updated_at       datetime [default: `now()`]
  status           enum("Open", "Closed") [default: "Open"]
}*/

import { Schema } from "@azure/cosmos-schema";
import { CosmosClient } from "@azure/cosmos";

const jobPostingSchema = new Schema({   
    business_id: { 
        type: String, 
        required: [true, "Business ID is required"], 
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
    requirements: { 
        type: String, 
        trim: true 
    },
    category: { 
        type: String, 
        trim: true 
    },
    budget_xrw: { 
        type: Number, 
        required: [true, "Budget is required"], 
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

export const JobPosting = CosmosClient.model("JobPosting", jobPostingSchema);