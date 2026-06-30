import { Button, Panel, RewardCard, SectionHeader } from "@/components/ui";
import type { CustomerAccount, Reward } from "@/types/domain";

export function RewardDeck({
  brandLabel,
  reward,
  customer
}: {
  brandLabel: string;
  reward: Reward;
  customer: CustomerAccount;
}) {
  return (
    <Panel className="reward-deck-panel" id="rewards">
      <SectionHeader title="Reward deck" action={<Button variant="outline">Manage</Button>} />
      <RewardCard brandLabel={brandLabel} reward={reward} />
      <div className="deck-count">
        <span>5 / 12 claimed</span>
        <button type="button">View all</button>
      </div>
      <div className="account-mini">
        <div className="avatar">{customer.name.slice(0, 1)}S</div>
        <div>
          <strong>{customer.name}</strong>
          <p>{customer.email}</p>
        </div>
        <span>{customer.tier}</span>
      </div>
      <div className="account-stats">
        <div>
          <strong>{customer.rewardsValueLabel}</strong>
          <span>Rewards</span>
        </div>
        <div>
          <strong>{customer.beans}</strong>
          <span>Beans</span>
        </div>
        <div>
          <strong>{customer.streak}</strong>
          <span>Streak</span>
        </div>
      </div>
    </Panel>
  );
}
