import { LucideIcon } from "lucide-react";

export interface ViewOption<T extends string = string> {
  key: T;
  label: string;
  Icon: LucideIcon;
}

export interface ViewSelectorProps<T extends string = string> {
  options: readonly ViewOption<T>[] | ViewOption<T>[];
  activeView: T;
  onViewChange: (key: any) => void;
  className?: string;
}

export function ViewSelector<T extends string = string>({
  options,
  activeView,
  onViewChange,
  className = "",
}: ViewSelectorProps<T>) {
  return (
    <div className={`inline-flex items-center p-0.5 rounded-[12px] border border-[rgba(110,15,45,0.18)] bg-white shadow-2xs ${className}`}>
      {options.map(({ key, label, Icon }, index) => {
        const isActive = activeView === key;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        const radiusClass = isFirst && isLast
          ? "rounded-[10px]"
          : isFirst
          ? "rounded-l-[10px] rounded-r-[4px]"
          : isLast
          ? "rounded-r-[10px] rounded-l-[4px]"
          : "rounded-[4px]";

        return (
          <button
            key={key}
            type="button"
            onClick={() => onViewChange(key)}
            className={
              `px-4 py-2 text-xs sm:text-sm cursor-pointer flex items-center gap-2 transition-all duration-200 ${radiusClass} ` +
              (isActive
                ? "bg-[#6E0F2D] text-white font-bold shadow-xs"
                : "bg-transparent text-[#6E0F2D] hover:bg-[rgba(110,15,45,0.05)] font-semibold")
            }
          >
            <Icon size={16} className={isActive ? "text-white" : "text-[#6E0F2D] opacity-80"} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
