import type { NextConfig } from "next";

const developmentEvalSource = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
const contentSecurityPolicy = `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'${developmentEvalSource} https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://riseupmaia.pt https://*.supabase.co https://www.google.com https://*.googleusercontent.com https://www.google-analytics.com https://stats.g.doubleclick.net; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.googleapis.com https://oauth2.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com; media-src 'self' blob: https://*.supabase.co; manifest-src 'self'; worker-src 'self' blob:; frame-src 'self' blob: https://drive.google.com https://docs.google.com; upgrade-insecure-requests`;

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
];

const legacyRoutes = ["index", "sobre", "equipa", "riseuplegends", "projetos", "junta-te", "contactos", "politica-protecao-dados", "termos-condicoes", "backoffice"];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return legacyRoutes.map((route) => ({
      source: `/${route}.html`,
      destination: route === "index" ? "/" : `/${route}`,
      permanent: true
    }));
  },
  async headers() {
    return [
      { source: "/backoffice", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/:path*", headers: securityHeaders }
    ];
  }
};

export default nextConfig;
