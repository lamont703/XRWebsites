import React, { useState } from 'react';
import { useAuth } from '@/store/auth/Auth';
import styles from '@/styles/JobApplication.module.css';

interface JobApplicationProps {
  jobId: string;
  jobTitle: string;
  onSubmit: (applicationData: JobApplicationData) => Promise<void>;
  onCancel: () => void;
}

export interface JobApplicationData {
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: number;
  portfolioLinks: string[];
}

export const JobApplication: React.FC<JobApplicationProps> = ({
  jobTitle,
  onSubmit,
  onCancel
}) => {
  const {} = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(['']);
  
  const [formData, setFormData] = useState<JobApplicationData>({
    coverLetter: '',
    proposedRate: 0,
    estimatedDuration: 1,
    portfolioLinks: []
  });

  const handleAddPortfolioLink = () => {
    setPortfolioLinks([...portfolioLinks, '']);
  };

  const handleRemovePortfolioLink = (index: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index));
  };

  const handlePortfolioLinkChange = (index: number, value: string) => {
    const newLinks = [...portfolioLinks];
    newLinks[index] = value;
    setPortfolioLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const validLinks = portfolioLinks.filter(link => link.trim() !== '');
      await onSubmit({
        ...formData,
        portfolioLinks: validLinks
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Apply for {jobTitle}</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="coverLetter" className={styles.label}>
            Cover Letter
          </label>
          <textarea
            id="coverLetter"
            className={styles.textarea}
            placeholder="Introduce yourself and explain why you're the best fit for this job..."
            value={formData.coverLetter}
            onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
            required
          />
        </div>

        <div className={styles.gridContainer}>
          <div className={styles.formGroup}>
            <label htmlFor="proposedRate" className={styles.label}>
              Proposed Rate (XRV)
            </label>
            <input
              type="number"
              id="proposedRate"
              className={styles.input}
              min="0"
              step="0.01"
              value={formData.proposedRate}
              onChange={(e) => setFormData({ ...formData, proposedRate: parseFloat(e.target.value) })}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="estimatedDuration" className={styles.label}>
              Estimated Duration (days)
            </label>
            <input
              type="number"
              id="estimatedDuration"
              className={styles.input}
              min="1"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Portfolio Links
          </label>
          <div className={styles.portfolioContainer}>
            {portfolioLinks.map((link, index) => (
              <div key={index} className={styles.portfolioItem}>
                <input
                  type="url"
                  className={styles.input}
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePortfolioLink(index)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPortfolioLink}
              className={styles.addButton}
            >
              + Add Portfolio Link
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}

        <div className={styles.buttonContainer}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}; 