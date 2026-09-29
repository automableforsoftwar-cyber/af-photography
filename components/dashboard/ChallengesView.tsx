"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useMemo, useRef, useState, type DragEvent } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { challenge, leaderboard as seedBoard } from "@/lib/lms";

const ease = [0.22, 1, 0.36, 1] as const;

type GalleryEntry = {
  id: string;
  title: string;
  author: string;
  votes: number;
  image: string;
  voted?: boolean;
};

const seedGallery: GalleryEntry[] = [
  {
    id: "v1",
    title: "أول ضوء",
    author: "سارة حسن",
    votes: 24,
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=90",
  },
  {
    id: "v2",
    title: "استوديو",
    author: "محمود علي",
    votes: 19,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=90",
  },
  {
    id: "v3",
    title: "خط المدينة",
    author: "نورا عادل",
    votes: 17,
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=90",
  },
  {
    id: "v4",
    title: "بعد المطر",
    author: "كريم فؤاد",
    votes: 12,
    image:
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=900&q=90",
  },
];

const rankList = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const rankItem = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease },
  },
};

const galleryList = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const galleryItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease },
  },
};

export function ChallengesView() {
  const [entries, setEntries] = useState(seedGallery);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ranked = useMemo(() => {
    const fromVotes = [...entries].sort((a, b) => b.votes - a.votes);
    if (fromVotes.length >= 3) return fromVotes;
    return seedBoard.map((e, i) => ({
      id: `lb-${i}`,
      title: e.work,
      author: e.name,
      votes: e.votes,
      image: e.avatar || seedGallery[0].image,
    }));
  }, [entries]);

  const takeFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, "").slice(0, 40));
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    takeFile(event.dataTransfer.files?.[0]);
  };

  const publish = () => {
    if (!preview || !title.trim()) return;
    setEntries((prev) => [
      {
        id: `u-${Date.now()}`,
        title: title.trim(),
        author: "إنت",
        votes: 0,
        image: preview,
      },
      ...prev,
    ]);
    setTitle("");
    setPreview(null);
  };

  const upvote = (id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id && !e.voted
          ? { ...e, votes: e.votes + 1, voted: true }
          : e,
      ),
    );
  };

  return (
    <div
      dir="ltr"
      className="flex h-full min-h-0 flex-col gap-6 overflow-hidden lg:flex-row"
    >
      {/* Physical FAR LEFT — dir=ltr locks leaderboard to screen-left */}
      <aside className="order-2 h-fit w-full shrink-0 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl lg:order-1 lg:sticky lg:top-0 lg:w-64 xl:w-72">
        <div dir="rtl">
          <h3 className="font-display text-lg font-bold text-white">الترتيب</h3>
          <p className="mt-1 text-xs text-slate-500">حسب الأصوات</p>
          <motion.ol
            variants={rankList}
            initial="hidden"
            animate="show"
            className="mt-5 space-y-3"
          >
            {ranked.slice(0, 8).map((entry, index) => (
              <motion.li
                key={entry.id}
                variants={rankItem}
                className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0"
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    index < 3
                      ? "bg-yellow-400 text-[#050505]"
                      : "bg-white/10 text-slate-300"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 text-start">
                  <span className="block truncate text-sm font-medium text-white">
                    {entry.title}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {entry.author}
                  </span>
                </span>
                <span className="text-sm font-medium text-yellow-400">
                  {entry.votes}
                </span>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </aside>

      <div
        dir="rtl"
        className="order-1 flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto pe-1 lg:order-2"
      >
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6">
          <p className="text-xs font-medium text-yellow-400">{challenge.kicker}</p>
          <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
            {challenge.title}
          </h2>
          <p className="mt-2 text-sm text-slate-400">{challenge.brief}</p>

          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            onDrop={onDrop}
            className={`mt-5 rounded-2xl border border-dashed px-5 py-10 text-center transition-colors ${
              dragging
                ? "border-yellow-400 bg-yellow-400/10"
                : "border-white/20 bg-black/30"
            }`}
          >
            <p className="text-lg font-bold text-white">سيّب الصورة هنا</p>
            <p className="mt-1 text-sm text-slate-400">JPEG أو PNG · فريم واحد</p>
            <PremiumButton
              variant="glass"
              className="mt-5"
              onClick={() => inputRef.current?.click()}
            >
              اختار ملف
            </PremiumButton>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => takeFile(e.target.files?.[0])}
            />
            <div className="mx-auto mt-4 flex max-w-md flex-col gap-2 sm:flex-row">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الفريم"
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/40"
              />
              <PremiumButton
                disabled={!preview || !title.trim()}
                onClick={publish}
              >
                انشر
              </PremiumButton>
            </div>
            {preview ? (
              <div className="relative mx-auto mt-4 aspect-[16/10] w-full max-w-md overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
          </div>
        </section>

        <section>
          <h3 className="font-display text-xl font-bold text-white">
            صوّت للصور
          </h3>
          <motion.div
            variants={galleryList}
            initial="hidden"
            animate="show"
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            {entries.map((entry) => (
              <motion.article
                key={entry.id}
                variants={galleryItem}
                whileHover={{ scale: 1.02 }}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
              >
                <div className="relative aspect-[4/3]">
                  {entry.image.startsWith("blob:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.image}
                      alt={entry.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={entry.image}
                      alt={entry.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 40vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0 text-start">
                    <p className="truncate font-medium text-white">
                      {entry.title}
                    </p>
                    <p className="text-xs text-slate-500">{entry.author}</p>
                  </div>
                  <button
                    type="button"
                    disabled={entry.voted}
                    onClick={() => upvote(entry.id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                      entry.voted
                        ? "border-yellow-400 bg-yellow-400 text-[#050505]"
                        : "border-white/15 text-slate-200 hover:border-yellow-400/50 hover:text-yellow-400"
                    }`}
                  >
                    ▲ {entry.votes}
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </section>
      </div>
    </div>
  );
}
