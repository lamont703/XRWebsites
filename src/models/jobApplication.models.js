/*Table JobApplications {
  id               uuid [primary key]
  job_id           uuid [not null, ref: > JobPostings.id]
  developer_id     uuid [not null, ref: > Users.id]
  cover_letter     text
  bid_xrw          decimal
  created_at       datetime [default: `now()`]
  status           enum("Pending", "Accepted", "Rejected") [default: "Pending"]
}*/

import { Schema } from "@azure/cosmos-schema";
import { CosmosClient } from "@azure/cosmos";

const jobApplicationSchema = new Schema({   
    job_id: { 
        type: String, 
        required: [true, "Job ID is required"], 
        index: true, 
        trim: true 
    },
    developer_id: { 
        type: String, 
        required: [true, "Developer ID is required"], 
        index: true, 
        trim: true 
    },
    cover_letter: { 
        type: String, 
        trim: true 
    },
    bid_xrw: { 
        type: Number, 
        required: [true, "Bid is required"], 
        default: 0 
    },
    created_at: { 
        type: Date, 
        default: new Date() 
    },
    status: { 
        type: String, 
        default: "Pending" 
    }
});                 

export const JobApplication = CosmosClient.model("JobApplication", jobApplicationSchema);