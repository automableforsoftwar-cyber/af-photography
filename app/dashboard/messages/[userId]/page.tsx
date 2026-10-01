import { redirect } from "next/navigation";

/** Legacy DM routes removed — private chats are a React state drawer only. */
export default function PeerMessagesRedirectPage() {
  redirect("/dashboard/community");
}
