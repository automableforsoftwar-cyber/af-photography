import type { NextConfig } from "next";

function supabaseHostname(): string {
  const fallback = "rwlamerpxlgspmzlueap.supabase.co";
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return fallback;
  try {
    return new URL(raw).hostname || fallback;
  } catch {
    return fallback;
  }
}

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: supabaseHostname(),
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
