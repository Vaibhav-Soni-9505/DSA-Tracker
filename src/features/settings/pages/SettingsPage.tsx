import { useState } from "react";
import { useProgress } from "@/hooks/useProgress";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

export default function SettingsPage() {
  const { resetProgress, loadTestData } = useProgress();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleResetConfirm = () => {
    resetProgress();
    setIsResetDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your application preferences and local tracking data.
        </p>
      </div>

      {/* Data Management Section */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-1">Local Data Management</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Reset local storage tracking states. This controls the mock progress, solved checkboxes, and revision schedules.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border rounded-lg bg-muted/20">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">Reset All Progress</h3>
              <p className="text-xs text-muted-foreground">
                Permanently clear all solved problems and scheduled revisions.
              </p>
            </div>
            <button
              onClick={() => setIsResetDialogOpen(true)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-4 text-xs font-semibold shadow-xs transition-colors shrink-0 focus-visible:outline-hidden dark:border-destructive/35"
            >
              <Trash2 className="h-4 w-4" />
              Reset All Progress
            </button>
          </div>

          {import.meta.env.DEV && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-blue-500/20 rounded-lg bg-blue-500/5">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Load Revision Test Data (Dev Only)</h3>
                <p className="text-xs text-muted-foreground">
                  Injects 3 test problems into your active progress to test the UI flow.
                </p>
              </div>
              <button
                onClick={() => {
                  loadTestData();
                  alert("Test data loaded!");
                }}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 text-xs font-semibold shadow-xs transition-colors shrink-0 focus-visible:outline-hidden"
              >
                Load Test Data
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset all progress?</DialogTitle>
            <DialogDescription className="pt-2">
              This will remove your solved status, first solved dates, and revision progress from this device.
              <br /><br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 sm:justify-end gap-2 sm:gap-0 border-t border-border/50 pt-4">
            <DialogClose asChild>
              <button className="h-9 px-4 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent focus-visible:outline-hidden transition-colors">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleResetConfirm}
              className="h-9 px-4 rounded-md text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs focus-visible:outline-hidden transition-colors"
            >
              Reset Progress
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
