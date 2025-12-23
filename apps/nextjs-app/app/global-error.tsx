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
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function GlobalError({ error, reset }: Props) {
  const [copied, setCopied] = useState(false);
  const [showStack, setShowStack] = useState(false);

  const errorMessage = error?.toString() || "Unknown error occurred";
  const stackTrace = error?.stack || "";
  const errorName = error?.name || "Error";
  const errorMessageClean = error?.message || errorMessage;

  const handleCopy = useCallback(async () => {
    const fullError = `${errorMessage}${stackTrace ? `\n\n${stackTrace}` : ""}${
      error.digest ? `\n\nDigest: ${error.digest}` : ""
    }`;
    try {
      await navigator.clipboard.writeText(fullError);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = fullError;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [errorMessage, stackTrace, error.digest]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const handleGoHome = useCallback(() => {
    window.location.href = "/";
  }, []);

  const handleGoToSetup = useCallback(() => {
    window.location.href = "/setup";
  }, []);

  // Create GitHub issue URL with pre-filled information
  const issueTitle = encodeURIComponent(
    `Error: ${errorMessage.substring(0, 100)}`,
  );
  const issueBody = encodeURIComponent(
    `## Error Details\n\`\`\`\n${errorMessage}\n\n${stackTrace}\n\`\`\`\n\n${
      error.digest ? `**Digest:** \`${error.digest}\`\n\n` : ""
    }## Steps to Reproduce\n1. \n2. \n3. \n\n## Additional Information\n`,
  );
  const newIssueUrl = `https://github.com/fredrikburmester/streamystats/issues/new?title=${issueTitle}&body=${issueBody}`;

  return (
    <html lang="en">
      <body style={{ backgroundColor: "#0A0A0A", margin: 0 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            color: "white",
            padding: "2rem 1rem",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "9999px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <AlertTriangle
                style={{ width: "2rem", height: "2rem", color: "#f87171" }}
              />
            </div>
          </div>

          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: "bold",
              marginBottom: "0.5rem",
              textAlign: "center",
              margin: "0 0 0.5rem 0",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "#9ca3af",
              textAlign: "center",
              marginBottom: "2rem",
              maxWidth: "28rem",
            }}
          >
            A critical error occurred. You can try refreshing the page or go to
            setup if this is a configuration issue.
          </p>

          {/* Error Container */}
          <div
            style={{
              width: "100%",
              maxWidth: "42rem",
              backgroundColor: "rgba(17, 24, 39, 0.5)",
              border: "1px solid #1f2937",
              borderRadius: "0.75rem",
              overflow: "hidden",
              marginBottom: "2rem",
            }}
          >
            {/* Error Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                backgroundColor: "rgba(31, 41, 55, 0.5)",
                borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.75rem",
                    fontFamily: "monospace",
                    fontWeight: "500",
                    borderRadius: "0.25rem",
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                  }}
                >
                  {errorName}
                </span>
                {error.digest && (
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      borderRadius: "0.25rem",
                      backgroundColor: "rgba(59, 130, 246, 0.2)",
                      color: "#60a5fa",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    {error.digest}
                  </span>
                )}
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
            <div style={{ padding: "1rem" }}>
              <pre
                style={{
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  color: "#e5e7eb",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: "1.625",
                  margin: 0,
                }}
              >
                {errorMessageClean}
              </pre>
            </div>

            {/* Stack Trace (Collapsible) */}
            {stackTrace && (
              <div style={{ borderTop: "1px solid #1f2937" }}>
                <button
                  type="button"
                  onClick={() => setShowStack(!showStack)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    fontSize: "0.875rem",
                    color: "#9ca3af",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = "#e5e7eb";
                    e.currentTarget.style.backgroundColor =
                      "rgba(31, 41, 55, 0.3)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = "#9ca3af";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.color = "#e5e7eb";
                    e.currentTarget.style.backgroundColor =
                      "rgba(31, 41, 55, 0.3)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.color = "#9ca3af";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span style={{ fontWeight: "500" }}>Stack Trace</span>
                  {showStack ? (
                    <ChevronUp style={{ width: "1rem", height: "1rem" }} />
                  ) : (
                    <ChevronDown style={{ width: "1rem", height: "1rem" }} />
                  )}
                </button>
                {showStack && (
                  <div style={{ padding: "0 1rem 1rem" }}>
                    <div
                      style={{
                        backgroundColor: "rgba(3, 7, 18, 0.5)",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        maxHeight: "16rem",
                        overflow: "auto",
                        border: "1px solid rgba(31, 41, 55, 0.5)",
                      }}
                    >
                      <pre
                        style={{
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          color: "#9ca3af",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          lineHeight: "1.625",
                          margin: 0,
                        }}
                      >
                        {stackTrace}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              width: "100%",
              maxWidth: "32rem",
              justifyContent: "center",
            }}
          >
            <Button
              onClick={handleReset}
              variant="default"
              className="h-11 px-6"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <Button
              variant="outline"
              className="h-11 px-6"
              onClick={() => window.open(newIssueUrl, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Report Issue
            </Button>

            <Button
              variant="ghost"
              className="h-11 px-6"
              onClick={handleGoHome}
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>

            <Button
              variant="ghost"
              className="h-11 px-6"
              onClick={handleGoToSetup}
            >
              Go to Setup
            </Button>
          </div>

          {/* Footer hint */}
          <p
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              marginTop: "2rem",
              textAlign: "center",
              maxWidth: "28rem",
            }}
          >
            If this error persists, please include the error details when
            reporting the issue.
          </p>
        </div>
      </body>
    </html>
  );
}
