import { Icons } from "@/components/icons";
import { Panel, SealEventTimeline, SectionHeader, StatusPill } from "@/components/ui";
import type { ProofEvent } from "@/types/domain";

export function SealEvents({ events }: { events: ProofEvent[] }) {
  return (
    <Panel className="seal-events-panel">
      <SectionHeader
        title="Seal events"
        action={
          <span className="live-label">
            <span /> Live
          </span>
        }
      />
      <SealEventTimeline events={events} />
      <button className="link-button" type="button">
        View all <Icons.external size={13} />
      </button>
      <StatusPill tone="neutral">All times shown in your local timezone</StatusPill>
    </Panel>
  );
}
