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