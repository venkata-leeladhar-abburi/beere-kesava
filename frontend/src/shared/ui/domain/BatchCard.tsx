/** BatchCard — design-system/06-DOMAIN.md Part G.2. */
import { DomainCard, type DomainCardDensity } from "./DomainCard";
import { EntityCode } from "./EntityCode";
import { StatusPill } from "./StatusPill";
import type { ProductionStatus } from "@/lib/domain/status";

export interface BatchCardProps {
  code: string;
  designName: string;
  weaverName?: string;
  sarees: number;
  daysElapsed?: number;
  status: ProductionStatus;
  /** Batch completion, 0-100. */
  progress?: number;
  density?: DomainCardDensity;
  onClick?: () => void;
  className?: string;
}

export function BatchCard({ code, designName, weaverName, sarees, daysElapsed, status, progress, density, onClick, className }: BatchCardProps) {
  return (
    <DomainCard
      avatarName={designName}
      title={designName}
      code={<EntityCode type="batch" value={code} size="sm" />}
      meta={weaverName}
      status={<StatusPill taxonomy="production" status={status} size="sm" />}
      stats={[
        { label: "Sarees", value: sarees },
        ...(daysElapsed != null ? [{ label: "Days elapsed", value: daysElapsed }] : []),
      ]}
      progress={progress}
      progressLabel="Completion"
      density={density}
      onClick={onClick}
      className={className}
    />
  );
}
