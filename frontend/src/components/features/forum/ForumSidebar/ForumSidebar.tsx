import { useQuery } from '@tanstack/react-query';
import LoadingOverlay from '@/components/layout/LoadingOverlay/LoadingOverlay';
import styles from '@/styles/ForumSidebar.module.css';

export const ForumSidebar = () => {
  const { data: sidebarData, isLoading } = useQuery({
    queryKey: ['forum-sidebar'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/forum/sidebar`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch sidebar data');
      return response.json();
    }
  });

  if (isLoading) return <LoadingOverlay isLoading={true} />;

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Popular Tags</h3>
        <div className={styles.tagsContainer}>
          {sidebarData?.tags?.map((tag: string) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          )) || <span className={styles.emptyState}>No tags available</span>}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Top Contributors</h3>
        <div className={styles.contributorsContainer}>
          {sidebarData?.contributors?.map((contributor: any) => (
            <div key={contributor.id} className={styles.contributorCard}>
              <div className={styles.avatar}>
                {contributor.avatar ? (
                  <img src={contributor.avatar} alt={contributor.name} className={styles.avatarImage} />
                ) : (
                  <span className={styles.avatarFallback}>{contributor.name.charAt(0)}</span>
                )}
              </div>
              <div className={styles.contributorInfo}>
                <p className={styles.contributorName}>{contributor.name}</p>
                <p className={styles.contributorStats}>{contributor.posts} posts</p>
              </div>
            </div>
          )) || <p className={styles.emptyState}>No contributors to show</p>}
        </div>
      </div>
    </div>
  );
}; 