import { RETENTION_DAYS, daysAgoIso, pickDisplayName } from "@/lib/display-name";
import { toCommunityImagePublicUrl } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

/** Peer-to-peer private DM (public.direct_messages). */
export type PeerDirectMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  is_read: boolean;
};

const DM_SELECT =
  "id, sender_id, receiver_id, content, image_url, created_at, is_read";

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
    .select(DM_SELECT)
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${peerUserId}),and(sender_id.eq.${peerUserId},receiver_id.eq.${user.id})`,
    )
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("peer DM fetch:", error);
    return [];
  }

  return ((data ?? []) as PeerDirectMessage[]).map((m) => ({
    ...m,
    image_url: m.image_url ? toCommunityImagePublicUrl(m.image_url) : null,
    is_read: Boolean(m.is_read),
  }));
}

export type PeerConversation = {
  peerUserId: string;
  peerName: string;
  lastMessageAt: string;
  unread: boolean;
};

/** Distinct peers the current user has DM history with (last 3 days). */
export async function fetchPeerConversations(): Promise<PeerConversation[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const since = daysAgoIso(RETENTION_DAYS);
  const { data, error } = await supabase
    .from("direct_messages")
    .select(DM_SELECT)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("peer conversations fetch:", error);
    return [];
  }

  const rows = (data ?? []) as PeerDirectMessage[];
  const byPeer = new Map<
    string,
    { lastMessageAt: string; unread: boolean }
  >();

  for (const row of rows) {
    const peerId =
      row.sender_id === user.id ? row.receiver_id : row.sender_id;
    if (!peerId || peerId === user.id) continue;
    const existing = byPeer.get(peerId);
    const unreadFromPeer =
      row.receiver_id === user.id && row.sender_id === peerId && !row.is_read;
    if (!existing) {
      byPeer.set(peerId, {
        lastMessageAt: row.created_at,
        unread: unreadFromPeer,
      });
    } else if (unreadFromPeer) {
      existing.unread = true;
    }
  }

  const peerIds = Array.from(byPeer.keys());
  if (peerIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", peerIds);

  const nameById = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameById.set(
      p.id as string,
      pickDisplayName(
        p.full_name as string | null,
        p.email as string | null,
      ),
    );
  }

  return peerIds
    .map((peerUserId) => {
      const meta = byPeer.get(peerUserId)!;
      return {
        peerUserId,
        peerName: nameById.get(peerUserId) || "عضو",
        lastMessageAt: meta.lastMessageAt,
        unread: meta.unread,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    );
}

/** Sender IDs with unread messages for the current user. */
export async function fetchUnreadSenderIds(): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("direct_messages")
    .select("sender_id")
    .eq("receiver_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("unread senders fetch:", error);
    return [];
  }

  return Array.from(
    new Set((data ?? []).map((row) => row.sender_id as string).filter(Boolean)),
  );
}

/** Mark all messages from peer → me as read. */
export async function markPeerThreadRead(peerUserId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("direct_messages")
    .update({ is_read: true })
    .eq("sender_id", peerUserId)
    .eq("receiver_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("mark peer thread read:", error);
  }
}

export async function sendPeerMessage(input: {
  receiverId: string;
  content?: string;
  imageUrl?: string | null;
}): Promise<
  { ok: true; message: PeerDirectMessage } | { ok: false; message: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "login_required" };
  }

  const content = (input.content ?? "").trim();
  const imageUrl = input.imageUrl?.trim()
    ? toCommunityImagePublicUrl(input.imageUrl.trim())
    : null;
  if (!content && !imageUrl) {
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
      content: content || "(صورة)",
      image_url: imageUrl,
      is_read: false,
    })
    .select(DM_SELECT)
    .single();

  if (error || !data) {
    console.error("peer DM insert:", error);
    return { ok: false, message: "send_failed" };
  }

  const message = data as PeerDirectMessage;
  return {
    ok: true,
    message: {
      ...message,
      image_url: message.image_url
        ? toCommunityImagePublicUrl(message.image_url)
        : null,
      is_read: Boolean(message.is_read),
    },
  };
}

/**
 * Live INSERT subscription for messages where current user is the receiver.
 * Returns an unsubscribe function.
 */
export function subscribeIncomingPeerMessages(input: {
  userId: string;
  onInsert: (message: PeerDirectMessage) => void;
}): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`peer-dm-inbox:${input.userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `receiver_id=eq.${input.userId}`,
      },
      (payload) => {
        const row = payload.new as PeerDirectMessage;
        if (!row?.id) return;
        input.onInsert({
          ...row,
          image_url: row.image_url
            ? toCommunityImagePublicUrl(row.image_url)
            : null,
          is_read: Boolean(row.is_read),
        });
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
