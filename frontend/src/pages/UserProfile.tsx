import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import LoadingOverlay from '@/components/layout/LoadingOverlay/LoadingOverlay';
import { useAuth } from '@/store/auth/Auth';
import { toast } from 'react-hot-toast';

export const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user data');
      const data = await response.json();
      return data.data; // Assuming the API returns { data: { user data... } }
    }
  });

  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/forum/users/${userId}/posts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user posts');
      const data = await response.json();
      return data.data.posts; // Access posts through the data property of ApiResponse
    }
  });

  const handleMessageClick = () => {
    if (!user) {
      toast.error('Please login to send messages');
      return;
    }
    navigate('/messages/inbox');
  };

  const handlePostClick = (postId: string) => {
    navigate(`/forum/posts/${postId}`, {
      state: { 
        from: 'profile',
        userId: userId 
      }
    });
  };

  // Add console logs to debug the condition
  console.log('Current user:', user);
  console.log('Profile user ID:', userId);
  console.log({
    userExists: !!user,
    userIdExists: !!userId,
    userIdMatch: user?.id !== userData?.id,
    userData
  });

  if (userLoading || postsLoading) return <LoadingOverlay isLoading={true} />;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 pt-20 lg:pt-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                {userData?.avatar ? (
                  <img src={userData.avatar} alt={userData.name} className="w-full h-full rounded-full" />
                ) : (
                  <span className="text-white text-4xl font-bold">
                    {userData?.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{userData?.name}</h1>
                <p className="text-gray-400">@{userData?.username}</p>
              </div>
            </div>
            {user && userData && (user.id !== userData.id) && (
              <button
                type="button"
                onClick={handleMessageClick}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Message
              </button>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Posts</h2>
              <div className="space-y-4">
                {userPosts?.length > 0 ? (
                  userPosts.map((post: any) => (
                    <div 
                      key={post.id}
                      onClick={() => handlePostClick(post.id)}
                      className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                    >
                      <h3 className="text-white font-medium mb-2">{post.title}</h3>
                      <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>👍 {post.likes || 0}</span>
                        <span>💬 {post.replies || 0}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No posts yet</p>
                )}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Activity</h2>
              {/* Add user's activity here */}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 