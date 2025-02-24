import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import LoadingOverlay from '@/components/layout/LoadingOverlay/LoadingOverlay';
import { toast } from 'react-hot-toast';

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
    navigate(`/users/${userId}`);
  };

  if (isLoading) return <LoadingOverlay isLoading={true} />;

  return (
    <MainLayout>
      <div className="p-4">
        <button
          onClick={handleBackClick}
          className="mb-4 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
        >
          Back to Profile
        </button>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gray-800 rounded-lg p-6 max-w-3xl mx-auto">
            <div className="h-[500px] overflow-y-auto mb-4 space-y-4">
              {messages?.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.senderId === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Type your message..."
              />
              <button
                onClick={() => sendMessageMutation.mutate(message)}
                disabled={!message.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 