/** CustomerCard — design-system/06-DOMAIN.md Part G.2. */
import { DomainCard, type DomainCardDensity } from "./DomainCard";
import { EntityCode } from "./EntityCode";
import { StatusPill } from "./StatusPill";
import { Money } from "./Money";
import type { PersonStatus, PaymentStatus } from "@/lib/domain/status";
import type { Paise } from "@/lib/domain/money";

export interface CustomerCardProps {
  code: string;
  name: string;
  avatarSrc?: string;
  city?: string;
  orders: number;
  outstanding: Paise;
  lastOrder?: string;
  status: PersonStatus;
  paymentStatus?: PaymentStatus;
  /** Credit limit used, 0-100. */
  progress?: number;
  density?: DomainCardDensity;
  onClick?: () => void;
  className?: string;
}

export function CustomerCard({ code, name, avatarSrc, city, orders, outstanding, lastOrder, status, paymentStatus, progress, density, onClick, className }: CustomerCardProps) {
  return (
    <DomainCard
      avatarName={name}
      avatarSrc={avatarSrc}
      title={name}
      code={<EntityCode type="customer" value={code} size="sm" />}
      meta={city}
      status={
        <span className="flex items-center gap-1.5">
          <StatusPill taxonomy="person" status={status} size="sm" />
          {paymentStatus && <StatusPill taxonomy="payment" status={paymentStatus} size="sm" />}
        </span>
      }
      stats={[
        { label: "Orders", value: orders },
        { label: "Outstanding", value: <Money value={outstanding} compact /> },
        ...(lastOrder ? [{ label: "Last order", value: lastOrder }] : []),
      ]}
      progress={progress}
      progressLabel="Credit used"
      density={density}
      onClick={onClick}
      className={className}
    />
  );
}
