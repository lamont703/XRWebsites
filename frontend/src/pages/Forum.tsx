import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import styles from '@/styles/Forum.module.css';

// Import icons
import { FaRocket, FaSync, FaPlus, FaSearch, FaSatelliteDish } from 'react-icons/fa';

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
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

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
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/forum/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch categories:', response.status);
        // Use mock categories if API fails
        setCategories([
          { id: 'development', name: 'Development', count: 24 },
          { id: 'business', name: 'Business', count: 18 },
          { id: 'networking', name: 'Networking', count: 12 },
          { id: 'tutorials', name: 'Tutorials', count: 8 },
          { id: 'general', name: 'General', count: 32 }
        ]);
        return;
      }
      
      const data = await response.json();
      
      // Log the response to see its structure
      console.log('Categories API response:', data);
      
      // Make sure we're setting an array
      const categoriesArray = data.data || data.categories || [];
      if (!Array.isArray(categoriesArray)) {
        console.error('API did not return an array for categories:', categoriesArray);
        setCategories([]);
      } else {
        setCategories(categoriesArray);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  // Create post mutation
  const createPostMutation = useMutation<ForumPost, Error, PostWithAuthor>({
    mutationFn: async (postData) => {
      console.log('Sending post data:', postData);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/forum/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        throw new Error(errorData.message || 'Failed to create post');
      }
      
      const responseData = await response.json();
      console.log('Create post response:', responseData);
      return responseData.data || responseData;
    },
    onSuccess: (data) => {
      console.log('Post created successfully:', data);
      // Invalidate and refetch to ensure we get the latest data
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      // Optionally add the new post directly to the cache
      queryClient.setQueryData(['forum-posts'], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Create a deep copy of the old data
        const newData = JSON.parse(JSON.stringify(oldData));
        
        // Add the new post to the posts array
        if (newData.data && Array.isArray(newData.data.posts)) {
          newData.data.posts.unshift(data);
        } else if (Array.isArray(newData.posts)) {
          newData.posts.unshift(data);
        }
        
        return newData;
      });
      
      setIsCreatePostOpen(false);
      toast.success('Post created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
      toast.error(error.message || 'Failed to create post');
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
        toast.error('You must be logged in to create a post');
        return;
      }
      
      const currentUser = user;
      const postWithAuthor = {
        ...postData,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username
        }
      };
      
      console.log('Creating post with data:', postWithAuthor);
      await createPostMutation.mutateAsync(postWithAuthor);
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast.error(error.message || 'Failed to create post');
    }
  };

  // Add this console log to debug posts data
  console.log('Posts data:', postsData);

  return (
    <MainLayout>
      <div className={styles.forumContainer}>
        <div className={styles.forumHeader}>
          <h1 className={styles.forumTitle}>
            <span className={styles.forumIcon}>💬</span> 
            Community Forum
          </h1>
          <p className={styles.forumSubtitle}>
            Join discussions and connect with other community members
          </p>
          <button 
            className={styles.missionControlButton}
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Mission Control
          </button>
        </div>
        
        <div className={styles.missionControlContainer}>
          <div className={styles.missionHeader}>
            <div className={styles.headerLeft}>
              <FaSatelliteDish className={styles.headerIcon} />
              <h1 className={styles.missionTitle}>Community Forum</h1>
            </div>
            
            <div className={styles.headerControls}>
              <div className={styles.searchContainer}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['forum-posts'] })}
                className={styles.controlButton}
                title="Refresh"
              >
                <FaSync className={styles.buttonIcon} />
                <span className={styles.buttonText}>Refresh</span>
              </button>
              
              <button
                onClick={() => setIsCreatePostOpen(true)}
                className={styles.primaryButton}
              >
                <FaPlus className={styles.buttonIcon} />
                <span className={styles.buttonText}>New Discussion</span>
              </button>
            </div>
          </div>

          <div className={styles.missionContent}>
            <div className={styles.mainContent}>
              <div className={styles.categoriesSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Categories</h2>
                </div>
                <ForumCategories categories={Array.isArray(categories) ? categories : []} />
              </div>
              
              <div className={styles.postsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Discussions</h2>
                  <ForumFilters
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedSort={selectedSort}
                    onSortChange={setSelectedSort}
                  />
                </div>
                
                {isLoading ? (
                  <div className={styles.loadingContainer}>
                    <LoadingOverlay isLoading={true} />
                  </div>
                ) : (
                  <div className={styles.postsContainer}>
                    {/* Add debugging to see what data is actually coming back */}
                    {console.log('Posts data structure:', postsData)}
                    
                    {/* Make the path more flexible to handle different response structures */}
                    {(postsData?.data?.posts || postsData?.posts || []).map((post: ForumPost) => (
                      <ForumPost 
                        key={post.id} 
                        {...post} 
                        likedBy={post.likedBy || []}
                        onLike={async (postId) => {
                          try {
                            await likePostMutation.mutateAsync(postId);
                          } catch (error) {
                            // Error handling is in the mutation
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
                    
                    {/* Show a message if no posts are found */}
                    {(postsData?.data?.posts || postsData?.posts || []).length === 0 && (
                      <div className={styles.emptyState}>
                        <FaRocket className={styles.emptyIcon} />
                        <p>No discussions found. Be the first to start a conversation!</p>
                        <button 
                          onClick={() => setIsCreatePostOpen(true)}
                          className={styles.emptyStateButton}
                        >
                          Create Discussion
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.sidebarContent}>
              <ForumSidebar />
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog
        open={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        className={styles.dialogOverlay}
      >
        <div className={styles.dialogBackdrop} aria-hidden="true" />
        
        <Dialog.Panel className={styles.dialogPanel}>
          <div className={styles.dialogHeader}>
            <Dialog.Title className={styles.dialogTitle}>
              <FaRocket className={styles.dialogIcon} />
              Launch New Discussion
            </Dialog.Title>
            <button 
              onClick={() => setIsCreatePostOpen(false)}
              className={styles.closeButton}
            >
              &times;
            </button>
          </div>
          
          <CreatePostForm 
            onSubmit={handleCreatePost} 
            categories={categories}
            isSubmitting={createPostMutation.isPending}
          />
        </Dialog.Panel>
      </Dialog>
    </MainLayout>
  );
}; 