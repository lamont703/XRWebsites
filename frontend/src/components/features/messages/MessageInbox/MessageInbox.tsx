import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/auth/Auth';
import { MainLayout } from '@/components/layout/MainLayout';
import LoadingOverlay from '@/components/layout/LoadingOverlay/LoadingOverlay';

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
      <div className="container mx-auto px-4 py-8 pt-10 lg:pt-8">
        <button
          onClick={handleBackClick}
          className="mb-4 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
        >
          Back to Profile
        </button>
        <div className="space-y-4">
          {conversations?.map((conversation: MessagePreview) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationClick(conversation.senderId)}
              className={`bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors
                ${conversation.unread ? 'border-l-4 border-blue-500' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  {conversation.senderAvatar ? (
                    <img 
                      src={conversation.senderAvatar} 
                      alt={conversation.senderName} 
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <span className="text-white font-bold">
                      {conversation.senderName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{conversation.senderName}</h3>
                      <p className="text-sm text-gray-400">@{conversation.senderUsername}</p>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(conversation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-2 line-clamp-1">{conversation.lastMessage}</p>
                </div>
              </div>
            </div>
          ))}
          
          {conversations?.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No messages yet
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}; 