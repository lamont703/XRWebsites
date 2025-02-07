import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DeleteConfirmationModal } from '../../../DeleteConfirmationModal';
import { useAuth } from '../../../../store/auth/Auth';
import { toast } from 'react-hot-toast';

interface ForumPostProps {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  category: string;
  tags?: string[];
  createdAt: string;
  likes: number;
  likedBy: string[];
  replies: number;
  isStickied?: boolean;
  onLike: (postId: string) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
  isLiking?: boolean;
}

export const ForumPost: React.FC<ForumPostProps> = ({
  id,
  title,
  content,
  author,
  category,
  tags,
  createdAt,
  likes,
  likedBy = [],
  replies,
  isStickied,
  onLike,
  onDelete,
  isLiking = false
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user } = useAuth();
  const isAuthor = user?.id === author.id;
  const hasLiked = user ? likedBy.includes(user.id) : false;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    setIsDeleteModalOpen(true);
  };

  return (
    <>
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <Link to={`/forum/posts/${id}`} className="block hover:bg-gray-750">
          <div className={`p-4 ${isStickied ? 'bg-blue-900/20' : 'bg-gray-700'} rounded-lg hover:bg-gray-600 transition-colors`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  {author.avatar ? (
                    <img src={author.avatar} alt={author.name} className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-white font-bold">
                      {author?.name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="block hover:bg-gray-750">
                    {title}
                  </div>
                  <div className="text-sm text-gray-400">
                    Posted by {author.name} (@{author.username}) • {new Date(createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isStickied && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    Pinned
                  </span>
                )}
                {isAuthor && (
                  <button
                    onClick={handleDelete}
                    className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full hover:bg-red-500/30"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            
            <p className="mt-3 text-gray-300 line-clamp-2">{content}</p>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex space-x-2">
                {tags?.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={(e) => {
                    e.preventDefault(); // Prevent navigation
                    if (!user) {
                      toast.error('Please login to like posts');
                      return;
                    }
                    console.log('Like button clicked for post:', id);
                    console.log('Current like state:', { likes, hasLiked, likedBy });
                    onLike(id);
                  }}
                  disabled={isLiking}
                  className={`flex items-center gap-1 ${
                    isLiking
                      ? 'opacity-50 cursor-not-allowed'
                      : hasLiked
                      ? 'text-blue-400'
                      : 'text-gray-400 hover:text-blue-400'
                  }`}
                >
                  {isLiking ? '⏳' : hasLiked ? '👍' : '👍'} {likes || 0}
                </button>
                <span className="text-gray-400">
                  {replies} {replies === 1 ? 'reply' : 'replies'}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDelete(id);
          setIsDeleteModalOpen(false);
        }}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />
    </>
  );
}; 