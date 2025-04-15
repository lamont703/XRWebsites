import styles from '@/styles/NFTLaunchStation.module.css';

interface NFTPreviewProps {
  name: string;
  description: string;
  imageUrl: string | null;
  attributes: Array<{ trait_type: string; value: string }>;
  royalties: number;
  supply: number;
  collection: string | null;
}

export const NFTPreview = ({
  name,
  description,
  imageUrl,
  attributes,
  royalties,
  supply,
  collection
}: NFTPreviewProps) => {
  // Filter out empty attributes
  const validAttributes = attributes.filter(
    attr => attr.trait_type.trim() !== '' && attr.value.trim() !== ''
  );

  return (
    <div className={styles.nftPreviewContainer}>
      <div className={styles.nftPreviewCard}>
        <div className={styles.previewHeader}>
          <h3>NFT Preview</h3>
        </div>
        
        <div className={styles.previewContent}>
          <div className={styles.previewImageContainer}>
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt="NFT Preview" 
                className={styles.previewImage}
              />
            ) : (
              <div className={styles.previewPlaceholder}>
                <span>Upload an image</span>
              </div>
            )}
          </div>
          
          <div className={styles.previewDetails}>
            <h4 className={styles.previewName}>{name || "NFT Name"}</h4>
            <p className={styles.previewDescription}>
              {description || "NFT Description will appear here"}
            </p>
            
            {validAttributes.length > 0 && (
              <div className={styles.previewAttributes}>
                {validAttributes.map((attr, index) => (
                  <div key={index} className={styles.previewAttribute}>
                    <span className={styles.attributeType}>{attr.trait_type}</span>
                    <span className={styles.attributeValue}>{attr.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.previewMetadata}>
        <div className={styles.metadataSection}>
          <h4>NFT Details</h4>
          <div className={styles.metadataGrid}>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Supply</span>
              <span className={styles.metadataValue}>{supply}</span>
            </div>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Royalties</span>
              <span className={styles.metadataValue}>{royalties}%</span>
            </div>
            {collection && (
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Collection</span>
                <span className={styles.metadataValue}>{collection}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.metadataSection}>
          <h4>Technical Information</h4>
          <div className={styles.metadataGrid}>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Standard</span>
              <span className={styles.metadataValue}>Solana NFT</span>
            </div>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Blockchain</span>
              <span className={styles.metadataValue}>Solana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 