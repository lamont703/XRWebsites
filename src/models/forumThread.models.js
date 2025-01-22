/*Table ForumThreads {
  id               uuid [primary key]
  user_id          uuid [not null, ref: > Users.id]
  title            string [not null]
  content          text [not null]
  created_at       datetime [default: `now()`]
  updated_at       datetime [default: `now()`]
}*/

import { Schema } from "@azure/cosmos-schema";
import { CosmosClient } from "@azure/cosmos";

const forumThreadSchema = new Schema({
    user_id: { 
        type: String, 
        required: [true, "User ID is required"], 
        index: true, 
        trim: true 
    },
    title: { 
        type: String, 
        required: [true, "Title is required"], 
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
    },
    updated_at: { 
        type: Date, 
        default: new Date() 
    }
});

export const ForumThread = CosmosClient.model("ForumThread", forumThreadSchema);