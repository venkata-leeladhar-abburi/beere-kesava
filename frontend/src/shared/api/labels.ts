import { apiClient } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface LabelSettings {
  id: string;
  labelSize: string;
  showBarcode: boolean;
  showCode: boolean;
  showWeaver: boolean;
  showDate: boolean;
  showBranding: boolean;
  defaultPrinter: string;
  connectionType: string;
  scanShowPhoto: boolean;
  scanShowCode: boolean;
  scanShowWeaver: boolean;
  scanShowFabric: boolean;
  scanShowColour: boolean;
  scanShowJari: boolean;
  scanShowDispatchDate: boolean;
  scanShowProductionStatus: boolean;
  updatedAt: string;
}

export type UpdateLabelSettingsPayload = Partial<Omit<LabelSettings, "id" | "updatedAt">>;

export const labelsApi = {
  barcodeUrl: (code: string) => `${API_BASE_URL}/labels/barcode?code=${encodeURIComponent(code)}`,
  qrCodeUrl: (code: string) => `${API_BASE_URL}/labels/qrcode?code=${encodeURIComponent(code)}`,

  getSettings: () => apiClient.get<LabelSettings>("/labels/settings"),
  updateSettings: (payload: UpdateLabelSettingsPayload) =>
    apiClient.patch<LabelSettings>("/labels/settings", payload),
};
