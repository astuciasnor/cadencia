import { useEffect } from "react";
import { AppShell } from "@/app/AppShell";
import { DayPlanPage } from "@/features/day-plan/DayPlanPage";
import { ProgressPage } from "@/features/progress/ProgressPage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { RhythmPage } from "@/features/rhythm/RhythmPage";
import { TimerPage } from "@/features/timer/TimerPage";
import { useAppStore } from "@/stores/app-store";

export default function App() {
  const activeTab = useAppStore((store) => store.ui.activeTab);
  const hydrate = useAppStore((store) => store.hydrate);
  const setActiveTab = useAppStore((store) => store.setActiveTab);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "timer" && <TimerPage />}
      {activeTab === "projects" && <ProjectsPage />}
      {activeTab === "day-plan" && <DayPlanPage />}
      {activeTab === "task-rhythm" && <RhythmPage />}
      {activeTab === "day-progress" && <ProgressPage />}
    </AppShell>
  );
}
