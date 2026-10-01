import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ name?: string }>;
};

/** Legacy route — DMs now open as a slide-over inside المجتمع. */
export default async function PeerMessagesRedirectPage({
  params,
  searchParams,
}: PageProps) {
  const { userId } = await params;
  const { name } = await searchParams;
  const q = new URLSearchParams();
  q.set("dm", userId);
  if (name) q.set("name", name);
  redirect(`/dashboard/community?${q.toString()}`);
}
