import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const defaultImageHosts = [
  "**.amazonaws.com",
  "**.storageapi.dev",
  "images.unsplash.com",
];
const imageHosts = process.env.NEXT_PUBLIC_IMAGE_HOSTS
  ? [
      ...new Set([
        ...process.env.NEXT_PUBLIC_IMAGE_HOSTS.split(",")
          .map((host) => host.trim())
          .filter(Boolean),
        ...defaultImageHosts,
      ]),
    ]
  : defaultImageHosts;

/** @type {import('next').NextConfig} */
const securityHeaders = [
  // CSP is deliberately omitted: Next.js inline scripts and the next-intl
  // runtime need nonces we don't emit yet — a malformed CSP would break the
  // app. The rest of the baseline is safe to enforce globally.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // camera=(self): the KYC selfie capture needs same-origin camera access.
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=(self)",
  },
];

const nextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    // AVIF disabled: GHSA-2xp9-vwfh-vxw4 (unauthenticated RCE in the image
    // optimizer via AVIF payloads) is unpatched in every released Next 14.x.
    // WebP remains the modern format until a patched release line exists.
    formats: ["image/webp"],
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
};

export default withNextIntl(nextConfig);
