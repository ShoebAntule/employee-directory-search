import type { EmployeePage } from "../types/employee";
import { getJson } from "./client";

export function searchEmployees(
  search: string,
  signal: AbortSignal,
  cursor?: string | null,
  department?: string | null,
) {
  const params = new URLSearchParams({ search, limit: "12" });

  if (cursor) params.set("cursor", cursor);
  if (department) params.set("department", department);

  return getJson<EmployeePage>("/employees", params, signal);
}