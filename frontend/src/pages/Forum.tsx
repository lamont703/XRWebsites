import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import { ForumCategories } from '@/components/features/forum/ForumCategories/ForumCategories';
import { ForumPost } from '@/components/features/forum/ForumPost/ForumPost';
import { ForumFilters } from '@/components/features/forum/ForumFilters/ForumFilters';
import { ForumSidebar } from '@/components/features/forum/ForumSidebar/ForumSidebar';
import { CreatePostForm } from '@/components/features/forum/CreatePostForm/CreatePostForm';
import { Dialog } from '@headlessui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import LoadingOverlay from '@/components/layout/LoadingOverlay/LoadingOverlay';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  category: 'development' | 'business' | 'networking' | 'tutorials' | 'general';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  likes: number;
  replies: number;
  isStickied?: boolean;
  likedBy: string[];
}

interface CreatePostData {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

type PostWithAuthor = CreatePostData & { author: { id: string; name: string; username: string | undefined } };

export const Forum = () => {
  const { user } = useAuth();
  console.log('Auth context user data:', user);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState<'latest' | 'popular' | 'unanswered'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch posts
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['forum-posts', selectedCategory, selectedSort, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: selectedCategory,
        sort: selectedSort,
        search: searchQuery
      });

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/forum/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    }
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/forum/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Create post mutation
  const createPostMutation = useMutation<ForumPost, Error, PostWithAuthor>({
    mutationFn: async (postData) => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/forum/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      setIsCreatePostOpen(false);
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });

      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    }
  });

  /*const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/forum/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });

      if (!response.ok) throw new Error('Failed to delete comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    }
  });*/

  // Add like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/forum/posts/${postId}/like`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to like post');
        }
        return data;
      } catch (error) {
        console.error('Like error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
    onError: (error) => {
      console.error('Like mutation error:', error);
      toast.error(error.message || 'Failed to like post');
    }
  });

  const handleCreatePost = async (postData: CreatePostData) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to create a post');
      }
      
      const currentUser = user; // TypeScript will now know user is not null
      const postWithAuthor = {
        ...postData,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username
        }
      };
      await createPostMutation.mutateAsync(postWithAuthor);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-2 sm:px-4 py-8 pt-20 lg:pt-8 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">Forum</h1>
          <button
            onClick={() => setIsCreatePostOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full sm:w-auto"
          >
            Create Post
          </button>
        </div>

        <ForumCategories categories={categories?.data || []} />
        <ForumFilters
          onCategoryChange={setSelectedCategory}
          onSortChange={setSelectedSort}
          onSearch={setSearchQuery}
          selectedCategory={selectedCategory}
          selectedSort={selectedSort}
        />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingOverlay isLoading={true} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {postsData?.data?.posts?.map((post: ForumPost) => (
                  <ForumPost 
                    key={post.id} 
                    {...post} 
                    likedBy={post.likedBy || []}
                    onLike={async (postId) => {
                      try {
                        await likePostMutation.mutateAsync(postId);
                      } catch (error) {
                        // Error handling is now in the mutation
                      }
                    }}
                    isLiking={likePostMutation.isPending}
                    onDelete={async (postId) => {
                      try {
                        await deletePostMutation.mutateAsync(postId);
                        toast.success('Post deleted successfully');
                      } catch (error) {
                        console.error('Failed to delete post:', error);
                        toast.error('Failed to delete post');
                      }
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <ForumSidebar />
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-gray-800 rounded-lg p-6">
            <Dialog.Title className="text-xl font-bold text-white mb-6">
              Create New Post
            </Dialog.Title>
            <CreatePostForm
              onSubmit={handleCreatePost}
              onCancel={() => setIsCreatePostOpen(false)}
              isLoading={createPostMutation.isPending}
            />
          </Dialog.Panel>
        </div>
      </Dialog>
    </MainLayout>
  );
}; 