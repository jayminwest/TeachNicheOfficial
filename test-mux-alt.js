const Mux = require('@mux/mux-node');

async function testMux() {
  try {
    // Get credentials from environment variables
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    
    console.log('Using credentials:');
    console.log('Token ID:', tokenId);
    console.log('Token Secret:', tokenSecret ? `${tokenSecret.substring(0, 5)}...` : 'undefined');
    
    // Initialize Mux client
    const mux = new Mux({ tokenId, tokenSecret });
    
    // Try a different API endpoint
    console.log('Testing video.uploads.list...');
    try {
      const uploads = await mux.video.uploads.list({ limit: 1 });
      console.log('Uploads list response:', JSON.stringify(uploads, null, 2));
    } catch (uploadError) {
      console.error('Error listing uploads:', uploadError);
      
      // Try creating an asset as a fallback
      console.log('Trying to create an asset instead...');
      try {
        const asset = await mux.video.assets.create({
          input: 'https://muxed.s3.amazonaws.com/leds.mp4',
          playback_policy: ['public']
        });
        console.log('Asset created successfully:', asset.id);
      } catch (assetError) {
        console.error('Error creating asset:', assetError);
      }
    }
  } catch (error) {
    console.error('Error initializing Mux client:', error);
  }
}

testMux();
