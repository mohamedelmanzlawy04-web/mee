'use client';

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: { componentStack: string }) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary
 *
 * Catches errors in child component trees and renders a fallback UI.
 * Use for section-level error isolation (not root-level — use app/error.tsx for that).
 *
 * @example
 * <ErrorBoundary fallback={<ProductCardSkeleton />}>
 *   <ProductCard product={product} />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    console.error('[ErrorBoundary]', error, info);
    this.props.onError?.(error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex items-center justify-center p-8 text-center">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This section encountered an error.
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="text-xs underline text-muted-foreground hover:text-foreground transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
