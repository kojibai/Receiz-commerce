import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader } from "@/components/ui";
import type { PublishState } from "@/types/domain";

export function PublishChecklist({
  publish,
  onPublish
}: {
  publish: PublishState;
  onPublish: () => void;
}) {
  return (
    <Panel className="admin-panel publish-panel">
      <SectionHeader title="Publish checklist" />
      <div className="checklist">
        {publish.checklist.map((item) => (
          <div className="check-row" key={item.id}>
            <span>{item.label}</span>
            {item.warning ? (
              <em>!</em>
            ) : item.complete ? (
              <Icons.check size={15} />
            ) : (
              <i />
            )}
          </div>
        ))}
      </div>
      <Button onClick={onPublish} variant="primary">
        Publish from checklist
      </Button>
    </Panel>
  );
}
