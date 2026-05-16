"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { BreakdownItem, TrendPoint } from "@/lib/reports/types";

type TrendChartProps = {
  data: TrendPoint[];
  label: string;
  valueLabel?: string;
  comparisonLabel?: string;
};

type BreakdownChartProps = {
  data: BreakdownItem[];
  label: string;
};

function EmptyChart({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex h-[220px] items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--soft)] text-[13px] font-medium text-[var(--muted)]"
    >
      Not enough data yet
    </div>
  );
}

export function ReportTrendChart({
  data,
  label,
  valueLabel = "Current",
  comparisonLabel = "Previous"
}: TrendChartProps) {
  const chartId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const currentGradientId = `${chartId}-report-current`;
  const previousGradientId = `${chartId}-report-previous`;

  if (data.length === 0) {
    return <EmptyChart label={label} />;
  }

  return (
    <div role="img" aria-label={label} className="h-[240px] min-w-0 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={220}
        initialDimension={{ width: 360, height: 240 }}
      >
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={currentGradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={previousGradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--muted-2)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--muted-2)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              color: "var(--ink)",
              fontSize: 12
            }}
            labelStyle={{ color: "var(--muted)" }}
          />
          <Area
            dataKey="comparison"
            name={comparisonLabel}
            type="monotone"
            stroke="var(--muted-2)"
            fill={`url(#${previousGradientId})`}
            isAnimationActive={false}
          />
          <Area
            dataKey="value"
            name={valueLabel}
            type="monotone"
            stroke="var(--primary)"
            strokeWidth={2}
            fill={`url(#${currentGradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportBreakdownChart({ data, label }: BreakdownChartProps) {
  if (data.length === 0) {
    return <EmptyChart label={label} />;
  }

  const rows = data.slice(0, 7);

  return (
    <div role="img" aria-label={label} className="h-[220px] min-w-0 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={200}
        initialDimension={{ width: 360, height: 220 }}
      >
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ left: 12, right: 12, top: 8, bottom: 8 }}
        >
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            allowDecimals={false}
            axisLine={false}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
            type="number"
          />
          <YAxis
            axisLine={false}
            dataKey="label"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
            type="category"
            width={92}
          />
          <Tooltip
            contentStyle={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              color: "var(--ink)",
              fontSize: 12
            }}
            formatter={(value, _name, item) => [
              `${value} (${item.payload.percent}%)`,
              "Count"
            ]}
          />
          <Bar
            dataKey="value"
            fill="var(--primary)"
            radius={[0, 5, 5, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
