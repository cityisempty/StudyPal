/** @type {import('next').NextConfig} */
const nextConfig = {
  // ===== Cloudflare Pages/Workers 兼容性配置 =====
  // 用于 Cloudflare 部署的 experimental 标志
  experimental: {
    // 支持 edge runtime（Cloudflare Workers）
    esmExternals: true,
  },

  // Next.js 16+ 使用 Turbopack 作为默认编译器
  // webpack 配置已不再受支持，需要迁移到 turbopack 配置
  turbopack: {
    // Turbopack 配置（如需自定义）
    // 目前保持默认，大多数应用无需修改
  },

  // 生产环境性能优化
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
