"use client";

import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Generate sample activity data for the heatmap
const generateActivityData = () => {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const data: Record<string, number> = {};

  // Loop through each day of the year
  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];

    // Generate random activity count (more likely to be 0)
    const rand = Math.random();
    let count = 0;

    if (rand > 0.6) count = Math.floor(Math.random() * 3) + 1;
    if (rand > 0.85) count = Math.floor(Math.random() * 5) + 3;
    if (rand > 0.95) count = Math.floor(Math.random() * 7) + 8;

    data[dateStr] = count;
  }

  return data;
};

// Get the day of week (0-6, where 0 is Sunday)
const getDayOfWeek = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.getDay();
};

// Get the week number relative to the start date
const getWeekNumber = (dateStr: string, startDate: Date) => {
  const date = new Date(dateStr);
  const diffTime = Math.abs(date.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
};

// Format date for display
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Get color based on activity count
const getColorClass = (count: number) => {
  if (count === 0) return "bg-gray-100 dark:bg-gray-800";
  if (count <= 2) return "bg-emerald-200 dark:bg-emerald-900";
  if (count <= 5) return "bg-emerald-300 dark:bg-emerald-700";
  if (count <= 10) return "bg-emerald-400 dark:bg-emerald-600";
  return "bg-emerald-500 dark:bg-emerald-500";
};

export function ActivityHeatmap() {
  const [activityData, setActivityData] = useState<Record<string, number>>({});
  const [weeks, setWeeks] = useState<string[][]>([]);

  useEffect(() => {
    // In a real app, you would fetch this data from your API
    const data = generateActivityData();
    setActivityData(data);

    // Organize dates into weeks for the grid
    const dates = Object.keys(data).sort();
    const startDate = new Date(dates[0]);

    const weekGrid: string[][] = Array(53)
      .fill(null)
      .map(() => Array(7).fill(""));

    dates.forEach((date) => {
      const dayOfWeek = getDayOfWeek(date);
      const weekNumber = getWeekNumber(date, startDate);

      if (weekNumber < 53) {
        weekGrid[weekNumber][dayOfWeek] = date;
      }
    });

    setWeeks(weekGrid);
  }, []);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="overflow-auto">
      <div className="flex min-w-max">
        <div className="mt-6 mr-2 grid grid-cols-1 gap-1">
          {dayLabels.map((day, i) => (
            <div
              key={day}
              className="text-muted-foreground flex h-3 items-center justify-end text-xs"
            >
              {i % 2 === 1 ? day : ""}
            </div>
          ))}
        </div>

        <div className="grid grid-flow-col gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-rows-7 gap-1">
              {week.map((date, dayIndex) => (
                <TooltipProvider key={`${weekIndex}-${dayIndex}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`h-3 w-3 rounded-sm ${date ? getColorClass(activityData[date] || 0) : "bg-transparent"}`}
                      />
                    </TooltipTrigger>
                    {date && (
                      <TooltipContent side="top">
                        <div className="text-xs">
                          <p className="font-medium">{formatDate(date)}</p>
                          <p>{activityData[date] || 0} contributions</p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <span className="text-muted-foreground text-xs">Less</span>
        <div className="flex gap-1">
          {[
            "bg-gray-100 dark:bg-gray-800",
            "bg-emerald-200 dark:bg-emerald-900",
            "bg-emerald-300 dark:bg-emerald-700",
            "bg-emerald-400 dark:bg-emerald-600",
            "bg-emerald-500 dark:bg-emerald-500",
          ].map((color, i) => (
            <div key={i} className={`h-3 w-3 rounded-sm ${color}`} />
          ))}
        </div>
        <span className="text-muted-foreground text-xs">More</span>
      </div>
    </div>
  );
}
