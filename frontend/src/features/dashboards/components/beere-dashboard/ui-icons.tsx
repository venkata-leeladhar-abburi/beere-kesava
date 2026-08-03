import React from 'react';
import { T } from './theme';


function IcoRawMaterial({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="7.5" cy="16" rx="5" ry="3.2" stroke={col} strokeWidth="1.4" />
      <ellipse cx="16.5" cy="16" rx="5" ry="3.2" stroke={col} strokeWidth="1.4" />
      <ellipse cx="12" cy="12" rx="4" ry="2.8" stroke={col} strokeWidth="1.4" />
      <path d="M12 9.2 C13 5 18.5 3.5 17.5 8" stroke={col} strokeWidth="1.4" />
      <path d="M14.5 5.5 C14 7 12.5 8.5 12 9.2" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}
function IcoYarnInventory({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20.5 L5.2 3 L8.8 3 L11 20.5Z" stroke={col} strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="3.4" y1="17"   x2="10.6" y2="17"   stroke={col} strokeWidth="1.1" />
      <line x1="4"   y1="13.5" x2="10"   y2="13.5" stroke={col} strokeWidth="1.1" />
      <line x1="4.6" y1="10"   x2="9.4"  y2="10"   stroke={col} strokeWidth="1.1" />
      <line x1="5.2" y1="6.5"  x2="8.8"  y2="6.5"  stroke={col} strokeWidth="1.1" />
      <path d="M13 20.5 L15.2 3 L18.8 3 L21 20.5Z" stroke={col} strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="13.4" y1="17"   x2="20.6" y2="17"   stroke={col} strokeWidth="1.1" />
      <line x1="14"   y1="13.5" x2="20"   y2="13.5" stroke={col} strokeWidth="1.1" />
      <line x1="14.6" y1="10"   x2="19.4" y2="10"   stroke={col} strokeWidth="1.1" />
      <line x1="15.2" y1="6.5"  x2="18.8" y2="6.5"  stroke={col} strokeWidth="1.1" />
    </svg>
  );
}
function IcoFabricRoll({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="7" cy="12" rx="4" ry="7" stroke={col} strokeWidth="1.4" />
      <line x1="7" y1="5"  x2="21" y2="4"  stroke={col} strokeWidth="1.4" />
      <line x1="7" y1="19" x2="21" y2="20" stroke={col} strokeWidth="1.4" />
      <line x1="21" y1="4" x2="21" y2="20" stroke={col} strokeWidth="1.4" />
      <line x1="11"   y1="4.4"  x2="11"   y2="19.6" stroke={col} strokeWidth="0.9" />
      <line x1="15"   y1="4.2"  x2="15"   y2="19.8" stroke={col} strokeWidth="0.9" />
      <line x1="18.5" y1="4.1"  x2="18.5" y2="19.9" stroke={col} strokeWidth="0.9" />
    </svg>
  );
}
function IcoQualityCheck({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 27 27" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3" width="15" height="19" rx="1.5" stroke={col} strokeWidth="1.4" />
      <path d="M8 3 L8 1 L13 1 L13 3" stroke={col} strokeWidth="1.3" />
      <line x1="6.5" y1="9"    x2="8.5"  y2="9"    stroke={col} strokeWidth="1.2" />
      <line x1="10"  y1="9"    x2="14.5" y2="9"    stroke={col} strokeWidth="1.2" />
      <line x1="6.5" y1="12.5" x2="8.5"  y2="12.5" stroke={col} strokeWidth="1.2" />
      <line x1="10"  y1="12.5" x2="14.5" y2="12.5" stroke={col} strokeWidth="1.2" />
      <line x1="6.5" y1="16"   x2="8.5"  y2="16"   stroke={col} strokeWidth="1.2" />
      <line x1="10"  y1="16"   x2="12.5" y2="16"   stroke={col} strokeWidth="1.2" />
      <circle cx="21" cy="21" r="5.5" stroke={col} strokeWidth="1.4" />
      <path d="M18 21 L20 23 L24.5 17.5" stroke={col} strokeWidth="1.7" />
    </svg>
  );
}
function IcoTruck({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="7" width="13" height="9" rx="1" stroke={col} strokeWidth="1.4" />
      <path d="M14 10.5 L14 16 L22.5 16 L22.5 11.5 L19.5 7.5 L14 7.5Z" stroke={col} strokeWidth="1.4" />
      <circle cx="5.5"  cy="17.5" r="1.7" stroke={col} strokeWidth="1.4" />
      <circle cx="18.5" cy="17.5" r="1.7" stroke={col} strokeWidth="1.4" />
    </svg>
  );
}
function IcoInvoice({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2 L15.5 2 L19 5.5 L19 22 L5 22 Z" stroke={col} strokeWidth="1.4" />
      <path d="M15.5 2 L15.5 5.5 L19 5.5" stroke={col} strokeWidth="1.3" />
      <line x1="8" y1="9"  x2="16" y2="9"  stroke={col} strokeWidth="1.2" />
      <line x1="8" y1="12" x2="16" y2="12" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}
function IcoResourceMgmt({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3.2" stroke={col} strokeWidth="1.4" />
      <path d="M2 21 C2 16.5 5 14 9 14 C10.2 14 11.3 14.3 12.3 14.9" stroke={col} strokeWidth="1.4" />
      <circle cx="18" cy="18" r="2.8" stroke={col} strokeWidth="1.3" />
      {[0,60,120,180,240,300].map((deg, i) => {
        const r = (deg * Math.PI) / 180;
        return <line key={i} x1={18+2.8*Math.cos(r)} y1={18+2.8*Math.sin(r)} x2={18+4.2*Math.cos(r)} y2={18+4.2*Math.sin(r)} stroke={col} strokeWidth="1.8" />;
      })}
    </svg>
  );
}
function IcoWarehouse({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 10 L12 3 L23 10" stroke={col} strokeWidth="1.4" />
      <rect x="3" y="10" width="18" height="12" stroke={col} strokeWidth="1.4" />
      <rect x="9.5" y="15" width="5" height="7" rx="0.5" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}
function IcoHandshake({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 17 L7 12 L10 12 L13.5 8.5" stroke={col} strokeWidth="1.4" />
      <path d="M2 17 C2 17 5 20 8 19.5 L13.5 19.5 C15.5 19.5 17 18 17 16 L13.5 12.5" stroke={col} strokeWidth="1.4" />
      <path d="M22 17 L17 12 L13.5 12" stroke={col} strokeWidth="1.4" />
      <path d="M22 17 C22 17 19 20 16 19.5" stroke={col} strokeWidth="1.4" />
    </svg>
  );
}
function IcoProductionPlan({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="1.5" stroke={col} strokeWidth="1.4" />
      <path d="M9 4 L9 2 L15 2 L15 4" stroke={col} strokeWidth="1.3" />
      <line x1="7"  y1="19" x2="7"  y2="13" stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="9"  stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="17" y1="19" x2="17" y2="15" stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="5"  y1="19" x2="19" y2="19" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}

export { IcoRawMaterial, IcoYarnInventory, IcoFabricRoll, IcoQualityCheck, IcoTruck, IcoInvoice, IcoResourceMgmt, IcoWarehouse, IcoHandshake, IcoProductionPlan };