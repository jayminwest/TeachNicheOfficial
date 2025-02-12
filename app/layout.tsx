import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Teach Niche",
  description: "A platform for niche educational content",
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer 
            logo={<Image src="/favicon.png" alt="Teach Niche Logo" width={24} height={24} />}
            brandName="Teach Niche"
            socialLinks={[]}
            mainLinks={[
              {
                href: "/docs",
                label: "Documentation"
              },
              {
                href: "/learn",
                label: "Learn"
              },
              {
                href: "/templates",
                label: "Templates"
              }
            ]}
            legalLinks={[
              {
                href: "/legal#terms",
                label: "Terms of Service"
              },
              {
                href: "/legal#privacy",
                label: "Privacy Policy"
              },
              {
                href: "/legal#legal",
                label: "Legal Information"
              }
            ]}
            copyright={{
              text: "© 2024 Teach Niche. All rights reserved.",
              license: "Released under the MIT License"
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
