/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Don't bundle the PDF parser into the server chunks — let it (and its
  // pdfjs-dist worker) resolve from node_modules at runtime. Bundling breaks
  // the worker path ("Cannot find module 'pdf.worker.mjs'").
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
}

export default nextConfig
