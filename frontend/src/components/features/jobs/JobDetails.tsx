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
          <div className={styles.missionDetails}>
            <div className={styles.missionDetailsHeader}>
              <h2 className={styles.missionTitle}>{title}</h2>
              <div className={styles.missionBadge}>
                {/* Assuming a status prop is added to the component */}
                {/* Replace 'Completed Mission' with 'Active Mission' if status is 'open' */}
                Completed Mission
              </div>
            </div>
            
            <div className={styles.missionSection}>
              <h3 className={styles.sectionTitle}>Mission Brief</h3>
              <p className={styles.missionDescription}>{description}</p>
            </div>
            
            <div className={styles.missionSection}>
              <h3 className={styles.sectionTitle}>Required Skills</h3>
              <div className={styles.skillsGrid}>
                {skills.map(skill => (
                  <div key={skill.name} className={styles.skillItem}>
                    <span className={styles.skillName}>{skill.name}</span>
                    <span className={styles.skillYears}>{skill.yearsRequired}+ years</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.missionSection}>
              <h3 className={styles.sectionTitle}>Mission Parameters</h3>
              <div className={styles.parameterGrid}>
                <div className={styles.parameter}>
                  <span className={styles.parameterLabel}>Location</span>
                  <span className={styles.parameterValue}>{location}</span>
                </div>
                <div className={styles.parameter}>
                  <span className={styles.parameterLabel}>Experience</span>
                  <span className={styles.parameterValue}>{experienceLevel}</span>
                </div>
                <div className={styles.parameter}>
                  <span className={styles.parameterLabel}>Posted</span>
                  <span className={styles.parameterValue}>{postedDate}</span>
                </div>
                <div className={styles.parameter}>
                  <span className={styles.parameterLabel}>Reward</span>
                  <span className={styles.parameterValue}>{price} USDC</span>
                </div>
              </div>
            </div>
            
            <div className={styles.missionActions}>
              <button 
                onClick={() => onApply(id, { coverLetter: '', expectedRate: price })}
                className={styles.primaryButton}
              >
                Accept Mission
              </button>
              <button 
                onClick={() => onSave(id)}
                className={styles.secondaryButton}
              >
                Save For Later
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 