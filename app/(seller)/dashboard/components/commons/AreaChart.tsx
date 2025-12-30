"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import AreaChartSkeleton from "../Skeletons/AreaChartSkeleton";
import SelectDropdown from "./Fields/SelectDropdown";
import { MONTHS } from "@/setting";
import { getSalesGraph } from "@/lib/api/seller/overview";
import { formatDate } from "@/utils/formatDate";
import { formatAmount } from "@/utils/formatCurrency";

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

const AreaChart = () => {
  const [chartData, setChartData] = useState<{
    categories: string[];
    series: number[];
  }>({
    categories: [],
    series: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [hasData, setHasData] = useState<boolean>(false);

  const monthOptions = MONTHS.map((m) => ({ label: m, value: m }));
 
  const currentMonthName = new Date().toLocaleString("en-US", {
    month: "long",
  });
 
  const defaultSelectedOption =
    monthOptions.find(
      (opt) =>
        opt.value.trim().toLowerCase() === currentMonthName.trim().toLowerCase()
    ) || monthOptions[0];

  const [selected, setSelected] = useState<{ label: string; value: string }>(
    defaultSelectedOption
  );

  const fetchChartData = useCallback(async (selectedPeriod: string) => {
    setLoading(true);
    try {
      const response: ApiResponse | null = await getSalesGraph(selectedPeriod);
      const raw = response?.data || [];
      if (
        response?.status === "success" &&
        Array.isArray(raw) &&
        raw.length > 0
      ) {
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
      console.error("Failed to fetch sales graph data:", error);
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
        type: "area",
        height: 350,
        toolbar: { show: false },
        background: "transparent",
        zoom: { enabled: true },
      },
      grid: {
        show: true,
        gradientToColors: ["rgba(249, 115, 22, 0.15)"],
        strokeDashArray: 4,
        padding: {
          top: 10,
          bottom: 0,
          left: 10,
          right: 10,
        },
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: "smooth",
        width: 1.5,
        colors: ["#F97316"],
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.4,
          inverseColors: false,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 90, 100],
          colorStops: [
            { offset: 0, color: "rgba(249, 115, 22, 0.4)", opacity: 0.4 },
            { offset: 100, color: "rgba(249, 115, 22, 0.05)", opacity: 0.05 },
          ],
        },
        colors: ["#F97316"],
      },
      series: [{ name: "Total Sales", data: chartData.series }],
      xaxis: {
        categories: chartData.categories,
        labels: {
          style: { colors: "#a1a1aa" },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: "#a1a1aa" },
          formatter: (val) => formatAmount(val),
        },
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: (val) => formatAmount(val),
        },
      },
      markers: {
        size: 4,
        colors: ["#F97316"],
        strokeColors: "#ffffff",
        strokeWidth: 2,
        hover: { size: 6 },
      },
    }),
    [chartData]
  );

  return (
    <>
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-normal">Sales Graph</h2>
          <SelectDropdown
            options={monthOptions}
            value={selected}
            onChange={setSelected}
          />
        </div>
        <div className="p-0 text-gray-950">
          {loading ? (
            <AreaChartSkeleton />
          ) : hasData ? (
            <ReactApexChart
              options={options}
              series={options.series}
              type="area"
              height={300}
            />
          ) : (
            <div className="text-center text-black py-10">
              No data available for {selected.label}.
            </div>
          )}
        </div>
      </div>
     
    </>
  );
};

export default AreaChart;
