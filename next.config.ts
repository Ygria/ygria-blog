import type { NextConfig } from "next";
import createMDX from '@next/mdx'
import { withContentCollections } from "@content-collections/next";

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ygria.site',
        port: '',
        pathname: '/**',
        search: '',
      },
    ],
    unoptimized: true, 
  },
};


const withMDX = createMDX({
})

export default withContentCollections(withMDX(nextConfig));
