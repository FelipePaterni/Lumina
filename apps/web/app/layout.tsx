import type { Metadata } from "next";

import { DashboardSessionProvider } from "../src/features/dashboard/DashboardSessionProvider";
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
      <body>
        <DashboardSessionProvider>{children}</DashboardSessionProvider>
      </body>
    </html>
  );
}
