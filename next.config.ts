import type { NextConfig } from "next";
import webpack from 'webpack';

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
    
    // Add plugin to handle node: protocol
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^node:/, 
        (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        }
      )
    );
    
    return config;
  },
};

export default nextConfig;
