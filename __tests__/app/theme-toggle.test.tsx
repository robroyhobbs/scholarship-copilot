import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/chrome/theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  it("loads a saved dark theme and lets the student switch back to light", async () => {
    localStorage.setItem("scholarship-theme", "dark");

    render(React.createElement(ThemeToggle));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("dark");
    });

    expect(
      screen.getByRole("button", { name: /switch to light mode/i }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /switch to light mode/i }),
    );

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("scholarship-theme")).toBe("light");
  });

  it("defaults to light theme and switches to dark mode", async () => {
    render(React.createElement(ThemeToggle));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
    });

    fireEvent.click(
      screen.getByRole("button", { name: /switch to dark mode/i }),
    );

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("scholarship-theme")).toBe("dark");
  });
});
