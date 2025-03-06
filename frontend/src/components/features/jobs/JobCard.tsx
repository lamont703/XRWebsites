import React from 'react';
import styles from '@/styles/JobCard.module.css';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    price: number;
    experienceLevel: string;
    location: string;
    poster?: {
      name: string;
      rating: number;
    };
    createdAt: string;
  };
  onClick: (job: any) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(job);
  };

  return (
    <div 
      className={styles.card}
      onClick={() => onClick(job)}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{job.title}</h3>
        <span className={styles.price}>${job.price}</span>
      </div>
      
      <p className={styles.description}>{job.description}</p>
      
      <div className={styles.buttonContainer}>
        <button
          onClick={handleViewDetails}
          className={styles.button}
        >
          View Details
        </button>
      </div>
    </div>
  );
}; 