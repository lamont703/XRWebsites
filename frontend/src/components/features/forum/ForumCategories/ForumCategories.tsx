import React from 'react';
import { Link } from 'react-router-dom';
import styles from '@/styles/ForumCategories.module.css';

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
  if (!categories || !Array.isArray(categories)) {
    console.log('Categories data is not an array:', categories);
    return (
      <div className={styles.emptyState}>
        <p>No categories available</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/forum/category/${category.id}`}
          className={styles.categoryCard}
        >
          <div className={styles.header}>
            <span className={styles.icon}>{category.icon}</span>
            <h3 className={styles.title}>{category.name}</h3>
          </div>
          <p className={styles.description}>{category.description}</p>
          <div className={styles.stats}>
            <span>{category.stats.totalPosts} posts</span>
            <span>{category.stats.activeUsers} active users</span>
          </div>
        </Link>
      ))}
    </div>
  );
}; 