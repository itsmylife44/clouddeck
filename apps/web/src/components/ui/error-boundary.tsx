"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Something went wrong
          </h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={this.handleReset}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
