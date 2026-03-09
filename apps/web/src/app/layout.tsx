import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CloudDeck -- Server Dashboard",
  description: "Professional Datalix server management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={plusJakarta.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] font-sans antialiased transition-colors duration-200">
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px -2px rgba(79, 70, 229, 0.1)",
              },
              classNames: {
                toast: "dark:!bg-slate-800 dark:!border-slate-700 dark:!text-slate-200",
              },
            }}
          />
        </Providers>

      </body>
    </html>
  );
}
