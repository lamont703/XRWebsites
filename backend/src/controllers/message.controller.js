import { getContainer } from '../database.js';
import Message from '../models/message.model.js';
import ApiError from '../utils/ApiError.js';

export const getMessages = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const container = await getContainer();
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'message' AND ((c.senderId = @currentUserId AND c.recipientId = @userId) OR (c.senderId = @userId AND c.recipientId = @currentUserId)) ORDER BY c.createdAt ASC",
      parameters: [
        { name: "@currentUserId", value: currentUserId },
        { name: "@userId", value: userId }
      ]
    };

    const { resources: messages } = await container.items.query(querySpec).fetchAll();
    return res.json({ messages });
  } catch (error) {
    throw new ApiError(500, "Failed to fetch messages");
  }
};

export const sendMessage = async (req, res) => {
  const { content } = req.body;
  const { userId: recipientId } = req.params;
  const senderId = req.user.id;

  try {
    const container = await getContainer();
    const message = Message.create({
      senderId,
      recipientId,
      content
    });

    const { resource: createdMessage } = await container.items.create(message);
    return res.status(201).json({ message: createdMessage });
  } catch (error) {
    throw new ApiError(500, "Failed to send message");
  }
};

export const getMessageInbox = async (req, res) => {
  const currentUserId = req.user.id;

  try {
    const container = await getContainer();
    
    // First get all messages
    const messageQuery = {
      query: `
        SELECT DISTINCT VALUE {
          'id': m.id,
          'senderId': m.senderId,
          'recipientId': m.recipientId,
          'content': m.content,
          'createdAt': m.createdAt,
          'read': m.read
        }
        FROM m 
        WHERE m.type = 'message' 
        AND (m.recipientId = @userId OR m.senderId = @userId)`,
      parameters: [
        { name: "@userId", value: currentUserId }
      ]
    };

    const { resources: messages } = await container.items.query(messageQuery).fetchAll();

    // Get unique user IDs from messages
    const userIds = [...new Set(messages.map(m => 
      m.senderId === currentUserId ? m.recipientId : m.senderId
    ))];

    // If no messages, return empty array
    if (userIds.length === 0) {
      return res.json({
        success: true,
        conversations: []
      });
    }

    // Get user details
    const userQuery = {
      query: `
        SELECT c.id, c.fullName as senderName, c.username as senderUsername, c.avatar as senderAvatar
        FROM c 
        WHERE c.type = 'user' 
        AND c.id IN (${userIds.map((_, i) => `@id${i}`).join(',')})`,
      parameters: userIds.map((id, index) => ({
        name: `@id${index}`,
        value: id
      }))
    };

    const { resources: users } = await container.items.query(userQuery).fetchAll();

    // Create conversations array
    const conversations = userIds.map(userId => {
      const userMessages = messages.filter(m => 
        m.senderId === userId || m.recipientId === userId
      );
      const lastMessage = userMessages.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0];
      const userDetails = users.find(u => u.id === userId);

      return {
        id: lastMessage.id,
        senderId: userId,
        senderName: userDetails?.senderName || 'Unknown User',
        senderUsername: userDetails?.senderUsername || 'unknown',
        senderAvatar: userDetails?.senderAvatar,
        lastMessage: lastMessage.content,
        createdAt: lastMessage.createdAt,
        unread: !lastMessage.read && lastMessage.recipientId === currentUserId
      };
    });

    return res.json({
      success: true,
      conversations: conversations.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
    });

  } catch (error) {
    console.error('Message inbox error:', error);
    throw new ApiError(500, "Failed to fetch message inbox");
  }
}; 