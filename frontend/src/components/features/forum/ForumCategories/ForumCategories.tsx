import React from 'react';
import { Link } from 'react-router-dom';

interface CategoryStats {
  totalPosts: number;
  activeUsers: number;
  lastPostDate: string;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  stats: CategoryStats;
}

interface ForumCategoriesProps {
  categories: ForumCategory[];
}

export const ForumCategories: React.FC<ForumCategoriesProps> = ({ categories }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/forum/category/${category.id}`}
          className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-2xl text-blue-400">{category.icon}</span>
            <h3 className="text-lg font-semibold text-white">{category.name}</h3>
          </div>
          <p className="text-gray-300 text-sm mb-4">{category.description}</p>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{category.stats.totalPosts} posts</span>
            <span>{category.stats.activeUsers} active users</span>
          </div>
        </Link>
      ))}
    </div>
  );
}; 