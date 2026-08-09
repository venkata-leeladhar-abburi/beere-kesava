/** SareeCard — design-system/06-DOMAIN.md Part G.2. */
import { DomainCard, type DomainCardDensity } from "./DomainCard";
import { EntityCode } from "./EntityCode";
import { StatusPill } from "./StatusPill";
import { Money } from "./Money";
import { Quantity } from "./Quantity";
import type { InventoryStatus, ProductionStatus } from "@/lib/domain/status";
import type { Paise } from "@/lib/domain/money";

export interface SareeCardProps {
  code: string;
  designName: string;
  imageSrc?: string;
  type?: string;
  weightGrams?: number;
  price?: Paise;
  weaverName?: string;
  inventoryStatus: InventoryStatus;
  productionStatus?: ProductionStatus;
  density?: DomainCardDensity;
  onClick?: () => void;
  className?: string;
}

export function SareeCard({ code, designName, imageSrc, type, weightGrams, price, weaverName, inventoryStatus, productionStatus, density, onClick, className }: SareeCardProps) {
  return (
    <DomainCard
      avatarName={designName}
      avatarSrc={imageSrc}
      title={designName}
      code={<EntityCode type="saree" value={code} size="sm" />}
      meta={type}
      status={
        <span className="flex items-center gap-1.5">
          <StatusPill taxonomy="inventory" status={inventoryStatus} size="sm" />
          {productionStatus && <StatusPill taxonomy="production" status={productionStatus} size="sm" />}
        </span>
      }
      stats={[
        ...(weightGrams != null ? [{ label: "Weight", value: <Quantity value={weightGrams} unit="g" /> }] : []),
        ...(price != null ? [{ label: "Price", value: <Money value={price} /> }] : []),
        ...(weaverName ? [{ label: "Weaver", value: weaverName }] : []),
      ]}
      density={density}
      onClick={onClick}
      className={className}
    />
  );
}
