import { useQuery } from '@tanstack/react-query';
import LoadingOverlay from '@/components/layout/LoadingOverlay/LoadingOverlay';
import styles from '@/styles/ForumSidebar.module.css';

// Mock data to use when the API endpoint is not available
const mockSidebarData = {
  tags: ['Web3', 'Blockchain', 'NFT', 'Metaverse', 'Gaming', 'Development'],
  topUsers: [
    { id: '1', name: 'User1', postCount: 15 },
    { id: '2', name: 'User2', postCount: 12 },
    { id: '3', name: 'User3', postCount: 8 }
  ],
  stats: {
    totalPosts: 125,
    totalUsers: 48,
    activeDiscussions: 12
  }
};

export const ForumSidebar = () => {
  // Use mock data directly instead of fetching from a non-existent endpoint
  // This eliminates the 404 error completely
  const { data: sidebarData, isLoading } = useQuery({
    queryKey: ['forum-sidebar'],
    queryFn: async () => {
      // Return mock data directly without making the API call
      // This prevents the 404 error from appearing in the console
      return mockSidebarData;
      
      /* 
      // Keep this code commented out until your backend endpoint is ready
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/forum/sidebar`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          }
        });
        
        if (!response.ok) {
          console.warn('Forum sidebar API returned:', response.status);
          return mockSidebarData; // Use mock data if API fails
        }
        
        return response.json();
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
        return mockSidebarData; // Use mock data if API fails
      }
      */
    },
    staleTime: Infinity, // Don't refetch since we're using static mock data
    refetchOnWindowFocus: false // Don't refetch on window focus
  });

  if (isLoading) return <LoadingOverlay isLoading={true} />;

  // Use the data directly since we're always returning mock data
  const displayData = sidebarData || mockSidebarData;

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Popular Tags</h3>
        <div className={styles.tagsContainer}>
          {displayData?.tags?.map((tag: string) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          )) || <span className={styles.emptyState}>No tags available</span>}
        </div>
      </div>
      
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Top Contributors</h3>
        <div className={styles.usersList}>
          {displayData?.topUsers?.map((user: any) => (
            <div key={user.id} className={styles.userItem}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.postCount}>{user.postCount} posts</span>
            </div>
          )) || <span className={styles.emptyState}>No users to display</span>}
        </div>
      </div>
      
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Forum Stats</h3>
        <div className={styles.statsList}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Posts</span>
            <span className={styles.statValue}>{displayData?.stats?.totalPosts || 0}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Members</span>
            <span className={styles.statValue}>{displayData?.stats?.totalUsers || 0}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Active Discussions</span>
            <span className={styles.statValue}>{displayData?.stats?.activeDiscussions || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 