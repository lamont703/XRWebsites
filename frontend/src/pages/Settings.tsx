import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import styles from '@/styles/Settings.module.css';
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
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2 className={styles.title}>Profile Settings</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={styles.editButton}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName" className={styles.label}>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    value={formData?.firstName || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                    title="Your first name"
                    placeholder="Enter your first name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="lastName" className={styles.label}>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    value={formData?.lastName || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                    title="Your last name"
                    placeholder="Enter your last name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="username" className={styles.label}>Username</label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={formData?.username || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                    title="Your username"
                    placeholder="Enter your username"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>Email</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData?.email || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                    title="Your email address"
                    placeholder="Enter your email address"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.label}>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData?.phone || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    title="Your phone number"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="location" className={styles.label}>Location</label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={formData?.location || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    title="Your location"
                    placeholder="Enter your location"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="website" className={styles.label}>Website</label>
                  <input
                    type="url"
                    name="website"
                    id="website"
                    value={formData?.website || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    title="Your website URL"
                    placeholder="Enter your website URL"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="bio" className={styles.label}>Bio</label>
                  <textarea
                    name="bio"
                    id="bio"
                    value={formData?.bio || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    rows={4}
                    title="Your bio"
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>
              <button type="submit" className={styles.submitButton}>
                Save Changes
              </button>
            </form>
          ) : (
            <div className={styles.formGrid}>
              <div>
                <h3 className={styles.label}>First Name</h3>
                <p className={styles.value}>{profile?.firstName || 'Not set'}</p>
              </div>
              <div>
                <h3 className={styles.label}>Last Name</h3>
                <p className={styles.value}>{profile?.lastName || 'Not set'}</p>
              </div>
              <div>
                <h3 className={styles.label}>Username</h3>
                <p className={styles.value}>{profile?.username || 'Not set'}</p>
              </div>
              <div>
                <h3 className={styles.label}>Email</h3>
                <p className={styles.value}>{profile?.email || 'Not set'}</p>
              </div>
              <div>
                <h3 className={styles.label}>Phone</h3>
                <p className={styles.value}>{profile?.phone || 'Not set'}</p>
              </div>
              <div className={styles.colSpan2}>
                <h3 className={styles.label}>Bio</h3>
                <p className={styles.value}>{profile?.bio || 'No bio added yet'}</p>
              </div>
              <div>
                <h3 className={styles.label}>Location</h3>
                <p className={styles.value}>{profile?.location || 'Not set'}</p>
              </div>
              <div>
                <h3 className={styles.label}>Website</h3>
                {profile?.website ? (
                  <a 
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.value}
                  >
                    {profile.website}
                  </a>
                ) : (
                  <p className={styles.value}>Not set</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}; 