"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts"; 
import { MONTHS } from "@/setting";
import { getVendorEarningsGraph } from "@/lib/api/seller/earnings";
import { formatDate } from "@/utils/formatDate";
import { formatAmount } from "@/utils/formatCurrency";
import AreaChartSkeleton from "@/app/components/common/skeletons/AreaChartSkeleton";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface SalesDataPoint {
  date: string;
  total: string;
}

interface ApiResponse {
  status: "success" | "error";
  data: SalesDataPoint[];
}

interface SalesGraphProps {
  initialMonth?: string;  
}

export default function SalesGraph({ initialMonth }: SalesGraphProps) {
  const [chartData, setChartData] = useState<{
    categories: string[];
    series: number[];
  }>({ categories: [], series: [] });
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  // Month selector
  const monthOptions = MONTHS.map((m) => ({ label: m, value: m }));
  const currentMonthName = new Date().toLocaleString("en-US", {
    month: "long",
  });
  const defaultSelectedOption =
    monthOptions.find(
      (opt) =>
        opt.value.trim().toLowerCase() ===
        (initialMonth || currentMonthName).trim().toLowerCase()
    ) || monthOptions[0];
  const [selected, setSelected] = useState<{ label: string; value: string }>(
    defaultSelectedOption
  );

  const fetchChartData = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const response: ApiResponse | null = await getVendorEarningsGraph();
      const raw = response?.data || [];

      if (response?.status === "success" && raw.length > 0) {
        const categories = raw.map((item: SalesDataPoint) =>
          formatDate(new Date(item.date))
        );
        const series = raw.map((item: SalesDataPoint) =>
          parseFloat(item.total)
        );

        setChartData({ categories, series });
        setHasData(true);
      } else {
        setChartData({ categories: [], series: [] });
        setHasData(false);
      }
    } catch (error) {
      console.error("Error fetching sales graph:", error);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChartData(selected.value);
  }, [fetchChartData, selected]);

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        height: 350,
        toolbar: { show: false },
        background: "transparent",
      },
      plotOptions: {
        bar: { horizontal: false, columnWidth: "50%", endingShape: "rounded" },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: chartData.categories,
        labels: { style: { colors: "#a1a1aa" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: "#a1a1aa" },
          formatter: (val) => formatAmount(val),
        },
      },
      tooltip: { theme: "dark", y: { formatter: (val) => formatAmount(val) } },
      fill: { colors: ["#F97316"] },
      colors: ["#F97316"],
      series: [{ name: "Total Sales", data: chartData.series }],
      grid: {
        show: true,
        strokeDashArray: 4,
        padding: { top: 10, bottom: 0, left: 10, right: 10 },
      },
    }),
    [chartData]
  );

  return (
    <div className="card p-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Sales Graph</h2>
        
      </div>

      {loading ? (
        <AreaChartSkeleton />
      ) : hasData ? (
        <ReactApexChart
          options={options}
          series={options.series as any}
          type="bar"
          height={300}
        />
      ) : (
        <div className="text-center text-black py-10">
          No data available for {selected.label}
        </div>
      )}
    </div>
  );
}
