import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.openfoodfacts.org" },
      { protocol: "https", hostname: "**.openfoodfacts.net" },
      { protocol: "https", hostname: "**.openbeautyfacts.org" },
      { protocol: "https", hostname: "**.openpetfoodfacts.org" },
      { protocol: "https", hostname: "**.upcitemdb.com" },
      { protocol: "https", hostname: "**.supabase.co" }
    ]
  }
};

export default nextConfig;
