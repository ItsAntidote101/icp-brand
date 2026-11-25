/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // The new site was previewed under /new before it went live on 25 Nov 2026.
      { source: '/new', destination: '/', permanent: false },
      { source: '/new/:path*', destination: '/:path*', permanent: false },
      // The old guides list is now the resources page.
      { source: '/guides', destination: '/resources', permanent: true },
      // Case studies and reviews are held back until real clients replace the samples.
      { source: '/case-studies', destination: '/', permanent: false },
      { source: '/case-studies/:path*', destination: '/', permanent: false },
      { source: '/reviews', destination: '/', permanent: false },
    ]
  },
};

export default nextConfig;
