import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Miwa",
  description:
    "Miwa is an AI clinical copilot for therapists that supports documentation drafting, clinical reflection, and supervision preparation.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container site-header-inner">
            <Link href="/" className="site-brand">
              Miwa
            </Link>

            <nav className="site-nav" aria-label="Primary">
              <Link href="/" className="site-nav-link">
                Home
              </Link>
              <Link href="/app" className="site-nav-link">
                Open App
              </Link>
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
