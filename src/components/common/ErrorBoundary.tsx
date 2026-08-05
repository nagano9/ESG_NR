import React, { type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey: string;
}

export function ErrorBoundary({ children, resetKey }: ErrorBoundaryProps) {
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    setErrorMessage("");
  }, [resetKey]);

  React.useEffect(() => {
    function handleError(event: ErrorEvent) {
      setErrorMessage(event.message || "Unexpected application error");
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "Unexpected async error");
      setErrorMessage(reason);
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  if (!errorMessage) return <>{children}</>;

  return (
    <div className="app-panel mx-auto max-w-2xl p-8">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-slate-950">Workspace failed to render</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        The module hit a recoverable UI error. Switch modules or retry this workspace.
      </p>
      <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-600">
        {errorMessage}
      </p>
      <button type="button" onClick={() => setErrorMessage("")} className="btn-primary mt-6">
        <RotateCcw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}
