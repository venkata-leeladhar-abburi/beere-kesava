const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const labelsApi = {
  barcodeUrl: (code: string) => `${API_BASE_URL}/labels/barcode?code=${encodeURIComponent(code)}`,
  qrCodeUrl: (code: string) => `${API_BASE_URL}/labels/qrcode?code=${encodeURIComponent(code)}`,
};
