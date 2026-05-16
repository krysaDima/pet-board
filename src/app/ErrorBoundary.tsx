import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Ловит сбои рендера, чтобы не оставлять белый экран без объяснения.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            fontFamily: 'system-ui, sans-serif',
            maxWidth: 560,
            margin: '48px auto',
            padding: 24,
            background: '#fff7ed',
            border: '1px solid #fdba74',
            borderRadius: 12,
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 12 }}>Что-то пошло не так</h1>
          <p style={{ color: '#444', marginBottom: 16 }}>
            Откройте консоль разработчика (клавиша F12 → вкладка «Консоль») и пришлите текст ошибки.
          </p>
          <pre
            style={{
              fontSize: 12,
              overflow: 'auto',
              padding: 12,
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #e7e5e4',
            }}
          >
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
