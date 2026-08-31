import { WorkerHomeDesktop } from "./WorkerHomeDesktop";

type Tab = "home" | "qc" | "weavers" | "finishing" | "activity";

interface WorkerHomeProps {
  onNavigate: (tab: Tab) => void;
}

export function WorkerHome({ onNavigate }: WorkerHomeProps) {
  return <WorkerHomeDesktop onNavigate={onNavigate} />;
}
