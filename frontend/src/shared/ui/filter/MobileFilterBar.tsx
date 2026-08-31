import { useState } from "react";
import { X, SlidersHorizontal, Check } from "lucide-react";
import { Drawer } from "../overlay/Drawer";
import { Button, SearchInput } from "../primitives";

export interface FilterOption {
  value: string;
  label: string;
}

export interface MobileFilterGroup {
  id: string;
  label: string;
  value: string;
  defaultValue?: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export interface MobileFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filterGroups: MobileFilterGroup[];
  onResetAll?: () => void;
  className?: string;
}

export function MobileFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filterGroups,
  onResetAll,
  className = "",
}: MobileFilterBarProps) {
  const [openDrawer, setOpenDrawer] = useState(false);

  // Count active non-default filters
  const activeFilters = filterGroups.filter(g => {
    const defaultVal = g.defaultValue ?? "All";
    return g.value !== defaultVal;
  });

  const activeCount = activeFilters.length;

  return (
    <div className={`w-full flex flex-col gap-2.5 ${className}`}>
      {/* Primary compact search & filter bar */}
      <div className="flex items-center gap-2.5 w-full">
        <div className="flex-1 min-w-0">
          <SearchInput
            aria-label={searchPlaceholder || "Search"}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full text-xs sm:text-sm"
          />
        </div>
        <Button
          onClick={() => setOpenDrawer(true)}
          variant={activeCount > 0 ? "secondary" : "tertiary"}
          size="sm"
          className={`shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeCount > 0
              ? "!bg-[#6E0F2D] !text-white shadow-xs"
              : "border border-[var(--border-default)] bg-white text-[#3B2314] hover:bg-[#F7F2EA]"
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-white text-[#6E0F2D] text-[11px] font-extrabold leading-none">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {/* Horizontal pill chips for active filters & quick scroll */}
      <div className="w-full overflow-x-auto section-nav-scroll pb-1 flex items-center gap-1.5 flex-nowrap text-xs">
        {activeFilters.map(g => {
          const matchedOpt = g.options.find(o => o.value === g.value);
          const displayLabel = matchedOpt ? matchedOpt.label : g.value;
          return (
            <span
              key={g.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6E0F2D]/10 text-[#6E0F2D] border border-[#6E0F2D]/20 font-semibold shrink-0 whitespace-nowrap"
            >
              <span>{g.label}: <strong>{displayLabel}</strong></span>
              <button
                type="button"
                onClick={() => g.onChange(g.defaultValue ?? "All")}
                className="hover:opacity-75 cursor-pointer ml-0.5"
                aria-label={`Clear filter for ${g.label}`}
              >
                <X size={12} />
              </button>
            </span>
          );
        })}

        {activeCount > 1 && onResetAll && (
          <button
            type="button"
            onClick={onResetAll}
            className="text-[#6E0F2D] hover:underline text-xs font-bold shrink-0 px-2 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Mobile Bottom Sheet Drawer for filters */}
      <Drawer open={openDrawer} onOpenChange={setOpenDrawer} side="bottom" size="lg">
        <Drawer.Header
          title="Filter Options"
          subtitle="Refine inventory and listings"
          onClose={() => setOpenDrawer(false)}
        />
        <Drawer.Body className="space-y-6 py-2">
          {filterGroups.map(g => (
            <div key={g.id} className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#7A6859] flex items-center justify-between">
                <span>{g.label}</span>
                {g.value !== (g.defaultValue ?? "All") && (
                  <button
                    type="button"
                    onClick={() => g.onChange(g.defaultValue ?? "All")}
                    className="text-[11px] text-[#6E0F2D] hover:underline font-semibold cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {g.options.map(opt => {
                  const isSelected = g.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => g.onChange(opt.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? "bg-[#6E0F2D] text-white border-[#6E0F2D] shadow-xs"
                          : "bg-white text-[#3B2314] border-[var(--border-default)] hover:bg-[#F7F2EA]"
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </Drawer.Body>
        <Drawer.Footer>
          {activeCount > 0 && onResetAll && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => {
                onResetAll();
              }}
              className="mr-auto text-xs"
            >
              Reset All
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => setOpenDrawer(false)}
            className="w-full sm:w-auto bg-[#6E0F2D] text-white font-bold text-xs px-6"
          >
            Apply Filters ({activeCount})
          </Button>
        </Drawer.Footer>
      </Drawer>
    </div>
  );
}
