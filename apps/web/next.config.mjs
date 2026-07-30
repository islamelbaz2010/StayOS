import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const imageHosts = process.env.NEXT_PUBLIC_IMAGE_HOSTS
  ? process.env.NEXT_PUBLIC_IMAGE_HOSTS.split(",")
      .map((host) => host.trim())
      .filter(Boolean)
  : ["**.amazonaws.com"];

/** @type {import('next').NextConfig} */
const nextConfig = {
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
