import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import type { Claim } from "@shared/schema";
import { useClaims } from "@/hooks/useClaims";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { calculateTotalQuantity } from "@/lib/claimUtils";
import {
  addDays,
  formatDateInput,
  parseDateInput,
  toDate,
  formatShortDate,
  startOfWeek,
} from "@/lib/dateUtils";

type BreakdownItem = {
  label: string;
  value: number;
  ratio: number;
  width: number;
};

type SeriesPoint = {
  label: string;
  count: number;
  rangeLabel: string;
};

const analyticsFontCss = `
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Fraunces:opsz,wght@9..144,600&display=swap");
`;

const normalizeLabel = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "未設定";
};

const buildBreakdown = (
  items: Array<{ label: string; value: number }>,
  top = 6
): BreakdownItem[] => {
  const sorted = [...items].sort((a, b) => b.value - a.value).slice(0, top);
  const total = sorted.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(1, ...sorted.map((item) => item.value));
  return sorted.map((item) => ({
    label: item.label,
    value: item.value,
    ratio: total ? item.value / total : 0,
    width: (item.value / max) * 100,
  }));
};

const makeBreakdownFromMap = (map: Map<string, number>) => {
  return buildBreakdown(
    Array.from(map.entries()).map(([label, value]) => ({ label, value }))
  );
};

export default function Analytics() {
  const { t } = useTranslation();
  const { data: claims = [], isLoading } = useClaims({ status: "COMPLETED" });
  const today = new Date();
  const [startDate, setStartDate] = useState(() =>
    formatDateInput(addDays(today, -90))
  );
  const [endDate, setEndDate] = useState(() => formatDateInput(today));

  const applyRangeDays = (days: number) => {
    const end = new Date();
    const start = addDays(end, -days);
    setStartDate(formatDateInput(start));
    setEndDate(formatDateInput(end));
  };

  const { filteredClaims, rangeLabel } = useMemo(() => {
    const rawStart = parseDateInput(startDate);
    const rawEnd = parseDateInput(endDate);
    if (!rawStart || !rawEnd) {
      return { filteredClaims: [], rangeLabel: "-" };
    }
    const start = rawStart <= rawEnd ? rawStart : rawEnd;
    const end = rawStart <= rawEnd ? rawEnd : rawStart;
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const label = `${formatShortDate(start)} - ${formatShortDate(end)}`;
    const list = claims.filter((claim) => {
      const occurrence = toDate(claim.occurrenceDate);
      if (!occurrence) return false;
      return occurrence >= start && occurrence <= end;
    });
    return { filteredClaims: list, rangeLabel: label };
  }, [claims, startDate, endDate]);

  const totalDefects = useMemo(
    () => filteredClaims.reduce((sum, claim) => sum + (calculateTotalQuantity(claim) ?? 0), 0),
    [filteredClaims]
  );

  const series = useMemo<SeriesPoint[]>(() => {
    const bucket = new Map<string, { date: Date; count: number }>();
    filteredClaims.forEach((claim) => {
      const occurrence = toDate(claim.occurrenceDate);
      if (!occurrence) return;
      const weekStart = startOfWeek(occurrence);
      const key = formatDateInput(weekStart);
      const entry = bucket.get(key) || { date: weekStart, count: 0 };
      entry.count += 1;
      bucket.set(key, entry);
    });
    return Array.from(bucket.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((entry) => {
        const end = addDays(entry.date, 6);
        return {
          label: formatShortDate(entry.date),
          count: entry.count,
          rangeLabel: `${formatShortDate(entry.date)} - ${formatShortDate(end)}`,
        };
      });
  }, [filteredClaims]);

  const {
    processItems,
    defectItems,
    customerItems,
    dcItems,
    processTotal,
    defectTotal,
    customerTotal,
    dcTotal,
  } = useMemo(() => {
    const processMap = new Map<string, number>();
    const defectMap = new Map<string, number>();
    const customerMap = new Map<string, number>();
    const dcMap = new Map<string, number>();

    filteredClaims.forEach((claim) => {
      const processLabel = normalizeLabel(
        (claim as any).occurrenceProcess ?? claim.correctiveAction
      );
      processMap.set(processLabel, (processMap.get(processLabel) ?? 0) + 1);

      const defectLabel = normalizeLabel(claim.defectCode ?? undefined);
      defectMap.set(defectLabel, (defectMap.get(defectLabel) ?? 0) + 1);

      const customerLabel = normalizeLabel(claim.customerName);
      customerMap.set(customerLabel, (customerMap.get(customerLabel) ?? 0) + 1);

      if (claim.dcItems && claim.dcItems.length > 0) {
        claim.dcItems.forEach((item) => {
          const dcLabel = normalizeLabel(item.dc);
          const qty = item.quantity ?? 0;
          dcMap.set(dcLabel, (dcMap.get(dcLabel) ?? 0) + qty);
        });
      }
    });

    return {
      processItems: makeBreakdownFromMap(processMap),
      defectItems: makeBreakdownFromMap(defectMap),
      customerItems: makeBreakdownFromMap(customerMap),
      dcItems: makeBreakdownFromMap(dcMap),
      processTotal: processMap.size,
      defectTotal: defectMap.size,
      customerTotal: customerMap.size,
      dcTotal: dcMap.size,
    };
  }, [filteredClaims]);

  return (
    <div className="space-y-6">
      <style>{analyticsFontCss}</style>
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-muted/40 via-background to-muted/30 p-6 text-foreground">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-12 h-52 w-52 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight"
              style={{ fontFamily: '"Space Grotesk", "Open Sans", sans-serif' }}
            >
              {t("nav.analytics")}
            </h1>
            <p className="text-sm text-muted-foreground">
              発生工程・不具合コード・顧客・DC別の傾向を俯瞰します
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="rounded-full border bg-card/80 px-3 py-1 font-medium">
              期間: {rangeLabel}
            </div>
            <div className="rounded-full border bg-card/80 px-3 py-1 font-medium">
              対象件数: {filteredClaims.length} 件
            </div>
            <div className="rounded-full border bg-card/80 px-3 py-1 font-medium">
              不良数合計: {totalDefects.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border bg-muted/20 p-4">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">開始日</div>
          <Input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="min-w-[160px]"
          />
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">終了日</div>
          <Input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="min-w-[160px]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => applyRangeDays(30)}>
            過去30日
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyRangeDays(90)}>
            過去90日
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyRangeDays(180)}>
            過去180日
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border bg-card p-5 shadow-sm text-card-foreground">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: '"Space Grotesk", "Open Sans", sans-serif' }}
              >
                週次の発生推移
              </h2>
              <p className="text-xs text-muted-foreground">
                発生日ベースの件数推移
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="mt-8 text-sm text-muted-foreground">Loading...</div>
          ) : series.length === 0 ? (
            <div className="mt-8 text-sm text-muted-foreground">
              期間内のデータがありません
            </div>
          ) : (
            <ChartContainer
              className="mt-6 h-[260px] w-full"
              config={{
                count: {
                  label: "件数",
                  color: "hsl(18, 83%, 45%)",
                },
              }}
            >
              <AreaChart data={series} margin={{ left: 0, right: 12, top: 8 }}>
                <defs>
                  <linearGradient id="analytics-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.rangeLabel ?? ""
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                  fill="url(#analytics-fill)"
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm text-card-foreground">
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: '"Space Grotesk", "Open Sans", sans-serif' }}
          >
            サマリー
          </h2>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">発生工程数</div>
              <div className="text-2xl font-semibold">
                {processTotal.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">不具合コード数</div>
              <div className="text-2xl font-semibold">
                {defectTotal.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">顧客数</div>
              <div className="text-2xl font-semibold">
                {customerTotal.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">DC数</div>
              <div className="text-2xl font-semibold">
                {dcTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BreakdownCard title="発生工程別" unit="件" items={processItems} />
        <BreakdownCard title="不具合コード別" unit="件" items={defectItems} />
        <BreakdownCard title="顧客別" unit="件" items={customerItems} />
        <BreakdownCard title="DC別（不良数）" unit="不良数" items={dcItems} />
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  unit,
  items,
}: {
  title: string;
  unit: string;
  items: BreakdownItem[];
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm text-card-foreground">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">上位{items.length}件</span>
      </div>
      {items.length === 0 ? (
        <div className="mt-6 text-sm text-muted-foreground">
          対象データがありません
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{item.label}</span>
                <span className="text-muted-foreground">
                  {item.value.toLocaleString()} {unit} (
                  {Math.round(item.ratio * 100)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400"
                  style={{ width: `${Math.max(4, item.width)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
