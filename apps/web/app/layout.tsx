import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Lumina Livros",
  description: "Fundação técnica da aplicação Lumina Livros.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
