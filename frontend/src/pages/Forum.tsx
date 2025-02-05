import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import { ForumCategories } from '@/components/features/forum/ForumCategories/ForumCategories';
import { ForumPost } from '@/components/features/forum/ForumPost/ForumPost';
import { ForumFilters } from '@/components/features/forum/ForumFilters/ForumFilters';
import { ForumSidebar } from '@/components/features/forum/ForumSidebar/ForumSidebar';
import { CreatePostForm } from '@/components/features/forum/CreatePostForm/CreatePostForm';
import { Dialog } from '@headlessui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: 'development' | 'business' | 'networking' | 'tutorials' | 'general';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  likes: number;
  replies: number;
  isStickied?: boolean;
}

export const Forum = () => {
  const { user } = useAuth();
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
  const createPostMutation = useMutation({
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

  const handleCreatePost = async (postData) => {
    try {
      await createPostMutation.mutateAsync(postData);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Forum</h1>
          <button
            onClick={() => setIsCreatePostOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Post
          </button>
        </div>

        <ForumCategories categories={categories?.data || []} />
        <ForumFilters
          onCategoryChange={setSelectedCategory}
          onSortChange={setSelectedSort}
          onSearchChange={setSearchQuery}
        />

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {postsData?.data?.posts?.map((post: ForumPost) => (
                <ForumPost key={post.id} {...post} onLike={() => {}} />
                ))}
              </div>
            </div>
            <ForumSidebar
            popularTopics={postsData?.data?.posts?.slice(0, 5) || []}
            activeUsers={[]}
            recentActivity={[]}
            />
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