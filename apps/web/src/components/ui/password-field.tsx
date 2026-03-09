"use client";

import { useState, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";

interface PasswordFieldProps {
  value: string;
}

export function PasswordField({ value }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  const toggle = useCallback(() => {
    setVisible((v) => !v);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-slate-900 dark:text-slate-100">
        {visible ? value : "••••••••••••"}
      </span>
      <button
        onClick={toggle}
        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        {visible ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>
      <CopyButton value={value} />
    </div>
  );
}
