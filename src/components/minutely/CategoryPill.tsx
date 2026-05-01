import { CATEGORY_STYLES, type Category } from "@/lib/minutely";
import { cn } from "@/lib/utils";

interface Props {
  category: Category | string;
  className?: string;
  size?: "sm" | "md";
}

export function CategoryPill({ category, className, size = "sm" }: Props) {
  const style = CATEGORY_STYLES[category as Category] ?? CATEGORY_STYLES.Other;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium ring-1",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        style.bg,
        style.text,
        style.ring,
        className,
      )}
    >
      {category}
    </span>
  );
}
