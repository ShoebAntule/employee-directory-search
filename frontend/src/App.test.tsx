import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./api/employees", () => ({ searchEmployees: vi.fn() }));

describe("directory", () => {
  it("starts with useful guidance and an accessible search field", () => {
    render(<App />);
    expect(
      screen.getByRole("searchbox", { name: /search employees/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The right person is a search away."),
    ).toBeInTheDocument();
  });
  it("filters by department without replacing the search text", () => {
  render(<App />);

  const input = screen.getByRole("searchbox");
  const engineering = screen.getByRole("button", {
    name: "Engineering",
  });

  fireEvent.change(input, { target: { value: "Rahul" } });
  fireEvent.click(engineering);

  expect(input).toHaveValue("Rahul");
  expect(engineering).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

  expect(input).toHaveValue("");
  expect(engineering).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(engineering);

  expect(engineering).toHaveAttribute("aria-pressed", "false");
});
});
