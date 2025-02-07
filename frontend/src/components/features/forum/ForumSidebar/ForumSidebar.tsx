import React from 'react';
import { Link } from 'react-router-dom';

interface Post {
  id: string;
  title: string;
  replies?: number;
}

interface ForumSidebarProps {
  popularTopics: Post[];
}

export const ForumSidebar: React.FC<ForumSidebarProps> = ({
  popularTopics
}) => {
  return (
    <div className="w-full lg:w-1/4 space-y-6 lg:pl-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Popular Topics</h3>
        <div className="space-y-4">
          {popularTopics.map((topic) => (
            <div key={topic.id} className="flex items-center justify-between">
              <Link
                to={`/forum/post/${topic.id}`}
                className="text-gray-300 hover:text-white truncate flex-1"
              >
                {topic.title}
              </Link>
              <span className="text-gray-400 text-sm">
                {topic.replies || 0} replies
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 