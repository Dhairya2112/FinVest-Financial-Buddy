import { Space_Grotesk, Space_Mono, Inter } from "next/font/google";
import TopographicBackground from "@/components/TopographicBackground";
import Navigation from "@/components/Navigation";
import GlobalQuickActions from "@/components/GlobalQuickActions";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "FinVest - NextGen Finance",
  description: "Industry-grade personal finance management",
  icons: {
    icon: "/icon.svg?v=4"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${spaceMono.variable} ${inter.variable} antialiased bg-black text-white font-inter`}
      >
        <div className="relative flex flex-col min-h-[100dvh] overflow-hidden">
           <TopographicBackground />
           <Navigation />
           <main className="relative z-10 w-full flex-1">
              {children}
           </main>
           <GlobalQuickActions />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
