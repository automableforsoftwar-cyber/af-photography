import { DashboardShell } from "@/components/dashboard/DashboardShell";

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ name?: string }>;
};

export default async function PeerMessagesPage({
  params,
  searchParams,
}: PageProps) {
  const { userId } = await params;
  const { name } = await searchParams;
  return (
    <DashboardShell
      section="messages"
      peerUserId={userId}
      peerName={name ?? null}
    />
  );
}
