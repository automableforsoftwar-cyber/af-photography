import { redirect } from "next/navigation";

/** الرسايل moved inside المجتمع → أمجد فريد */
export default function InboxRedirectPage() {
  redirect("/dashboard/community");
}
