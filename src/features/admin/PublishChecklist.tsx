import { InlineActionFeedback } from "@/components/ActionFeedback";
import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader } from "@/components/ui";
import type { ActionFeedbackState } from "@/types/action-feedback";
import type { PublishState } from "@/types/domain";

export function PublishChecklist({
  publish,
  onPublish,
  publishFeedback
}: {
  publish: PublishState;
  onPublish: () => void;
  publishFeedback?: ActionFeedbackState;
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
      <div className="action-feedback-stack">
        <Button
          className={publishFeedback ? `action-button-${publishFeedback.status}` : undefined}
          onClick={onPublish}
          variant="primary"
        >
          {publishFeedback?.status === "pending" ? "Publishing" : publishFeedback?.status === "success" ? "Published" : "Publish from checklist"}
        </Button>
        <InlineActionFeedback feedback={publishFeedback} />
      </div>
    </Panel>
  );
}
