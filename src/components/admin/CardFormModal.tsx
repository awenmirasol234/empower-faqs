import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  extractYouTubeId,
  getYouTubeThumbnailUrl,
} from "../../services/youtubeService.ts";
import type {
  CardType,
  Category,
  ContentCard,
  ContentStatus,
  ThumbnailMode,
} from "../../types/content.ts";
import { VideoModal } from "../video/VideoModal.tsx";
import { MOCK_YOUTUBE_URLS } from "../../data/mockYoutubeUrls.ts";

interface CardFormModalProps {
  open: boolean;
  categories: Category[];
  editing: ContentCard | null;
  initialType?: CardType;
  saving: boolean;
  onClose: () => void;
  onSave: (card: ContentCard) => Promise<void>;
}

export function CardFormModal({
  open,
  categories,
  editing,
  initialType = "video",
  saving,
  onClose,
  onSave,
}: CardFormModalProps) {
  const isEditing = Boolean(editing);

  const [type, setType] = useState<CardType>(editing?.type ?? initialType);
  const [youtubeUrl, setYoutubeUrl] = useState(editing?.youtube_url ?? "");
  const [youtubeId, setYoutubeId] = useState<string | null>(
    editing?.youtube_id || null
  );
  const [title, setTitle] = useState(editing?.title ?? "");
  const [categoryId, setCategoryId] = useState(
    editing?.category_id ? String(editing.category_id) : ""
  );
  const [description, setDescription] = useState(editing?.description ?? "");
  const [tags, setTags] = useState(editing?.tags ?? "");
  const [thumbnailMode, setThumbnailMode] = useState<ThumbnailMode>(
    editing?.thumbnail_mode ?? "youtube"
  );
  const [customThumbDataUrl, setCustomThumbDataUrl] = useState<string | null>(
    editing?.thumbnail_url ?? null
  );
  const [transcriptMode, setTranscriptMode] = useState<"paste" | "upload">("paste");
  const [transcript, setTranscript] = useState(editing?.transcript ?? "");
  const [language, setLanguage] = useState(editing?.language ?? "English");
  const [presenter, setPresenter] = useState(editing?.presenter ?? "");
  const [organization, setOrganization] = useState(editing?.organization ?? "");
  const [location, setLocation] = useState(editing?.location ?? "");
  const [duration, setDuration] = useState(editing?.duration ?? "");
  const [date, setDate] = useState(editing?.date ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [status, setStatus] = useState<ContentStatus>(editing?.status ?? "draft");
  const [displayOrder, setDisplayOrder] = useState(editing?.display_order ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!youtubeUrl.trim()) {
      setYoutubeId(null);
      return;
    }
    setYoutubeId(extractYouTubeId(youtubeUrl));
  }, [youtubeUrl]);

  const ytThumb = useMemo(
    () => (youtubeId ? getYouTubeThumbnailUrl(youtubeId) : null),
    [youtubeId]
  );

  const previewThumb = useMemo(() => {
    if (thumbnailMode === "custom" && customThumbDataUrl) {
      return customThumbDataUrl;
    }
    return ytThumb;
  }, [thumbnailMode, customThumbDataUrl, ytThumb]);

  if (!open) return null;

  const handleCustomThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Thumbnail image must be smaller than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomThumbDataUrl(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTranscriptUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["srt", "vtt", "txt"].includes(ext)) {
      setError("Please upload a .srt, .vtt or .txt file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Transcript file is too large (max 2MB).");
      return;
    }
    const text = await file.text();
    setTranscript(text.trim());
    setError(null);
  };

  const buildCardPayload = (overrideStatus?: ContentStatus): ContentCard | null => {
    if (type === "video") {
      if (!youtubeUrl.trim()) {
        setError("Please enter a YouTube URL.");
        return null;
      }
      if (!youtubeId) {
        setError("Please enter a valid YouTube URL.");
        return null;
      }
    } else if (youtubeUrl.trim() && !youtubeId) {
      setError("Optional YouTube URL is invalid.");
      return null;
    }

    if (!title.trim()) {
      setError(type === "faq" ? "Please enter a question." : "Please enter a title.");
      return null;
    }

    const catNum = categoryId ? Number(categoryId) : null;
    const matchedCat =
      catNum !== null ? categories.find((c) => c.id === catNum) ?? null : null;
    const now = new Date().toISOString();
    const resolvedId = editing?.id ?? Date.now();

    return {
      id: resolvedId,
      type,
      title: title.trim(),
      description: description.trim() || null,
      category_id: matchedCat ? matchedCat.id : null,
      category: matchedCat
        ? { id: matchedCat.id, name: matchedCat.name, slug: matchedCat.slug }
        : null,
      tags: tags.trim() || null,
      youtube_url: youtubeUrl.trim(),
      youtube_id: youtubeId ?? "",
      thumbnail: youtubeId ? getYouTubeThumbnailUrl(youtubeId) : "",
      thumbnail_mode: thumbnailMode,
      thumbnail_url: thumbnailMode === "custom" ? customThumbDataUrl : null,
      transcript: transcript.trim() || null,
      language: language.trim() || "English",
      presenter: presenter.trim() || null,
      organization: organization.trim() || null,
      location: location.trim() || null,
      duration: duration.trim() || null,
      date: date.trim() || null,
      notes: notes.trim() || null,
      status: overrideStatus ?? status,
      display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
      views: editing?.views ?? 0,
      created_at: editing?.created_at ?? now,
      updated_at: now,
    };
  };

  const handleSubmit = async (overrideStatus?: ContentStatus) => {
    const payload = buildCardPayload(overrideStatus);
    if (!payload) return;
    setError(null);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    }
  };

  const selectedCategoryName = categories.find(
    (c) => String(c.id) === categoryId
  )?.name;

  const previewCard: ContentCard = {
    id: editing?.id ?? 0,
    type,
    title: title.trim() || "Preview Title",
    description: description.trim() || null,
    category_id: categoryId ? Number(categoryId) : null,
    category: null,
    tags: tags.trim() || null,
    youtube_url: youtubeUrl.trim(),
    youtube_id: youtubeId ?? "",
    thumbnail: youtubeId ? getYouTubeThumbnailUrl(youtubeId) : "",
    thumbnail_mode: thumbnailMode,
    thumbnail_url: thumbnailMode === "custom" ? customThumbDataUrl : null,
    transcript: transcript.trim() || null,
    language: language.trim() || null,
    presenter: presenter.trim() || null,
    organization: organization.trim() || null,
    location: location.trim() || null,
    duration: duration.trim() || null,
    date: date.trim() || null,
    notes: notes.trim() || null,
    status,
    display_order: displayOrder,
    views: editing?.views ?? 0,
    created_at: editing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#131416]/50 p-2 sm:p-4">
      <div
        data-ui="modal"
        className="my-4 w-full max-w-3xl rounded-[12px] border border-[#e8eaec] bg-[#ffffff]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[12px] border-b border-[#e8eaec] bg-[#f4f6f8] px-4 py-3 sm:px-6">
          <h2 className="text-[15px] font-semibold text-[#131416]">
            {isEditing
              ? `Edit ${type === "faq" ? "FAQ" : "Video"}`
              : type === "faq"
              ? "Add FAQ Card"
              : "Add YouTube Video"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 min-h-[44px] min-w-[44px]"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="space-y-5 px-4 py-5 sm:px-6 sm:py-6 max-h-[85vh] overflow-y-auto"
        >
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 break-words">
              {error}
            </div>
          )}

          {/* Card type toggle */}
          <div>
            <span className="text-sm font-medium text-zinc-700">Card Type</span>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setType("video")}
                className={`rounded-full px-4 py-2 text-xs font-medium min-h-[44px] ${
                  type === "video"
                    ? "bg-accentBlue text-white"
                    : "border border-zinc-300 bg-white text-zinc-700"
                }`}
              >
                YouTube Video
              </button>
              <button
                type="button"
                onClick={() => setType("faq")}
                className={`rounded-full px-4 py-2 text-xs font-medium min-h-[44px] ${
                  type === "faq"
                    ? "bg-accentBlue text-white"
                    : "border border-zinc-300 bg-white text-zinc-700"
                }`}
              >
                FAQ (Q&amp;A)
              </button>
            </div>
          </div>

          {/* YouTube URL */}
          <div>
            <label
              className="text-sm font-medium text-zinc-700"
              htmlFor="yt-url"
            >
              {type === "faq" ? "YouTube URL (optional)" : "YouTube URL"}
            </label>
            <input
              id="yt-url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=XXXXXXXX"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Supports youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, and
              youtube.com/embed/ — extracts the 11-character ID automatically.
            </p>
            {youtubeId && (
              <p className="mt-1 text-xs text-green-700">
                Detected Video ID: {youtubeId}
              </p>
            )}
            {!youtubeId && youtubeUrl.trim() && (
              <p className="mt-1 text-xs text-red-600">
                Please enter a valid YouTube URL.
              </p>
            )}
            {import.meta.env.DEV && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-zinc-500">
                  Dev Mock URLs:
                </span>
                {MOCK_YOUTUBE_URLS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setYoutubeUrl(preset.url);
                      if (!title.trim() && preset.sampleTitle) {
                        setTitle(preset.sampleTitle);
                      }
                    }}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                      preset.expectedId === null
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-accentBlue hover:text-accentBlue"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title / Question */}
          <div>
            <label
              className="text-sm font-medium text-zinc-700"
              htmlFor="card-title"
            >
              {type === "faq" ? "Question / Title" : "Title"}
            </label>
            <input
              id="card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "faq"
                  ? "How do I reset my password?"
                  : "How to Apply — Step by Step"
              }
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label
              className="text-sm font-medium text-zinc-700"
              htmlFor="card-category"
            >
              Category
            </label>
            <div className="relative mt-1">
              <select
                id="card-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 pr-12 text-sm leading-5 outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Description / Answer */}
          <div>
            <label
              className="text-sm font-medium text-zinc-700"
              htmlFor="card-desc"
            >
              {type === "faq" ? "Answer" : "Description"}
            </label>
            <textarea
              id="card-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === "faq"
                  ? "Write a clear, helpful answer..."
                  : "Enter description..."
              }
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20"
            />
          </div>

          {/* Thumbnail */}
          {(type === "video" || youtubeId) && (
            <div>
              <span className="text-sm font-medium text-zinc-700">Thumbnail</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <label
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm cursor-pointer min-h-[44px] ${
                    thumbnailMode === "youtube"
                      ? "border-accentBlue bg-accentBlue text-white"
                      : "border-zinc-300 bg-white text-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="thumbMode"
                    value="youtube"
                    checked={thumbnailMode === "youtube"}
                    onChange={() => setThumbnailMode("youtube")}
                    className="sr-only"
                  />
                  Use YouTube Thumbnail
                </label>
                <label
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm cursor-pointer min-h-[44px] ${
                    thumbnailMode === "custom"
                      ? "border-accentBlue bg-accentBlue text-white"
                      : "border-zinc-300 bg-white text-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="thumbMode"
                    value="custom"
                    checked={thumbnailMode === "custom"}
                    onChange={() => setThumbnailMode("custom")}
                    className="sr-only"
                  />
                  Upload Custom
                </label>
              </div>

              {thumbnailMode === "custom" && (
                <div className="mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomThumbChange}
                    className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-zinc-800 min-h-[44px]"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    PNG, JPG up to 2MB.
                  </p>
                </div>
              )}

              <div className="mt-3">
                <p className="text-xs font-medium text-zinc-700">
                  Thumbnail Preview
                </p>
                <div className="mt-1 aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                  {previewThumb ? (
                    <img
                      src={previewThumb}
                      alt="Thumbnail preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-zinc-500 px-4 text-center">
                      Paste a YouTube URL to see thumbnail, or upload a custom
                      image.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Transcript */}
          <div>
            <span className="text-sm font-medium text-zinc-700">
              Transcript / Subtitles
            </span>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setTranscriptMode("paste")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium min-h-[44px] ${
                  transcriptMode === "paste"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                Paste Transcript
              </button>
              <button
                type="button"
                onClick={() => setTranscriptMode("upload")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium min-h-[44px] ${
                  transcriptMode === "upload"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                Upload .srt/.vtt/.txt
              </button>
            </div>
            {transcriptMode === "paste" ? (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={"00:00 Introduction\n01:25 Requirements"}
                rows={4}
                className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20"
              />
            ) : (
              <div className="mt-2">
                <input
                  ref={transcriptInputRef}
                  type="file"
                  accept=".srt,.vtt,.txt"
                  onChange={handleTranscriptUpload}
                  className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:text-zinc-700 hover:file:bg-zinc-200 min-h-[44px]"
                />
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Transcript will appear here after upload."
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20"
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label
              className="text-sm font-medium text-zinc-700"
              htmlFor="card-tags"
            >
              Tags
            </label>
            <input
              id="card-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="registration, application, requirements"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Comma-separated, shown as #tags and searchable.
            </p>
          </div>

          {/* More options */}
          <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700">
              More options (optional)
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Presenter
                </label>
                <input
                  value={presenter}
                  onChange={(e) => setPresenter(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Organization
                </label>
                <input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Language
                </label>
                <input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Duration
                </label>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 5:32"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700">Date</label>
                <input
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="2026-11-14"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Location
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Status
                </label>
                <div className="relative mt-1">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentStatus)}
                    className="w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 pr-12 text-sm leading-5 outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="hidden">Hidden</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <ChevronDown className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Only Published appears on the public site.
                </p>
              </div>
            </div>
          </details>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 min-h-[44px]"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-accentBlue px-4 py-2.5 text-sm font-medium text-white hover:bg-[#244ac2] disabled:opacity-50 min-h-[44px]"
            >
              {saving
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : status === "published"
                ? "Publish"
                : "Save Draft"}
            </button>
            {status !== "published" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSubmit("published")}
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 min-h-[44px]"
              >
                {isEditing ? "Save & Publish" : "Publish"}
              </button>
            )}
          </div>
        </form>
      </div>

      <VideoModal
        card={previewCard}
        categoryName={selectedCategoryName}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
