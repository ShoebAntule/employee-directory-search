const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function getJson<T>(
  path: string,
  params: URLSearchParams,
  signal: AbortSignal,
): Promise<T> {
  if (!baseUrl) {
    throw new ApiError(
      "The API address is missing. Set VITE_API_BASE_URL and restart the frontend.",
      0,
    );
  }
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(12000)]);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}?${params}`, {
      signal: requestSignal,
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (signal.aborted) throw error;
    if (requestSignal.aborted) {
      throw new ApiError(
        "The directory is taking too long to respond. Please try again.",
        0,
      );
    }
    throw new ApiError(
      "We could not reach the directory. Check your connection and try again.",
      0,
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      typeof body?.message === "string"
        ? body.message
        : "We could not load employees. Please try again.";
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}
