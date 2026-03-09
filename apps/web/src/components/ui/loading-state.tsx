"use client";

import { Loader2, AlertCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className = "py-20" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
        <AlertCircle className="h-7 w-7 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      {message && (
        <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
      )}
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50">
        <Icon className="h-7 w-7 text-indigo-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
      {action &&
        (action.href ? (
          <a href={action.href}>
            <Button className="mt-4">{action.label}</Button>
          </a>
        ) : (
          <Button className="mt-4" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}
