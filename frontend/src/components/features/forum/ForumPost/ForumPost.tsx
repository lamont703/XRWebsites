import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeleteConfirmationModal } from '../../../DeleteConfirmationModal';
import { useAuth } from '../../../../store/auth/Auth';
import { toast } from 'react-hot-toast';
import styles from '@/styles/ForumPost.module.css';

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
  const navigate = useNavigate();
  const isAuthor = user?.id === author.id;
  const hasLiked = user ? likedBy.includes(user.id) : false;

  const handleCommentClick = () => {
    navigate(`/forum/posts/${id}#comments`);
  };

  const handleTitleClick = () => {
    navigate(`/forum/posts/${id}`);
  };

  const handleUserClick = () => {
    navigate(`/users/${author.id}`);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.userInfo}>
              <div 
                onClick={handleUserClick}
                className={styles.avatar}
              >
                {author.avatar ? (
                  <img src={author.avatar} alt={author.name} className={styles.avatarImage} />
                ) : (
                  <span className={styles.avatarFallback}>
                    {author?.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <div>
                <button
                  onClick={handleTitleClick}
                  className={styles.title}
                >
                  {title}
                </button>
                <div className={styles.metadata}>
                  Posted by{' '}
                  <button
                    onClick={handleUserClick}
                    className={styles.userLink}
                  >
                    {author.name}
                  </button>
                  {' '}
                  <button
                    onClick={handleUserClick}
                    className={styles.userLink}
                  >
                    (@{author.username})
                  </button>
                  {' • '}
                  {new Date(createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className={styles.badges}>
              {isStickied && (
                <span className={styles.pinnedBadge}>
                  Pinned
                </span>
              )}
              {isAuthor && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          
          <p className={styles.postContent}>{content}</p>
          
          <div className={styles.footer}>
            <div className={styles.tags}>
              {tags?.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className={styles.actions}>
              <button
                onClick={() => {
                  if (!user) {
                    toast.error('Please login to like posts');
                    return;
                  }
                  onLike(id);
                }}
                disabled={isLiking}
                className={`${styles.actionButton} ${hasLiked ? styles.liked : ''}`}
              >
                {isLiking ? '⏳' : hasLiked ? '👍' : '👍'} {likes || 0}
              </button>
              <button
                onClick={handleCommentClick}
                className={styles.actionButton}
              >
                💬 {replies || 0}
              </button>
            </div>
          </div>
        </div>
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