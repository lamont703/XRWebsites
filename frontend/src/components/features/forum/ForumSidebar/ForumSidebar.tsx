import React from 'react';
import { Link } from 'react-router-dom';

interface TopicStats {
  id: string;
  title: string;
  replies: number;
  views: number;
  lastActivity: string;
}

interface ActiveUser {
  id: string;
  name: string;
  avatar?: string;
  reputation: number;
  posts: number;
}

interface ForumSidebarProps {
  popularTopics: TopicStats[];
  activeUsers: ActiveUser[];
  recentActivity: {
    type: 'post' | 'reply' | 'like';
    user: {
      name: string;
      avatar?: string;
    };
    content: string;
    timestamp: string;
  }[];
}

export const ForumSidebar: React.FC<ForumSidebarProps> = ({
  popularTopics,
  activeUsers,
  recentActivity,
}) => {
  return (
    <div className="space-y-6">
      {/* Popular Topics */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Popular Topics</h3>
        <div className="space-y-3">
          {popularTopics.map((topic) => (
            <Link
              key={topic.id}
              to={`/forum/post/${topic.id}`}
              className="block hover:bg-gray-700 rounded-lg p-2 transition-colors"
            >
              <div className="text-white font-medium line-clamp-1">{topic.title}</div>
              <div className="text-sm text-gray-400 flex justify-between mt-1">
                <span>{topic.replies} replies</span>
                <span>{topic.views} views</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Active Users</h3>
        <div className="space-y-3">
          {activeUsers.map((user) => (
            <Link
              key={user.id}
              to={`/forum/user/${user.id}`}
              className="flex items-center space-x-3 hover:bg-gray-700 rounded-lg p-2 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                ) : (
                  <span className="text-white font-bold">{user.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="text-white font-medium">{user.name}</div>
                <div className="text-sm text-gray-400">
                  {user.posts} posts • {user.reputation} rep
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  {activity.user.avatar ? (
                    <img src={activity.user.avatar} alt={activity.user.name} className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-white font-bold">{activity.user.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-white font-medium">{activity.user.name}</span>
                  <span className="text-gray-400">
                    {' '}
                    {activity.type === 'post'
                      ? 'created a new post'
                      : activity.type === 'reply'
                      ? 'replied to'
                      : 'liked'}
                  </span>
                </div>
              </div>
              <div className="text-gray-400 mt-1 ml-10">
                {activity.content}
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 