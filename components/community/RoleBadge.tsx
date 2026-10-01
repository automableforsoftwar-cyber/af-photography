type RoleBadgeProps = {
  title: string | null | undefined;
  className?: string;
};

export function RoleBadge({ title, className = "" }: RoleBadgeProps) {
  const clean = title?.trim() || "";
  if (!clean) return null;

  const isInstructor = clean === "المدرب";
  const isOrganizer = clean === "المنظم";
  if (!isInstructor && !isOrganizer) return null;

  const styles = isInstructor
    ? "border-yellow-400/60 bg-yellow-400 text-[#050505] shadow-[0_0_18px_rgba(251,191,36,0.35)]"
    : "border-sky-400/50 bg-sky-500 text-white shadow-[0_0_18px_rgba(56,189,248,0.3)]";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.7rem] font-bold leading-none ${styles} ${className}`}
    >
      {clean}
    </span>
  );
}
