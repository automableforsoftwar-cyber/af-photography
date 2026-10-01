import { badgeTone } from "@/lib/roles";

type RoleBadgeProps = {
  title: string | null | undefined;
  className?: string;
};

export function RoleBadge({ title, className = "" }: RoleBadgeProps) {
  const tone = badgeTone(title);
  if (!tone || !title) return null;

  const styles =
    tone === "gold"
      ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-300"
      : "border-sky-400/45 bg-sky-400/15 text-sky-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold leading-none ${styles} ${className}`}
    >
      {title}
    </span>
  );
}
