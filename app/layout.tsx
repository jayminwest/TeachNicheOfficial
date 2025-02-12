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
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer 
            logo={<Image src="/next.svg" alt="Next.js Logo" width={24} height={24} className="dark:invert" />}
            brandName="Teach Niche"
            socialLinks={[
              {
                icon: <Image src="/vercel.svg" alt="Vercel" width={20} height={20} className="dark:invert" />,
                href: "https://vercel.com",
                label: "Vercel"
              }
            ]}
            mainLinks={[
              {
                href: "https://teach-niche.com/docs",
                label: "Documentation"
              },
              {
                href: "https://teach-niche.com/learn",
                label: "Learn"
              },
              {
                href: "https://teach-niche.com/templates",
                label: "Templates"
              }
            ]}
            legalLinks={[
              {
                href: "https://teach-niche.com/terms",
                label: "Terms of Service"
              },
              {
                href: "https://teach-niche.com/privacy",
                label: "Privacy Policy"
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
