export interface ReturnRowState {
  uid: string;
  materialType: "Warp" | "Resham" | "Jari";
  warpSubtype: "Resham Warp" | "Jari Warp";
  description: string;
  quantity: string;
  jariType: "Polyester" | "Silk Fast";
  jariGrade: "1G" | "2G" | "3G" | "4G" | "5G";
  jariColor: string;
  jariUnit: "Reels" | "Buns";
  warpReshamUnit: "kg" | "g";
}

export function emptyReturnRow(): ReturnRowState {
  return {
    uid: `ret-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    materialType: "Warp",
    warpSubtype: "Resham Warp",
    description: "",
    quantity: "",
    jariType: "Polyester",
    jariGrade: "2G",
    jariColor: "Gold",
    jariUnit: "Reels",
    warpReshamUnit: "kg",
  };
}
