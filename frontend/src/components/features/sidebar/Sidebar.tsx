import { useNavigate } from 'react-router-dom';
import { UserInfo } from './UserInfo';

export const Sidebar = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // Implement logout logic
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="w-64 bg-gray-800 p-4">
      <div className="text-2xl font-bold text-blue-400 mb-8">XRWebsites.io</div>
      <UserInfo />
      <nav className="space-y-2">
        <NavLink to="/dashboard">Overview</NavLink>
        <NavLink to="/wallet">Wallet</NavLink>
        <NavLink to="/assets">NFT Assets</NavLink>
        <NavLink to="/jobs">Jobs</NavLink>
        <NavLink to="/token-creator">Create Token</NavLink>
        <NavLink to="/settings">Settings</NavLink>
        <NavLink to="/marketplace">Job Marketplace</NavLink>
        <button 
          onClick={handleLogout}
          className="w-full mt-4 p-2 rounded bg-red-600 hover:bg-red-700 text-white"
        >
          Logout
        </button>
      </nav>
    </div>
  );
}; 