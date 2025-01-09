import { useAppBranchDataTaskProgressHistory } from "@upsoft/patchkit-launcher-runtime-api-react-theme-extras";
import {
  CSSProperties,
  useContext,
  useMemo,
} from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts";

import { ThemeVariantContext } from "@/contexts/theme-variant-context";
import { ThemeVariant } from "@/lib/theme-variant";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";

export function AppBranchDataTaskProgressBpsChart(
  {
    appId,
    appBranchId,
    appBranchDataTaskId,
    className,
  }: {
    appId: string;
    appBranchId: string;
    appBranchDataTaskId: number;
    className?: string;
  },
) {
  const appBranchDataTaskProgressHistory = useAppBranchDataTaskProgressHistory({
    appId,
    appBranchId,
    appBranchDataTaskId,
  });

  const chartEntriesMaxTimeRangeMs = 60000;

  const chartEntriesMaxTime = appBranchDataTaskProgressHistory.points[appBranchDataTaskProgressHistory.points.length - 1]?.capturedDate.getTime() ?? 0;

  const chartEntries = appBranchDataTaskProgressHistory.points
    .filter(
      appBranchDataTaskProgressHistoryPoint => appBranchDataTaskProgressHistoryPoint.capturedDate.getTime() > chartEntriesMaxTime - chartEntriesMaxTimeRangeMs,
    )
    .map(
      appBranchDataTaskProgressHistoryPoint => ({
        time: appBranchDataTaskProgressHistoryPoint.capturedDate.getTime(),
        downloadingBps: appBranchDataTaskProgressHistoryPoint.appBranchDataTaskProgress?.downloadTask.processedBytesCountPerSecond ?? 0,
        writingToDiskBps: appBranchDataTaskProgressHistoryPoint.appBranchDataTaskProgress?.writeTask.processedBytesCountPerSecond ?? 0,
      }),
    );

  const chartEntriesMaxBps = Math.max(
    ...[
      ...chartEntries.map(chartEntry => chartEntry.downloadingBps),
      ...chartEntries.map(chartEntry => chartEntry.writingToDiskBps),
    ],
  );

  const { themeVariant } = useContext(ThemeVariantContext);

  const chartConfig = useMemo<ChartConfig>(
    () => {
      let downloadingBpsColor: string;
      let writingToDiskBpsColor: string;

      switch (themeVariant) {
        case ThemeVariant.Light:
          downloadingBpsColor = "var(--chart-2)";
          writingToDiskBpsColor = "var(--chart-4)";
          break;
        case ThemeVariant.Dark:
          downloadingBpsColor = "var(--chart-1)";
          writingToDiskBpsColor = "var(--chart-3)";
          break;
      }

      return {
        downloadingBps: {
          label: `Downloading Speed`,
          color: `hsl(${downloadingBpsColor})`,
        },
        writingToDiskBps: {
          label: `Disk Speed`,
          color: `hsl(${writingToDiskBpsColor})`,
        },
      };
    },
    [
      themeVariant,
    ],
  );

  return (
    <ChartContainer className={className} config={chartConfig}>
      <ComposedChart
        accessibilityLayer
        data={chartEntries}
        margin={{
          top: 12,
          left: 12,
          right: 12,
          bottom: 12,
        }}
      >
        <ChartTooltip
          cursor={false}
          content={(
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(_, payload) => {
                if (payload[0] === undefined) {
                  return ``;
                }
                return new Date(payload[0].payload.time).toLocaleTimeString();
              }}
              formatter={(itemValue, itemName, item) => {
                const itemValueAsNumber = itemValue.valueOf() as number;

                const itemValueLabel = itemValueAsNumber > 1024 * 1024
                  ? `${String((Math.floor(itemValueAsNumber / 1024 / 1024 * 10) / 10).toFixed(1))} MB/s`
                  : `${String(Math.floor(itemValueAsNumber / 1024))} KB/s`;

                return (
                  <>
                    <div
                      className="size-2.5 shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]"
                      style={
                        {
                          "--color-bg": item.stroke,
                          "--color-border": item.stroke,
                        } as CSSProperties
                      }
                    />
                    <div
                      className="flex flex-1 items-end justify-between gap-4 leading-none"
                    >
                      <div className="grid gap-1.5">
                        <span className="text-muted-foreground">
                          {chartConfig[itemName]?.label}
                        </span>
                      </div>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {itemValueLabel}
                      </span>
                    </div>
                  </>
                );
              }}
            />
          )}
        />
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          type="number"
          domain={([dataMin, dataMax]) => [Math.max(dataMin, dataMax - chartEntriesMaxTimeRangeMs), Math.max(dataMin + chartEntriesMaxTimeRangeMs, dataMax)]}
          allowDataOverflow={true}
          hide
        />
        <YAxis
          domain={[0, chartEntriesMaxBps < 1024 * 1024 ? 1024 * 1024 : Math.ceil(chartEntriesMaxBps / 1024 / 1024) * 1024 * 1024]}
          ticks={
            (() => {
              if (chartEntriesMaxBps < 1024 * 1024) {
                return [
                  0,
                  1024 * 256,
                  1024 * 512,
                  1024 * 1024,
                ];
              }

              return [
                0,
                1024 * 1024,
                Math.ceil(chartEntriesMaxBps / 2 / 1024 / 1024) * 1024 * 1024,
                Math.ceil(chartEntriesMaxBps / 1024 / 1024) * 1024 * 1024,
              ];
            })()
          }
          axisLine={false}
          tickLine={false}
          tickMargin={8}
          tickFormatter={(value) => {
            if (value >= 1024 * 1024) {
              return `${String(Math.round(value / 1024 / 1024))} MB/s`;
            }

            return `${String(Math.round(value / 1024))} KB/s`;
          }}
        />
        <defs>
          <linearGradient id="fillDownloadingBps" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-downloadingBps)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-downloadingBps)"
              stopOpacity={0.5}
            />
          </linearGradient>
        </defs>
        <Bar
          dataKey="downloadingBps"
          type="bump"
          fill="url(#fillDownloadingBps)"
          fillOpacity={0.4}
          activeBar={{
            fillOpacity: 1,
          }}
          isAnimationActive={false}
          stroke="var(--color-downloadingBps)"
          maxBarSize={Number.MAX_SAFE_INTEGER}
        />
        <Area
          dataKey="writingToDiskBps"
          type="bump"
          fillOpacity={0}
          isAnimationActive={false}
          stroke="var(--color-writingToDiskBps)"
        />
      </ComposedChart>
    </ChartContainer>
  );
}
