import nextPwa from "next-pwa";

const withPWA = nextPwa({
	dest: "public",
	cacheId: "amysa-shop-v0.1.1",
	disable: process.env.NODE_ENV === "development",
	register: true,
	skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		optimizePackageImports: ["lucide-react"],
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**.supabase.co",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
		],
	},
};

export default withPWA(nextConfig);
