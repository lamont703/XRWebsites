export interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  features: {
    burnable: boolean;
    mintable: boolean;
    transferable: boolean;
    pausable: boolean;
  };
  description?: string;
  image?: string;
  uri?: string;
}



export const defaultTokenConfig: TokenConfig = {
  name: "",
  symbol: "",
  decimals: 9,
  totalSupply: 1000000,
  features: {
    burnable: false,
    mintable: true,
    transferable: true,
    pausable: false
  },
  description: "",
  image: "",
  uri: ""
};
