const path = require('path');
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.shopifycdn.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      }
    ]
  },
  webpack: (config, { dev, isServer }) => {
    // Optimisation des assets
    config.module.rules.push({
      test: /\.(png|jpg|gif|svg)$/i,
      type: 'asset/resource'
    });

    // Optimisation du cache en développement
    if (dev && !isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.resolve(__dirname, '.next/cache/webpack'),
        name: 'development-cache',
        version: '1',
        compression: 'gzip',
        maxAge: 172800000, // 48 heures
      };
    }

    // Ajouter le fallback pour Buffer
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: false
    };

    return config;
  },
  // Configuration du serveur de développement
  env: {
    PORT: '3000'
  }
};

module.exports = nextConfig;
