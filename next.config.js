/** @type {import('next').NextConfig} */
const nextConfig = {
  // ===== Cloudflare Pages/Workers 兼容性配置 =====
  // 用于 Cloudflare 部署的 experimental 标志
  experimental: {
    // 支持 edge runtime（Cloudflare Workers）
    esmExternals: true,
  },

  // 禁用某些在 Cloudflare 环境中不稳定的特性
  // webpack 配置可选：避免某些 Node.js 专用模块被 bundled
  webpack: (config, { isServer }) => {
    // 标记某些模块为 external（不打包进 bundle）
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },

  // 生产环境性能优化
  swcMinify: true,
  compress: true,

  // 图片优化（Cloudflare 环境下保险做法）
  images: {
    unoptimized: true, // 禁用 Next.js 内置图片优化（Cloudflare 有自己的优化）
  },

  // 响应头配置（安全性）
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // 重定向配置（可选）
  async redirects() {
    return [];
  },

  // 自定义环境变量暴露给前端
  env: {
    // 注意：这些值会暴露到客户端！不要放 API key
    // 只放公开的配置
  },
};

module.exports = nextConfig;
