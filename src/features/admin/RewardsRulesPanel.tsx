import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { RewardRule } from "@/types/domain";

export function RewardsRulesPanel({ rules }: { rules: RewardRule[] }) {
  return (
    <Panel className="admin-panel">
      <SectionHeader title="Rewards & rules" action={<button className="link-button">View all</button>} />
      <div className="admin-list">
        {rules.map((rule) => (
          <div className="reward-rule-row" key={rule.id}>
            <div className="rule-icon">%</div>
            <div>
              <strong>{rule.label}</strong>
              <span>{rule.trigger}</span>
            </div>
            <StatusPill tone={rule.active ? "green" : "neutral"}>
              {rule.active ? "Active" : "Draft"}
            </StatusPill>
          </div>
        ))}
      </div>
      <Button variant="outline">Add reward</Button>
    </Panel>
  );
}
