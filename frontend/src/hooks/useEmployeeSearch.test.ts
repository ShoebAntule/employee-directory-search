import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { searchEmployees } from "../api/employees";
import type { EmployeePage } from "../types/employee";
import { useEmployeeSearch } from "./useEmployeeSearch";

vi.mock("../api/employees", () => ({ searchEmployees: vi.fn() }));
const search = vi.mocked(searchEmployees);
const page: EmployeePage = {
  items: [
    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul@example.test",
      department: "Engineering",
      designation: "Engineer",
      date_of_joining: "2024-01-01",
    },
  ],
  has_more: false,
  next_cursor: null,
};

beforeEach(() => {
  vi.useFakeTimers();
  search.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
});
async function finishTyping() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(350);
  });
}

describe("employee search", () => {
  it("does not request empty or whitespace searches", async () => {
    const { rerender } = renderHook(({ query }) => useEmployeeSearch(query), {
      initialProps: { query: "" },
    });
    await finishTyping();
    rerender({ query: "   " });
    await finishTyping();
    expect(search).not.toHaveBeenCalled();
  });

  it("debounces typing into a single request", async () => {
    search.mockResolvedValue(page);
    const { result, rerender } = renderHook(
      ({ query }) => useEmployeeSearch(query),
      { initialProps: { query: "R" } },
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ query: "Ra" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ query: "Rah" });
    expect(search).not.toHaveBeenCalled();
    await finishTyping();
    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0][0]).toBe("Rah");
    expect(result.current.items[0].name).toBe("Rahul Sharma");
  });

  it("aborts and ignores stale responses even if the transport resolves later", async () => {
    let resolveOld!: (value: EmployeePage) => void;
    search
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValueOnce({ items: [], next_cursor: null, has_more: false });
    const { result, rerender } = renderHook(
      ({ query }) => useEmployeeSearch(query),
      { initialProps: { query: "Rah" } },
    );
    await finishTyping();
    const oldSignal = search.mock.calls[0][1];
    rerender({ query: "Design" });
    expect(oldSignal.aborted).toBe(true);
    await finishTyping();
    await act(async () => {
      resolveOld(page);
    });
    expect(result.current.items).toEqual([]);
    expect(result.current.status).toBe("success");
  });

  it("shows errors and lets the user retry", async () => {
    search
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce(page);
    const { result } = renderHook(() => useEmployeeSearch("Rah"));
    await finishTyping();
    expect(result.current.error).toBe("Unavailable");
    act(() => {
      result.current.retry();
    });
    await finishTyping();
    expect(result.current.status).toBe("success");
  });

  it("keeps existing employees when loading another page fails", async () => {
    search
      .mockResolvedValueOnce({ ...page, next_cursor: "next", has_more: true })
      .mockRejectedValueOnce(new Error("Try later"))
      .mockResolvedValueOnce({ ...page, items: [{ ...page.items[0], id: 2 }] });
    const { result } = renderHook(() => useEmployeeSearch("Rah"));
    await finishTyping();
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.pageError).toBe("Try later");
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.items.map((item) => item.id)).toEqual([1, 2]);
  });

  it("prevents duplicate pagination requests", async () => {
    search.mockResolvedValueOnce({
      ...page,
      next_cursor: "next",
      has_more: true,
    });
    let finish!: (value: EmployeePage) => void;
    search.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = renderHook(() => useEmployeeSearch("Rah"));
    await finishTyping();
    act(() => {
      void result.current.loadMore();
      void result.current.loadMore();
    });
    expect(search).toHaveBeenCalledTimes(2);
    await act(async () => {
      finish({ ...page, items: [] });
    });
  });

  it("aborts in-flight pagination when the search changes", async () => {
    search.mockResolvedValueOnce({
      ...page,
      next_cursor: "next",
      has_more: true,
    });
    let finish!: (value: EmployeePage) => void;
    search
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce({ items: [], next_cursor: null, has_more: false });
    const { result, rerender } = renderHook(
      ({ query }) => useEmployeeSearch(query),
      { initialProps: { query: "Rah" } },
    );
    await finishTyping();
    act(() => {
      void result.current.loadMore();
    });
    const signal = search.mock.calls[1][1];
    rerender({ query: "Design" });
    expect(signal.aborted).toBe(true);
    await finishTyping();
    await act(async () => {
      finish(page);
    });
    expect(result.current.items).toEqual([]);
  });
});
