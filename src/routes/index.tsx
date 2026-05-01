import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { UsernameGate } from "@/components/minutely/UsernameGate";
import { TopBar } from "@/components/minutely/TopBar";
import { CategoryPill } from "@/components/minutely/CategoryPill";
import { NewMeetingDialog } from "@/components/minutely/NewMeetingDialog";
import { ConfirmDeleteDialog } from "@/components/minutely/ConfirmDeleteDialog";
import { toast } from "sonner";
import {
  CATEGORIES,
  FILTER_KEY,
  formatDate,
  previewFromBlocks,
  type Block,
  type Category,
} from "@/lib/minutely";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

interface MeetingRow {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  category: string;
  username: string;
  created_at: string;
  minutes?: { content: Block[] | null }[] | null;
}

type Filter = "All" | Category;

function Dashboard({ username, signOut }: { username: string; signOut: () => void }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [meetings, setMeetings] = useState<MeetingRow[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("meetings").delete().eq("id", deleteId);
    setDeleting(false);
    if (error) {
      console.error("Supabase delete error [meetings]:", error);
      toast.error("Could not delete meeting");
      setDeleteId(null);
      return;
    }
    toast.success("Meeting deleted");
    setMeetings((prev) => prev?.filter((m) => m.id !== deleteId) ?? []);
    setDeleteId(null);
  };

  useEffect(() => {
    const f = localStorage.getItem(FILTER_KEY) as Filter | null;
    if (f) setFilter(f);
  }, []);

  useEffect(() => {
    localStorage.setItem(FILTER_KEY, filter);
  }, [filter]);

  const load = async () => {
    const minutelyUsername = localStorage.getItem("minutely_username");

    let query = supabase
      .from("meetings")
      .select("id,title,description,meeting_date,category,username,created_at, minutes(content)")
      .order("meeting_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (minutelyUsername) {
      query = query.eq("username", minutelyUsername);
    }

    const { data } = await query;
    setMeetings((data as MeetingRow[] | null) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const visible = meetings?.filter((m) => filter === "All" || m.category === filter) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        username={username}
        onSignOut={signOut}
        right={
          <button
            onClick={() => setShowNew(true)}
            className="hidden items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            New meeting
          </button>
        }
      />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Meetings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything documented under{" "}
              <span className="font-medium text-foreground">{username}</span>.
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 sm:hidden"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>

        {/* Filter pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          {(["All", ...CATEGORIES] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                filter === f
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Cards */}
        {visible === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {filter === "All" ? "No meetings yet" : `No ${filter} meetings`}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "All"
                ? "Create your first one to start documenting."
                : "Try another filter or create a new meeting."}
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              New meeting
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((m) => {
              const preview = previewFromBlocks(m.minutes?.[0]?.content ?? []);
              return (
                <Link
                  key={m.id}
                  to="/meeting/$id"
                  params={{ id: m.id }}
                  className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-accent/60 hover:shadow-sm"
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteId(m.id);
                    }}
                    className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-destructive group-hover:opacity-100"
                    aria-label="Delete meeting"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="mb-3 flex items-start justify-between gap-2 pr-6">
                    <CategoryPill category={m.category} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(m.meeting_date)}
                    </span>
                  </div>
                  <h3 className="line-clamp-2 text-base font-semibold text-foreground transition group-hover:text-primary">
                    {m.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                    {preview || m.description || "No notes yet."}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>by {m.username}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <NewMeetingDialog
        username={username}
        open={showNew}
        onClose={() => {
          setShowNew(false);
        }}
      />
      <ConfirmDeleteDialog
        open={!!deleteId}
        deleting={deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function Index() {
  return <UsernameGate>{(name, out) => <Dashboard username={name} signOut={out} />}</UsernameGate>;
}
