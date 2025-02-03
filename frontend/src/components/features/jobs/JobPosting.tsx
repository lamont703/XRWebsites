import React, { useState } from 'react';

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
    <div className="w-full max-w-full overflow-x-hidden">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Post a New Job</h2>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1 sm:mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm sm:text-base"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1 sm:mb-2">
            Project Type
          </label>
          <select
            value={formData.projectType}
            onChange={e => setFormData(prev => ({ ...prev, projectType: e.target.value as any }))}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm sm:text-base"
          >
            <option value="AR">AR (Augmented Reality)</option>
            <option value="VR">VR (Virtual Reality)</option>
            <option value="Web3">Web3</option>
            <option value="Metaverse">Metaverse</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 h-32"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              placeholder="e.g., Remote, Worldwide"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Price (XRV)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              min="0"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Experience Level
            </label>
            <select
              value={formData.experienceLevel}
              onChange={e => setFormData(prev => ({ ...prev, experienceLevel: e.target.value as any }))}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Project Duration
            </label>
            <input
              type="text"
              value={formData.projectDuration}
              onChange={e => setFormData(prev => ({ ...prev, projectDuration: e.target.value }))}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              placeholder="e.g., 3 months"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Required Skills
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={skillInput.name}
              onChange={e => setSkillInput(prev => ({ ...prev, name: e.target.value }))}
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2"
              placeholder="Skill name"
            />
            <input
              type="number"
              value={skillInput.yearsRequired}
              onChange={e => setSkillInput(prev => ({ ...prev, yearsRequired: Number(e.target.value) }))}
              className="w-20 bg-gray-700 text-white rounded-lg px-4 py-2"
              min="0"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {formData.skills.map(skill => (
              <span
                key={skill.name}
                className="bg-gray-700 text-white text-xs sm:text-sm rounded-full px-3 py-1 flex items-center gap-2"
              >
                {skill.name}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.name)}
                  className="hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mt-4">
            <p className="text-green-500 text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm mt-4">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg
            transition-colors duration-200 text-sm sm:text-base font-medium disabled:opacity-50"
        >
          {isLoading ? 'Posting...' : 'Post Job'}
        </button>
      </form>
    </div>
  );
}; 