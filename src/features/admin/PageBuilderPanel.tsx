import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { SitePage } from "@/types/domain";

export function PageBuilderPanel({ pages }: { pages: SitePage[] }) {
  return (
    <Panel className="admin-panel">
      <SectionHeader title="Page builder" action={<Button variant="outline">Add page</Button>} />
      <div className="admin-list">
        {pages.map((page) => (
          <div className="admin-list-row" key={page.id}>
            <span className="drag-handle">⋮⋮</span>
            <strong>{page.title}</strong>
            <span>{page.slug}</span>
            <StatusPill tone={page.published ? "green" : "neutral"}>
              {page.published ? "Published" : "Draft"}
            </StatusPill>
          </div>
        ))}
      </div>
    </Panel>
  );
}
