import React, { useState } from 'react';
import { useAuth } from '@/store/auth/Auth';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';

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
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<string | null>(null);

  // Filter out deleted comments
  const activeComments = comments.filter(comment => comment.status !== 'deleted');

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

    return (
      <div
        key={comment.id}
        className={`${depth > 0 ? 'ml-8 border-l border-gray-700' : ''} py-4`}
      >
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            {comment.author?.avatar ? (
              <img 
                src={comment.author.avatar} 
                alt={comment.author?.name || 'User'} 
                className="w-full h-full rounded-full" 
              />
            ) : (
              <span className="text-white font-bold">
                {comment.author?.name ? comment.author.name.charAt(0) : '?'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-white">
                {comment.author?.name || comment.author?.username || 'Anonymous'}
              </span>
              {comment.author?.username && (
                <span className="text-sm text-gray-400">
                  @{comment.author.username}
                </span>
              )}
            </div>
            <p className="text-gray-300 mb-2">{comment.content}</p>
            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={() => onLikeComment(comment.id)}
                disabled={isLiking?.[comment.id]}
                className={`flex items-center gap-1 ${
                  isLiking?.[comment.id]
                    ? 'opacity-50 cursor-not-allowed'
                    : comment.likedBy?.includes(user?.id)
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-blue-400'
                }`}
              >
                {isLiking?.[comment.id] ? '⏳' : '👍'} {comment.likes || 0}
              </button>
              <button
                onClick={() => setReplyTo(comment.id)}
                className="text-gray-400 hover:text-blue-400"
              >
                Reply
              </button>
            </div>
            {replyTo === comment.id && (
              <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Write a reply..."
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="px-3 py-1 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Reply
                  </button>
                </div>
              </form>
            )}
            {isAuthor && (
              <button
                onClick={() => setIsDeleteModalOpen(comment.id)}
                className="text-red-400 hover:text-red-500"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        {comment.replies
          ?.filter(reply => reply.status !== 'deleted')
          ?.map((reply) => renderComment(reply, depth + 1))}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen === comment.id}
          onClose={() => setIsDeleteModalOpen(null)}
          onConfirm={() => {
            console.log('Delete triggered for comment:', comment.id);
            onDeleteComment(comment.id);
            setIsDeleteModalOpen(null);
          }}
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => handleSubmit(e)} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Write a comment..."
          rows={4}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Post Comment
          </button>
        </div>
      </form>
      <div className="divide-y divide-gray-700">
        {activeComments.map((comment) => renderComment(comment))}
      </div>
    </div>
  );
}; 