const Mux = require('@mux/mux-node');

async function testMux() {
  try {
    console.log('Initializing Mux client with explicit credentials...');
    
    // Use the credentials that worked in your curl command
    const mux = new Mux({
      tokenId: 'a079129e-c4ca-4ed3-a03e-884b95399ddb',
      tokenSecret: 'ZqT2/1nL0ERvchBxotrpk7ZT94ESjZL7IIT9zqNOH92cR9VgWMTqg/M55qqGUiJ80Kt/87bxz/G'
    });
    
    console.log('Mux client initialized:', !!mux);
    console.log('Mux.video available:', !!mux.video);
    
    if (mux.video && mux.video.assets) {
      console.log('Testing video.assets.list with explicit credentials...');
      try {
        const assets = await mux.video.assets.list({ limit: 1 });
        console.log('Assets list response:', JSON.stringify(assets, null, 2));
      } catch (error) {
        console.error('Error listing assets:', error);
      }
    }
    
    console.log('Test completed');
  } catch (error) {
    console.error('Error testing Mux client:', error);
  }
}

testMux();
