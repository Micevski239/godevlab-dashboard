import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "GoGevgelija Dashboard",
  description: "Internal management dashboard for GoGevgelija",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
