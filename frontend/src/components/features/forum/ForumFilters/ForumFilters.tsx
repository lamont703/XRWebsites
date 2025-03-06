import React from 'react';
import styles from '@/styles/ForumFilters.module.css';

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
    <div className={styles.container}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search posts..."
          onChange={(e) => onSearch(e.target.value)}
          className={styles.input}
          title="Search forum posts"
        />
      </div>
      
      <div className={styles.filtersContainer}>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={styles.select}
          title="Filter by category"
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
          className={styles.select}
          title="Sort posts by"
        >
          <option value="latest">Latest</option>
          <option value="popular">Most Popular</option>
          <option value="unanswered">Unanswered</option>
        </select>
      </div>
    </div>
  );
}; 