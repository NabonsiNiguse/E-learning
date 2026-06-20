/**
 * AppErrorBoundary — beautiful fallback UI for unexpected React errors.
 *
 * Wraps the entire app so no uncaught render error ever shows a blank screen.
 * Features:
 *   • Auto-retry after 5 seconds (configurable)
 *   • Manual "Try again" button
 *   • "Go home" escape hatch
 *   • Error details shown only in development
 *   • Compatible with React 19 / class component Error Boundary API
 */

import { Component, type ReactNode, type ErrorInfo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Milliseconds before automatic retry. Set to 0 to disable. Default: 8000. */
  autoRetryMs?: number;
}

interface State {
  hasError:   boolean;
  error:      Error | null;
  errorInfo:  ErrorInfo | null;
  retryIn:    number;   // countdown seconds
  showDetail: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  private _retryInterval: ReturnType<typeof setInterval> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError:   false,
      error:      null,
      errorInfo:  null,
      retryIn:    0,
      showDetail: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log to console; replace with Sentry.captureException(error) in production
    console.error("[AppErrorBoundary]", error, errorInfo);

    // Start auto-retry countdown
    const delayMs = this.props.autoRetryMs ?? 8000;
    if (delayMs > 0) {
      const seconds = Math.round(delayMs / 1000);
      this.setState({ retryIn: seconds });

      this._retryInterval = setInterval(() => {
        this.setState((s) => {
          if (s.retryIn <= 1) {
            clearInterval(this._retryInterval!);
            return { retryIn: 0 };
          }
          return { retryIn: s.retryIn - 1 };
        });
      }, 1000);

      setTimeout(() => this.handleReset(), delayMs);
    }
  }

  componentWillUnmount() {
    if (this._retryInterval) clearInterval(this._retryInterval);
  }

  handleReset = () => {
    if (this._retryInterval) clearInterval(this._retryInterval);
    this.setState({
      hasError: false, error: null, errorInfo: null, retryIn: 0, showDetail: false,
    });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, errorInfo, retryIn, showDetail } = this.state;
    const isDev = import.meta.env.DEV;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-lg w-full space-y-8"
        >
          {/* Icon */}
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: [0, -6, 6, -6, 0] }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="h-24 w-24 rounded-3xl bg-destructive/10 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.15)]"
            >
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </motion.div>
          </div>

          {/* Text */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-display font-extrabold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {error?.message
                ? `An unexpected error occurred: "${error.message}"`
                : "An unexpected error occurred. We've noted it and are working on a fix."}
            </p>
          </div>

          {/* Auto-retry countdown */}
          {retryIn > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-3 text-sm text-muted-foreground"
            >
              <div className="relative h-8 w-8">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 32 32">
                  <circle
                    cx="16" cy="16" r="12"
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth="3"
                  />
                  <circle
                    cx="16" cy="16" r="12"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 12}`}
                    strokeDashoffset={`${(2 * Math.PI * 12) * (1 - retryIn / ((this.props.autoRetryMs ?? 8000) / 1000))}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.9s linear" }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                  {retryIn}
                </span>
              </div>
              <span>Auto-retrying in {retryIn}s…</span>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={this.handleReset}
              className="gradient-primary text-white border-0 shadow-[0_4px_16px_-4px] shadow-primary/40 gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => { window.location.href = "/"; }}
              className="gap-2"
            >
              <Home className="h-4 w-4" /> Go home
            </Button>
          </div>

          {/* Dev-only error detail */}
          {isDev && error && (
            <div className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => this.setState((s) => ({ showDetail: !s.showDetail }))}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-muted-foreground bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <span className="text-destructive font-semibold">
                  {error.name}: {error.message.slice(0, 80)}
                </span>
                {showDetail
                  ? <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                  : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
              </button>
              {showDetail && (
                <pre className="px-4 py-3 text-[11px] font-mono text-muted-foreground bg-background overflow-x-auto max-h-48 leading-relaxed">
                  {errorInfo?.componentStack ?? error.stack}
                </pre>
              )}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground/60">
            Learnly — if this keeps happening, please contact support.
          </p>
        </motion.div>
      </div>
    );
  }
}
