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

/**
 * Upload an image file to the public `community_images` bucket.
 * Path: `{userId}/{timestamp}-{safeName}`
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

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safe = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 40);
  const path = `${user.id}/${Date.now()}-${safe || `photo.${ext}`}`;

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
