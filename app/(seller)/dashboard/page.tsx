"use client";

import React, { useState } from "react";
import { RecentReviews } from "./components/Review";
import Overview from "./components/Overview";
import SelectDropdown from "./components/commons/Fields/SelectDropdown";
import AreaChart from "./components/commons/AreaChart";
import { LuLayoutDashboard } from "react-icons/lu";

const periods = [
  { value: "last_year", label: "All" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "last_month", label: "Last month" },
  { value: "last_year", label: "Last year" },
];

const DashboardPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0]);

  return (
    <>
      <div className="card mb-6 hover:shadow-lg transition-all duration-300 rounded-xl bg-white cursor-default">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-green-800!">
            <LuLayoutDashboard />
            Seller Dashboard
          </h2>
          <SelectDropdown
            options={periods}
            value={selectedPeriod}
            onChange={setSelectedPeriod}
          />
        </div>
        <p className="text-sm mt-1 text-gray-600">
          From your dashboard, you can easily access and control your
          <span className="text-green-800"> selling platform</span>
        </p>
      </div>
      <div className="space-y-4 text-gray-700 p-0 md:p-0">
        <Overview period={selectedPeriod.value} />
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-[calc(70%-0.5rem)]">
            <AreaChart />
          </div>

          <div className="w-full md:w-[calc(30%-0.5rem)]">
            <RecentReviews />
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
