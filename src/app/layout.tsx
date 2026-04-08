import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import FrecciaLenta from "@/components/FrecciaLenta";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Treni Italia – Live Tracker",
  description:
    "Real-time Italian train departures, arrivals, delays and journey tracking.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TreniItalia",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Treni Italia – Live Tracker",
    description: "Real-time Italian train departures, arrivals, delays and journey tracking.",
    type: "website",
    locale: "it_IT",
    siteName: "Treni Italia",
  },
  twitter: {
    card: "summary",
    title: "Treni Italia – Live Tracker",
    description: "Real-time Italian train departures, arrivals, delays and journey tracking.",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <Providers>
          {children}
          <FrecciaLenta />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

