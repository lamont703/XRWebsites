import React, { useState } from 'react';
import { useAuth } from '@/store/auth/useAuth';

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
  jobId,
  jobTitle,
  onSubmit,
  onCancel
}) => {
  const { user } = useAuth();
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
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Apply for {jobTitle}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Letter */}
        <div>
          <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-400 mb-2">
            Cover Letter
          </label>
          <textarea
            id="coverLetter"
            rows={6}
            className="w-full bg-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
            placeholder="Introduce yourself and explain why you're the best fit for this job..."
            value={formData.coverLetter}
            onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
            required
          />
        </div>

        {/* Rate and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="proposedRate" className="block text-sm font-medium text-gray-400 mb-2">
              Proposed Rate (XRV)
            </label>
            <input
              type="number"
              id="proposedRate"
              min="0"
              step="0.01"
              className="w-full bg-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              value={formData.proposedRate}
              onChange={(e) => setFormData({ ...formData, proposedRate: parseFloat(e.target.value) })}
              required
            />
          </div>
          <div>
            <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-400 mb-2">
              Estimated Duration (days)
            </label>
            <input
              type="number"
              id="estimatedDuration"
              min="1"
              className="w-full bg-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        {/* Portfolio Links */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Portfolio Links
          </label>
          {portfolioLinks.map((link, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="url"
                className="flex-1 bg-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
                value={link}
                onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemovePortfolioLink(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddPortfolioLink}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            + Add Portfolio Link
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 font-medium
              transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-3 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}; 