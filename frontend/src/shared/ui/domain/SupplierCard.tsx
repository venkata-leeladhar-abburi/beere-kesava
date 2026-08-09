/** SupplierCard — design-system/06-DOMAIN.md Part G.2. */
import { DomainCard, type DomainCardDensity } from "./DomainCard";
import { EntityCode } from "./EntityCode";
import { StatusPill } from "./StatusPill";
import { Money } from "./Money";
import type { PersonStatus } from "@/lib/domain/status";
import type { Paise } from "@/lib/domain/money";

export interface SupplierCardProps {
  code: string;
  name: string;
  logoSrc?: string;
  city?: string;
  purchaseOrders: number;
  spend: Paise;
  rating?: number;
  status: PersonStatus;
  density?: DomainCardDensity;
  onClick?: () => void;
  className?: string;
}

export function SupplierCard({ code, name, logoSrc, city, purchaseOrders, spend, rating, status, density, onClick, className }: SupplierCardProps) {
  return (
    <DomainCard
      avatarName={name}
      avatarSrc={logoSrc}
      title={name}
      code={<EntityCode type="supplier" value={code} size="sm" />}
      meta={city}
      status={<StatusPill taxonomy="person" status={status} size="sm" />}
      stats={[
        { label: "POs", value: purchaseOrders },
        { label: "Spend", value: <Money value={spend} compact /> },
        ...(rating != null ? [{ label: "Rating", value: <span className="tabular-nums">{rating.toFixed(1)} / 5</span> }] : []),
      ]}
      density={density}
      onClick={onClick}
      className={className}
    />
  );
}
