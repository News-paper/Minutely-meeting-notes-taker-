import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Type,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Minus,
} from "lucide-react";
import { newBlock, type Block, type BlockType } from "@/lib/minutely";
import { cn } from "@/lib/utils";

interface Props {
  value: Block[];
  onChange: (next: Block[]) => void;
}

const SLASH_OPTIONS: {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { type: "heading2", label: "Heading 2", description: "Large section heading", icon: Heading2 },
  { type: "heading3", label: "Heading 3", description: "Medium section heading", icon: Heading3 },
  { type: "bullet", label: "Bullet list", description: "Simple bulleted list", icon: List },
  {
    type: "numbered",
    label: "Numbered list",
    description: "Ordered numbered list",
    icon: ListOrdered,
  },
  { type: "todo", label: "To-do", description: "Track tasks with checkboxes", icon: CheckSquare },
  { type: "divider", label: "Divider", description: "Visual section separator", icon: Minus },
  { type: "paragraph", label: "Paragraph", description: "Plain text paragraph", icon: Type },
];

function placeholderFor(t: BlockType): string {
  switch (t) {
    case "heading2":
      return "Heading 2";
    case "heading3":
      return "Heading 3";
    case "bullet":
    case "numbered":
      return "List item";
    case "todo":
      return "To-do";
    default:
      return "Type '/' for commands…";
  }
}

function classFor(t: BlockType): string {
  switch (t) {
    case "heading2":
      return "text-2xl font-bold tracking-tight leading-snug";
    case "heading3":
      return "text-lg font-semibold tracking-tight leading-snug";
    default:
      return "text-base leading-relaxed";
  }
}

export function BlockEditor({ value, onChange }: Props) {
  // slashFor: block id of the block showing the slash menu, or null
  const [slashFor, setSlashFor] = useState<string | null>(null);
  // slashQuery: text typed after "/" to filter the menu
  const [slashQuery, setSlashQuery] = useState("");
  // which option is currently highlighted in the menu
  const [menuIndex, setMenuIndex] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);

  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const focusNext = useRef<string | null>(null);

  // Ensure at least one block
  useEffect(() => {
    if (value.length === 0) onChange([newBlock()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focusNext.current) {
      const el = refs.current[focusNext.current];
      el?.focus();
      focusNext.current = null;
    }
  });

  const updateBlock = (id: string, patch: Partial<Block>) => {
    onChange(value.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const insertAfter = (id: string, type: BlockType = "paragraph") => {
    const idx = value.findIndex((b) => b.id === id);
    const nb = newBlock(type);
    const next = [...value];
    next.splice(idx + 1, 0, nb);
    onChange(next);
    focusNext.current = nb.id;
  };

  const removeBlock = (id: string) => {
    if (value.length <= 1) {
      onChange([newBlock()]);
      return;
    }
    const idx = value.findIndex((b) => b.id === id);
    const next = value.filter((b) => b.id !== id);
    onChange(next);
    const focusTarget = next[Math.max(0, idx - 1)];
    if (focusTarget) focusNext.current = focusTarget.id;
  };

  const applySlashOption = (blockId: string, optType: BlockType) => {
    const block = value.find((b) => b.id === blockId);
    if (!block) return;
    // Strip the slash and any query text typed after it
    const slashIndex = block.text.lastIndexOf("/");
    const strippedText = slashIndex >= 0 ? block.text.slice(0, slashIndex).trimEnd() : block.text;

    if (optType === "divider") {
      updateBlock(blockId, { type: "divider", text: "" });
      // Insert a paragraph after divider so user can keep typing
      setTimeout(() => insertAfter(blockId, "paragraph"), 0);
    } else {
      updateBlock(blockId, { type: optType, text: strippedText });
      focusNext.current = blockId;
    }
    setSlashFor(null);
    setSlashQuery("");
    setMenuIndex(0);
  };

  const filteredOptions = slashQuery
    ? SLASH_OPTIONS.filter(
        (o) =>
          o.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
          o.description.toLowerCase().includes(slashQuery.toLowerCase()),
      )
    : SLASH_OPTIONS;

  let numberedIdx = 0;

  return (
    <div className="space-y-0.5">
      {value.map((b) => {
        if (b.type === "numbered") numberedIdx += 1;
        else numberedIdx = 0;
        const showPlus = hovered === b.id;
        const isSlash = slashFor === b.id;

        if (b.type === "divider") {
          return (
            <div
              key={b.id}
              className="group relative py-3"
              onMouseEnter={() => setHovered(b.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="absolute -left-8 top-1/2 -translate-y-1/2">
                {showPlus && (
                  <button
                    onClick={() => insertAfter(b.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-secondary"
                    aria-label="Add block"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              <hr className="border-border" />
              <button
                onClick={() => removeBlock(b.id)}
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-secondary"
              >
                Remove
              </button>
            </div>
          );
        }

        return (
          <div
            key={b.id}
            className={cn(
              "group relative flex items-start gap-2",
              b.type === "heading2" && "mt-5 mb-1",
              b.type === "heading3" && "mt-3 mb-0.5",
            )}
            onMouseEnter={() => setHovered(b.id)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Add block (+) button */}
            <div className="absolute -left-8 top-1.5">
              {showPlus && (
                <button
                  onClick={() => insertAfter(b.id)}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-secondary"
                  aria-label="Add block"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Bullet point */}
            {b.type === "bullet" && (
              <span className="mt-2.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/60" />
            )}

            {/* Numbered list index */}
            {b.type === "numbered" && (
              <span className="mt-1.5 w-5 shrink-0 select-none text-sm font-medium text-foreground/60">
                {numberedIdx}.
              </span>
            )}

            {/* To-do checkbox */}
            {b.type === "todo" && (
              <input
                type="checkbox"
                checked={!!b.checked}
                onChange={(e) => updateBlock(b.id, { checked: e.target.checked })}
                className="mt-2 h-4 w-4 shrink-0 cursor-pointer rounded accent-primary"
              />
            )}

            {/* Text area + slash menu */}
            <div className="relative flex-1">
              <textarea
                ref={(el) => {
                  refs.current[b.id] = el;
                }}
                rows={1}
                value={b.text}
                placeholder={placeholderFor(b.type)}
                onChange={(e) => {
                  const v = e.target.value;
                  updateBlock(b.id, { text: v });

                  // Slash command detection: look for a "/" that starts at
                  // the beginning OR is preceded by whitespace
                  const slashIdx = v.lastIndexOf("/");
                  if (slashIdx !== -1) {
                    const before = v.slice(0, slashIdx);
                    const isValidTrigger = before === "" || before.endsWith(" ") || before.endsWith("\n");
                    if (isValidTrigger) {
                      const query = v.slice(slashIdx + 1);
                      // Only keep showing menu if query has no spaces (i.e. still in "command" mode)
                      if (!query.includes(" ")) {
                        setSlashFor(b.id);
                        setSlashQuery(query);
                        setMenuIndex(0);
                      } else {
                        setSlashFor(null);
                        setSlashQuery("");
                      }
                    } else {
                      setSlashFor(null);
                      setSlashQuery("");
                    }
                  } else {
                    if (slashFor === b.id) {
                      setSlashFor(null);
                      setSlashQuery("");
                    }
                  }

                  // Auto-resize textarea height
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                  // Navigate slash menu with arrow keys
                  if (isSlash && filteredOptions.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setMenuIndex((i) => (i + 1) % filteredOptions.length);
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setMenuIndex((i) => (i - 1 + filteredOptions.length) % filteredOptions.length);
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applySlashOption(b.id, filteredOptions[menuIndex].type);
                      return;
                    }
                  }

                  if (e.key === "Escape") {
                    setSlashFor(null);
                    setSlashQuery("");
                    return;
                  }

                  if (e.key === "Enter" && !e.shiftKey && !isSlash) {
                    e.preventDefault();
                    insertAfter(
                      b.id,
                      b.type === "heading2" || b.type === "heading3" ? "paragraph" : b.type,
                    );
                  } else if (e.key === "Backspace" && b.text === "") {
                    e.preventDefault();
                    removeBlock(b.id);
                  }
                }}
                className={cn(
                  "w-full resize-none border-0 bg-transparent outline-none placeholder:text-muted-foreground/50",
                  classFor(b.type),
                  b.type === "todo" && b.checked && "text-muted-foreground line-through",
                )}
              />

              {/* Slash command menu */}
              {isSlash && filteredOptions.length > 0 && (
                <div className="absolute left-0 top-full z-30 mt-1.5 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-xl ring-1 ring-black/5">
                  <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    Insert block
                  </div>
                  <div className="pb-1">
                    {filteredOptions.map((opt, idx) => {
                      const Icon = opt.icon;
                      const isActive = idx === menuIndex;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onMouseEnter={() => setMenuIndex(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applySlashOption(b.id, opt.type);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-accent/20 text-foreground"
                              : "text-foreground hover:bg-secondary",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                              isActive
                                ? "border-accent bg-accent/20 text-accent-foreground"
                                : "border-border bg-background text-muted-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex flex-col items-start">
                            <span className="font-medium">{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
