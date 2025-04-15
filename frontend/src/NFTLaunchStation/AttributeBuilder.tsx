import { useState } from 'react';
import styles from '@/styles/NFTLaunchStation.module.css';

interface AttributeBuilderProps {
  attributes: Array<{ trait_type: string; value: string }>;
  onChange: (attributes: Array<{ trait_type: string; value: string }>) => void;
}

export const AttributeBuilder = ({ attributes, onChange }: AttributeBuilderProps) => {
  const handleAddAttribute = () => {
    onChange([...attributes, { trait_type: '', value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    onChange(newAttributes);
  };

  return (
    <div className={styles.attributeBuilder}>
      <h4 className={styles.sectionTitle}>NFT Attributes</h4>
      <p className={styles.attributeDescription}>
        Attributes define the properties and rarity of your NFT
      </p>
      
      <div className={styles.attributeList}>
        {attributes.map((attr, index) => (
          <div key={index} className={styles.attributeItem}>
            <div className={styles.attributeInputGroup}>
              <input
                type="text"
                placeholder="Trait Type"
                value={attr.trait_type}
                onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
                className={styles.attributeInput}
              />
              <input
                type="text"
                placeholder="Value"
                value={attr.value}
                onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                className={styles.attributeInput}
              />
            </div>
            
            <div className={styles.attributeActions}>
              <button 
                type="button" 
                onClick={() => handleRemoveAttribute(index)}
                className={styles.removeAttributeButton}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        type="button"
        onClick={handleAddAttribute}
        className={styles.addAttributeButton}
      >
        <span className={styles.buttonIcon}>+</span> Add Attribute
      </button>
    </div>
  );
}; 