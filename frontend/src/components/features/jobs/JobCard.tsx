import React, { useNavigate } from 'react-router-dom';

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
      className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors"
      onClick={() => onClick(job)}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-white">{job.title}</h3>
        <span className="text-green-400 font-medium">${job.price}</span>
      </div>
      
      <p className="text-gray-300 mb-4 line-clamp-2">{job.description}</p>
      
      <div className="flex justify-end">
        <button
          onClick={handleViewDetails}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
}; 