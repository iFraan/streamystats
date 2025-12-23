import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/**
 * Hook for managing query parameters in the URL with Suspense support
 */
export function useQueryParams<_T = unknown>() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Updates URL query parameters and triggers Suspense
   */
  const updateQueryParams = (
    params: Record<string, string | null>,
    options: { scroll?: boolean } = { scroll: false },
  ) => {
    setIsLoading(true); // Show loading state immediately

    // Start a transition to update the route
    startTransition(() => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      // Update or remove each parameter
      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      }

      router.replace(`?${newSearchParams.toString()}`, {
        scroll: options.scroll,
      });
    });
  };

  // Reset loading state when the transition completes
  useEffect(() => {
    if (!isPending) {
      setIsLoading(false);
    }
  }, [isPending]);

  return {
    updateQueryParams,
    isLoading: isLoading || isPending,
  };
}
