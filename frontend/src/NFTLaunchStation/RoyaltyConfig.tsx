import { useState } from 'react';
import styles from '@/styles/NFTLaunchStation.module.css';

interface RoyaltyConfigProps {
  royalties: number;
  supply: number;
  onRoyaltyChange: (royalties: number) => void;
  onSupplyChange: (supply: number) => void;
}

interface RoyaltyRecipient {
  address: string;
  share: number;
}

export const RoyaltyConfig = ({ 
  royalties, 
  supply, 
  onRoyaltyChange, 
  onSupplyChange 
}: RoyaltyConfigProps) => {
  const [royaltyRecipients, setRoyaltyRecipients] = useState<RoyaltyRecipient[]>([
    { address: '', share: 100 }
  ]);

  const addRecipient = () => {
    // Calculate remaining share
    const usedShare = royaltyRecipients.reduce((sum, recipient) => sum + recipient.share, 0);
    const remainingShare = Math.max(0, 100 - usedShare);
    
    setRoyaltyRecipients([
      ...royaltyRecipients,
      { address: '', share: remainingShare }
    ]);
  };

  const removeRecipient = (index: number) => {
    if (royaltyRecipients.length <= 1) return;
    
    const newRecipients = royaltyRecipients.filter((_, i) => i !== index);
    
    // Redistribute the removed share to the first recipient
    if (newRecipients.length > 0) {
      const removedShare = royaltyRecipients[index].share;
      newRecipients[0] = {
        ...newRecipients[0],
        share: newRecipients[0].share + removedShare
      };
    }
    
    setRoyaltyRecipients(newRecipients);
  };

  const updateRecipient = (index: number, field: keyof RoyaltyRecipient, value: string | number) => {
    const newRecipients = [...royaltyRecipients];
    
    if (field === 'share') {
      // Ensure share is a number
      const numValue = typeof value === 'string' ? parseInt(value) : value;
      
      // Calculate the difference from the previous share
      const prevShare = newRecipients[index].share;
      const diff = numValue - prevShare;
      
      // If increasing this share, decrease others proportionally
      if (diff > 0) {
        const otherRecipients = newRecipients.filter((_, i) => i !== index);
        const totalOtherShares = otherRecipients.reduce((sum, r) => sum + r.share, 0);
        
        if (totalOtherShares > 0) {
          // Distribute the difference proportionally
          otherRecipients.forEach((recipient, i) => {
            const otherIndex = i >= index ? i + 1 : i;
            const proportion = recipient.share / totalOtherShares;
            newRecipients[otherIndex] = {
              ...recipient,
              share: Math.max(0, recipient.share - Math.ceil(diff * proportion))
            };
          });
        }
      }
      
      newRecipients[index] = {
        ...newRecipients[index],
        [field]: numValue
      };
    } else {
      newRecipients[index] = {
        ...newRecipients[index],
        [field]: value
      };
    }
    
    setRoyaltyRecipients(newRecipients);
  };

  return (
    <div className={styles.royaltyConfig}>
      <h4 className={styles.sectionTitle}>Royalties & Supply</h4>
      
      <div className={styles.configRow}>
        <div className={styles.configField}>
          <label className={styles.fieldLabel}>Royalties (%)</label>
          <div className={styles.royaltySlider}>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={royalties}
              onChange={(e) => onRoyaltyChange(parseFloat(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.royaltyValue}>{royalties}%</span>
          </div>
        </div>
        
        <div className={styles.configField}>
          <label className={styles.fieldLabel}>Supply</label>
          <input
            type="number"
            min="1"
            value={supply}
            onChange={(e) => onSupplyChange(parseInt(e.target.value))}
            className={styles.input}
          />
        </div>
      </div>
      
      {royalties > 0 && (
        <div className={styles.royaltySplits}>
          <h5 className={styles.subsectionTitle}>Royalty Recipients</h5>
          {royaltyRecipients.map((recipient, index) => (
            <div key={index} className={styles.recipientRow}>
              <input
                type="text"
                placeholder="Wallet Address"
                value={recipient.address}
                onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                className={styles.recipientInput}
              />
              <div className={styles.shareInputContainer}>
                <input
                  type="number"
                  placeholder="Share %"
                  value={recipient.share}
                  onChange={(e) => updateRecipient(index, 'share', parseInt(e.target.value))}
                  className={styles.shareInput}
                  min="0"
                  max="100"
                />
                <span className={styles.shareSymbol}>%</span>
              </div>
              <button 
                onClick={() => removeRecipient(index)}
                className={styles.removeButton}
                disabled={royaltyRecipients.length <= 1}
              >
                ✕
              </button>
            </div>
          ))}
          <button 
            onClick={addRecipient}
            className={styles.addRecipientButton}
          >
            + Add Recipient
          </button>
        </div>
      )}
    </div>
  );
}; 