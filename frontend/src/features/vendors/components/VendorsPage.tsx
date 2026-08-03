import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import { T } from "./vendors-page/theme";
import { Vendor } from "./vendors-page/types";
import { INITIAL_VENDORS } from "./vendors-page/data";
import { VendorsHeroStats } from "./vendors-page/VendorsHeroStats";
import { AddVendorModal } from "./vendors-page/AddVendorModal";
import { VendorAnalyticsSection } from "./vendors-page/VendorAnalyticsSection";
import { VendorDirectorySection } from "./vendors-page/VendorDirectorySection";
import { VendorProfile } from "./vendors-page/VendorProfile";

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const nextId = `VEN-${String(vendors.length + 1).padStart(3, "0")}`;

  if (selectedVendor) return <VendorProfile vendor={selectedVendor} onBack={() => setSelectedVendor(null)} onUpdate={(v) => { setVendors(prev => prev.map(old => old.id === v.id ? v : old)); setSelectedVendor(v); }} />;

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", paddingBottom: 100 }}>
      <VendorsHeroStats vendors={vendors} onAddClick={() => setShowAddForm(true)} />

      <AnimatePresence>
        {showAddForm && (
          <AddVendorModal
            nextId={nextId}
            onCancel={() => setShowAddForm(false)}
            onSave={v => { setVendors(p => [v, ...p]); setShowAddForm(false); }}
          />
        )}
      </AnimatePresence>

      <VendorAnalyticsSection vendors={vendors} />

      <VendorDirectorySection
        vendors={vendors}
        onSelectVendor={setSelectedVendor}
        onAddClick={() => setShowAddForm(v => !v)}
      />
    </div>
  );
}
