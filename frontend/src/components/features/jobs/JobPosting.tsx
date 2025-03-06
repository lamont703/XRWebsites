import React, { useState } from 'react';
import styles from '@/styles/JobPosting.module.css';

interface JobPostingProps {
  onSubmit: (jobData: JobPostData) => Promise<void>;
}

export interface JobPostData {
  title: string;
  description: string;
  location: string;
  price: number;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  skills: { name: string; yearsRequired: number; }[];
  projectDuration: string;
  projectType: 'AR' | 'VR' | 'Web3' | 'Metaverse' | 'Other';
}

export const JobPosting: React.FC<JobPostingProps> = ({ onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState({ name: '', yearsRequired: 1 });
  
  const [formData, setFormData] = useState<JobPostData>({
    title: '',
    description: '',
    location: '',
    price: 0,
    experienceLevel: 'intermediate',
    skills: [],
    projectDuration: '',
    projectType: 'AR'
  });

  const handleAddSkill = () => {
    if (skillInput.name) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, { ...skillInput }]
      }));
      setSkillInput({ name: '', yearsRequired: 1 });
    }
  };

  const handleRemoveSkill = (skillName: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.name !== skillName)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      setSuccess('Job posted successfully!');
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        location: '',
        price: 0,
        experienceLevel: 'intermediate',
        skills: [],
        projectDuration: '',
        projectType: 'AR'
      });
      
      // Clear success message after 10 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 10000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post job');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Post a New Job</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={styles.input}
            required
            title="Job Title"
            placeholder="Enter job title"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className={styles.textarea}
            required
            title="Job Description"
            placeholder="Enter job description"
          />
        </div>

        <div className={styles.gridContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className={styles.input}
              placeholder="e.g., Remote, Worldwide"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Price (XRV)</label>
            <input
              type="number"
              value={formData.price}
              onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className={styles.input}
              min="0"
              required
              title="Job Price"
              placeholder="Enter price in XRV"
            />
          </div>
        </div>

        <div className={styles.gridContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Experience Level</label>
            <select
              value={formData.experienceLevel}
              onChange={e => setFormData(prev => ({ ...prev, experienceLevel: e.target.value as any }))}
              className={styles.select}
              title="Experience Level Required"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Project Duration</label>
            <input
              type="text"
              value={formData.projectDuration}
              onChange={e => setFormData(prev => ({ ...prev, projectDuration: e.target.value }))}
              className={styles.input}
              placeholder="e.g., 3 months"
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Required Skills</label>
          <div className={styles.skillsInput}>
            <input
              type="text"
              value={skillInput.name}
              onChange={e => setSkillInput(prev => ({ ...prev, name: e.target.value }))}
              className={styles.input}
              placeholder="Skill name"
            />
            <input
              type="number"
              value={skillInput.yearsRequired}
              onChange={e => setSkillInput(prev => ({ ...prev, yearsRequired: Number(e.target.value) }))}
              className={styles.input}
              min="0"
              placeholder="Years"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className={styles.addButton}
            >
              Add
            </button>
          </div>
          
          <div className={styles.skillsList}>
            {formData.skills.map(skill => (
              <span key={skill.name} className={styles.skillTag}>
                {skill.name} • {skill.yearsRequired}+ years
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.name)}
                  className={styles.removeButton}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {success && (
          <div className={styles.successAlert}>
            <p className={styles.successText}>{success}</p>
          </div>
        )}

        {error && (
          <div className={styles.errorAlert}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? 'Posting...' : 'Post Job'}
        </button>
      </form>
    </div>
  );
}; 