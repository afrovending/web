import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import isTodayPlugin from "dayjs/plugin/isToday";
import isYesterdayPlugin from "dayjs/plugin/isYesterday";
import weekOfYear from "dayjs/plugin/weekOfYear";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { CANADA_TIMEZONE } from "@/setting";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(isTodayPlugin);
dayjs.extend(isYesterdayPlugin);
dayjs.extend(weekOfYear);
dayjs.extend(localizedFormat);

/**
 * Format relative time (e.g. "1 minute ago", "3 hours ago")
 */
export const formatTimeAgo = (timestamp: string): string => {
  if (!timestamp) return "";

  const date = dayjs(timestamp);
  if (!date.isValid()) return "";

  return date.fromNow();
};

/**
 * Human readable date for notifications:
 * - Today, 3:45PM
 * - Yesterday, 11:18AM
 * - Tue 5:21PM (same week)
 * - 3rd, January (older)
 */

export function formatHumanReadableDate(timestamp: string): string {
  // Use .utc(timestamp, true) if your API date is a simple string like "2025-12-17"
  // to prevent it from shifting timezones incorrectly.
  const date = dayjs.utc(timestamp).tz(CANADA_TIMEZONE, true);

  if (!date.isValid()) return "N/A";

  const now = dayjs().tz(CANADA_TIMEZONE);

  if (date.isToday()) {
    return `Today, ${date.format("h:mma")}`;
  }

  if (date.isYesterday()) {
    return `Yesterday, ${date.format("h:mma")}`;
  }

  // Simplified Tomorrow check using dayjs plugin logic
  const tomorrow = now.add(1, "day");
  if (date.isSame(tomorrow, "day")) {
    return `Tomorrow, ${date.format("h:mma")}`;
  }

  // Check if it's within the current week
  if (date.week() === now.week() && date.isAfter(now)) {
    return `${date.format("ddd")}, ${date.format("h:mma")}`;
  }

  return date.format("DD MMMM, YYYY");
}
export function formatHumanReadable(timestamp: string): string {
let date = dayjs.utc(timestamp).tz(CANADA_TIMEZONE, true).hour(18).minute(0);

if (!date.isValid()) return "N/A";

const now = dayjs().tz(CANADA_TIMEZONE);
const tomorrow = now.add(1, "day");

// 2. Smart Logic for labels
if (date.isToday()) {
  return `Today, ${date.format("h:mma")}`; // "Today, 12:00pm"
}

if (date.isSame(tomorrow, "day")) {
  return `Tomorrow, ${date.format("h:mma")}`; // "Tomorrow, 12:00pm"
}

// 3. For the current week: "Thu, 12:00pm"
if (date.week() === now.week() && date.isAfter(now)) {
  return `${date.format("ddd")}, ${date.format("h:mma")}`;
}

// 4. For everything else: "Dec 25, 12:00pm"
return `${date.format("MMM D")}, ${date.format("h:mma")}`;
}

/**
 * Simple short formatting (e.g. "21 Feb")
 */
export function formatDate(date: string | Date): string {
  const d = dayjs(date);
  if (!d.isValid()) return "";

  return d.format("DD MMM");
}
