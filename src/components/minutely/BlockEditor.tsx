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
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { type: "paragraph", label: "Paragraph", icon: Type },
  { type: "heading2", label: "Heading 2", icon: Heading2 },
  { type: "heading3", label: "Heading 3", icon: Heading3 },
  { type: "bullet", label: "Bullet list", icon: List },
  { type: "numbered", label: "Numbered list", icon: ListOrdered },
  { type: "todo", label: "To-do", icon: CheckSquare },
  { type: "divider", label: "Divider", icon: Minus },
];

function placeholderFor(t: BlockType): string {
  switch (t) {
    case "heading2":
      return "Heading 2";
    case "heading3":
      return "Heading 3";
    case "bullet":
      return "List item";
    case "numbered":
      return "List item";
    case "todo":
      return "To-do";
    default:
      return "Type / for commands";
  }
}

function classFor(t: BlockType): string {
  switch (t) {
    case "heading2":
      return "text-2xl font-semibold tracking-tight";
    case "heading3":
      return "text-xl font-semibold tracking-tight";
    default:
      return "text-base";
  }
}

export function BlockEditor({ value, onChange }: Props) {
  const [slashFor, setSlashFor] = useState<string | null>(null);
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

  const changeType = (id: string, type: BlockType) => {
    if (type === "divider") {
      updateBlock(id, { type, text: "" });
      // also create a paragraph after divider for continued editing
      insertAfter(id, "paragraph");
    } else {
      updateBlock(id, {
        type,
        text:
          type === "todo"
            ? (value.find((b) => b.id === id)?.text ?? "")
            : (value.find((b) => b.id === id)?.text ?? ""),
      });
    }
    setSlashFor(null);
  };

  let numberedIdx = 0;

  return (
    <div className="space-y-1">
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
            className="group relative flex items-start gap-2"
            onMouseEnter={() => setHovered(b.id)}
            onMouseLeave={() => setHovered(null)}
          >
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

            {b.type === "bullet" && (
              <span className="mt-2.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/70" />
            )}
            {b.type === "numbered" && (
              <span className="mt-1 w-5 shrink-0 select-none text-sm text-foreground/70">
                {numberedIdx}.
              </span>
            )}
            {b.type === "todo" && (
              <input
                type="checkbox"
                checked={!!b.checked}
                onChange={(e) => updateBlock(b.id, { checked: e.target.checked })}
                className="mt-2 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-accent)]"
              />
            )}

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
                  if (v.endsWith("/") && (v === "/" || v.endsWith(" /"))) {
                    setSlashFor(b.id);
                  } else if (slashFor === b.id && !v.endsWith("/")) {
                    setSlashFor(null);
                  }
                  // auto-resize
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    setSlashFor(null);
                    insertAfter(
                      b.id,
                      b.type === "heading2" || b.type === "heading3" ? "paragraph" : b.type,
                    );
                  } else if (e.key === "Backspace" && b.text === "") {
                    e.preventDefault();
                    removeBlock(b.id);
                  } else if (e.key === "Escape") {
                    setSlashFor(null);
                  }
                }}
                className={cn(
                  "w-full resize-none border-0 bg-transparent leading-relaxed outline-none placeholder:text-muted-foreground/60",
                  classFor(b.type),
                  b.type === "todo" && b.checked && "text-muted-foreground line-through",
                )}
              />
              {isSlash && (
                <div className="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Insert block
                  </div>
                  {SLASH_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          // strip trailing slash
                          const stripped = b.text.replace(/\/+\s*$/, "").trimEnd();
                          updateBlock(b.id, { text: stripped, type: opt.type });
                          setSlashFor(null);
                          if (opt.type === "divider") {
                            insertAfter(b.id, "paragraph");
                          } else {
                            focusNext.current = b.id;
                          }
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground transition hover:bg-secondary"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
