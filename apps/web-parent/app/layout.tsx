import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "습관퀘스트 - 부모 관리자",
  description: "자녀의 습관을 관리하고 모니터링하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
