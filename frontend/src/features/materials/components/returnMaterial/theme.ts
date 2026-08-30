export interface ReturnRowState {
  uid: string;
  materialType: "Warp" | "Resham" | "Jari";
  description: string;
  quantity: string;
  jariUnit: "Reels" | "Buns";
  warpReshamUnit: "kg" | "g";
}

export function emptyReturnRow(): ReturnRowState {
  return {
    uid: `ret-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    materialType: "Warp",
    description: "",
    quantity: "",
    jariUnit: "Reels",
    warpReshamUnit: "kg",
  };
}
