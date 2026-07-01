import { Icons } from "@/components/icons";
import { Panel, SectionHeader, StatusPill } from "@/components/ui";
import { buildLaunchReadiness } from "@/lib/launch/readiness";
import type { CommerceState } from "@/types/domain";

function statusTone(status: ReturnType<typeof buildLaunchReadiness>["status"]) {
  if (status === "elite_ready") return "green";
  if (status === "nearly_ready") return "gold";
  return "pink";
}

function categoryTone(status: ReturnType<typeof buildLaunchReadiness>["categories"][number]["status"]) {
  if (status === "ready") return "green";
  if (status === "action_needed") return "gold";
  return "pink";
}

export function LaunchReadinessPanel({
  compact = false,
  state
}: {
  compact?: boolean;
  state: CommerceState;
}) {
  const readiness = buildLaunchReadiness(state);
  const categories = compact ? readiness.categories.slice(0, 4) : readiness.categories;

  return (
    <Panel className={compact ? "admin-panel launch-readiness-panel compact" : "admin-panel launch-readiness-panel"}>
      <SectionHeader
        title="Launch readiness"
        action={<StatusPill tone={statusTone(readiness.status)}>{readiness.grade}</StatusPill>}
      />
      <div className="readiness-score-card">
        <div className="readiness-score-ring" aria-label={`Launch readiness score ${readiness.score} out of 100`}>
          <strong>{readiness.score}</strong>
          <span>/100</span>
        </div>
        <div>
          <strong>{readiness.summary}</strong>
          <p>
            Production launch is graded for no-code merchants and developers cloning this app as the canonical Receiz SDK base.
          </p>
        </div>
      </div>

      <div className="readiness-audience-grid">
        {readiness.audiences.map((audience) => (
          <div className="readiness-audience-card" key={audience.id}>
            <span>{audience.id === "merchant" ? <Icons.store size={18} /> : <Icons.github size={18} />}</span>
            <div>
              <strong>{audience.label}</strong>
              <p>{audience.summary}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="readiness-category-list">
        {categories.map((category) => (
          <div className="readiness-category-row" key={category.id}>
            <div>
              <strong>{category.label}</strong>
              <span>{category.actionLabel}</span>
            </div>
            <StatusPill tone={categoryTone(category.status)}>{category.score}</StatusPill>
          </div>
        ))}
      </div>

      {readiness.blockers.length ? (
        <div className="readiness-blockers">
          <strong>Critical blockers</strong>
          {readiness.blockers.slice(0, compact ? 2 : 4).map((blocker) => (
            <span key={blocker.id}>{blocker.actionLabel}</span>
          ))}
        </div>
      ) : (
        <div className="readiness-next-actions">
          <strong>Release loop</strong>
          {readiness.nextActions.slice(0, compact ? 2 : 3).map((action) => (
            <span key={action}>{action}</span>
          ))}
        </div>
      )}

      {compact ? null : (
        <div className="readiness-sdk-rails">
          <strong>Receiz SDK rails for clone builders</strong>
          <div>
            {readiness.sdkRails.map((rail) => (
              <span key={rail}>{rail}</span>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
