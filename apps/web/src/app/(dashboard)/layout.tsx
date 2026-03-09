import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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

  // Single query: get role + API key count in one round-trip
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      _count: { select: { apiKeys: true } },
    },
  });

  if (!user) {
    // User exists in JWT but not in DB (e.g. after database reset).
    // Redirect to force-logout to clear the stale session and prevent
    // a redirect loop between the proxy (JWT valid) and layout (user missing).
    redirect("/force-logout");
  }

  if (user.role === "ADMIN") {
    if (user._count.apiKeys === 0) {
      redirect("/onboarding");
    }
  } else {
    // Regular user: run both checks in parallel
    const [adminKeyCount, permCount] = await Promise.all([
      db.apiKey.count({ where: { user: { role: "ADMIN" } } }),
      db.serverPermission.count({ where: { userId: session.user.id } }),
    ]);

    if (adminKeyCount === 0 || permCount === 0) {
      redirect("/onboarding");
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background blur orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[300px] -right-[200px] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20 opacity-40 blur-3xl" />
        <div className="absolute -bottom-[200px] -left-[150px] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 opacity-30 blur-3xl" />
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
