const messageSchema = {
  type: 'message',  // partition key
  id: '', // unique identifier
  senderId: '', // user id of sender
  recipientId: '', // user id of recipient
  content: '', // message content
  read: false, // read status
  createdAt: '', // timestamp
  updatedAt: '' // timestamp
};

class Message {
  static create(data) {
    return {
      type: 'message',
      id: data.id || `message-${Date.now()}`,
      senderId: data.senderId,
      recipientId: data.recipientId,
      content: data.content,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

export default Message; 