import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window;
  
  const processPolyfill = {
    env: { NODE_ENV: 'development' },
    nextTick: function(fn: Function) { setTimeout(fn, 0); },
    version: '',
    platform: 'darwin' as const,
    versions: {
      node: '16.0.0'
    }
  };
  
  Object.defineProperty(window, 'process', {
    value: processPolyfill
  });
} 