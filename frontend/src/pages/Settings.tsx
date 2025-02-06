import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import styles from '../styles/Dashboard.module.css';
import { toast } from 'react-hot-toast';

interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
}

export const Settings = () => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/${user.id}/profile`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();

      console.log('Profile data from API:', data);
      
      // Create profile with all user data
      const fullProfile = {
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ')[1] || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        ...data.data // Merge any additional data from profile endpoint
      };

      setProfile(fullProfile);
      setFormData(fullProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
      
      // If profile fetch fails, still show auth context data
      if (user) {
        const initialProfile = {
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ')[1] || '',
          email: user.email || '',
          username: user.username || '',
          phone: user.phone || '',
          bio: user.bio || '',
          location: user.location || '',
          website: user.website || ''
        };
        setProfile(initialProfile);
        setFormData(initialProfile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/${user.id}/update`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fullName: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            username: formData.username,
            phone: formData.phone,
            bio: formData.bio,
            location: formData.location,
            website: formData.website
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      // Update local profile state
      setProfile({
        ...formData,
        ...data.data
      });
      setFormData({
        ...formData,
        ...data.data
      });
      
      // Update AuthContext
      updateUser({
        ...user,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email
      });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Settings Section */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData?.firstName || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData?.lastName || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData?.username || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData?.email || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData?.phone || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData?.bio || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData?.location || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData?.website || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-gray-300 mb-1">First Name</h3>
                  <p className="text-white text-lg">{profile?.firstName || 'Not set'}</p>
                </div>
                <div>
                  <h3 className="text-gray-300 mb-1">Last Name</h3>
                  <p className="text-white text-lg">{profile?.lastName || 'Not set'}</p>
                </div>
                <div>
                  <h3 className="text-gray-300 mb-1">Username</h3>
                  <p className="text-white text-lg">{profile?.username || 'Not set'}</p>
                </div>
                <div>
                  <h3 className="text-gray-300 mb-1">Email</h3>
                  <p className="text-white text-lg">{profile?.email || 'Not set'}</p>
                </div>
                <div>
                  <h3 className="text-gray-300 mb-1">Phone</h3>
                  <p className="text-white text-lg">{profile?.phone || 'Not set'}</p>
                </div>
                <div className="col-span-2">
                  <h3 className="text-gray-300 mb-1">Bio</h3>
                  <p className="text-white">{profile?.bio || 'No bio added yet'}</p>
                </div>
                <div>
                  <h3 className="text-gray-300 mb-1">Location</h3>
                  <p className="text-white">{profile?.location || 'Not set'}</p>
                </div>
                <div>
                  <h3 className="text-gray-300 mb-1">Website</h3>
                  {profile?.website ? (
                    <a 
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {profile.website}
                    </a>
                  ) : (
                    <p className="text-white">Not set</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Account Stats Section */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className="text-sm font-medium text-gray-400 mb-2">Account Status</div>
              <div className="text-2xl font-bold text-white">Active</div>
            </div>
            <div className={styles.statCard}>
              <div className="text-sm font-medium text-gray-400 mb-2">2FA Status</div>
              <div className="text-2xl font-bold text-white">Disabled</div>
            </div>
            <div className={styles.statCard}>
              <div className="text-sm font-medium text-gray-400 mb-2">Last Login</div>
              <div className="text-2xl font-bold text-white">Today</div>
            </div>
            <div className={styles.statCard}>
              <div className="text-sm font-medium text-gray-400 mb-2">Account Type</div>
              <div className="text-2xl font-bold text-white">Standard</div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
            {/* Your existing settings content */}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 