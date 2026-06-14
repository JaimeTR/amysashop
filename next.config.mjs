import nextPwa from "next-pwa";

const withPWA = nextPwa({
	dest: "public",
	cacheId: "amysa-shop-v0.1.2",
	disable: process.env.NODE_ENV === "development",
	register: true,
	skipWaiting: true,
	runtimeCaching: [
		{
			urlPattern: /^https?:\/\/.*\.supabase\.co\/.*\.(?:png|jpg|jpeg|webp|avif|svg|gif)$/i,
			handler: "StaleWhileRevalidate",
			options: {
				cacheName: "supabase-images",
				expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
			},
		},
		{
			urlPattern: /\/api\//,
			handler: "NetworkFirst",
			options: {
				cacheName: "api-cache",
				networkTimeoutSeconds: 5,
				expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
			},
		},
		{
			urlPattern: /\/_next\/image\?/,
			handler: "StaleWhileRevalidate",
			options: {
				cacheName: "next-image-cache",
				expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
			},
		},
	],
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
		minimumCacheTTL: 2592000,
		deviceSizes: [640, 1080, 1920],
		imageSizes: [32, 128, 384],
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
