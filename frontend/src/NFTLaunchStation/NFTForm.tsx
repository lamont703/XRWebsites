import { useState } from 'react';
import { AttributeBuilder } from './AttributeBuilder';
import { CollectionSelector } from './CollectionSelector';
import { RoyaltyConfig } from './RoyaltyConfig';
import { NFTPreview } from './NFTPreview';
import styles from '@/styles/NFTLaunchStation.module.css';
import { NFTConfig } from '@/types/nft';

interface NFTFormProps {
  nftConfig: NFTConfig;
  onChange: (config: NFTConfig) => void;
  onSubmit: () => void;
  isWalletConnected: boolean;
  error: string | null;
}

export const NFTForm = ({
  nftConfig,
  onChange,
  onSubmit,
  isWalletConnected,
  error
}: NFTFormProps) => {
  const [activeTab, setActiveTab] = useState('design');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Image size must be less than 10MB');
        return;
      }
      
      // Create a preview URL
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      
      // Update the config
      onChange({ ...nftConfig, image: file });
    }
  };

  const handleAttributeChange = (attributes: Array<{ trait_type: string; value: string }>) => {
    onChange({ ...nftConfig, attributes });
  };

  const handleCollectionChange = (collection: string | null) => {
    onChange({ ...nftConfig, collection });
  };

  const handleRoyaltyChange = (royalties: number) => {
    onChange({ ...nftConfig, royalties });
  };

  const handleSupplyChange = (supply: number) => {
    onChange({ ...nftConfig, supply });
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formTabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'design' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('design')}
        >
          Design
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'properties' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          Properties
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'preview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>
      
      <div className={styles.formContent}>
        {activeTab === 'design' && (
          <div className={styles.designTab}>
            <div className={styles.formField}>
              <div className={styles.labelContainer}>
                <label className={styles.label}>NFT Image</label>
                <span className={styles.tooltip} title="Upload an image for your NFT (PNG, JPG recommended)">ℹ️</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
              <p className={styles.helperText}>Max size: 10MB. Recommended: 1500x1500px</p>
            </div>
            
            <div className={styles.formField}>
              <div className={styles.labelContainer}>
                <label className={styles.label}>Name</label>
              </div>
              <input
                type="text"
                value={nftConfig.name}
                onChange={(e) => onChange({ ...nftConfig, name: e.target.value })}
                className={styles.input}
                placeholder="Enter NFT name"
                required
              />
            </div>
            
            <div className={styles.formField}>
              <div className={styles.labelContainer}>
                <label className={styles.label}>Description</label>
              </div>
              <textarea
                value={nftConfig.description}
                onChange={(e) => onChange({ ...nftConfig, description: e.target.value })}
                className={styles.textarea}
                placeholder="Describe your NFT"
                rows={4}
                required
              />
            </div>
          </div>
        )}
        
        {activeTab === 'properties' && (
          <div className={styles.propertiesTab}>
            <AttributeBuilder 
              attributes={nftConfig.attributes}
              onChange={handleAttributeChange}
            />
            
            <CollectionSelector
              selectedCollection={nftConfig.collection}
              onChange={handleCollectionChange}
            />
            
            <RoyaltyConfig
              royalties={nftConfig.royalties}
              supply={nftConfig.supply}
              onRoyaltyChange={handleRoyaltyChange}
              onSupplyChange={handleSupplyChange}
            />
          </div>
        )}
        
        {activeTab === 'preview' && (
          <div className={styles.previewTab}>
            <NFTPreview
              name={nftConfig.name}
              description={nftConfig.description}
              imageUrl={imageUrl}
              attributes={nftConfig.attributes}
              royalties={nftConfig.royalties}
              supply={nftConfig.supply}
              collection={nftConfig.collection}
            />
          </div>
        )}
      </div>
      
      {error && (
        <div className={styles.errorMessage}>{error}</div>
      )}
      
      <div className={styles.formActions}>
        {activeTab === 'preview' ? (
          <button
            onClick={onSubmit}
            disabled={!isWalletConnected}
            className={styles.launchButton}
          >
            Launch NFT
          </button>
        ) : (
          <button
            onClick={() => setActiveTab(activeTab === 'design' ? 'properties' : 'preview')}
            className={styles.nextButton}
          >
            Next Step
          </button>
        )}
      </div>
    </div>
  );
}; 