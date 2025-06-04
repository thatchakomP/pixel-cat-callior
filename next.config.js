// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // For Next.js 14 and above, remotePatterns is preferred.
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'replicate.delivery',
                port: '', // Leave empty for default HTTPS port
                pathname: '/xezq/**', // Use a wildcard if paths under /xezq/ vary
            },
            // If you are also using Cloudinary for food images and linking directly:
            // {
            //   protocol: 'https',
            //   hostname: 'res.cloudinary.com',
            //   port: '',
            //   pathname: '/your-cloud-name/**', // Replace 'your-cloud-name' with your actual Cloudinary cloud name
            // },
        ],
        // Alternatively, for older Next.js versions (or if you prefer simpler):
        // domains: ['replicate.delivery', 'res.cloudinary.com'], // <-- Only if you use domains
    },
}

module.exports = nextConfig
