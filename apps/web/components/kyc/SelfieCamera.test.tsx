import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";

import { SelfieCamera } from "./SelfieCamera";

const t = messages.kyc.camera as Record<string, string>;

const fakeTrack = { stop: vi.fn() };
const fakeStream = { getTracks: () => [fakeTrack] } as unknown as MediaStream;

function mockGetUserMedia(
  impl: () => Promise<MediaStream> | undefined = async () => fakeStream
) {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn(impl) },
  });
}

function mockNoGetUserMedia() {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: undefined,
  });
}

// jsdom has no canvas 2d context or media playback — stub enough of both
// for capture → preview → use-photo to exercise the real component logic.
function mockCapturePipeline() {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
    configurable: true,
    get: () => 640,
  });
  Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
    configurable: true,
    get: () => 480,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: () => ({ drawImage: vi.fn() }),
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
    configurable: true,
    value: function (cb: (b: Blob | null) => void) {
      cb(new Blob(["jpeg-data"], { type: "image/jpeg" }));
    },
  });
}

function renderCamera(onCapture = vi.fn(), onClose = vi.fn()) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SelfieCamera onCapture={onCapture} onClose={onClose} />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  fakeTrack.stop.mockClear();
  mockCapturePipeline();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SelfieCamera", () => {
  it("starts the camera and shows the capture action", async () => {
    mockGetUserMedia();
    renderCamera();
    expect(
      await screen.findByRole("button", { name: t.capture })
    ).toBeInTheDocument();
  });

  it("capture → preview → use photo passes a jpeg File upward", async () => {
    const onCapture = vi.fn();
    const onClose = vi.fn();
    mockGetUserMedia();
    renderCamera(onCapture, onClose);

    fireEvent.click(
      await screen.findByRole("button", { name: t.capture })
    );
    fireEvent.click(
      await screen.findByRole("button", { name: t.usePhoto })
    );

    expect(onCapture).toHaveBeenCalledTimes(1);
    const file = onCapture.mock.calls[0][0] as File;
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe("image/jpeg");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(fakeTrack.stop).toHaveBeenCalled();
  });

  it("retake returns to the live capture state", async () => {
    mockGetUserMedia();
    renderCamera();
    fireEvent.click(
      await screen.findByRole("button", { name: t.capture })
    );
    fireEvent.click(
      await screen.findByRole("button", { name: t.retake })
    );
    expect(
      await screen.findByRole("button", { name: t.capture })
    ).toBeInTheDocument();
    // Stream stays alive through a retake — no camera re-request needed.
    expect(fakeTrack.stop).not.toHaveBeenCalled();
  });

  it("permission denied shows the fallback message and upload escape", async () => {
    mockGetUserMedia(async () => {
      throw new DOMException("denied", "NotAllowedError");
    });
    renderCamera();
    expect(await screen.findByRole("alert")).toHaveTextContent(t.denied);
    expect(
      screen.getByRole("button", { name: t.uploadInstead })
    ).toBeInTheDocument();
  });

  it("no getUserMedia shows the unavailable fallback", async () => {
    mockNoGetUserMedia();
    renderCamera();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.unavailable
    );
    expect(
      screen.getByRole("button", { name: t.uploadInstead })
    ).toBeInTheDocument();
  });

  it("camera init failure (non-permission) shows the unavailable fallback", async () => {
    mockGetUserMedia(async () => {
      throw new DOMException("no device", "NotFoundError");
    });
    renderCamera();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      t.unavailable
    );
  });

  it("stops the stream when closed", async () => {
    mockGetUserMedia();
    const onClose = vi.fn();
    renderCamera(vi.fn(), onClose);
    await screen.findByRole("button", { name: t.capture });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(fakeTrack.stop).toHaveBeenCalled();
  });
});
