export interface FactoryLoom {
  id: string; loomNumber: string;
  location: string; operatorName: string; operatorPhone: string;
  status: "active" | "idle" | "maintenance";
  installedYear: string; notes: string;
}

const INITIAL_LOOMS: FactoryLoom[] = [];

export const FACTORY_LOOMS_LIST: FactoryLoom[] = INITIAL_LOOMS;
