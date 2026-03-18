import type { Metadata } from "next";
import { FirebaseAuthBootstrap } from "@/components/auth/firebase-auth-bootstrap";
import { SiteHeader } from "@/components/chrome/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Scholarship Copilot",
    template: "%s | Scholarship Copilot",
  },
  description:
    "A student-first scholarship application workspace built around reusable profile context, document ingestion, and grounded drafting.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <FirebaseAuthBootstrap />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
