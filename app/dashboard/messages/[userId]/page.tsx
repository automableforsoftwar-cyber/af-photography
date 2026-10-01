import { redirect } from "next/navigation";

/** Legacy DM URL — chats open as a slide-over inside المجتمع (no query routing). */
export default function PeerMessagesRedirectPage() {
  redirect("/dashboard/community");
}
