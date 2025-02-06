import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostComments } from '@/components/features/forum/PostComments/PostComments';
import { useAuth } from '@/store/auth/Auth';

interface Author {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: Author;
  category: string;
  tags: string[];
  createdAt: string;
  likes: number;
  replies: number;
  isStickied?: boolean;
}

interface Comment {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  likes: number;
  likedBy: string[];
  replies: Comment[];
}

export const PostDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [likingStates, setLikingStates] = useState<{ [key: string]: boolean }>({});

  // Fetch post details
  const { data: postData, isLoading, error } = useQuery({
    queryKey: ['forum-post', id],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/forum/posts/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch post');
        }
        
        return response.json();
      } catch (error) {
        console.error('Error fetching post:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000 // Cache for 30 seconds
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/forum/posts/${id}/comments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content, parentId })
        }
      );
      if (!response.ok) throw new Error('Failed to create comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', id] });
    }
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/forum/comments/${commentId}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
          }
        }
      );
      if (!response.ok) throw new Error('Failed to like comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', id] });
    }
  });

  const handleAddComment = async (content: string, parentId?: string) => {
    try {
      await createCommentMutation.mutateAsync({ content, parentId });
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      setLikingStates(prev => ({ ...prev, [commentId]: true }));
      await likeCommentMutation.mutateAsync(commentId);
    } catch (error) {
      console.error('Failed to like comment:', error);
    } finally {
      setLikingStates(prev => ({ ...prev, [commentId]: false }));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div>Loading...</div>
        </div>
      </MainLayout>
    );
  }

  const post = postData?.data;

  if (!post) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div>Post not found</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-full h-full rounded-full" />
              ) : (
                <span className="text-white font-bold">{post.author?.name?.charAt(0) || '?'}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{post.title}</h1>
              <div className="text-sm text-gray-400">
                Posted by {post.author?.name || 'Unknown'} • {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <p className="text-gray-300 mb-6">{post.content}</p>
          
          <div className="flex gap-2 mb-8">
            {post.tags.map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h2 className="text-xl font-bold text-white mb-4">Comments</h2>
            <PostComments
              comments={post.comments || []}
              onAddComment={handleAddComment}
              onLikeComment={handleLikeComment}
              isLiking={likingStates}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 