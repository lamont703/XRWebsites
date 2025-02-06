import React from 'react';
import { Link } from 'react-router-dom';

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
  tags: string[];
  createdAt: string;
  likes: number;
  replies: number;
  isStickied: boolean;
  onLike: () => void;
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
  replies,
  isStickied,
  onLike,
}) => {
  return (
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
            {isStickied && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                Pinned
              </span>
            )}
          </div>
          
          <p className="mt-3 text-gray-300 line-clamp-2">{content}</p>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex space-x-2">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <button
                onClick={onLike}
                className="flex items-center space-x-1 hover:text-blue-400"
              >
                <span>👍</span>
                <span>{likes}</span>
              </button>
              <div className="flex items-center space-x-1">
                <span>💬</span>
                <span>{replies}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}; 