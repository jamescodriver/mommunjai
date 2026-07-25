/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    // Allow the brand site(s) to embed tool pages as widgets.
    const allowed = (process.env.ALLOWED_FRAME_ANCESTORS || "'self'").trim();
    return [
      {
        source: "/tools/:path*",
        headers: [
          { key: "Content-Security-Policy", value: `frame-ancestors ${allowed};` },
        ],
      },
    ];
  },
};
export default nextConfig;
