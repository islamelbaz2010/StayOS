import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const defaultImageHosts = ["**.amazonaws.com", "images.unsplash.com"];
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
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
};

export default withNextIntl(nextConfig);
