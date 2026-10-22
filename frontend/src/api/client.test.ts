import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function client() {
  vi.stubEnv("VITE_API_BASE_URL", "https://directory.example/");
  return import("./client");
}

describe("API client", () => {
  it("uses the configured URL and forwards successful responses", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ items: [] })));
    vi.stubGlobal("fetch", fetcher);
    const { getJson } = await client();
    expect(
      await getJson(
        "/employees",
        new URLSearchParams({ search: "Rah" }),
        new AbortController().signal,
      ),
    ).toEqual({ items: [] });
    expect(fetcher.mock.calls[0][0]).toBe(
      "https://directory.example/employees?search=Rah",
    );
  });
  it("shows the server's safe error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ message: "Temporarily unavailable" }), {
            status: 503,
          }),
        ),
    );
    const { getJson } = await client();
    await expect(
      getJson(
        "/employees",
        new URLSearchParams(),
        new AbortController().signal,
      ),
    ).rejects.toThrow("Temporarily unavailable");
  });
  it("handles non-JSON server failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Bad Gateway", { status: 502 })),
    );
    const { getJson } = await client();
    await expect(
      getJson(
        "/employees",
        new URLSearchParams(),
        new AbortController().signal,
      ),
    ).rejects.toThrow("We could not load employees");
  });
  it("requires explicit API configuration", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const { getJson } = await import("./client");
    await expect(
      getJson(
        "/employees",
        new URLSearchParams(),
        new AbortController().signal,
      ),
    ).rejects.toThrow("API address is missing");
  });
  it("preserves cancellation without reporting a connection error", async () => {
    const controller = new AbortController();
    const aborted = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(aborted));
    const { getJson } = await client();
    controller.abort();
    await expect(
      getJson("/employees", new URLSearchParams(), controller.signal),
    ).rejects.toBe(aborted);
  });
});
