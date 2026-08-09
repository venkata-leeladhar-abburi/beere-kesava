/** WeaverCard — design-system/06-DOMAIN.md Part G.2. */
import { DomainCard, type DomainCardDensity } from "./DomainCard";
import { EntityCode } from "./EntityCode";
import { StatusPill } from "./StatusPill";
import type { PersonStatus } from "@/lib/domain/status";

export interface WeaverCardProps {
  code: string;
  name: string;
  avatarSrc?: string;
  village?: string;
  sarees: number;
  looms: number;
  currentBatch?: string;
  status: PersonStatus;
  /** Current batch's completion %, if any. */
  progress?: number;
  density?: DomainCardDensity;
  onClick?: () => void;
  className?: string;
}

export function WeaverCard({ code, name, avatarSrc, village, sarees, looms, currentBatch, status, progress, density, onClick, className }: WeaverCardProps) {
  return (
    <DomainCard
      avatarName={name}
      avatarSrc={avatarSrc}
      title={name}
      code={<EntityCode type="weaver" value={code} size="sm" />}
      meta={village}
      status={<StatusPill taxonomy="person" status={status} size="sm" />}
      stats={[
        { label: "Sarees", value: sarees },
        { label: "Looms", value: looms },
        ...(currentBatch ? [{ label: "Batch", value: <EntityCode type="batch" value={currentBatch} size="sm" /> }] : []),
      ]}
      progress={progress}
      progressLabel="Batch progress"
      density={density}
      onClick={onClick}
      className={className}
    />
  );
}
