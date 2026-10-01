import { supabase } from "@/lib/supabase";

const BUCKET = "community_images";

/**
 * Always return an absolute public Storage URL (never a bare path).
 */
export function toCommunityImagePublicUrl(pathOrUrl: string): string {
  const raw = pathOrUrl.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  // Strip accidental bucket prefix
  const path = raw
    .replace(/^\/+/, "")
    .replace(/^community_images\//, "");

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function extFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  const fromType = file.type.split("/")[1]?.toLowerCase();
  if (fromType === "jpeg") return "jpg";
  if (fromType && /^[a-z0-9]{2,5}$/.test(fromType)) return fromType;
  return "jpg";
}

/**
 * Upload an image file to the public `community_images` bucket.
 * Path: `{userId}/{timestamp}-{safeBase}.{ext}`
 * Returns the full public URL from getPublicUrl().
 */
export async function uploadCommunityImage(
  file: File,
): Promise<{ ok: true; publicUrl: string } | { ok: false; message: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "login_required" };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "not_image" };
  }

  const ext = extFromFile(file);
  const base = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 32);
  const path = `${user.id}/${Date.now()}-${base || "photo"}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    console.error("storage upload:", error);
    return { ok: false, message: "upload_failed" };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl?.trim() || "";
  if (!publicUrl || !/^https?:\/\//i.test(publicUrl)) {
    return { ok: false, message: "url_failed" };
  }

  return { ok: true, publicUrl };
}
