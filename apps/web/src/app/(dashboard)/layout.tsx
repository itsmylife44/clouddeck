import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen">
      {/* Background blur orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[300px] -right-[200px] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-[200px] -left-[150px] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 opacity-30 blur-3xl" />
      </div>

      <Sidebar />

      {/* Main content area — offset by sidebar width */}
      <div className="pl-[240px] transition-all duration-200">
        <Header />
        <main className="relative z-10 p-6">{children}</main>
      </div>
    </div>
  );
}
