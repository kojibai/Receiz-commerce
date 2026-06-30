import { Icons } from "@/components/icons";
import { Button, Panel, RewardCard, SectionHeader } from "@/components/ui";
import type { CustomerAccount, Reward } from "@/types/domain";

export function RewardDeck({
  brandImageUrl,
  brandLabel,
  showAdminActions = true,
  reward,
  customer
}: {
  brandImageUrl?: string | null;
  brandLabel: string;
  showAdminActions?: boolean;
  reward: Reward | null;
  customer: CustomerAccount;
}) {
  return (
    <Panel className="reward-deck-panel" id="rewards">
      <SectionHeader title="Reward deck" action={showAdminActions ? <Button variant="outline">Manage</Button> : null} />
      {reward ? (
        <RewardCard brandImageUrl={brandImageUrl} brandLabel={brandLabel} reward={reward} />
      ) : (
        <div className="panel-empty-state">
          <Icons.gift size={22} />
          <strong>No rewards yet</strong>
          <span>{showAdminActions ? "Create the first branded reward in Admin Studio." : "Rewards will appear here when this store launches them."}</span>
        </div>
      )}
      <div className="deck-count">
        <span>{reward ? "5 / 12 claimed" : "0 / 0 claimed"}</span>
        <button type="button">View all</button>
      </div>
      <div className="account-mini">
        <div className="avatar">{customer.name.slice(0, 1)}</div>
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
