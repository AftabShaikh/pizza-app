import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/context/AppProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pizza Palace - Fresh & Delicious Pizzas",
  description: "Order fresh, handcrafted pizzas online. Choose from our variety of classic and gourmet pizzas with custom toppings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
          /* Screen reader only class */
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }
          
          /* Skip link styles */
          .skip-link {
            transform: translateY(-100%);
          }
          
          .skip-link:focus {
            transform: translateY(0);
          }
          
          /* High contrast mode support */
          @media (prefers-contrast: high) {
            .accessible-orange {
              background-color: #cc4400 !important;
            }
          }
          
          /* Focus indicators for better visibility */
          button:focus-visible,
          a:focus-visible,
          input:focus-visible,
          select:focus-visible,
          textarea:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
