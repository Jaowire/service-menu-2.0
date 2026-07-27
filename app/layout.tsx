import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taverna INFINITI | Service Consultation",
  description:
    "A clear, personalized maintenance consultation for Taverna INFINITI customers.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
