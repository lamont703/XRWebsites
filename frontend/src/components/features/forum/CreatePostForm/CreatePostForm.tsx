import React, { useState } from 'react';
import { useAuth } from '@/store/auth/Auth';
import styles from '@/styles/CreatePostForm.module.css';

interface CreatePostFormProps {
  onSubmit: (postData: {
    title: string;
    content: string;
    category: string;
    tags: string[];
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ onSubmit, onCancel, isLoading }) => {
  const {} = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [] as string[],
    tagInput: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    if (formData.tagInput && !formData.tags.includes(formData.tagInput)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput],
        tagInput: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }
    
    console.log('Submitting post form data:', formData);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="post-title" className={styles.label}>Title</label>
        <input
          id="post-title"
          type="text"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="post-content" className={styles.label}>Content</label>
        <textarea
          id="post-content"
          value={formData.content}
          onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
          className={styles.textarea}
          required
          title="Post content"
          placeholder="Write your post content here..."
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="post-category" className={styles.label}>Category</label>
        <select
          id="post-category"
          value={formData.category}
          onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className={styles.select}
          title="Select post category"
        >
          <option value="general">General</option>
          <option value="development">Development</option>
          <option value="business">Business</option>
          <option value="networking">Networking</option>
          <option value="tutorials">Tutorials</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Tags</label>
        <div className={styles.tagsContainer}>
          {formData.tags.map(tag => (
            <span key={tag} className={styles.tag}>
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className={styles.removeTagButton}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className={styles.tagInput}>
          <input
            type="text"
            value={formData.tagInput}
            onChange={e => setFormData(prev => ({ ...prev, tagInput: e.target.value }))}
            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            className={styles.input}
            placeholder="Add a tag..."
          />
          <button
            type="button"
            onClick={handleAddTag}
            className={styles.addTagButton}
          >
            Add
          </button>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Post'}
        </button>
      </div>
    </form>
  );
}; 