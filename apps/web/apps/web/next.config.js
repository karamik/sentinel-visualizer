/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // статический экспорт
  images: {
    unoptimized: true, // для GitHub Pages
  },
  basePath: process.env.NODE_ENV === 'production' ? '/sentinel-visualizer' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/sentinel-visualizer/' : '',
}

module.exports = nextConfig
