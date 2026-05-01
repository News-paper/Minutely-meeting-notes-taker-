import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { UsernameGate } from "@/components/minutely/UsernameGate";
import { TopBar } from "@/components/minutely/TopBar";
import { CategoryPill } from "@/components/minutely/CategoryPill";
import { BlockEditor } from "@/components/minutely/BlockEditor";
import { ConfirmDeleteDialog } from "@/components/minutely/ConfirmDeleteDialog";
import {
  CATEGORIES,
  formatDate,
  formatTime,
  newBlock,
  type Block,
} from "@/lib/minutely";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/meeting/$id")({
  component: MeetingPage,
});

interface MeetingRow {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  category: string;
  username: string;
}

interface InsightRow {
  id: string;
  username: string;
  content: string;
  created_at: string;
}

function MeetingPage() {
  return (
    <UsernameGate>
      {(name, signOut) => <MeetingInner username={name} signOut={signOut} />}
    </UsernameGate>
  );
}

type SaveState = "idle" | "saving" | "saved";

function MeetingInner({ username, signOut }: { username: string; signOut: () => void }) {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<MeetingRow | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [insights, setInsights] = useState<InsightRow[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const initialLoad = useRef(true);
  const saveTimer = useRef<number | null>(null);

  // Load
  useEffect(() => {
    (async () => {
      const { data: m } = await supabase
        .from("meetings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!m) {
        setNotFound(true);
        return;
      }
      setMeeting(m as MeetingRow);

      const { data: min } = await supabase
        .from("minutes")
        .select("content")
        .eq("meeting_id", id)
        .maybeSingle();
      const loaded = (min?.content as Block[] | undefined) ?? [];
      setBlocks(loaded.length > 0 ? loaded : [newBlock()]);

      const { data: ins } = await supabase
        .from("insights")
        .select("*")
        .eq("meeting_id", id)
        .order("created_at", { ascending: true });
      setInsights((ins as InsightRow[] | null) ?? []);

      // allow auto-save effect to engage after first paint
      setTimeout(() => {
        initialLoad.current = false;
      }, 100);
    })();
  }, [id]);

  // Debounced auto-save of minutes
  useEffect(() => {
    if (initialLoad.current) return;
    setSaveState("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from("minutes")
        .upsert(
          [
            {
              meeting_id: id,
              content: blocks as unknown as never,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "meeting_id" }
        )
        .select();
      
      console.log("Supabase minutes upsert - data:", data, "error:", error);
      
      if (error) {
        toast.error("Could not save minutes");
        setSaveState("idle");
      } else {
        setSaveState("saved");
      }
    }, 2000);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [blocks, id]);

  const handleDelete = async () => {
    if (!meeting) return;
    setDeleting(true);
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    setDeleting(false);
    if (error) {
      console.error("Supabase delete error [meetings]:", error);
      toast.error("Could not delete meeting");
      setDeleteConfirm(false);
      return;
    }
    toast.success("Meeting deleted");
    navigate({ to: "/" });
  };

  const updateMeeting = async (patch: Partial<MeetingRow>) => {
    if (!meeting) return;
    setMeeting({ ...meeting, ...patch });
    const { data, error } = await supabase.from("meetings").update(patch).eq("id", id).select();
    console.log("Supabase meeting update - data:", data, "error:", error);
    if (error) toast.error("Could not save changes");
  };

  const addInsight = async () => {
    const minutelyUsername = localStorage.getItem("minutely_username") || username;
    const { data, error } = await supabase
      .from("insights")
      .insert({ meeting_id: id, username: minutelyUsername, content: "" })
      .select("*")
      .single();
    
    console.log("Supabase insights insert - data:", data, "error:", error);
    
    if (error || !data) {
      toast.error("Could not add insight");
      return;
    }
    setInsights((prev) => [...prev, data as InsightRow]);
  };

  const updateInsight = async (insightId: string, content: string) => {
    setInsights((prev) => prev.map((i) => (i.id === insightId ? { ...i, content } : i)));
    const { data, error } = await supabase.from("insights").update({ content }).eq("id", insightId).select();
    console.log("Supabase insights update - data:", data, "error:", error);
  };

  const removeInsight = async (insightId: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== insightId));
    const { data, error } = await supabase.from("insights").delete().eq("id", insightId).select();
    console.log("Supabase insights delete - data:", data, "error:", error);
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-foreground">Meeting not found.</p>
        <Link to="/" className="text-sm font-medium text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar username={username} onSignOut={signOut} />
        <div className="mx-auto max-w-3xl space-y-4 px-6 py-12">
          <div className="h-9 w-2/3 animate-pulse rounded bg-secondary" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
          <div className="h-64 animate-pulse rounded-xl bg-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        username={username}
        onSignOut={signOut}
        right={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveState === "saving" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </>
            ) : saveState === "saved" ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" /> Saved
              </>
            ) : null}
          </div>
        }
      />

      <main className="mx-auto max-w-3xl px-6 pb-32 pt-8 sm:pl-16">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </button>
          
          <button
            onClick={() => setDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          {editingTitle ? (
            <input
              autoFocus
              defaultValue={meeting.title}
              onBlur={(e) => {
                const v = e.target.value.trim() || meeting.title;
                setEditingTitle(false);
                if (v !== meeting.title) updateMeeting({ title: v });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingTitle(false);
              }}
              className="w-full border-0 bg-transparent text-4xl font-semibold tracking-tight text-foreground outline-none"
            />
          ) : (
            <h1
              onClick={() => setEditingTitle(true)}
              className="cursor-text text-4xl font-semibold tracking-tight text-foreground"
            >
              {meeting.title}
            </h1>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">{formatDate(meeting.meeting_date)}</span>
            <div className="relative">
              <button onClick={() => setShowCatMenu((s) => !s)}>
                <CategoryPill category={meeting.category} size="md" className="cursor-pointer" />
              </button>
              {showCatMenu && (
                <div className="absolute left-0 top-full z-10 mt-1.5 w-44 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setShowCatMenu(false);
                        if (c !== meeting.category) updateMeeting({ category: c });
                      }}
                      className="flex w-full items-center px-3 py-2 text-sm text-foreground transition hover:bg-secondary"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {editingDesc ? (
            <input
              autoFocus
              defaultValue={meeting.description ?? ""}
              placeholder="Add a short description"
              onBlur={(e) => {
                const v = e.target.value.trim();
                setEditingDesc(false);
                if ((v || null) !== (meeting.description ?? null))
                  updateMeeting({ description: v || null });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingDesc(false);
              }}
              className="mt-3 w-full border-0 bg-transparent text-sm text-muted-foreground outline-none"
            />
          ) : (
            <p
              onClick={() => setEditingDesc(true)}
              className="mt-3 cursor-text text-sm text-muted-foreground"
            >
              {meeting.description || "Add a short description…"}
            </p>
          )}
        </div>

        {/* Editor */}
        <section className="leading-relaxed">
          <BlockEditor value={blocks} onChange={setBlocks} />
        </section>

        {/* Insights */}
        <section className="mt-16 border-t border-border pt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Insights & Takeaways</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Short reflections from this meeting.
              </p>
            </div>
            <button
              onClick={addInsight}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-accent/60"
            >
              <Plus className="h-3.5 w-3.5" />
              Add insight
            </button>
          </div>

          {insights.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
              No insights yet. Capture a key takeaway.
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onChange={(c) => updateInsight(ins.id, c)}
                  onDelete={() => removeInsight(ins.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <ConfirmDeleteDialog
        open={deleteConfirm}
        deleting={deleting}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function InsightCard({
  insight,
  onChange,
  onDelete,
}: {
  insight: InsightRow;
  onChange: (c: string) => void;
  onDelete: () => void;
}) {
  const [val, setVal] = useState(insight.content);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (val === insight.content) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange(val), 600);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [val]);

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
      <div className="flex-1">
        <textarea
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          placeholder="Write a takeaway…"
          rows={1}
          className="w-full resize-none border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        <div className="mt-1.5 text-[11px] text-muted-foreground">
          {insight.username} · {formatTime(insight.created_at)}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="rounded-md p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-secondary hover:text-destructive"
        aria-label="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}