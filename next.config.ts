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
    
    return config;
  },
};

export default nextConfig;
