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
    
    // Handle node: protocol imports and Node.js built-in modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      process: require.resolve('process/browser'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util/'),
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      fs: false,
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
      zlib: require.resolve('browserify-zlib'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      assert: require.resolve('assert/'),
      url: require.resolve('url/'),
      querystring: require.resolve('querystring-es3'),
      events: require.resolve('events/'),
      constants: require.resolve('constants-browserify'),
      timers: require.resolve('timers-browserify'),
      tty: require.resolve('tty-browserify'),
      vm: require.resolve('vm-browserify'),
      dgram: false,
      dns: false,
      net: false,
      tls: false,
      child_process: false,
    };
    
    // Add plugin to handle node: protocol
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^node:/, 
        (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        }
      ),
      // Provide process for browser
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      })
    );
    
    return config;
  },
};

export default nextConfig;
