import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostComments } from '@/components/features/forum/PostComments/PostComments';
import { useAuth } from '@/store/auth/Auth';
import { toast } from 'react-hot-toast';
import LoadingOverlay from '@/components/layout/LoadingOverlay/LoadingOverlay';

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
  status?: string;
}

export const PostDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [likingStates, setLikingStates] = useState<{ [key: string]: boolean }>({});
  const [comments, setComments] = useState([]);

  // Fetch post details
  const { data: postData, isLoading, error } = useQuery({
    queryKey: ['forum-post', id],
    queryFn: async () => {
      console.log('Fetching post data...');
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
        
        const data = await response.json();
        console.log('Raw post response:', data);
        console.log('Comments in response:', data?.data?.comments);
        return data;
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
      try {
        console.log('Starting like mutation for comment:', commentId);
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
        
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }

        const data = await response.json();
        console.log('Like comment response:', data);
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to like comment');
        }
        return data;
      } catch (error) {
        console.error('Like comment error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Like comment mutation succeeded:', data);
      queryClient.invalidateQueries({ queryKey: ['forum-post', id] });
    },
    onError: (error) => {
      console.error('Like comment mutation error:', error);
      toast.error(error.message || 'Failed to like comment');
    }
  });

  // Add delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      console.log('Starting delete mutation for comment:', commentId);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/forum/comments/${commentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          }
        }
      );

      if (!response.ok) {
        console.error('Delete response not OK:', await response.text());
        throw new Error('Failed to delete comment');
      }
      const data = await response.json();
      console.log('Delete response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Delete mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['forum-post', id] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      toast.success('Comment deleted successfully');
    },
    onError: (error) => {
      console.error('Delete comment error:', error);
      toast.error('Failed to delete comment');
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

  // Add handleDeleteComment function
  const handleDeleteComment = async (commentId: string) => {
    console.log('HandleDeleteComment called with:', commentId);
    try {
      await deleteCommentMutation.mutateAsync(commentId);
      console.log('Delete mutation completed successfully');
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  useEffect(() => {
    console.log('Post data updated:', {
      comments: postData?.data?.comments?.map(c => ({
        id: c.id,
        status: c.status,
        content: c.content
      })),
      commentCount: postData?.data?.comments?.length,
      rawData: postData?.data
    });
  }, [postData]);

  if (isLoading) return <LoadingOverlay isLoading={true} />;
  if (!comments) return null;

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
        <button
          onClick={() => navigate('/forum')}
          className="mb-6 flex items-center gap-2 text-blue-400 hover:text-blue-500"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
          Back to Forum
        </button>

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
            {post.tags?.map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <div id="comments" className="border-t border-gray-700 pt-6">
            <h2 className="text-xl font-bold text-white mb-4">Comments</h2>
            <PostComments
              comments={post.comments || []}
              onAddComment={handleAddComment}
              onLikeComment={handleLikeComment}
              onDeleteComment={handleDeleteComment}
              isLiking={likingStates}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 