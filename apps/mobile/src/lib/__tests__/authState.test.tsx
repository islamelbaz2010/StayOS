/**
 * Reproduces the founder-reported defect: "login/logout does not update
 * the visible app state until the app is closed and reopened."
 *
 * `useHasTokens` subscribes to token changes via useSyncExternalStore —
 * a setTokens/clearTokens call must propagate to React immediately.
 */

const store: Record<string, string> = {};
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    store[key] = value;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    delete store[key];
  }),
}));

import React from "react";
import { act, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { clearTokens, setTokens } from "../api";
import { useHasTokens } from "../hooks";

function Probe() {
  const authed = useHasTokens();
  return <Text testID="flag">{authed ? "authed" : "guest"}</Text>;
}

describe("useHasTokens propagation", () => {
  beforeEach(async () => {
    for (const key of Object.keys(store)) delete store[key];
    await clearTokens();
  });

  it("flips to authed immediately when tokens are set (login)", async () => {
    const screen = render(<Probe />);
    expect(screen.getByTestId("flag").props.children).toBe("guest");

    await act(async () => {
      await setTokens("access", "refresh");
    });

    expect(screen.getByTestId("flag").props.children).toBe("authed");
  });

  it("flips back to guest immediately when tokens are cleared (logout)", async () => {
    await act(async () => {
      await setTokens("access", "refresh");
    });
    const screen = render(<Probe />);
    expect(screen.getByTestId("flag").props.children).toBe("authed");

    await act(async () => {
      await clearTokens();
    });

    expect(screen.getByTestId("flag").props.children).toBe("guest");
  });
});
