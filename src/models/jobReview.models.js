/*Table JobReviews {
  id               uuid [primary key]
  job_id           uuid [not null, ref: > JobPostings.id]
  reviewer_id      uuid [not null, ref: > Users.id]
  rating           int [not null, default: 0]
  comment          text
  created_at       datetime [default: `now()`]
}*/

import { Schema } from "@azure/cosmos-schema";
import { CosmosClient } from "@azure/cosmos";

const jobReviewSchema = new Schema({    
    job_id: { 
        type: String, 
        required: [true, "Job ID is required"], 
        index: true, 
        trim: true 
    },
    reviewer_id: { 
        type: String, 
        required: [true, "Reviewer ID is required"], 
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
        trim: true },
    created_at: { 
        type: Date, 
        default: new Date() 
    }
}); 

export const JobReview = CosmosClient.model("JobReview", jobReviewSchema);  