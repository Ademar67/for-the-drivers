import nextPWA from "next-pwa";

const nextConfig = {
  reactStrictMode: true,
};

const withPWA = nextPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,

  // ✅ offline fallback
  fallbacks: {
    document: "/offline",
  },

  // ✅ cache estratégico (Workbox)
  runtimeCaching: [
    // HTML / navegación
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },

    // Next static assets
    {
      urlPattern: /^https?.*\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },

    // Imágenes
    {
      urlPattern: ({ request }) => request.destination === "image",
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "images",
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },

    // APIs (DENUE y otras) → no offline real, pero cachea respuestas recientes
    {
      urlPattern: /^https?.*\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
});

export default withPWA(nextConfig);
