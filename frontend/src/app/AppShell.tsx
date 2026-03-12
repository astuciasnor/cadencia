import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateLabel } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { APP_TABS, type AppTabId } from "./navigation";

interface AppShellProps {
  activeTab: AppTabId;
  onTabChange: (tab: AppTabId) => void;
  children: ReactNode;
}

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const currentFocus = useAppStore((store) => store.state.currentFocus);
  const dayPlanItems = useAppStore((store) => store.state.dayPlan.items.length);
  const completedSessionsToday = useAppStore(
    (store) => store.state.history[new Date().toISOString().slice(0, 10)]?.completedFocusSessions ?? 0
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col gap-4 px-4 py-4 md:px-5 md:py-5">
      <header className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/60 px-5 py-5 shadow-panel backdrop-blur-sm lg:grid-cols-[minmax(0,1fr),280px]">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="blue">Cadência V2</Badge>
            <Badge variant="success">Tablet 10&quot; first</Badge>
            <Badge variant="muted">{formatDateLabel()}</Badge>
            <Badge variant="muted">Persistência local ativa</Badge>
          </div>
          <div className="max-w-4xl">
            <h1 className="text-balance text-[1.85rem] font-semibold leading-tight tracking-[-0.05em] text-white md:text-[2.2rem]">
              Estrutura, seleção, foco e execução no mesmo fluxo.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Base da V2 com domínio explícito, persistência local e painéis compactos para leitura prática em tablet e notebook.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-slate-500">Foco atual</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {currentFocus ? currentFocus.label : "Nenhum foco definido no momento."}
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-slate-500">Hoje</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {dayPlanItems} itens no plano do dia · {completedSessionsToday} sessões concluídas.
            </p>
          </div>
        </div>
      </header>

      <nav className="sticky top-4 z-10 grid grid-cols-5 gap-2 rounded-[1.5rem] border border-white/10 bg-slate-950/72 p-2 shadow-panel backdrop-blur-sm">
        {APP_TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            className="h-11 rounded-[1.1rem] px-3 text-sm"
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </nav>

      <main className="grid gap-4">{children}</main>
    </div>
  );
}
