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
  onClick?: () => void;
}

export const JobCard = ({ job, onClick }: JobCardProps) => {
  return (
    <div 
      className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors"
      onClick={onClick}
    >
      <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
      <p className="text-gray-400 mb-4 line-clamp-2">{job.description}</p>
      
      <div className="flex justify-between items-center mb-4">
        <div className="text-blue-400 font-bold">{job.price} XRV</div>
        <div className="text-gray-400">{job.location}</div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">
          Experience: {job.experienceLevel}
        </div>
        {job.poster && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">{job.poster.name}</span>
            <span className="text-yellow-400">★ {job.poster.rating}</span>
          </div>
        )}
      </div>
    </div>
  );
}; 