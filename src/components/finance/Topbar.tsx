import { Bell, LogOut, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { ScanReceiptDialog } from "./ScanReceiptDialog";
import { ExportDialog } from "./ExportDialog";
import { AdvisorDialog } from "./AdvisorDialog";
import { MobileSidebar } from "./Sidebar";
import { Transaction } from "@/lib/finance";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

interface Props {
  onAdd: (tx: Omit<Transaction, "id">) => void;
  items: Transaction[];
}

export function Topbar({ onAdd, items }: Props) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.email ?? "U")
    .split("@")[0].slice(0, 2).toUpperCase();

  const doSignOut = async () => { await signOut(); navigate("/auth"); };

  return (
    <header className="flex items-center gap-2 px-3 sm:px-5 lg:px-8 h-14 sm:h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-20">
      <MobileSidebar />
      <div className="flex items-center gap-1.5 lg:hidden min-w-0">
        <img src="/khaata-logo.png" alt="Khaata" width={32} height={32} className="h-8 w-8 rounded-lg shadow-glow shrink-0" />
        <span className="font-bold text-sm tracking-tight truncate">Khaata</span>
      </div>
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search transactions, categories…" className="pl-9 bg-secondary/40 border-border/60 focus-visible:ring-primary/40" />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <AdvisorDialog items={items} />
        <ExportDialog items={items} />
        <ScanReceiptDialog onAdd={onAdd} />
        <Button variant="ghost" size="icon" className="relative hidden sm:inline-flex" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        </Button>
        <AddTransactionDialog onAdd={onAdd} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-0.5 sm:ml-1 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-primary grid place-items-center text-[10px] sm:text-sm font-bold text-primary-foreground shrink-0 hover:opacity-90"
              aria-label="Account menu">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{user?.email ?? "Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/transactions")}>Transactions</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={doSignOut} className="text-expense focus:text-expense">
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
