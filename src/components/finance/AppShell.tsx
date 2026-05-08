import { ReactNode } from "react";
import { Sidebar } from "@/components/finance/Sidebar";
import { Topbar } from "@/components/finance/Topbar";
import { useTransactions } from "@/lib/finance";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface Props { children: (api: ReturnType<typeof useTransactions>) => ReactNode }

export function AppShell({ children }: Props) {
  const { user, loading: authLoading } = useAuth();
  const tx = useTransactions();

  if (authLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onAdd={tx.add} items={tx.items} />
        <main className="flex-1 px-3 sm:px-5 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-5 sm:space-y-6 animate-fade-in">
          {children(tx)}
          <footer className="pt-2 pb-4 text-center text-xs text-muted-foreground">
            Khaata · Built with care · Synced securely.
          </footer>
        </main>
      </div>
    </div>
  );
}
