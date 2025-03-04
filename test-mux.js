const Mux = require('@mux/mux-node');

// Replace with your actual credentials (or use environment variables)
const tokenId = process.env.MUX_TOKEN_ID;
const tokenSecret = process.env.MUX_TOKEN_SECRET;

async function testMux() {
  try {
    console.log('Initializing Mux client...');
    const mux = new Mux({ tokenId, tokenSecret });
    
    console.log('Mux client initialized:', !!mux);
    console.log('Mux.video available:', !!mux.video);
    console.log('Mux client keys:', Object.keys(mux));
    
    if (mux.video) {
      console.log('Video keys:', Object.keys(mux.video));
      console.log('video.assets available:', !!mux.video.assets);
      console.log('video.uploads available:', !!mux.video.uploads);
      
      if (mux.video.assets) {
        console.log('Testing video.assets.list...');
        try {
          const assets = await mux.video.assets.list({ limit: 1 });
          console.log('Assets list response:', JSON.stringify(assets, null, 2));
        } catch (error) {
          console.error('Error listing assets:', error);
        }
      }
    }
    
    console.log('Test completed');
  } catch (error) {
    console.error('Error testing Mux client:', error);
  }
}

testMux();
