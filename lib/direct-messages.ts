import { RETENTION_DAYS, daysAgoIso, pickDisplayName } from "@/lib/display-name";
import { supabase } from "@/lib/supabase";

/** Peer-to-peer private DM (public.direct_messages). */
export type PeerDirectMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export async function fetchPeerDisplayName(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();

  return pickDisplayName(
    data?.full_name as string | null,
    data?.email as string | null,
  );
}

/** Thread between current user and peer (last 3 days). */
export async function fetchPeerThread(
  peerUserId: string,
): Promise<PeerDirectMessage[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const since = daysAgoIso(RETENTION_DAYS);
  const { data, error } = await supabase
    .from("direct_messages")
    .select("id, sender_id, receiver_id, content, created_at")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${peerUserId}),and(sender_id.eq.${peerUserId},receiver_id.eq.${user.id})`,
    )
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("peer DM fetch:", error);
    return [];
  }

  return (data ?? []) as PeerDirectMessage[];
}

export async function sendPeerMessage(input: {
  receiverId: string;
  content: string;
}): Promise<
  { ok: true; message: PeerDirectMessage } | { ok: false; message: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "login_required" };
  }

  const content = input.content.trim();
  if (!content) {
    return { ok: false, message: "empty" };
  }

  if (input.receiverId === user.id) {
    return { ok: false, message: "self" };
  }

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      sender_id: user.id,
      receiver_id: input.receiverId,
      content,
    })
    .select("id, sender_id, receiver_id, content, created_at")
    .single();

  if (error || !data) {
    console.error("peer DM insert:", error);
    return { ok: false, message: "send_failed" };
  }

  return { ok: true, message: data as PeerDirectMessage };
}
