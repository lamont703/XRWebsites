export interface NFTAttribute {
  trait_type: string;
  value: string;
}

export interface NFTConfig {
  name: string;
  description: string;
  image: File | null;
  imageUrl?: string;
  attributes: NFTAttribute[];
  royalties: number;
  supply: number;
  collection: string | null;
}

export const defaultNftConfig: NFTConfig = {
  name: '',
  description: '',
  image: null,
  attributes: [{ trait_type: '', value: '' }],
  royalties: 5,
  supply: 1,
  collection: null
}; 