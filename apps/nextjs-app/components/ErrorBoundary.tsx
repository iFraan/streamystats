"use client";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Home,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";
import React, {
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useState,
} from "react";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  error?: Error;
  onReset?: () => void;
}

function ErrorDisplay({ error, onReset }: ErrorDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showStack, setShowStack] = useState(false);

  const errorMessage = error?.toString() || "Unknown error occurred";
  const stackTrace = error?.stack || "";

  const handleCopy = useCallback(async () => {
    const fullError = `${errorMessage}${stackTrace ? `\n\n${stackTrace}` : ""}`;
    try {
      await navigator.clipboard.writeText(fullError);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = fullError;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [errorMessage, stackTrace]);

  const handleRefresh = useCallback(() => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  }, [onReset]);

  // Create GitHub issue URL with pre-filled information
  const issueTitle = encodeURIComponent(
    `Error: ${errorMessage.substring(0, 100)}`,
  );
  const issueBody = encodeURIComponent(
    `## Error Details\n\`\`\`\n${errorMessage}\n\n${stackTrace}\n\`\`\`\n\n## Steps to Reproduce\n1. \n2. \n3. \n\n## Browser/Environment\n- URL: ${
      typeof window !== "undefined" ? window.location.href : "N/A"
    }\n- User Agent: ${
      typeof navigator !== "undefined" ? navigator.userAgent : "N/A"
    }\n\n## Additional Information\n`,
  );
  const newIssueUrl = `https://github.com/fredrikburmester/streamystats/issues/new?title=${issueTitle}&body=${issueBody}`;

  // Parse error for better display
  const errorName = error?.name || "Error";
  const errorMessageClean = error?.message || errorMessage;

  return (
    <div className="flex flex-col items-center justify-center min-h-[90svh] bg-black text-white w-full px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">
        Something went wrong
      </h1>
      <p className="text-gray-400 text-center mb-8 max-w-md">
        The application encountered an unexpected error. You can try refreshing
        the page or submit an issue if the problem persists.
      </p>

      {/* Error Container */}
      <div className="w-full max-w-2xl bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden mb-8">
        {/* Error Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs font-mono font-medium rounded bg-red-500/20 text-red-400 border border-red-500/30">
              {errorName}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1.5 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1.5" />
                Copy Error
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        <div className="p-4">
          <pre className="text-sm font-mono text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
            {errorMessageClean}
          </pre>
        </div>

        {/* Stack Trace (Collapsible) */}
        {stackTrace && (
          <div className="border-t border-gray-800">
            <button
              type="button"
              onClick={() => setShowStack(!showStack)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/30 transition-colors"
            >
              <span className="font-medium">Stack Trace</span>
              {showStack ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showStack && (
              <div className="px-4 pb-4">
                <div className="bg-gray-950/50 rounded-lg p-4 max-h-64 overflow-auto border border-gray-800/50">
                  <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap break-words leading-relaxed">
                    {stackTrace}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <Button
          onClick={handleRefresh}
          variant="default"
          className="flex-1 h-11"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>

        <Button variant="outline" className="flex-1 h-11" asChild>
          <Link href={newIssueUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Report Issue
          </Link>
        </Button>

        <Button variant="ghost" className="flex-1 h-11" asChild>
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </Button>
      </div>

      {/* Footer hint */}
      <p className="text-xs text-gray-500 mt-8 text-center max-w-md">
        If this error persists, please include the error details when reporting
        the issue.
      </p>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(_error: Error, errorInfo: ErrorInfo): void {
    // Avoid console.log in production - error is already captured in state
    void errorInfo;
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay error={this.state.error} onReset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
