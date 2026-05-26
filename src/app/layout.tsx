import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://duely.app"), // Replace with your actual production URL
  title: {
    default: "Duely | Secure Credit Card Management",
    template: "%s | Duely",
  },
  description:
    "Take control of your financial health. Securely track credit card bills, due dates, and payments with military-grade end-to-end encryption.",
  keywords: [
    "credit card tracker",
    "financial wellness",
    "payment reminders",
    "secure vault",
    "personal finance",
    "bill tracker"
  ],
  openGraph: {
    title: "Duely - The Modern Credit Card Vault",
    description: "Never miss a payment with end-to-end encrypted tracking.",
    url: "https://duely.app",
    siteName: "Duely",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Duely | Secure Credit Card Management",
    description: "End-to-end encrypted credit card bill tracking across all your devices.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}