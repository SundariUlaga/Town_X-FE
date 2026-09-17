import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const VIEWED_KEY = "townx_viewed_stories";

export type StoryItem = {
  id: number;
  user_id?: string | null;
  user_name?: string | null;
  media_url: string;
  media_type: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  location?: string | null;
  property_id?: number | null;
  property_price?: number | null;
  property_locality?: string | null;
  property_city?: string | null;
  cover_url?: string | null;
  is_hot?: boolean;
  views_count?: number;
};

function readViewed(): Set<number> {
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map(Number).filter((n) => Number.isFinite(n)));
  } catch {
    return new Set();
  }
}

export function markStoryViewed(id: number) {
  const next = readViewed();
  next.add(id);
  try {
    localStorage.setItem(VIEWED_KEY, JSON.stringify([...next].slice(-200)));
  } catch {
    /* ignore quota */
  }
}

function displayName(story: StoryItem) {
  if (story.user_name?.trim()) return story.user_name.trim().split(/\s+/)[0];
  if (story.user_id) return String(story.user_id).slice(0, 8);
  return "TX";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] || "T").toUpperCase();
}

function avatarHue(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  return hash;
}

type StoriesRailProps = {
  stories: StoryItem[];
  loading?: boolean;
  onOpenStory: (story: StoryItem) => void;
  onCreateStory: () => void;
  className?: string;
};

/**
 * Facebook-web story tray: portrait cards for real stories only (not listings).
 * Create tile first when signed in; rail hides when there are no stories.
 */
export function StoriesRail({
  stories,
  loading = false,
  onOpenStory,
  onCreateStory,
  className,
}: StoriesRailProps) {
  const { user } = useAuth();
  const [viewed, setViewed] = useState<Set<number>>(() => readViewed());

  const handleOpen = useCallback(
    (story: StoryItem) => {
      markStoryViewed(story.id);
      setViewed((prev) => new Set(prev).add(story.id));
      onOpenStory(story);
    },
    [onOpenStory]
  );

  const cards = useMemo(() => stories, [stories]);

  // Hide the whole tray when empty — a lone “Create story” tile looks orphaned.
  if (!loading && cards.length === 0) return null;

  const showCreate = Boolean(user);

  return (
    <section id="stories-section" className={cn("border-b border-gray-200/80 bg-white", className)}>
      <div className="mx-auto max-w-[90rem] px-4 py-3 sm:py-4">
        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x proximity" }}
        >
          {showCreate ? (
            <button
              type="button"
              onClick={onCreateStory}
              className="relative h-[140px] w-[82px] shrink-0 overflow-hidden rounded-[10px] border border-gray-200 bg-[#f0f2f5] text-left transition-opacity hover:opacity-95 sm:h-[148px] sm:w-[86px]"
              style={{ scrollSnapAlign: "start" }}
              aria-label="Create a story"
            >
              <div className="flex h-full flex-col items-center justify-center gap-2 px-1">
                <span className="flex size-9 items-center justify-center rounded-full bg-secondary-500 text-white shadow-soft-sm">
                  <Plus className="size-5" strokeWidth={2.75} />
                </span>
                <span className="text-center text-[11px] font-semibold leading-tight text-gray-900">
                  Create story
                </span>
              </div>
            </button>
          ) : null}

          {loading &&
            cards.length === 0 &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="h-[140px] w-[82px] shrink-0 animate-pulse rounded-[10px] bg-gray-200 sm:h-[148px] sm:w-[86px]"
              />
            ))}

          {cards.map((story) => {
            const name = displayName(story);
            const seed = story.user_name || story.user_id || String(story.id);
            const hue = avatarHue(seed);
            const isViewed = viewed.has(story.id);
            const cover =
              story.cover_url ||
              story.thumbnail_url ||
              (story.media_type === "video" ? story.thumbnail_url : story.media_url) ||
              story.media_url;
            const place =
              [story.property_locality || story.location, story.property_city]
                .filter(Boolean)
                .join(", ") || "";

            return (
              <button
                key={story.id}
                type="button"
                onClick={() => handleOpen(story)}
                className="relative h-[140px] w-[82px] shrink-0 overflow-hidden rounded-[10px] bg-gray-800 text-left sm:h-[148px] sm:w-[86px]"
                style={{ scrollSnapAlign: "start" }}
              >
                <img
                  src={cover || undefined}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/25" />

                {/* Avatar — top-left, ring only on avatar */}
                <span
                  className={cn(
                    "absolute left-1.5 top-1.5 flex size-7 items-center justify-center rounded-full p-[2px]",
                    isViewed ? "bg-gray-400" : ""
                  )}
                  style={
                    isViewed
                      ? undefined
                      : {
                          background: `linear-gradient(135deg, #f97316, #ec4899, #0ea5e9)`,
                        }
                  }
                >
                  <span
                    className="flex size-full items-center justify-center rounded-full text-[9px] font-bold text-white ring-1 ring-black/20"
                    style={{ backgroundColor: `hsl(${hue} 50% 38%)` }}
                    title={name}
                  >
                    {initials(name)}
                  </span>
                </span>

                {story.is_hot ? (
                  <span className="absolute right-1.5 top-1.5 rounded bg-rose-600 px-1 py-px text-[8px] font-bold uppercase tracking-wide text-white shadow-sm">
                    Hot
                  </span>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 px-1.5 pb-1.5 pt-6">
                  <p className="truncate text-[11px] font-bold leading-tight text-white drop-shadow">
                    {name}
                  </p>
                  {place ? (
                    <p className="truncate text-[9px] font-medium leading-tight text-white/90 drop-shadow">
                      {place}
                    </p>
                  ) : story.caption ? (
                    <p className="truncate text-[9px] font-medium leading-tight text-white/90 drop-shadow">
                      {story.caption}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default StoriesRail;
