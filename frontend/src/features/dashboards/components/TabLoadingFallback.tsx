import React from "react";

export function TabLoadingFallback() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(139,26,46,0.15)", borderTopColor: "#6B1A2A", animation: "bk-spin 0.8s linear infinite" }} />
      <style>{"@keyframes bk-spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
