import { Space_Grotesk, Space_Mono, Inter } from "next/font/google";
import TopographicBackground from "@/components/TopographicBackground";
import Navigation from "@/components/Navigation";
import GlobalQuickActions from "@/components/GlobalQuickActions";
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
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📈</text></svg>"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${spaceMono.variable} ${inter.variable} antialiased bg-black text-white font-inter`}
      >
        <div className="relative min-h-screen overflow-hidden">
           <TopographicBackground />
           <Navigation />
           <main className="relative z-10 w-full flex-1 pb-24 md:pb-0">
              {children}
           </main>
           <GlobalQuickActions />
        </div>
      </body>
    </html>
  );
}
