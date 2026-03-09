"use client";

import { useSession } from "next-auth/react";
import { User } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-sm">
      <div />

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">
            {session?.user?.name || "User"}
          </p>
          <p className="text-xs text-slate-500">{session?.user?.email}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100">
          <User className="h-4 w-4 text-indigo-600" />
        </div>
      </div>
    </header>
  );
}
