import type { ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey: string;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return <>{children}</>;
}
