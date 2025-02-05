import React, { useState } from 'react';
import { useAuth } from '@/store/auth/Auth';
import { JobApplication, JobApplicationData } from './JobApplication';

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
    <div className="bg-gray-800 rounded-lg p-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
          <p className="text-red-500 text-sm">{error}</p>
          {!user?.walletId && (
            <a 
              href="/profile" 
              className="text-blue-400 hover:text-blue-300 text-sm block mt-2"
            >
              Complete Profile →
            </a>
          )}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-4">
          <p className="text-green-500 text-sm">{success}</p>
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
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <div className="flex items-center space-x-4 text-gray-400">
              <span>Posted {postedDate}</span>
              <span>•</span>
              <span>{location}</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="text-gray-400 hover:text-blue-400"
          >
            <svg
              className={`w-6 h-6 ${isSaved ? 'fill-current text-blue-400' : 'stroke-current'}`}
              fill="none"
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
      )}

      <div className="space-y-6">
        {/* Price and Experience Level */}
        <div className="flex space-x-4">
          <div className="bg-gray-700 rounded-lg p-4 flex-1">
            <div className="text-gray-400 text-sm mb-1">Price</div>
            <div className="text-xl font-bold text-white">{price} XRV</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 flex-1">
            <div className="text-gray-400 text-sm mb-1">Experience Level</div>
            <div className="text-xl font-bold text-white capitalize">{experienceLevel}</div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Job Description</h3>
          <p className="text-gray-400">{description}</p>
        </div>

        {/* Skills */}
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Skills & Expertise</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div key={skill.name} className="bg-gray-700 rounded-full px-3 py-1">
                <span className="text-white">{skill.name}</span>
                <span className="text-gray-400 text-sm"> • {skill.yearsRequired}+ years</span>
              </div>
            ))}
          </div>
        </div>

        {/* About the Client */}
        <div>
          <h3 className="text-lg font-bold text-white mb-2">About the Client</h3>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-white font-medium mb-2">{poster.name}</div>
            <div className="space-y-1 text-sm text-gray-400">
              <div>Rating: {poster.rating}/5</div>
              <div>{poster.jobsPosted} jobs posted</div>
              <div>Member since {poster.memberSince}</div>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="mt-6">
          <button
            onClick={handleApplyClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mt-4"
            disabled={isLoading}
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}; 