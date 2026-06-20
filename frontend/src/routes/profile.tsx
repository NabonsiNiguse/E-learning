import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Camera, Mail, MapPin, Briefcase, Save, X } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/app-context";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Learnly" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { currentUser, role } = useApp();

  // AuthUser has first_name / last_name / full_name / email
  const firstName = currentUser?.first_name ?? currentUser?.full_name?.split(" ")[0] ?? "";
  const lastName  = currentUser?.last_name  ?? currentUser?.full_name?.split(" ")[1] ?? "";
  const fullName  = currentUser?.full_name  ?? `${firstName} ${lastName}`.trim();
  const email     = currentUser?.email ?? "";

  // Initials for avatar fallback
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";

  const bio = role === "teacher"
    ? currentUser?.teacher_profile?.bio ?? ""
    : currentUser?.student_profile?.bio ?? "";

  const [form, setForm] = useState({ firstName, lastName, email, bio });
  const [dirty, setDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setField = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const handleSave = () => {
    toast.success("Profile updated.");
    setDirty(false);
  };

  const handleCancel = () => {
    setForm({ firstName, lastName, email, bio });
    setDirty(false);
    toast.info("Changes discarded.");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) toast.success(`Avatar "${file.name}" selected — would upload in production.`);
  };

  return (
    <RequireAuth>
      <AppLayout>
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar card */}
        <div className="space-y-4">
          <Card className="p-6 border-border shadow-soft text-center">
            <div className="relative w-24 h-24 mx-auto">
              <div className="h-24 w-24 rounded-full gradient-primary flex items-center justify-center text-white text-3xl font-semibold shadow-glow">
                {initials}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <button
                onClick={handleAvatarClick}
                title="Change avatar"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-background border border-border shadow-sm flex items-center justify-center hover:bg-secondary hover:border-foreground/20 hover:shadow-md transition-all duration-150 active:scale-95">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="mt-4 font-display font-bold text-xl">{fullName}</h2>
            <Badge variant="outline" className="mt-1.5 capitalize bg-primary-soft border-primary/20 text-accent-foreground">
              {role}
            </Badge>
            <div className="mt-5 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                Addis Ababa, ET
              </div>
              <div className="flex items-center justify-center gap-2">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                Member since 2025
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border shadow-soft">
            <h3 className="font-semibold mb-4">Stats</h3>
            <div className="space-y-3">
              {role === "student" && [
                { l: "Courses enrolled", v: "8"   },
                { l: "Certificates",     v: "3"   },
                { l: "Hours learned",    v: "142h" },
              ].map((s) => (
                <div key={s.l} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{s.l}</span>
                  <span className="font-semibold">{s.v}</span>
                </div>
              ))}
              {role === "teacher" && [
                { l: "Courses created", v: "3"    },
                { l: "Total students",  v: "2,204" },
                { l: "Avg. rating",     v: "4.8"  },
              ].map((s) => (
                <div key={s.l} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{s.l}</span>
                  <span className="font-semibold">{s.v}</span>
                </div>
              ))}
              {role === "admin" && [
                { l: "Users managed",  v: "2,847" },
                { l: "Courses active", v: "124"   },
                { l: "Revenue",        v: "$48k"  },
              ].map((s) => (
                <div key={s.l} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{s.l}</span>
                  <span className="font-semibold">{s.v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Edit form */}
        <Card className="p-6 border-border shadow-soft">
          <h3 className="font-display font-bold text-xl mb-1">Edit profile</h3>
          <p className="text-sm text-muted-foreground mb-6">Update your personal information</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input defaultValue="+251 9 12 34 56 78" />
            </div>
            {role === "teacher" && (
              <div className="space-y-2">
                <Label>Expertise</Label>
                <Input defaultValue={currentUser?.teacher_profile?.expertise ?? ""} />
              </div>
            )}
            <div className="space-y-2 sm:col-span-2">
              <Label>Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setField("bio", e.target.value)}
                placeholder="Tell us about yourself…"
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel} disabled={!dirty}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button className="gradient-primary text-white border-0 gap-1.5" onClick={handleSave} disabled={!dirty}>
              <Save className="h-4 w-4" /> Save changes
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
    </RequireAuth>
  );
}
