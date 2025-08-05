/** @type {import('next').NextConfig} */
const nextConfig = {
  // This creates a static export of your app, which is required for asset canisters.
  output: 'export',
  // Optional: Disables image optimization if you don't use the default Next.js Image component.
  images: {
    unoptimized: true,
  }
};

export default nextConfig;