import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import LoadingOverlay from '@/components/layout/LoadingOverlay/LoadingOverlay';
import { toast } from 'react-hot-toast';
import styles from '@/styles/Messages.module.css';

export const Messages = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', userId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/messages/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      return data.messages;
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/messages/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', userId] });
      setMessage('');
      toast.success('Message sent');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    }
  });

  const handleBackClick = () => {
    navigate('/messages/inbox');
  };

  if (isLoading) return <LoadingOverlay isLoading={true} />;

  return (
    <MainLayout>
      <div className={styles.container}>
        <button
          onClick={handleBackClick}
          className={styles.backButton}
        >
          Back to Messages
        </button>
        <div className={styles.messageCard}>
          <div className={styles.messagesContainer}>
            {messages?.map((msg: any) => (
              <div
                key={msg.id}
                className={`${styles.messageWrapper} ${
                  msg.senderId === user?.id ? styles.messageWrapperSent : styles.messageWrapperReceived
                }`}
              >
                <div
                  className={`${styles.message} ${
                    msg.senderId === user?.id ? styles.messageSent : styles.messageReceived
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.inputContainer}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={styles.input}
              placeholder="Type your message..."
            />
            <button
              onClick={() => sendMessageMutation.mutate(message)}
              disabled={!message.trim()}
              className={styles.sendButton}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 