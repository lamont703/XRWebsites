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
  };
  onClick: (job: Job) => void;
}

export const JobCard = ({ job, onClick }: JobCardProps) => {
  return (
    <div 
      className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors"
      onClick={() => onClick(job)}
    >
      <h3 className="text-xl font-semibold text-white mb-2">{job.title}</h3>
      <p className="text-gray-400 mb-4">{job.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-blue-400">${job.price}</span>
        <span className="text-gray-400">{job.location}</span>
      </div>
    </div>
  );
}; 