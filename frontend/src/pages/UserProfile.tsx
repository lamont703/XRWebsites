import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import LoadingOverlay from '@/components/layout/LoadingOverlay/LoadingOverlay';
import { useAuth } from '@/store/auth/Auth';
import { toast } from 'react-hot-toast';
import styles from '@/styles/UserProfile.module.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectWallet } from '@/components/features/wallet/ConnectWallet';
import { useState } from 'react';

// Define interfaces for type safety
interface UserData {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  joinedDate?: string;
  skills?: string[];
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  reputation?: number;
  badges?: {
    id: string;
    name: string;
    icon: string;
    description: string;
  }[];
}

interface UserPost {
  id: string;
  title: string;
  content: string;
  likes: number;
  replies: number;
  createdAt: string;
  category?: string;
}

export const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState<'posts' | 'activity' | 'badges'>('posts');
  
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
      return data.data as UserData;
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
      return data.data.posts as UserPost[];
    }
  });

  const { data: userActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['user-activity', userId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${userId}/activity`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user activity');
      const data = await response.json();
      return data.data.activities;
    },
    enabled: activeTab === 'activity'
  });

  const handleMessageClick = () => {
    if (!user) {
      toast.error('Please login to send messages');
      return;
    }
    navigate(`/messages/${userId}`);
  };

  const handlePostClick = (postId: string) => {
    navigate(`/forum/posts/${postId}`, {
      state: { 
        from: 'profile',
        userId: userId 
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (userLoading || postsLoading || (activeTab === 'activity' && activityLoading)) 
    return <LoadingOverlay isLoading={true} />;

  return (
    <MainLayout>
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <h1 className={styles.profileTitle}>
            <span className={styles.profileIcon}>👤</span> 
            User Profile
          </h1>
          <p className={styles.profileSubtitle}>
            View community member details and contributions
          </p>
          <button 
            className={styles.missionControlButton}
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Mission Control
          </button>
        </div>
        
        {!wallet.connected && (
          <div className={styles.walletConnectBanner}>
            <div className={styles.bannerContent}>
              <div className={styles.bannerIcon}>🔗</div>
              <div className={styles.bannerText}>
                <h3>Connect Your Wallet</h3>
                <p>Connect your wallet to interact with community members</p>
              </div>
            </div>
            <div className={styles.bannerAction}>
              <ConnectWallet />
            </div>
          </div>
        )}
        
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
                  {userData?.joinedDate && (
                    <p className={styles.joinDate}>
                      <span className={styles.joinIcon}>🚀</span> Joined {formatDate(userData.joinedDate)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className={styles.userActions}>
                {userData?.reputation !== undefined && (
                  <div className={styles.reputationBadge}>
                    <span className={styles.reputationIcon}>⭐</span>
                    <span className={styles.reputationScore}>{userData.reputation}</span>
                  </div>
                )}
                
                {user && userData && (user.id !== userData.id) && (
                  <button
                    type="button"
                    onClick={handleMessageClick}
                    className={styles.messageButton}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles.messageIcon} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Message
                  </button>
                )}
              </div>
            </div>

            {userData?.bio && (
              <div className={styles.bioSection}>
                <h2 className={styles.bioTitle}>About</h2>
                <p className={styles.bioContent}>{userData.bio}</p>
              </div>
            )}
            
            {userData?.skills && userData.skills.length > 0 && (
              <div className={styles.skillsSection}>
                <h2 className={styles.skillsTitle}>Skills</h2>
                <div className={styles.skillTags}>
                  {userData.skills.map((skill, index) => (
                    <span key={index} className={styles.skillTag}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.tabsContainer}>
              <div className={styles.tabs}>
                <button 
                  className={`${styles.tabButton} ${activeTab === 'posts' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('posts')}
                >
                  <span className={styles.tabIcon}>📝</span> Posts
                </button>
                <button 
                  className={`${styles.tabButton} ${activeTab === 'activity' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('activity')}
                >
                  <span className={styles.tabIcon}>📊</span> Activity
                </button>
                <button 
                  className={`${styles.tabButton} ${activeTab === 'badges' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('badges')}
                >
                  <span className={styles.tabIcon}>🏆</span> Badges
                </button>
              </div>
            </div>

            <div className={styles.content}>
              {activeTab === 'posts' && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Recent Posts</h2>
                  <div className={styles.postsList}>
                    {userPosts?.length > 0 ? (
                      userPosts.map((post) => (
                        <div 
                          key={post.id}
                          onClick={() => handlePostClick(post.id)}
                          className={styles.postCard}
                        >
                          <h3 className={styles.postTitle}>{post.title}</h3>
                          <p className={styles.postContent}>{post.content.length > 150 
                            ? `${post.content.substring(0, 150)}...` 
                            : post.content}
                          </p>
                          <div className={styles.postMetadata}>
                            {post.category && <span className={styles.postCategory}>{post.category}</span>}
                            <span className={styles.postStat}>👍 {post.likes || 0}</span>
                            <span className={styles.postStat}>💬 {post.replies || 0}</span>
                            <span className={styles.postDate}>{formatDate(post.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>📝</div>
                        <p>No posts yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'activity' && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Activity</h2>
                  {userActivity?.length > 0 ? (
                    <div className={styles.activityTimeline}>
                      {userActivity.map((activity: any, index: number) => (
                        <div key={index} className={styles.activityItem}>
                          <div className={styles.activityIcon}>
                            {activity.type === 'post' ? '📝' : 
                             activity.type === 'comment' ? '💬' : 
                             activity.type === 'like' ? '👍' : 
                             activity.type === 'reward' ? '🏆' : '🔔'}
                          </div>
                          <div className={styles.activityContent}>
                            <p className={styles.activityText}>{activity.description}</p>
                            <span className={styles.activityDate}>{formatDate(activity.date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyStateIcon}>📊</div>
                      <p>No activity recorded yet</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'badges' && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Badges & Achievements</h2>
                  {userData?.badges && userData.badges.length > 0 ? (
                    <div className={styles.badgesGrid}>
                      {userData.badges.map((badge) => (
                        <div key={badge.id} className={styles.badgeCard}>
                          <div className={styles.badgeIcon}>{badge.icon}</div>
                          <h3 className={styles.badgeName}>{badge.name}</h3>
                          <p className={styles.badgeDescription}>{badge.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyStateIcon}>🏆</div>
                      <p>No badges earned yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {userData?.socialLinks && Object.values(userData.socialLinks).some(link => link) && (
              <div className={styles.socialLinks}>
                <h2 className={styles.socialTitle}>Connect</h2>
                <div className={styles.socialIcons}>
                  {userData.socialLinks.twitter && (
                    <a href={userData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <span className={styles.twitterIcon}>𝕏</span>
                    </a>
                  )}
                  {userData.socialLinks.github && (
                    <a href={userData.socialLinks.github} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <span>GitHub</span>
                    </a>
                  )}
                  {userData.socialLinks.linkedin && (
                    <a href={userData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {userData.socialLinks.website && (
                    <a href={userData.socialLinks.website} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <span>🌐</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 