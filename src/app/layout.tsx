import type { Metadata } from "next";
import "./globals.css";
import { PlayerProvider } from "@/lib/PlayerContext";
import { PlayerUI } from "@/components/PlayerUI";

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
        <PlayerProvider>
          <header className="header">
            <div className="container headerInner">
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--primary)' }}>
                <a href="/">コエトバ</a>
              </h1>
              <nav>
                <ul className="navList">
                  <li><a href="/">ホーム</a></li>
                  <li><a href="/live">ライブ</a></li>
                </ul>
              </nav>
            </div>
          </header>

          <main className="container">
            {children}
          </main>
        </PlayerProvider>
      </body>
    </html>
  );
}
