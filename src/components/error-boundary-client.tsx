"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export class ErrorBoundary extends React.Component<Props, { hasError: boolean; error?: Error }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console for debugging
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="font-semibold text-destructive-800">Se produjo un error al cargar este módulo.</p>
          <p className="text-sm text-muted-foreground">Abre la consola del navegador para ver detalles técnicos.</p>
          <details className="mt-2 text-xs text-muted-foreground">
            <summary>Detalles</summary>
            <pre className="whitespace-pre-wrap break-words text-xs">{String(this.state.error)}</pre>
          </details>
          {this.props.fallback ?? null}
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
