import { getPublicTrackingAction } from "@/actions/reception-actions";
import { notFound } from "next/navigation";
import { LiveTrackView } from "@/components/track/live-track-view";

// The public tracking page must always reflect the latest state for the
// client. We bypass any caching so each visit fetches fresh data, and the
// client component then keeps polling for live updates.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reception = await getPublicTrackingAction(token);

  if (!reception) notFound();

  return <LiveTrackView token={token} initialReception={reception} />;
}
