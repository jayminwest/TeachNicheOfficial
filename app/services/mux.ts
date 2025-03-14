import Mux from '@mux/mux-node';

// Simple function to get a Mux client
export function getMuxClient() {
  return new Mux({
    tokenId: process.env.MUX_TOKEN_ID || '',
    tokenSecret: process.env.MUX_TOKEN_SECRET || '',
  });
}
