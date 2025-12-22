import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css'; // Assuming you will create a global stylesheet

/**
 * A component to gracefully handle unexpected rendering errors in the application.
 * In a real-world app, this could log errors to a service like Sentry or LogRocket.
 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex h-screen w-full items-center justify-center bg-dark text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500">Something went wrong.</h1>
            <p className="mt-2 text-slate-400">Please refresh the page to continue.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root not found in the DOM. Application cannot mount.');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
