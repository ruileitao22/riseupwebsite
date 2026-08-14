import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://riseupmaia.pt"),
  authors: [{ name: "Rise Up - Júnior Empresa" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/img/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/img/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/img/favicon-48x48.png", sizes: "48x48", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }]
  },
  manifest: "/site.webmanifest"
};

export const viewport: Viewport = { themeColor: "#5f2dbf" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body suppressHydrationWarning>
        {children}
        <Script id="google-consent-default" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','wait_for_update':500});`}
        </Script>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-WC7ZNKQKSH" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`gtag('js',new Date());gtag('config','G-WC7ZNKQKSH');`}
        </Script>
      </body>
    </html>
  );
}
