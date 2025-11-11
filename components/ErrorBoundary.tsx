import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  private unhandledRejectionHandler?: (event: PromiseRejectionEvent) => void;
  private errorHandler?: (event: ErrorEvent) => void;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidMount() {
    // 非同期エラー（Promise rejection）をキャッチ
    this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.setState({
        hasError: true,
        error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        errorInfo: null,
      });
      // デフォルトのエラーハンドリングを防ぐ
      event.preventDefault();
    };

    // グローバルエラーをキャッチ（ErrorBoundaryでキャッチできないエラー）
    this.errorHandler = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      if (!this.state.hasError) {
        this.setState({
          hasError: true,
          error: event.error || new Error(event.message || 'Unknown error'),
          errorInfo: null,
        });
      }
    };

    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);
    window.addEventListener('error', this.errorHandler);
  }

  public componentWillUnmount() {
    if (this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
    }
    if (this.errorHandler) {
      window.removeEventListener('error', this.errorHandler);
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラー情報を詳細にログ出力
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    console.error('Component stack:', errorInfo.componentStack);
    
    // エラー情報を状態に保存
    this.setState({
      error,
      errorInfo,
    });

    // ここでエラー報告サービスに送信することも可能
    // Example: logErrorToService(error, errorInfo);
  }

  private handleReload = () => {
    // エラー状態をリセットしてページを再読み込み
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  private handleReset = () => {
    // エラー状態をリセットして再レンダリングを試みる
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || '予期せぬエラーが発生しました';
      const errorStack = this.state.error?.stack;
      
      // You can render any custom fallback UI
      return (
        <div className="bg-red-900/50 border border-red-500 text-red-300 p-6 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">問題が発生しました</h2>
          <p className="mb-4">
            アプリケーションで予期せぬエラーが発生しました。
          </p>
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/50 rounded text-left text-sm">
              <p className="font-semibold mb-1">エラー詳細:</p>
              <p className="break-words">{errorMessage}</p>
              {errorStack && process.env.NODE_ENV === 'development' && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs">スタックトレースを表示</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 whitespace-pre-wrap break-words">
                    {errorStack}
                  </pre>
                </details>
              )}
            </div>
          )}
          <div className="flex gap-4 justify-center">
            <button
              onClick={this.handleReset}
              className="py-2 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
            >
              再試行
            </button>
            <button
              onClick={this.handleReload}
              className="py-2 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
