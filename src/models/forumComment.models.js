/*Table ForumComments {
  id               uuid [primary key]
  thread_id        uuid [not null, ref: > ForumThreads.id]
  user_id          uuid [not null, ref: > Users.id]
  content          text [not null]
  created_at       datetime [default: `now()`]
}*/

import { Schema } from "@azure/cosmos-schema";
import { CosmosClient } from "@azure/cosmos";

const forumCommentSchema = new Schema({ 
    thread_id: { 
        type: String, 
        required: [true, "Thread ID is required"], 
        index: true, 
        trim: true 
    },
    user_id: { 
        type: String, 
        required: [true, "User ID is required"], 
        index: true, 
        trim: true 
    },
    content: { 
        type: String, 
        required: [true, "Content is required"], 
        trim: true 
    },
    created_at: { 
        type: Date, 
        default: new Date() 
    }
}); 

export const ForumComment = CosmosClient.model("ForumComment", forumCommentSchema); 