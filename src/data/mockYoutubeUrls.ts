export interface MockYouTubePreset {
  label: string;
  url: string;
  sampleTitle: string;
  expectedId: string | null;
}

export const MOCK_YOUTUBE_URLS: MockYouTubePreset[] = [
  {
    label: "watch?v=",
    url: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
    sampleTitle: "YouTube Player API Demo",
    expectedId: "M7lc1UVf-VE",
  },
  {
    label: "youtu.be/",
    url: "https://youtu.be/aqz-KE-bpKQ",
    sampleTitle: "Big Buck Bunny (Short Link)",
    expectedId: "aqz-KE-bpKQ",
  },
  {
    label: "shorts/",
    url: "https://www.youtube.com/shorts/5qap5aO4i9A",
    sampleTitle: "Quick Tip (YouTube Shorts)",
    expectedId: "5qap5aO4i9A",
  },
  {
    label: "embed/",
    url: "https://www.youtube.com/embed/LXb3EKWsInQ",
    sampleTitle: "4K Walkthrough (Embed URL)",
    expectedId: "LXb3EKWsInQ",
  },
  {
    label: "watch + playlist",
    url: "https://www.youtube.com/watch?v=g7eDQ9sCEl4&list=RDg7eDQ9sCEl4&start_radio=1",
    sampleTitle: "Playlist Parameter Test",
    expectedId: "g7eDQ9sCEl4",
  },
  {
    label: "Invalid URL",
    url: "https://empower-slpa.org/not-a-youtube-video",
    sampleTitle: "",
    expectedId: null,
  },
];
