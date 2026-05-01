export const CATEGORIES = [
  "Team Meeting",
  "Client Call",
  "1-on-1",
  "Brainstorm",
  "Review",
  "Interview",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_STYLES: Record<Category, { bg: string; text: string; ring: string }> = {
  "Team Meeting": {
    bg: "bg-[oklch(var(--cat-team)/0.15)]",
    text: "text-[var(--cat-team)]",
    ring: "ring-[oklch(var(--cat-team)/0.3)]",
  },
  "Client Call": {
    bg: "bg-[oklch(var(--cat-client)/0.18)]",
    text: "text-[var(--cat-client)]",
    ring: "ring-[oklch(var(--cat-client)/0.35)]",
  },
  "1-on-1": {
    bg: "bg-[oklch(var(--cat-oneonone)/0.15)]",
    text: "text-[var(--cat-oneonone)]",
    ring: "ring-[oklch(var(--cat-oneonone)/0.3)]",
  },
  Brainstorm: {
    bg: "bg-[oklch(var(--cat-brainstorm)/0.18)]",
    text: "text-[var(--cat-brainstorm)]",
    ring: "ring-[oklch(var(--cat-brainstorm)/0.35)]",
  },
  Review: {
    bg: "bg-[oklch(var(--cat-review)/0.18)]",
    text: "text-[var(--cat-review)]",
    ring: "ring-[oklch(var(--cat-review)/0.35)]",
  },
  Interview: {
    bg: "bg-[oklch(var(--cat-interview)/0.16)]",
    text: "text-[var(--cat-interview)]",
    ring: "ring-[oklch(var(--cat-interview)/0.32)]",
  },
  Other: {
    bg: "bg-[oklch(var(--cat-other)/0.18)]",
    text: "text-[var(--cat-other)]",
    ring: "ring-[oklch(var(--cat-other)/0.32)]",
  },
};

export const USERNAME_KEY = "minutely_username";
export const THEME_KEY = "minutely_theme";
export const FILTER_KEY = "minutely_last_filter";

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// Block editor types
export type BlockType =
  | "paragraph"
  | "heading2"
  | "heading3"
  | "bullet"
  | "numbered"
  | "todo"
  | "divider";

export interface Block {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
}

export function newBlock(type: BlockType = "paragraph", text = ""): Block {
  return {
    id: Math.random().toString(36).slice(2, 11),
    type,
    text,
    ...(type === "todo" ? { checked: false } : {}),
  };
}

export function previewFromBlocks(blocks: Block[] | null | undefined): string {
  if (!blocks || blocks.length === 0) return "";
  for (const b of blocks) {
    if (b.type === "divider") continue;
    const t = (b.text || "").trim();
    if (t) return t;
  }
  return "";
}
