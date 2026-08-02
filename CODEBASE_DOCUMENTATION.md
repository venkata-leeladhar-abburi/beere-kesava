# Beere Kesava & Brothers Silks — Technical Codebase Documentation

---

## 📖 Executive Summary

**Beere Kesava & Brothers Silks** (Established 1999) is a modern, enterprise-grade web application engineered to manage the end-to-end operations of traditional silk saree manufacturing, artisan weaver management, inventory control, B2B/B2C sales, financial accounting, and multi-portal staff operations.

This codebase follows **Feature-Driven Modular Architecture** using React 18, TypeScript, Vite, and Framer Motion (`motion/react`), providing high performance, strict type safety, and a luxury aesthetic tailored for a heritage silk brand.

---

## 🛠️ Technology Stack & Key Dependencies

| Technology | Layer | Purpose |
| :--- | :--- | :--- |
| **React 18** | Frontend Framework | Declarative, component-based UI rendering |
| **TypeScript** | Type System | Strict type safety and interface definitions (`0` tsc errors) |
| **Vite** | Bundler & Dev Server | Fast module replacement (HMR) and optimized build bundling |
| **Framer Motion (`motion/react`)** | Animation Engine | Micro-interactions, spring physics, Ken Burns hero motion |
| **Lucide React & Phosphor Icons** | Iconography | High-clarity vector icons across all UI modules |
| **Vanilla CSS + Theme Tokens** | Styling | Flexible design system with zero framework constraints |

---

## 📁 Directory Structure & File Architecture

```
beere-kesava/
├── frontend/
│   ├── src/
│   │   ├── api/                   # API client configuration and endpoint services
│   │   ├── app/                   # Application shell, layout, and global UI helpers
│   │   │   ├── components/        # SectionNavigator, ImageWithFallback, useResponsive hook
│   │   │   └── constants/         # Base64 image constants & logo assets
│   │   ├── contexts/              # Global React Context state providers
│   │   │   ├── AuthContext.tsx    # User authentication & active role state
│   │   │   ├── FirmsContext.tsx   # Multi-firm enterprise management
│   │   │   ├── BatchContext.tsx   # Production weaving batch state
│   │   │   └── POContext.tsx      # Purchase orders & raw material procurement
│   │   ├── features/              # Feature Modules (Domain Logic & Views)
│   │   │   ├── auth/              # Role selector, login modals, auth guard
│   │   │   ├── bulk-orders/       # B2B & wholesale order management
│   │   │   ├── customers/         # Retail & wholesale customer registry
│   │   │   ├── dashboards/        # Master Admin Dashboard (Desktop & Mobile)
│   │   │   │   └── components/beere-dashboard/
│   │   │   │       ├── data.tsx   # Operational data feeds & metrics
│   │   │   │       ├── desktop.tsx# Re-export entrypoint for desktop dashboard
│   │   │   │       ├── theme.tsx  # Luxury color tokens & typography constants
│   │   │   │       ├── ui.tsx     # UI primitives (Card, Donut, BarChart, AnimatedNumber)
│   │   │   │       └── components/# Modularized dashboard sub-components
│   │   │   │           ├── TopNav.tsx
│   │   │   │           ├── Hero.tsx
│   │   │   │           ├── MetricsBar.tsx
│   │   │   │           ├── ThreeCol.tsx
│   │   │   │           ├── ActivityStrip.tsx
│   │   │   │           ├── WeaverSection.tsx
│   │   │   │           ├── RawMaterial.tsx
│   │   │   │           └── Footer.tsx
│   │   │   ├── inventory/         # Saree stock, barcode tracking, warehouse levels
│   │   │   ├── materials/         # Raw silk yarn, jari, and dye inventory
│   │   │   ├── payments/          # Weaver payouts, supplier invoices, advance tracking
│   │   │   ├── portals/           # Role-specific staff portals (Shop, Weaver, Worker)
│   │   │   ├── production/        # Batch creation, loom allocation, saree status
│   │   │   ├── purchasing/        # Raw material POs & supplier orders
│   │   │   ├── reports/           # Financial analytics, output velocity, QC reports
│   │   │   ├── suppliers/         # Silk yarn & jari supplier database
│   │   │   ├── vendors/           # Dyers, zari processors & third-party vendors
│   │   │   └── weavers/           # Weaver profiles, loom capacity, wage rate charts
│   │   ├── hooks/                 # Custom React hooks (debounce, local storage, state)
│   │   ├── imports/               # Static assets & showroom hero images (`hero.png`)
│   │   ├── types/                 # Shared TypeScript types and domain entities
│   │   └── main.tsx               # Application bootstrap entry point
│   ├── package.json               # Dependencies and build scripts
│   └── vite.config.ts             # Vite bundler configuration
└── tsconfig.json                  # Root TypeScript configuration extending frontend
```

---

## 👥 Multi-Role User Access & Portals

The platform provides customized user experiences based on the active role:

### 1. **Admin Command Center (`/admin`)**
- Full governance over production, inventory, weaver payouts, sales, and analytics.
- Features sticky double-tier navigation with drop-down groups (`TopNav`), real-time operational feeds (`ActivityStrip`), and performance charts (`ThreeCol`).

### 2. **Shop Staff Portal (`/shop`)**
- Point-of-Sale (POS) cashier flow, saree catalog browsing, customer registration, discount management, and digital invoice generation.

### 3. **Weaver Portal (`/weaver`)**
- Tailored view for individual artisan weavers to check assigned looms, active warp batches, completion dates, piece-rate wages, and payout history.

### 4. **Worker / Warehouse Portal (`/worker`)**
- Warehouse staff interface for inspecting raw silk receipts, issuing yarn to weavers, conducting Quality Control (QC) checks on finished sarees, and updating inventory status.

---

## 🎨 Design System & Color Tokens

The visual language reflects the heritage and prestige of silk craftsmanship:

- **Royal Burgundy (`#6E0F2D`)**: Primary brand color for active tabs, primary buttons, and key callouts.
- **Antique Gold (`#C89B47` / `#E7C983`)**: Luxury accents, section borders, and highlighted metric counters.
- **Warm Cream (`#F5E8D0` / `#FFFDF9`)**: Background canvas and glassmorphic card fills.
- **Dark Burgundy (`#0D0207` / `#1A0A0F`)**: Deep hero canvas and navigation header background.
- **Micro-Animations**: Framer Motion spring transitions (`stiffness: 420`, `damping: 34`), entrance staggers, and Ken Burns hero zoom effects.

---

## 🧪 Verification & Build Commands

To verify type safety and build validity across the project:

```bash
# Navigate to the frontend directory
cd frontend

# Run TypeScript type check (Must return 0 errors)
npx tsc --noEmit

# Run local Vite development server
npm run dev

# Build production bundle
npm run build
```

---

*Documentation maintained for Beere Kesava & Brothers Silks Codebase.*
