const Mux = require('@mux/mux-node');

// Replace with your actual credentials (or use environment variables)
const tokenId = process.env.MUX_TOKEN_ID;
const tokenSecret = process.env.MUX_TOKEN_SECRET;

async function testMux() {
  try {
    console.log('Initializing Mux client...');
    const mux = new Mux({ tokenId, tokenSecret });
    
    console.log('Mux client initialized:', !!mux);
    console.log('Mux.Video available:', !!mux.Video);
    console.log('Mux client keys:', Object.keys(mux));
    
    if (mux.Video) {
      console.log('Video keys:', Object.keys(mux.Video));
      console.log('Video.Assets available:', !!mux.Video.Assets);
      console.log('Video.Uploads available:', !!mux.Video.Uploads);
      
      if (mux.Video.Assets) {
        console.log('Testing Video.Assets.list...');
        try {
          const assets = await mux.Video.Assets.list({ limit: 1 });
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
