/** LoomCard — design-system/06-DOMAIN.md Part G.2. */
import { DomainCard, type DomainCardDensity } from "./DomainCard";
import { EntityCode } from "./EntityCode";
import { StatusPill } from "./StatusPill";
import { Percent } from "./Percent";
import type { ResourceCondition } from "@/lib/domain/status";

export interface LoomCardProps {
  code: string;
  location?: string;
  type?: string;
  currentBatch?: string;
  uptime?: number;
  condition: ResourceCondition;
  /** Current batch's completion %, if any. */
  progress?: number;
  density?: DomainCardDensity;
  onClick?: () => void;
  className?: string;
}

export function LoomCard({ code, location, type, currentBatch, uptime, condition, progress, density, onClick, className }: LoomCardProps) {
  return (
    <DomainCard
      avatarName={code}
      title={code}
      code={<EntityCode type="loom" value={code} size="sm" icon />}
      meta={[location, type].filter(Boolean).join(" · ") || undefined}
      status={<StatusPill taxonomy="condition" status={condition} size="sm" />}
      stats={[
        ...(currentBatch ? [{ label: "Batch", value: <EntityCode type="batch" value={currentBatch} size="sm" /> }] : []),
        ...(uptime != null ? [{ label: "Uptime", value: <Percent value={uptime} decimals={0} /> }] : []),
      ]}
      progress={progress}
      progressLabel="Batch progress"
      density={density}
      onClick={onClick}
      className={className}
    />
  );
}
