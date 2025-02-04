import React, { useState } from 'react';
import { useAuth } from '@/store/auth/useAuth';

interface CreateNFTProps {
  onSubmit: (nftData: NFTData) => Promise<void>;
  onCancel: () => void;
}

export interface NFTData {
  name: string;
  description: string;
  image: File | null;
  attributes: NFTAttribute[];
  collection?: string;
  royalties: number;
  supply: number;
}

interface NFTAttribute {
  trait_type: string;
  value: string;
}

export const CreateNFT: React.FC<CreateNFTProps> = ({
  onSubmit,
  onCancel
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<NFTAttribute[]>([
    { trait_type: '', value: '' }
  ]);
  
  const [formData, setFormData] = useState<NFTData>({
    name: '',
    description: '',
    image: null,
    attributes: [],
    royalties: 10, // Default 10%
    supply: 1 // Default single edition
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size must be less than 10MB');
        return;
      }
      setFormData({ ...formData, image: file });
    }
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, field: keyof NFTAttribute, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setAttributes(newAttributes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.image) {
        throw new Error('Please select an image for your NFT');
      }

      const validAttributes = attributes.filter(
        attr => attr.trait_type.trim() !== '' && attr.value.trim() !== ''
      );

      await onSubmit({
        ...formData,
        attributes: validAttributes
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create NFT');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Create New NFT</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            NFT Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full bg-gray-700 text-white rounded-lg p-3"
            required
          />
          <p className="text-sm text-gray-500 mt-1">Max size: 10MB. Recommended: 1500x1500px</p>
        </div>

        {/* Name and Description */}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full bg-gray-700 text-white rounded-lg p-3"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full bg-gray-700 text-white rounded-lg p-3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Attributes */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Attributes
          </label>
          {attributes.map((attr, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Trait Type"
                className="flex-1 bg-gray-700 text-white rounded-lg p-3"
                value={attr.trait_type}
                onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
              />
              <input
                type="text"
                placeholder="Value"
                className="flex-1 bg-gray-700 text-white rounded-lg p-3"
                value={attr.value}
                onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveAttribute(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddAttribute}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            + Add Attribute
          </button>
        </div>

        {/* Royalties and Supply */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="royalties" className="block text-sm font-medium text-gray-400 mb-2">
              Royalties (%)
            </label>
            <input
              type="number"
              id="royalties"
              min="0"
              max="50"
              className="w-full bg-gray-700 text-white rounded-lg p-3"
              value={formData.royalties}
              onChange={(e) => setFormData({ ...formData, royalties: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <label htmlFor="supply" className="block text-sm font-medium text-gray-400 mb-2">
              Supply
            </label>
            <input
              type="number"
              id="supply"
              min="1"
              className="w-full bg-gray-700 text-white rounded-lg p-3"
              value={formData.supply}
              onChange={(e) => setFormData({ ...formData, supply: Number(e.target.value) })}
              required
            />
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 
              font-medium transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Creating...' : 'Create NFT'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-3 
              font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}; 