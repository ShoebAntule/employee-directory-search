import { useCallback, useEffect, useRef, useState } from "react";
import { searchEmployees } from "../api/employees";
import type { EmployeePage } from "../types/employee";

interface SearchState extends EmployeePage {
  status: "idle" | "waiting" | "loading" | "success" | "error";
  error: string | null;
  loadingMore: boolean;
  pageError: string | null;
}

const emptyState: SearchState = {
  items: [],
  next_cursor: null,
  has_more: false,
  status: "idle",
  error: null,
  loadingMore: false,
  pageError: null,
};

export function useEmployeeSearch(value: string , department: string | null = null){
  
  const query = value.trim() || department || "";
  const [state, setState] = useState<SearchState>(emptyState);
  const [retryKey, setRetryKey] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const pagePending = useRef(false);

  useEffect(() => {
    const requestId = ++generation.current;
    controller.current?.abort();
    pagePending.current = false;
    if (!query) {
      setState(emptyState);
      return;
    }
    setState({ ...emptyState, status: "waiting" });
    const active = new AbortController();
    controller.current = active;
    const timer = window.setTimeout(async () => {
      setState({ ...emptyState, status: "loading" });
      try {
        const page = await searchEmployees(
  query,
  active.signal,
  undefined,
  department,
);
        if (!active.signal.aborted && requestId === generation.current) {
          setState({ ...emptyState, ...page, status: "success" });
        }
      } catch (error) {
        if (!active.signal.aborted && requestId === generation.current) {
          setState({
            ...emptyState,
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : "Unable to search employees.",
          });
        }
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      active.abort();
    };
  }, [query, department, retryKey]);

  const loadMore = useCallback(async () => {
    if (!state.next_cursor || state.status !== "success" || pagePending.current)
      return;
    pagePending.current = true;
    const requestId = generation.current;
    const active = new AbortController();
    controller.current = active;
    setState((previous) => ({
      ...previous,
      loadingMore: true,
      pageError: null,
    }));
    try {
      const page = await searchEmployees(
        query,
        active.signal,
        state.next_cursor,
        department,
      );
      if (!active.signal.aborted && requestId === generation.current) {
        setState((previous) => ({
          ...previous,
          ...page,
          items: [...previous.items, ...page.items],
          loadingMore: false,
        }));
      }
    } catch (error) {
      if (!active.signal.aborted && requestId === generation.current) {
        setState((previous) => ({
          ...previous,
          loadingMore: false,
          pageError:
            error instanceof Error
              ? error.message
              : "Unable to load more employees.",
        }));
      }
    } finally {
      if (requestId === generation.current) pagePending.current = false;
    }
  }, [query, department, state.next_cursor, state.status]);

  return { ...state, loadMore, retry: () => setRetryKey((key) => key + 1) };
}
