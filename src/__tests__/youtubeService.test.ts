import { describe, expect, it } from "vitest";
import { MOCK_YOUTUBE_URLS } from "../data/mockYoutubeUrls.ts";
import {
  extractYouTubeId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  isValidYouTubeUrl,
} from "../services/youtubeService.ts";

describe("youtubeService", () => {
  it("extracts 11-char ID from standard watch URLs", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(
      extractYouTubeId(
        "https://www.youtube.com/watch?v=g7eDQ9sCEl4&list=RDg7eDQ9sCEl4&start_radio=1"
      )
    ).toBe("g7eDQ9sCEl4");
  });

  it("extracts ID from youtu.be short URLs", () => {
    expect(extractYouTubeId("https://youtu.be/9bZkp7q19f0")).toBe("9bZkp7q19f0");
    expect(extractYouTubeId("https://youtu.be/9bZkp7q19f0?t=42")).toBe(
      "9bZkp7q19f0"
    );
  });

  it("extracts ID from Shorts and embed URLs", () => {
    expect(extractYouTubeId("https://www.youtube.com/shorts/jNQXAC9IVRw")).toBe(
      "jNQXAC9IVRw"
    );
    expect(extractYouTubeId("https://www.youtube.com/embed/kJQP7kiw5Fk")).toBe(
      "kJQP7kiw5Fk"
    );
  });

  it("rejects invalid YouTube URLs", () => {
    expect(extractYouTubeId("")).toBeNull();
    expect(extractYouTubeId("https://vimeo.com/123456")).toBeNull();
    expect(extractYouTubeId("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(isValidYouTubeUrl("not-a-url")).toBe(false);
  });

  it("generates thumbnail and embed URLs", () => {
    expect(getYouTubeThumbnailUrl("dQw4w9WgXcQ")).toBe(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    );
    expect(getYouTubeEmbedUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it("validates all dev mock YouTube URL presets", () => {
    for (const preset of MOCK_YOUTUBE_URLS) {
      expect(extractYouTubeId(preset.url)).toBe(preset.expectedId);
      expect(isValidYouTubeUrl(preset.url)).toBe(preset.expectedId !== null);
    }
  });
});
