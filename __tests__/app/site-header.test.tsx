import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname,
}));

import { SiteHeader } from "@/components/chrome/site-header";

describe("SiteHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks the current section link as active", () => {
    usePathname.mockReturnValue("/scholarships/abc");

    render(React.createElement(SiteHeader));

    expect(screen.getByRole("link", { name: "Scholarships" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Profile" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
