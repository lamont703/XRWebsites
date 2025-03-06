import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/auth/Auth';
import { MainLayout } from '@/components/layout/MainLayout';
import LoadingOverlay from '@/components/layout/LoadingOverlay/LoadingOverlay';
import styles from '@/styles/MessageInbox.module.css';

interface MessagePreview {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar?: string;
  lastMessage: string;
  createdAt: string;
  unread: boolean;
}

export const MessageInbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['message-previews'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/messages/inbox`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch message previews');
      const data = await response.json();
      return data.conversations;
    }
  });

  const handleConversationClick = (userId: string) => {
    navigate(`/messages/${userId}`);
  };

  const handleBackClick = () => {
    navigate(`/users/${user?.id}`);
  };

  if (isLoading) return <LoadingOverlay isLoading={true} />;

  return (
    <MainLayout>
      <div className={styles.container}>
        <button
          onClick={handleBackClick}
          className={styles.backButton}
        >
          Back to Profile
        </button>
        <div className={styles.conversationsList}>
          {conversations?.map((conversation: MessagePreview) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationClick(conversation.senderId)}
              className={`${styles.conversationCard} ${
                conversation.unread ? styles.unreadCard : ''
              }`}
            >
              <div className={styles.cardContent}>
                <div className={styles.avatar}>
                  {conversation.senderAvatar ? (
                    <img 
                      src={conversation.senderAvatar} 
                      alt={conversation.senderName} 
                      className={styles.avatarImage}
                    />
                  ) : (
                    <span className={styles.avatarFallback}>
                      {conversation.senderName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className={styles.messageInfo}>
                  <div className={styles.messageHeader}>
                    <div>
                      <h3 className={styles.userName}>{conversation.senderName}</h3>
                      <p className={styles.userHandle}>@{conversation.senderUsername}</p>
                    </div>
                    <span className={styles.timestamp}>
                      {new Date(conversation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={styles.lastMessage}>{conversation.lastMessage}</p>
                </div>
              </div>
            </div>
          ))}
          
          {conversations?.length === 0 && (
            <div className={styles.emptyState}>
              No messages yet
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}; 