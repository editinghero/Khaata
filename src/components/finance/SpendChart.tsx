import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/finance";

interface Props {
  data: { label: string; expense: number; bill: number; emi: number }[];
}

export function SpendChart({ data }: Props) {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Cash flow</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 6 months · expenses, bills & EMI</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Legend color="hsl(var(--expense))" label="Expenses" />
          <Legend color="hsl(var(--bill))" label="Bills" />
          <Legend color="hsl(var(--emi))" label="EMI" />
        </div>
      </div>
      <div className="h-[280px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--expense))" stopOpacity={0.45} />
                <stop offset="100%" stopColor="hsl(var(--expense))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gBill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--bill))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--bill))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gEmi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--emi))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--emi))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
              tickFormatter={(v) => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : v >= 1000 ? `₹${(v/1000).toFixed(1)}k` : `₹${v}`} />
            <Tooltip
              cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 10px 30px -10px hsl(0 0% 0% / 0.5)",
              }}
              formatter={(v: number, n) => [formatCurrency(v), String(n).charAt(0).toUpperCase() + String(n).slice(1)]}
            />
            <Area type="monotone" dataKey="expense" stroke="hsl(var(--expense))" strokeWidth={2} fill="url(#gExpense)" />
            <Area type="monotone" dataKey="bill" stroke="hsl(var(--bill))" strokeWidth={2} fill="url(#gBill)" />
            <Area type="monotone" dataKey="emi" stroke="hsl(var(--emi))" strokeWidth={2} fill="url(#gEmi)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <span>{label}</span>
    </div>
  );
}
