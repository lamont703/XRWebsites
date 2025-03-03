import { useQuery } from '@tanstack/react-query';
import LoadingOverlay from '@/components/layout/LoadingOverlay/LoadingOverlay';

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
    <div className="bg-gray-800 rounded-lg p-4 mt-20 lg:mt-0">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {sidebarData?.tags?.map((tag: string) => (
            <span key={tag} className="px-2 py-1 bg-gray-700 text-sm text-gray-300 rounded">
              {tag}
            </span>
          )) || <span className="text-gray-400">No tags available</span>}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Top Contributors</h3>
        <div className="space-y-3">
          {sidebarData?.contributors?.map((contributor: any) => (
            <div key={contributor.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                {contributor.avatar ? (
                  <img src={contributor.avatar} alt={contributor.name} className="w-full h-full rounded-full" />
                ) : (
                  <span className="text-white text-sm">{contributor.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <p className="text-white text-sm">{contributor.name}</p>
                <p className="text-gray-400 text-xs">{contributor.posts} posts</p>
              </div>
            </div>
          )) || <p className="text-gray-400">No contributors to show</p>}
        </div>
      </div>
    </div>
  );
}; 