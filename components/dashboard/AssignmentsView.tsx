"use client";

import { useRef, useState } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { assignments } from "@/lib/lms";

type UploadItem = { id: string; name: string; size: string };

export function AssignmentsView() {
  const [activeId, setActiveId] = useState(assignments[0]?.id ?? "");
  const [uploads, setUploads] = useState<Record<string, UploadItem[]>>({});
  const [dragging, setDragging] = useState(false);
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const assignment =
    assignments.find((item) => item.id === activeId) ?? assignments[0];
  const files = uploads[activeId] ?? [];

  if (!assignment) {
    return null;
  }

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next = Array.from(list).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`,
    }));
    setUploads((current) => ({
      ...current,
      [activeId]: [...(current[activeId] ?? []), ...next],
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <aside className="space-y-2">
        <p className="kicker mb-4">تسليمات عملية</p>
        {assignments.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              className={`w-full border px-4 py-4 text-start ${
                active
                  ? "border-gold bg-gold/15"
                  : "border-white/10 bg-white/5 hover:border-gold/40"
              }`}
            >
              <span className="block text-xl font-bold">{item.title}</span>
              <span className="mt-1 block text-sm font-medium text-slate-400">
                {item.due}
              </span>
            </button>
          );
        })}
      </aside>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
        <p className="kicker">التسليم</p>
        <h2 className="font-display text-blend mt-3 text-3xl font-bold leading-snug sm:text-4xl">
          {assignment.title}
        </h2>
        <p className="mt-2 text-sm font-medium text-gold">
          {assignment.due}
        </p>
        <p className="mt-5 max-w-2xl text-base font-normal leading-loose text-slate-400">
          {assignment.brief}
        </p>
        <ul className="mt-5 space-y-2 text-sm font-normal leading-loose text-slate-400">
          {assignment.criteria.map((line) => (
            <li key={line} className="flex gap-3">
              <span className="text-gold">▸</span>
              {line}
            </li>
          ))}
        </ul>

        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={`mt-8 border border-dashed px-6 py-12 text-center transition-colors ${
            dragging
              ? "border-gold bg-gold/10"
              : "border-white/20 bg-background/30"
          }`}
        >
          <p className="text-2xl font-bold leading-snug text-slate-50">اسحب الشغل وسيبه هنا</p>
          <p className="mt-2 text-sm font-normal text-slate-400">
            PDF أو شرائح أو مستند · لحد ٣ ملفات للموجز ده
          </p>
          <PremiumButton
            variant="glass"
            className="mt-6"
            onClick={() => inputRef.current?.click()}
          >
            اختار ملفات
          </PremiumButton>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.dng,.cr2,.nef,.arw"
            multiple
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        {files.length > 0 ? (
          <ul className="mt-5 space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between border border-white/10 bg-background/40 px-4 py-3 text-sm"
              >
                <span>
                  {file.name}
                  <span className="ms-3 text-xs font-medium text-slate-400">
                    {file.size}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setUploads((current) => ({
                      ...current,
                      [activeId]: (current[activeId] ?? []).filter(
                        (item) => item.id !== file.id,
                      ),
                    }))
                  }
                  className="text-xs font-medium text-slate-400 hover:text-gold"
                >
                  شيل
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <PremiumButton
          className="mt-8"
          disabled={files.length === 0 || submitted[activeId]}
          onClick={() =>
            setSubmitted((current) => ({ ...current, [activeId]: true }))
          }
        >
          {submitted[activeId] ? "اتسلم للنقد" : "سلّم الشغل"}
        </PremiumButton>
      </section>
    </div>
  );
}
