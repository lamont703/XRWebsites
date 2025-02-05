import React from 'react';

interface ForumFiltersProps {
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: 'latest' | 'popular' | 'unanswered') => void;
  selectedCategory: string;
  selectedSort: 'latest' | 'popular' | 'unanswered';
}

export const ForumFilters: React.FC<ForumFiltersProps> = ({
  onSearch,
  onCategoryChange,
  onSortChange,
  selectedCategory,
  selectedSort,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4">
      <div className="w-full md:w-1/3">
        <input
          type="text"
          placeholder="Search posts..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      
      <div className="flex gap-4 w-full md:w-auto">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="development">Development</option>
          <option value="business">Business</option>
          <option value="networking">Networking</option>
          <option value="tutorials">Tutorials</option>
          <option value="general">General</option>
        </select>

        <select
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value as 'latest' | 'popular' | 'unanswered')}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="latest">Latest</option>
          <option value="popular">Most Popular</option>
          <option value="unanswered">Unanswered</option>
        </select>
      </div>
    </div>
  );
}; 