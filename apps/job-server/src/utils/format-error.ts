import axios from "axios";

type RetryMeta = {
  attemptNumber?: number;
  retriesLeft?: number;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapNestedError(err: unknown): unknown {
  if (!isObject(err)) return err;

  // p-retry commonly wraps the original error in { error, attemptNumber, retriesLeft }
  if ("error" in err) return (err as Record<string, unknown>).error;

  // Standard Error cause chaining
  if ("cause" in err) return (err as Record<string, unknown>).cause;

  return err;
}

function isSensitiveKey(key: string): boolean {
  return /^(authorization|cookie|set-cookie|password|pass|pwd|token|api[_-]?key|secret)$/i.test(
    key
  );
}

function redactSensitive(
  value: unknown,
  opts: { depth: number; maxDepth: number }
): unknown {
  if (opts.depth >= opts.maxDepth) return "[Truncated]";

  if (Array.isArray(value)) {
    const maxItems = 50;
    const items = value
      .slice(0, maxItems)
      .map((v) => redactSensitive(v, { ...opts, depth: opts.depth + 1 }));
    if (value.length > maxItems)
      items.push(`[+${value.length - maxItems} more]`);
    return items;
  }

  if (isObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = isSensitiveKey(k)
        ? "[REDACTED]"
        : redactSensitive(v, { ...opts, depth: opts.depth + 1 });
    }
    return out;
  }

  return value;
}

function stringifyTruncated(value: unknown, maxLen: number): string {
  try {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    if (str.length <= maxLen) return str;
    return `${str.slice(0, maxLen)}…[truncated ${str.length - maxLen} chars]`;
  } catch {
    const str = String(value);
    if (str.length <= maxLen) return str;
    return `${str.slice(0, maxLen)}…[truncated ${str.length - maxLen} chars]`;
  }
}

function readRetryMeta(err: unknown): RetryMeta {
  if (!isObject(err)) return {};

  const attemptNumber =
    typeof err.attemptNumber === "number" ? err.attemptNumber : undefined;
  const retriesLeft =
    typeof err.retriesLeft === "number" ? err.retriesLeft : undefined;

  return { attemptNumber, retriesLeft };
}

function joinDefined(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(", ");
}

function toAbsoluteUrl(baseURL?: string, url?: string): string | undefined {
  if (!baseURL && !url) return undefined;
  if (baseURL && url) {
    const base = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${base}${path}`;
  }
  return url ?? baseURL;
}

export function formatError(err: unknown): string {
  const retryMeta = readRetryMeta(err);
  const rootErr = unwrapNestedError(err);

  if (axios.isAxiosError(rootErr)) {
    const status = rootErr.response?.status;
    const code = rootErr.code ?? undefined;
    const method = rootErr.config?.method?.toUpperCase();
    const fullUrlNoQuery = toAbsoluteUrl(
      rootErr.config?.baseURL,
      rootErr.config?.url
    );
    const fullUrlWithQuery = (() => {
      try {
        // Uses axios' own URL building, including params serialization behavior.
        return rootErr.config ? axios.getUri(rootErr.config) : undefined;
      } catch {
        return undefined;
      }
    })();

    const paramsForLog =
      rootErr.config?.params !== undefined
        ? stringifyTruncated(
            redactSensitive(rootErr.config.params, { depth: 0, maxDepth: 6 }),
            2000
          )
        : undefined;

    const meta = joinDefined([
      status ? `status=${status}` : undefined,
      code ? `code=${code}` : undefined,
      method ? `method=${method}` : undefined,
      fullUrlWithQuery
        ? `url=${fullUrlWithQuery}`
        : fullUrlNoQuery
        ? `url=${fullUrlNoQuery}`
        : undefined,
      paramsForLog ? `params=${paramsForLog}` : undefined,
      typeof retryMeta.attemptNumber === "number"
        ? `attempt=${retryMeta.attemptNumber}`
        : undefined,
      typeof retryMeta.retriesLeft === "number"
        ? `retriesLeft=${retryMeta.retriesLeft}`
        : undefined,
    ]);

    return meta.length > 0
      ? `AxiosError(${meta}): ${rootErr.message}`
      : `AxiosError: ${rootErr.message}`;
  }

  if (rootErr instanceof Error) {
    const meta = joinDefined([
      typeof retryMeta.attemptNumber === "number"
        ? `attempt=${retryMeta.attemptNumber}`
        : undefined,
      typeof retryMeta.retriesLeft === "number"
        ? `retriesLeft=${retryMeta.retriesLeft}`
        : undefined,
    ]);

    return meta.length > 0
      ? `${rootErr.name}(${meta}): ${rootErr.message}`
      : `${rootErr.name}: ${rootErr.message}`;
  }

  try {
    return typeof rootErr === "string" ? rootErr : JSON.stringify(rootErr);
  } catch {
    return String(rootErr);
  }
}
