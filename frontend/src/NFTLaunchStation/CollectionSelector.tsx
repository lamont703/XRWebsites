import { useState, useEffect } from 'react';
import styles from '@/styles/NFTLaunchStation.module.css';

interface Collection {
  id: string;
  name: string;
}

interface CollectionSelectorProps {
  selectedCollection: string | null;
  onChange: (collection: string | null) => void;
}

export const CollectionSelector = ({ selectedCollection, onChange }: CollectionSelectorProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionSymbol, setNewCollectionSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load collections from backend
    const loadCollections = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/collections`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCollections(data.collections || []);
        }
      } catch (error) {
        console.error('Failed to load collections:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCollections();
  }, []);

  const handleCreateCollection = async () => {
    if (!newCollectionName || !newCollectionSymbol) {
      alert('Please enter both name and symbol for the new collection');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/collections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCollectionName,
          symbol: newCollectionSymbol
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCollections([...collections, data.collection]);
        onChange(data.collection.id);
        setNewCollectionName('');
        setNewCollectionSymbol('');
      } else {
        alert('Failed to create collection');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to create collection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.collectionSelector}>
      <h4 className={styles.sectionTitle}>Collection</h4>
      <p className={styles.collectionDescription}>
        Add this NFT to an existing collection or create a new one
      </p>
      
      <select 
        value={selectedCollection || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={styles.collectionSelect}
        disabled={isLoading}
      >
        <option value="">No Collection</option>
        {collections.map(collection => (
          <option key={collection.id} value={collection.id}>
            {collection.name}
          </option>
        ))}
        <option value="new">+ Create New Collection</option>
      </select>
      
      {selectedCollection === 'new' && (
        <div className={styles.newCollectionForm}>
          <input
            type="text"
            placeholder="Collection Name"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Collection Symbol"
            value={newCollectionSymbol}
            onChange={(e) => setNewCollectionSymbol(e.target.value)}
            className={styles.input}
          />
          <button 
            onClick={handleCreateCollection}
            className={styles.createCollectionButton}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Collection'}
          </button>
        </div>
      )}
    </div>
  );
}; 