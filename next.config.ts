import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Enable WebAssembly support
  webpack: (config) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Add rule for WebAssembly files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    
    // Handle node: protocol imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      process: require.resolve('process/browser'),
    };
    
    return config;
  },
};

export default nextConfig;
