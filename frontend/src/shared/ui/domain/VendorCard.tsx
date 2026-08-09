/** VendorCard — design-system/06-DOMAIN.md Part G.2. */
import { DomainCard, type DomainCardDensity } from "./DomainCard";
import { EntityCode } from "./EntityCode";
import { StatusPill } from "./StatusPill";
import { Money } from "./Money";
import type { PersonStatus, PaymentStatus } from "@/lib/domain/status";
import type { Paise } from "@/lib/domain/money";

export interface VendorCardProps {
  code: string;
  name: string;
  service?: string;
  jobs: number;
  outstanding: Paise;
  status: PersonStatus;
  paymentStatus?: PaymentStatus;
  density?: DomainCardDensity;
  onClick?: () => void;
  className?: string;
}

export function VendorCard({ code, name, service, jobs, outstanding, status, paymentStatus, density, onClick, className }: VendorCardProps) {
  return (
    <DomainCard
      avatarName={name}
      title={name}
      code={<EntityCode type="vendor" value={code} size="sm" />}
      meta={service}
      status={
        <span className="flex items-center gap-1.5">
          <StatusPill taxonomy="person" status={status} size="sm" />
          {paymentStatus && <StatusPill taxonomy="payment" status={paymentStatus} size="sm" />}
        </span>
      }
      stats={[
        { label: "Jobs", value: jobs },
        { label: "Outstanding", value: <Money value={outstanding} compact /> },
      ]}
      density={density}
      onClick={onClick}
      className={className}
    />
  );
}
