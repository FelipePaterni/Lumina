import type { Metadata } from "next";

import { DashboardSessionProvider } from "../src/features/dashboard/DashboardSessionProvider";
import { SiteNavigation } from "../src/features/v11/SiteNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumina Livros",
  description:
    "Descubra, compre e acompanhe livros físicos e digitais na Lumina Livros.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="pt-BR">
      <body>
        <DashboardSessionProvider>
          <SiteNavigation />
          {children}
        </DashboardSessionProvider>
      </body>
    </html>
  );
}
