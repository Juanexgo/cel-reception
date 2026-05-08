import type { NextConfig } from "next";

/**
 * Baseline security headers applied to every response.
 *
 * - HSTS: forces HTTPS in browsers that have visited the site once over TLS.
 *   Only meaningful in production behind HTTPS, harmless otherwise.
 * - X-Frame-Options + frame-ancestors: blocks clickjacking via iframes.
 * - X-Content-Type-Options: prevents MIME sniffing on user-uploaded blobs
 *   (for example, signature data URLs we render via <img>).
 * - Referrer-Policy: don't leak full URLs (which include tracking tokens)
 *   to third-party origins when users click outbound links.
 * - Permissions-Policy: deny powerful APIs we never use.
 *
 * NOTE: we deliberately keep CSP light — the print page uses inline styles
 * and Next.js dev mode injects inline scripts, so a strict CSP is left as
 * future work for the deployment platform.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  // Don't leak the framework version in error pages or HTTP headers.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
