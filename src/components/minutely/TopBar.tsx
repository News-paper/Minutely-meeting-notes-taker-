import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { getInitials } from "@/lib/minutely";
import { useTheme } from "./ThemeProvider";

interface Props {
  username: string;
  onSignOut: () => void;
  right?: React.ReactNode;
}

export function TopBar({ username, onSignOut, right }: Props) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-base font-semibold">M</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Minutely</span>
        </Link>
        <div className="flex items-center gap-3">
          {right}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-secondary"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {getInitials(username)}
            </div>
            <div className="hidden sm:flex sm:flex-col sm:leading-tight">
              <span className="text-sm font-medium text-foreground">Hi, {username}</span>
              <button
                onClick={onSignOut}
                className="text-left text-xs text-muted-foreground transition hover:text-primary"
              >
                Not you?
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}