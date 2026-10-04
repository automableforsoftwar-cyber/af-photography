"use client";

import { useCallback, useEffect, useState } from "react";
import {
  competitionPhase,
  fetchCompetitionsForCourse,
  syncAllCompetitionAnnouncements,
  upsertCompetition,
  type Competition,
} from "@/lib/competitions";
import { modules } from "@/lib/content";

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type CompetitionAdminPanelProps = {
  courseId: string;
};

export function CompetitionAdminPanel({ courseId }: CompetitionAdminPanelProps) {
  const courseTitle =
    modules.find((m) => m.id === courseId)?.title ?? courseId;
  const [list, setList] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | undefined>();
  const [title, setTitle] = useState("مسابقة التصوير");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [maxVotes, setMaxVotes] = useState(3);

  const load = useCallback(async () => {
    setLoading(true);
    await syncAllCompetitionAnnouncements();
    const rows = await fetchCompetitionsForCourse(courseId);
    setList(rows);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const fillForm = (c?: Competition) => {
    if (!c) {
      setEditId(undefined);
      setTitle(`مسابقة · ${courseTitle}`);
      const now = new Date();
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setStartsAt(toLocalInputValue(now.toISOString()));
      setEndsAt(toLocalInputValue(end.toISOString()));
      setMaxVotes(3);
      return;
    }
    setEditId(c.id);
    setTitle(c.title);
    setStartsAt(toLocalInputValue(c.starts_at));
    setEndsAt(toLocalInputValue(c.ends_at));
    setMaxVotes(c.max_votes_per_user);
  };

  useEffect(() => {
    setEditId(undefined);
    setTitle(`مسابقة · ${courseTitle}`);
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setStartsAt(toLocalInputValue(now.toISOString()));
    setEndsAt(toLocalInputValue(end.toISOString()));
    setMaxVotes(3);
  }, [courseId, courseTitle]);

  const save = async () => {
    setSaving(true);
    setNotice(null);
    const result = await upsertCompetition({
      id: editId,
      courseId,
      title,
      startsAt,
      endsAt,
      maxVotesPerUser: maxVotes,
    });
    setSaving(false);
    if (!result.ok) {
      const map: Record<string, string> = {
        invalid_dates: "تأكد من تاريخ البداية والنهاية.",
        end_before_start: "تاريخ النهاية لازم يكون بعد البداية.",
        save_failed: "مقدرناش نحفظ المسابقة. جرّب تاني.",
        login_required: "سجّل دخول كإدارة الأول.",
      };
      setNotice(map[result.message] ?? "حصل خطأ.");
      return;
    }
    setNotice(
      editId
        ? "تم تحديث إعدادات المسابقة."
        : "تم إنشاء المسابقة — لو بدأت دلوقتي هيتبعت إعلان على #الرسائل.",
    );
    fillForm(undefined);
    await load();
  };

  const phaseLabel = (c: Competition) => {
    const p = competitionPhase(c);
    if (p === "active") return "جارية";
    if (p === "upcoming") return "قادمة";
    return "منتهية";
  };

  return (
    <div className="space-y-8 text-right">
      <header>
        <p className="text-xs font-medium text-yellow-400">المسابقات</p>
        <h2 className="mt-1 font-display text-xl font-bold text-white">
          إدارة المسابقة · {courseTitle}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          حدّد وقت البداية/النهاية والحد الأقصى للتصويت لكل عضو. النظام يعلن
          تلقائياً على قناة #الرسائل عند البداية والنهاية.
        </p>
      </header>

      {notice ? (
        <p className="rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300">
          {notice}
        </p>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-white">
          {editId ? "تعديل مسابقة" : "مسابقة جديدة"}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-slate-400 sm:col-span-2">
            عنوان المسابقة
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-yellow-400/40"
            />
          </label>
          <label className="block text-sm text-slate-400">
            تاريخ ووقت البداية
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-yellow-400/40"
            />
          </label>
          <label className="block text-sm text-slate-400">
            تاريخ ووقت النهاية
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-yellow-400/40"
            />
          </label>
          <label className="block text-sm text-slate-400">
            أقصى عدد أصوات لكل مستخدم
            <input
              type="number"
              min={1}
              max={50}
              value={maxVotes}
              onChange={(e) => setMaxVotes(Number(e.target.value) || 1)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-yellow-400/40"
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-[#050505] disabled:opacity-40"
          >
            {saving ? "بنحفظ…" : editId ? "تحديث المسابقة" : "حفظ المسابقة"}
          </button>
          {editId ? (
            <button
              type="button"
              onClick={() => fillForm(undefined)}
              className="rounded-full border border-white/15 px-4 py-2.5 text-sm text-slate-300"
            >
              إلغاء التعديل
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-white">المسابقات المسجّلة</h3>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">بنحمّل…</p>
        ) : list.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">لسه مفيش مسابقات للكورس ده.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {list.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              >
                <div className="min-w-0 text-right">
                  <p className="font-medium text-white">{c.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(c.starts_at).toLocaleString("ar-EG")} →{" "}
                    {new Date(c.ends_at).toLocaleString("ar-EG")} · حد الأصوات:{" "}
                    {c.max_votes_per_user}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.65rem] font-medium ${
                      competitionPhase(c) === "active"
                        ? "bg-yellow-400/15 text-yellow-400"
                        : competitionPhase(c) === "upcoming"
                          ? "bg-white/10 text-slate-300"
                          : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {phaseLabel(c)}
                  </span>
                  <button
                    type="button"
                    onClick={() => fillForm(c)}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:border-yellow-400/40 hover:text-yellow-400"
                  >
                    تعديل
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
