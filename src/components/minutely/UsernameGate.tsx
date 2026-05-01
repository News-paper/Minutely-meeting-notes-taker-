import { useEffect, useState } from "react";
import { USERNAME_KEY } from "@/lib/minutely";

interface Props {
  children: (username: string, signOut: () => void) => React.ReactNode;
}

export function UsernameGate({ children }: Props) {
  const [username, setUsername] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(USERNAME_KEY);
    if (stored) setUsername(stored);
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!username) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <span className="text-2xl font-semibold">M</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Minutely</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your meeting minutes, organised.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = input.trim();
              if (!v) return;
              localStorage.setItem(USERNAME_KEY, v);
              setUsername(v);
            }}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Enter your name to get started
              </span>
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Arjun"
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {children(username, () => {
        localStorage.removeItem(USERNAME_KEY);
        setUsername(null);
      })}
    </>
  );
}