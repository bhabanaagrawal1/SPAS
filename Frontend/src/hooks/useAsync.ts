
import { useEffect, useState } from "react";

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

export function useAsync<T>(
  load: ((signal: AbortSignal) => Promise<T>) | null,
  deps: unknown[],
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: load !== null,
    error: null,
  });

  useEffect(() => {
    if (!load) {
      return;
    }

    const controller = new AbortController();

    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setState({
          data: null,
          loading: false,
          error: error instanceof Error
            ? error
            : new Error("Something went wrong"),
        });
      });

    return () => controller.abort();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  if (!load) {
    return { data: null, loading: false, error: null };
  }

  return state;
}