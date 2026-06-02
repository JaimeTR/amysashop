import nextPwa from "next-pwa";

const withPWA = nextPwa({
	dest: "public",
	cacheId: "amysa-shop-v0.1.2",
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
		formats: ["image/avif", "image/webp"],
	},

	async headers() {
		return [
			{
				source: "/:path*\\.(png|jpg|jpeg|svg|webp|avif)$",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
			{
				source: "/_next/static/:path*",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
		];
	},
	async rewrites() {
		return [
			{
				source: "/catalogo",
				destination: "/tienda",
			},
			{
				source: "/catalogo/:path*",
				destination: "/tienda/:path*",
			},
		];
	},
};

export default withPWA(nextConfig);
