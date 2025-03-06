import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth/Auth';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import styles from '@/styles/PostComments.module.css';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  likes: number;
  likedBy: string[];
  replies: Comment[];
  status?: string;
}

interface PostCommentsProps {
  comments: Comment[];
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onLikeComment: (commentId: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  isLiking?: { [key: string]: boolean }; // Add this
}

export const PostComments: React.FC<PostCommentsProps> = ({
  comments = [],
  onAddComment,
  onLikeComment,
  onDeleteComment,
  isLiking = {}
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<string | null>(null);

  // Filter out deleted comments
  const activeComments = comments.filter(comment => comment.status !== 'deleted');

  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (newComment.trim()) {
      await onAddComment(newComment, parentId);
      setNewComment('');
      setReplyTo(null);
    }
  };

  const renderComment = (comment: Comment, depth = 0) => {
    if (!comment || comment.status === 'deleted') return null;
    const isAuthor = user?.id === comment.author.id;
    const hasLiked = comment.likedBy?.includes(user?.id || '');

    return (
      <div key={comment.id} className={`${styles.comment} ${depth > 0 ? styles.nested : ''}`}>
        <div className={styles.commentHeader}>
          <div 
            onClick={() => handleUserClick(comment.author?.id)}
            className={styles.avatar}
          >
            {comment.author.avatar ? (
              <img src={comment.author.avatar} alt={comment.author.name} className={styles.avatarImage} />
            ) : (
              <span className={styles.avatarFallback}>{comment.author.name.charAt(0)}</span>
            )}
          </div>
          <div className={styles.commentContent}>
            <div className={styles.userInfo}>
              <button onClick={() => handleUserClick(comment.author.id)} className={styles.userName}>
                {comment.author.name}
              </button>
              <span className={styles.timestamp}>
                • {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className={styles.text}>{comment.content}</p>
            <div className={styles.actions}>
              <button
                onClick={() => onLikeComment(comment.id)}
                disabled={isLiking?.[comment.id]}
                className={`${styles.actionButton} ${hasLiked ? styles.liked : ''}`}
              >
                {isLiking?.[comment.id] ? '⏳' : '👍'} {comment.likes || 0}
              </button>
              <button
                onClick={() => setReplyTo(comment.id)}
                className={styles.actionButton}
              >
                Reply
              </button>
              {isAuthor && (
                <button
                  onClick={() => setIsDeleteModalOpen(comment.id)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              )}
            </div>
            {replyTo === comment.id && (
              <form onSubmit={(e) => handleSubmit(e, comment.id)} className={styles.commentForm}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className={styles.textarea}
                  placeholder="Write a reply..."
                  rows={4}
                />
                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    Reply
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        {comment.replies
          ?.filter(reply => reply.status !== 'deleted')
          ?.map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <form onSubmit={(e) => handleSubmit(e)} className={styles.commentForm}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className={styles.textarea}
          placeholder="Write a comment..."
          rows={4}
        />
        <div className={styles.formActions}>
          <button type="submit" className={styles.submitButton}>
            Post Comment
          </button>
        </div>
      </form>
      <div className={styles.commentThread}>
        {activeComments.map((comment) => renderComment(comment))}
      </div>
      <DeleteConfirmationModal
        isOpen={!!isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(null)}
        onConfirm={() => {
          if (isDeleteModalOpen) {
            onDeleteComment(isDeleteModalOpen);
            setIsDeleteModalOpen(null);
          }
        }}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
      />
    </div>
  );
}; 