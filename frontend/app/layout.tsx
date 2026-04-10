import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";

import { ModeProvider } from "@/lib/mode-context";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "synapse -- Business & Tech Collaboration",
  description: "AI-powered collaboration tool that bridges the gap between business and technical teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-mode="business" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} ${mono.variable} font-sans antialiased`} suppressHydrationWarning>
        <ModeProvider>{children}</ModeProvider>
      </body>
    </html>
  );
}
