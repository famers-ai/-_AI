import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ForHuman AI | Smart Farm",
  description: "Future Farming Solutions powered by Gemini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto h-screen relative">
            <div className="max-w-7xl mx-auto">
              <Header />
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
