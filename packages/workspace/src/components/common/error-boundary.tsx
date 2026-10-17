"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@json-explore/ui/components/button";
import { ErrorState } from "@json-explore/ui/components/error-state";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Last-resort UI recovery. Does not log the thrown value — it may contain
 * user JSON from a render path.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo): void {
    return;
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="Something went wrong"
          message="Try again. JSON stays in this browser and was not sent anywhere."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                this.setState({ hasError: false });
              }}
            >
              Try again
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
