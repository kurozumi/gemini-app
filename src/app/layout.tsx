import type { Metadata } from "next";
import "./globals.css";
import { PlayerProvider } from "@/lib/PlayerContext";
import { PlayerUI } from "@/components/PlayerUI";

export const metadata: Metadata = {
  title: "おやすみASMR | 極上の添い寝ボイス配信PWA",
  description: "あなたの夜に寄り添う、最高品質のASMRと添い寝ボイスをお届けします。",
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
                <a href="/">おやすみASMR</a>
              </h1>
              <nav>
                <ul className="navList">
                  <li><a href="/">ホーム</a></li>
                  <li><a href="/live">ライブ</a></li>
                  <li><a href="/search">探す</a></li>
                  <li><a href="/favorites">お気に入り</a></li>
                </ul>
              </nav>
            </div>
          </header>

          <main className="container">
            {children}
          </main>

          <footer className="footer">
            <PlayerUI />
          </footer>
        </PlayerProvider>
      </body>
    </html>
  );
}
