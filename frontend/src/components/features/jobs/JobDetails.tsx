import React, { useState } from 'react';
import { useAuth } from '@/store/auth/Auth';
import { JobApplication, JobApplicationData } from './JobApplication';
import styles from '@/styles/JobDetails.module.css';

interface Skill {
  name: string;
  yearsRequired: number;
}

interface JobPoster {
  id: string;
  name: string;
  rating: number;
  jobsPosted: number;
  memberSince: string;
}

interface JobDetailsProps {
  id: string;
  title: string;
  description: string;
  skills: Skill[];
  postedDate: string;
  location: string;
  price: number;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  poster: JobPoster;
  isSaved?: boolean;
  onApply: (jobId: string, applicationData: JobApplicationData) => Promise<void>;
  onSave: (jobId: string) => Promise<void>;
}

export const JobDetails: React.FC<JobDetailsProps> = ({
  id,
  title,
  description,
  skills = [],
  postedDate,
  location,
  price,
  experienceLevel,
  poster,
  isSaved = false,
  onApply,
  onSave,
}) => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const handleApplyClick = async () => {
    if (!user?.id) {
      setError('Please login to apply for jobs');
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    // Show application form if user is logged in
    setShowApplicationForm(true);
  };

  const handleApplicationSubmit = async (applicationData: JobApplicationData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onApply(id, applicationData);
      
      // Send message to job poster
      const messageResponse = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/messages/${poster.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: `Hi, I've applied for your job: "${title}". You can view my application in your Jobs dashboard.`
        })
      });

      if (!messageResponse.ok) {
        console.error('Failed to send notification message to job poster');
      }

      setShowApplicationForm(false);
      setSuccess('Application submitted successfully!');
      
      // Clear success message after 10 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 10000);
      
    } catch (err) {
      console.error('Application submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await onSave(id);
    } catch (err) {
      setError('Failed to save job');
    }
  };

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorAlert}>
          <p className={styles.errorText}>{error}</p>
          {!user?.walletId && (
            <a href="/profile" className={styles.profileLink}>
              Complete Profile →
            </a>
          )}
        </div>
      )}
      
      {success && (
        <div className={styles.successAlert}>
          <p className={styles.successText}>{success}</p>
        </div>
      )}

      {showApplicationForm ? (
        <JobApplication
          jobId={id}
          jobTitle={title}
          onSubmit={handleApplicationSubmit}
          onCancel={() => setShowApplicationForm(false)}
        />
      ) : (
        <>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>{title}</h2>
              <div className={styles.metaInfo}>
                <span>Posted {postedDate}</span>
                <span>•</span>
                <span>{location}</span>
              </div>
            </div>
            <button
              onClick={handleSave}
              className={`${styles.saveButton} ${isSaved ? styles.saved : ''}`}
              title={isSaved ? "Remove from saved jobs" : "Save job"}
            >
              <svg
                className="w-6 h-6"
                fill={isSaved ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Price</div>
                <div className={styles.statValue}>{price} XRV</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Experience Level</div>
                <div className={styles.statValue}>{experienceLevel}</div>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Job Description</h3>
              <p className={styles.description}>{description}</p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Skills & Expertise</h3>
              <div className={styles.skillsGrid}>
                {skills.map((skill) => (
                  <div key={skill.name} className={styles.skillTag}>
                    <span>{skill.name}</span>
                    <span> • {skill.yearsRequired}+ years</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>About the Client</h3>
              <div className={styles.clientCard}>
                <div className={styles.clientName}>{poster.name}</div>
                <div className={styles.clientInfo}>
                  <div>Rating: {poster.rating}/5</div>
                  <div>{poster.jobsPosted} jobs posted</div>
                  <div>Member since {poster.memberSince}</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleApplyClick}
              className={styles.applyButton}
              disabled={isLoading}
            >
              {isLoading ? 'Applying...' : 'Apply Now'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}; 