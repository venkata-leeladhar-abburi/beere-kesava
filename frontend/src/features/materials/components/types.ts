import type React from "react";

export type StatusType = "good" | "warning" | "critical" | "empty";

export type BatchRow = {
  id: string; type: string; details: string; vendor: string; date: string;
  received: number; given: number; remaining: number; statusType: StatusType;
};

export type WeaverStatus = "on-time" | "approaching" | "overdue" | "quality";

export type WeaverMat = {
  name: string; id: string; initials: string; avatarBg: string; batch: string;
  daysAgo: number; img?: string; status: WeaverStatus; statusText: string;
  warp: string; resham: string; jari: string; expected: number; done: number; design: string;
};

export type POFilter = "all" | "pending" | "approved" | "received" | "rejected";

export type MoveType = "in" | "out";
export type MoveEntry = { type: MoveType; desc: string; ref: string; time: string };

export type TagStyle = { col: string; bg: string };
export type StatusCfgEntry = { dot: string; color: string; bg: string; text: string; icon: React.ReactNode };
export type WeaverStatusCfgEntry = { border: string; bannerBg: string; bannerColor: string };
