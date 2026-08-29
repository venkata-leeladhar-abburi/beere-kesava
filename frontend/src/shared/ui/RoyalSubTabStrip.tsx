import React from "react";

export interface SubTabItem<T extends string = string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
}

export function RoyalSubTabStrip<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: {
  tabs: readonly SubTabItem<T>[] | SubTabItem<T>[];
  activeTab: T;
  onTabChange: (key: any) => void;
  className?: string;
}) {
  return (
    <div className={`w-full overflow-x-auto section-nav-scroll pb-0.5 mb-6 border-b-2 border-[rgba(110,15,45,0.12)] ${className}`}>
      <div className="flex items-center justify-between w-full min-w-full gap-4 px-1">
        {tabs.map(t => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTabChange(t.key)}
              className={
                "flex-1 rounded-t-xl px-4 py-3.5 mb-[-2px] text-sm sm:text-[15px] cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-200 relative " +
                (isActive
                  ? "bg-[rgba(110,15,45,0.07)] text-[#6E0F2D] font-extrabold border-b-[3.5px] border-[#6E0F2D] shadow-2xs"
                  : "bg-transparent text-[#886A58] hover:text-[#6E0F2D] hover:bg-[rgba(110,15,45,0.03)] font-semibold border-b-[3.5px] border-transparent")
              }
            >
              {t.icon && <span className={isActive ? "text-[#6E0F2D]" : "text-[#886A58]"}>{t.icon}</span>}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
