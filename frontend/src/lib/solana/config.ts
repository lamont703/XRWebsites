import { Cluster, Connection, ConnectionConfig } from '@solana/web3.js';
import { create } from 'zustand';
import { createContext } from 'react';

// Network types and configuration
export type NetworkType = 'mainnet' | 'devnet';

// Convert NetworkType to Cluster
function networkTypeToCluster(network: NetworkType): Cluster {
  return network === 'mainnet' ? 'mainnet-beta' as Cluster : 'devnet' as Cluster;
}

// Convert Cluster to NetworkType
function clusterToNetworkType(cluster: Cluster): NetworkType {
  return cluster === 'mainnet-beta' ? 'mainnet' : 'devnet';
}

// Alchemy endpoints
const ALCHEMY_MAINNET = 'https://solana-mainnet.core.chainstack.com/4d36293a8e6eef86281f61a73c33af5c';
//const CHAINSTACK_MAINNET = 'https://solana-mainnet.core.chainstack.com/4d36293a8e6eef86281f61a73c33af5c';
const ALCHEMY_DEVNET = 'https://solana-devnet.g.alchemy.com/v2/9W2xUPlDu4DakYXWytaIqTgmNSpGLdtu';

export const NETWORK_CONFIG = {
  mainnet: {
    name: 'Mainnet Beta',
    cluster: 'mainnet-beta' as Cluster,
    endpoint: ALCHEMY_MAINNET
  },
  devnet: {
    name: 'Devnet',
    cluster: 'devnet' as Cluster,
    endpoint: ALCHEMY_DEVNET
  }
} as const;

export interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  connection: Connection;
}

export const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// Connection configuration
const CONNECTION_CONFIG: ConnectionConfig = {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  httpHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': window.location.origin
  },
  fetch: customFetch // Custom fetch implementation for proper JSON-RPC formatting
};

// Custom fetch implementation to ensure proper JSON-RPC formatting
async function customFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Ensure the body is properly formatted as JSON-RPC
  if (init?.body) {
    try {
      const body = JSON.parse(init.body.toString());
      if (!body.jsonrpc) {
        body.jsonrpc = '2.0';
      }
      if (!body.id) {
        body.id = Math.random().toString(36).substring(7);
      }
      init.body = JSON.stringify(body);
    } catch (e) {
      // If body is not JSON, leave it as is
      console.warn('Non-JSON body in request:', e);
    }
  }

  // Add required headers
  init = init || {};
  init.headers = {
    ...init.headers,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  return fetch(input, init);
}

// RPC configuration
interface RPCEndpoint {
  url: string;
  weight: number; // Higher weight = higher priority
  rateLimit?: number; // Requests per second limit
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 1000; // 1 second window
const ALCHEMY_RPS = 25; // Set to 25 to stay under the 30 RPS limit
const PUBLIC_RPS = 10; // Conservative limit for public endpoints
const requestTimestamps: { [key: string]: number[] } = {};

export const RPC_ENDPOINTS: Record<Cluster, RPCEndpoint[]> = {
  'mainnet-beta': [
    { 
      url: ALCHEMY_MAINNET,
      weight: 3,
      rateLimit: ALCHEMY_RPS
    },
    { 
      url: 'https://rpc.ankr.com/solana', 
      weight: 2,
      rateLimit: PUBLIC_RPS
    }
  ],
  'devnet': [
    { 
      url: ALCHEMY_DEVNET,
      weight: 3,
      rateLimit: ALCHEMY_RPS
    },
    { 
      url: 'https://rpc.ankr.com/solana_devnet', 
      weight: 2,
      rateLimit: PUBLIC_RPS
    }
  ],
  'testnet': [
    { 
      url: 'https://api.testnet.solana.com',
      weight: 1,
      rateLimit: PUBLIC_RPS
    }
  ]
};

// Endpoint failure and rate limit tracking
const failedEndpoints = new Map<string, number>();
const FAILURE_THRESHOLD = 3;
const FAILURE_RESET_TIME = 5 * 60 * 1000; // 5 minutes

function isRateLimited(endpoint: RPCEndpoint): boolean {
  const now = Date.now();
  const timestamps = requestTimestamps[endpoint.url] || [];
  
  // Clean up old timestamps
  requestTimestamps[endpoint.url] = timestamps.filter(
    time => now - time < RATE_LIMIT_WINDOW
  );

  // Check if we're over the rate limit
  return requestTimestamps[endpoint.url].length >= (endpoint.rateLimit || PUBLIC_RPS);
}

function trackRequest(url: string) {
  const now = Date.now();
  requestTimestamps[url] = requestTimestamps[url] || [];
  requestTimestamps[url].push(now);
}

export function getOptimalEndpoint(network: Cluster): string {
  const endpoints = RPC_ENDPOINTS[network];
  const now = Date.now();

  // Clean up old failure records
  for (const [url, timestamp] of failedEndpoints.entries()) {
    if (now - timestamp > FAILURE_RESET_TIME) {
      failedEndpoints.delete(url);
    }
  }

  // Find the best available endpoint
  const availableEndpoint = endpoints
    .filter(endpoint => !failedEndpoints.has(endpoint.url) && !isRateLimited(endpoint))
    .sort((a, b) => b.weight - a.weight)[0];

  if (availableEndpoint) {
    trackRequest(availableEndpoint.url);
    return availableEndpoint.url;
  }

  // If all endpoints are rate limited, use the official Solana endpoint
  const solanaEndpoint = endpoints.find(e => e.url === NETWORK_CONFIG[network === 'mainnet-beta' ? 'mainnet' : 'devnet'].endpoint);
  if (solanaEndpoint) {
    return solanaEndpoint.url;
  }

  // Fallback to highest weight endpoint
  return endpoints.sort((a, b) => b.weight - a.weight)[0].url;
}

export function markEndpointAsFailed(url: string) {
  const failCount = (failedEndpoints.get(url) || 0) + 1;
  if (failCount >= FAILURE_THRESHOLD) {
    failedEndpoints.set(url, Date.now());
  }
}

export function resetEndpointFailures() {
  failedEndpoints.clear();
}

// Network state management
interface NetworkState {
  network: NetworkType;
  connection: Connection;
  setNetwork: (network: NetworkType) => void;
}

export const useNetwork = create<NetworkState>((set) => ({
  network: 'mainnet',
  connection: new Connection(getOptimalEndpoint(networkTypeToCluster('mainnet')), CONNECTION_CONFIG),
  setNetwork: (network: NetworkType) => {
    const cluster = networkTypeToCluster(network);
    const connection = new Connection(getOptimalEndpoint(cluster), CONNECTION_CONFIG);
    set({ network, connection });
  },
}));

export function createConnection(network: NetworkType): Connection {
  const cluster = networkTypeToCluster(network);
  const endpoint = getOptimalEndpoint(cluster);
  return new Connection(endpoint, CONNECTION_CONFIG);
} 