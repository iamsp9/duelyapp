import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://duely.app"),

  title: {
    default: "Duely",
    template: "%s | Duely",
  },

  description:
    "Securely track credit card bills, due dates, and payments.",

  openGraph: {
    title: "Duely",
    description:
      "Secure credit card bill tracking.",
    siteName: "Duely",
    type: "website",
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