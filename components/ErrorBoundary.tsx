import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="bg-red-900/50 border border-red-500 text-red-300 p-6 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">問題が発生しました</h2>
          <p className="mb-6">
            アプリケーションで予期せぬエラーが発生しました。ページを再読み込みして、もう一度お試しください。
          </p>
          <button
            onClick={this.handleReload}
            className="py-2 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors"
          >
            ページを再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
