import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import LoadingOverlay from '@/components/layout/LoadingOverlay/LoadingOverlay';
import { useAuth } from '@/store/auth/Auth';
import { toast } from 'react-hot-toast';
import styles from '@/styles/UserProfile.module.css';

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
      <div className={styles.container}>
        <div className={styles.profileCard}>
          <div className={styles.header}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {userData?.avatar ? (
                  <img src={userData.avatar} alt={userData.name} className={styles.avatarImage} />
                ) : (
                  <span className={styles.avatarFallback}>
                    {userData?.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <div>
                <h1 className={styles.userName}>{userData?.name}</h1>
                <p className={styles.userHandle}>@{userData?.username}</p>
              </div>
            </div>
            {user && userData && (user.id !== userData.id) && (
              <button
                type="button"
                onClick={handleMessageClick}
                className={styles.messageButton}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Message
              </button>
            )}
          </div>

          <div className={styles.content}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Recent Posts</h2>
              <div className={styles.postsList}>
                {userPosts?.length > 0 ? (
                  userPosts.map((post: any) => (
                    <div 
                      key={post.id}
                      onClick={() => handlePostClick(post.id)}
                      className={styles.postCard}
                    >
                      <h3 className={styles.postTitle}>{post.title}</h3>
                      <p className={styles.postContent}>{post.content}</p>
                      <div className={styles.postMetadata}>
                        <span>👍 {post.likes || 0}</span>
                        <span>💬 {post.replies || 0}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyState}>No posts yet</p>
                )}
              </div>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Activity</h2>
              {/* Add user's activity here */}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 