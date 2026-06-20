import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-context";
import { usePayments } from "@/lib/use-api";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Payments — Learnly" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const { courses } = useApp();
  const { data, isLoading } = usePayments();
  const locked = courses.filter((c) => c.locked);
  const history = data?.results ?? [];

  return (
    <RequireAuth>
      <AppLayout>
        <div className="space-y-6">
        {locked.length > 0 && (
          <Card className="p-6 border-border shadow-soft">
            <h3 className="font-display font-bold text-xl mb-4">Unlock new courses</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {locked.map((c) => (
                <div key={c.id} className="rounded-xl border border-border p-4 flex flex-col">
                  <div className={`h-24 rounded-lg bg-gradient-to-br ${c.thumbnail} mb-3`} />
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.lessons} lessons</div>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-lg font-bold font-display">${c.price}</span>
                    <Button size="sm" asChild className="gradient-primary text-white border-0">
                      <Link to="/payment/$courseId" params={{ courseId: c.id }}>Pay</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="border-border shadow-soft overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-display font-bold text-xl">Payment history</h3>
            <p className="text-sm text-muted-foreground mt-1">Your past transactions</p>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No payment history yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Course</th>
                    <th className="px-5 py-3 text-left font-medium">Method</th>
                    <th className="px-5 py-3 text-left font-medium">Date</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="px-5 py-3 font-medium">Course #{h.course}</td>
                      <td className="px-5 py-3 text-muted-foreground capitalize">{h.payment_method}</td>
                      <td className="px-5 py-3 text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-right font-semibold">${h.amount}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={
                          h.status === "success" ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" :
                          h.status === "failed"  ? "bg-red-500/10 text-red-700 border-red-200" :
                          "bg-amber-500/10 text-amber-700 border-amber-200"
                        }>
                          {h.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
    </RequireAuth>
  );
}
