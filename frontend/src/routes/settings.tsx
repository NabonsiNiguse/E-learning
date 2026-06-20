import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useApp } from "@/context/app-context";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Learnly" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { logout } = useApp();
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleUpdatePassword = () => {
    if (!currentPw) { toast.error("Enter your current password."); return; }
    if (newPw.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { toast.error("Passwords do not match."); return; }
    toast.success("Password updated successfully.");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  const handleDeleteAccount = async () => {
    setDeleteOpen(false);
    toast.success("Account deleted. Signing out…");
    await new Promise((r) => setTimeout(r, 1200));
    logout();
  };
  return (
    <RequireAuth>
    <AppLayout>
      <div className="max-w-3xl space-y-5">
        <Card className="p-6 border-border shadow-soft">
          <h3 className="font-display font-bold text-lg">Notifications</h3>
          <p className="text-sm text-muted-foreground mt-1">Choose what you want to be notified about</p>
          <Separator className="my-5" />
          <div className="space-y-5">
            {[
              { l: "Course updates", d: "Get notified when an instructor updates a course" },
              { l: "New lessons", d: "Email me when new lessons are published" },
              { l: "Marketing emails", d: "Recommendations & special offers" },
              { l: "Weekly digest", d: "A summary of your learning progress" },
            ].map((n, i) => (
              <div key={n.l} className="flex items-start justify-between gap-4 group">
                <div>
                  <div className="font-medium text-sm group-hover:text-foreground transition-colors">{n.l}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.d}</div>
                </div>
                <Switch defaultChecked={i < 2} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 border-border shadow-soft">
          <h3 className="font-display font-bold text-lg">Security</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage your password and account security</p>
          <Separator className="my-5" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Current password</Label><Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} /></div>
            <div /><div className="space-y-2"><Label>New password</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
            <div className="space-y-2"><Label>Confirm new password</Label><Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></div>
          </div>
          <Button onClick={handleUpdatePassword} className="mt-5 gradient-primary text-white border-0 shadow-[0_4px_16px_-4px] shadow-primary/40 hover:shadow-[0_6px_20px_-4px] hover:shadow-primary/50 transition-shadow">Update password</Button>
        </Card>

        <Card className="p-6 border border-destructive/30 bg-destructive/5 shadow-soft">
          <h3 className="font-display font-bold text-lg text-destructive">Danger zone</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="hover:shadow-[0_4px_16px_-4px_rgba(239,68,68,0.4)] transition-shadow">Delete account</Button>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete account?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete your account and all associated data. This action <strong>cannot be undone</strong>.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>Yes, delete my account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
    </RequireAuth>
  );
}
