/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: [
      'res.cloudinary.com',
      'via.placeholder.com',
      'picsum.photos',
      'rickandmortyapi.com',
      'localhost'
    ]
  }
}

export default nextConfig
