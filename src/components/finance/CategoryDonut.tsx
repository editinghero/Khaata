import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/finance";

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--expense))",
  "hsl(var(--bill))",
  "hsl(var(--emi))",
  "hsl(var(--savings))",
  "hsl(280 70% 65%)",
  "hsl(20 85% 60%)",
  "hsl(120 50% 55%)",
];

interface Props {
  data: { name: string; value: number }[];
}

export function CategoryDonut({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const top = data.slice(0, 6);

  return (
    <div className="glass-card p-6 h-full">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-foreground">By category</h3>
        <p className="text-xs text-muted-foreground mt-0.5">This month's spend distribution</p>
      </div>

      <div className="relative h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={top} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="none">
              {top.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
              }}
              formatter={(v: number) => formatCurrency(v)}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
            <div className="text-xl font-bold font-mono-num text-foreground">{formatCurrency(total)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {top.map((c, i) => (
          <div key={c.name} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="text-muted-foreground flex-1">{c.name}</span>
            <span className="font-semibold font-mono-num text-foreground">{formatCurrency(c.value)}</span>
            <span className="text-muted-foreground w-10 text-right">{total ? ((c.value/total)*100).toFixed(0) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
