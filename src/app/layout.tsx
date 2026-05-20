import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "コエトバ | 声で、つながる匿名音声掲示板",
  description: "会員登録不要。匿名で誰でもすぐに音声配信や聴取ができるリアルタイムプラットフォームです。",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <header className="header">
          <div className="container headerInner">
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--primary)' }}>
              <Link href="/">コエトバ</Link>
            </h1>
          </div>
        </header>

        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
