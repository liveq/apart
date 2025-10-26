import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // PDF.js의 canvas 모듈을 클라이언트와 서버 모두에서 무시
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
    };

    // pdfjs-dist에서 canvas require를 무시
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^canvas$/,
        contextRegExp: /pdfjs-dist/,
      })
    );

    return config;
  },
};

export default nextConfig;
