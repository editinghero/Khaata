import { useState } from "react";
import { LayoutDashboard, Receipt, CalendarClock, PieChart, Settings, TrendingUp, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const items = [
  { icon: LayoutDashboard, label: "Overview", to: "/" },
  { icon: Receipt, label: "Transactions", to: "/transactions" },
  { icon: CalendarClock, label: "Bills & EMI", to: "/bills" },
  { icon: PieChart, label: "Analytics", to: "/analytics" },
  { icon: TrendingUp, label: "Budgets", to: "/budgets" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

function NavBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <img src="/khaata-logo.png" alt="Khaata logo" width={36} height={36} className="h-9 w-9 rounded-xl shadow-glow" />
        <div>
          <div className="font-bold tracking-tight text-foreground text-lg">Khaata</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Smart Finance · India</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={label}
            to={to}
            end={to === "/"}
            onClick={onNavigate}
            className={({ isActive }) => cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-secondary text-foreground shadow-card-glow"
                : "text-sidebar-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                <span>{label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 lg:mt-auto rounded-xl border border-border/60 bg-gradient-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-foreground">Cloud sync</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your transactions are securely stored and synced across devices.
        </p>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[248px] shrink-0 flex-col border-r border-border/60 bg-sidebar/40 backdrop-blur-xl px-4 py-6">
      <NavBody />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] bg-sidebar/95 backdrop-blur-xl border-border/60 px-4 py-6 flex flex-col">
        <NavBody onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
