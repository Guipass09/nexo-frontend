import { Component, type ErrorInfo, type ReactNode } from "react";

type AppRenderBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type AppRenderBoundaryState = {
  hasError: boolean;
};

export class AppRenderBoundary extends Component<AppRenderBoundaryProps, AppRenderBoundaryState> {
  public state: AppRenderBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): AppRenderBoundaryState {
    return {
      hasError: true,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[app-render-boundary] render failed", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}
