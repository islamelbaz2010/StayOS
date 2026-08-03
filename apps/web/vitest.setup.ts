import { vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn(() => "blob:mock-url") as typeof URL.createObjectURL;
}

if (typeof URL.revokeObjectURL === "undefined") {
  URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL;
}
