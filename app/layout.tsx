import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3d chess",
  description: "Online 3D Chess Game, Millennium Chess and Raumschach Chess",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kr">
      <body>
        {children}
      </body>
    </html>
  );
}
