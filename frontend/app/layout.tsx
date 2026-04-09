import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DentalLeads — Dentist Lead Generation & Pipeline Management",
    template: "%s | DentalLeads",
  },
  description:
    "Discover, analyze, and convert dentist leads with AI-powered website scoring, automated outreach, and a full sales pipeline — all in one platform.",
  keywords: [
    "dentist leads",
    "dental marketing",
    "lead generation",
    "dental practice",
    "dentist outreach",
    "website analysis",
    "sales pipeline",
    "dental CRM",
  ],
  authors: [{ name: "DentalLeads" }],
  creator: "DentalLeads",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: "DentalLeads",
    title: "DentalLeads — Dentist Lead Generation & Pipeline Management",
    description:
      "Discover, analyze, and convert dentist leads with AI-powered website scoring, automated outreach, and a full sales pipeline.",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "DentalLeads logo" }],
  },
  twitter: {
    card: "summary",
    title: "DentalLeads — Dentist Lead Generation & Pipeline Management",
    description:
      "Discover, analyze, and convert dentist leads with AI-powered website scoring, automated outreach, and a full sales pipeline.",
    images: ["/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
