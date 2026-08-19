import { useSimulatedDate } from "@/hooks/useSimulatedDate";
import { formatDate } from "@/lib/date";

export function SimulatedDateControl() {
  const { today, isSimulated, nextDay, prevDay, resetDate } = useSimulatedDate();

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-lg">
      <div className="flex flex-col items-end pr-2 border-r border-border">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Simulated Today
        </span>
        <span className={`text-sm font-medium ${isSimulated ? "text-amber-500" : "text-foreground"}`}>
          {formatDate(today.toISOString())}
        </span>
      </div>
      <div className="flex gap-1">
        <button
          onClick={prevDay}
          className="rounded px-2 py-1 text-xs font-medium border border-border hover:bg-accent transition-colors"
        >
          -1d
        </button>
        <button
          onClick={nextDay}
          className="rounded px-2 py-1 text-xs font-medium border border-border hover:bg-accent transition-colors"
        >
          +1d
        </button>
        {isSimulated && (
          <button
            onClick={resetDate}
            className="rounded px-2 py-1 text-xs font-medium border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
