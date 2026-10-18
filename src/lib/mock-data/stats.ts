import { PropertyTypeDistribution, AppointmentsTrendItem, InquiriesTrendItem } from "@/types/stats";

export const PROPERTY_TYPE_DISTRIBUTION: PropertyTypeDistribution[] = [
  { name: "سكني (فيلات وشقق)", count: 4, percentage: 57, color: "#C6A15B" },
  { name: "تجاري وإداري", count: 2, percentage: 29, color: "#171717" },
  { name: "أراضي وزراعي", count: 1, percentage: 14, color: "#A98242" },
];

export const APPOINTMENTS_TREND_DATA: AppointmentsTrendItem[] = [
  { date: "12 أكتوبر", requests: 3, confirmed: 2 },
  { date: "13 أكتوبر", requests: 5, confirmed: 4 },
  { date: "14 أكتوبر", requests: 4, confirmed: 3 },
  { date: "15 أكتوبر", requests: 7, confirmed: 6 },
  { date: "16 أكتوبر", requests: 6, confirmed: 5 },
  { date: "17 أكتوبر", requests: 9, confirmed: 7 },
  { date: "18 أكتوبر", requests: 8, confirmed: 6 },
];

export const INQUIRIES_TREND_DATA: InquiriesTrendItem[] = [
  { month: "مايو", inquiries: 45, leads: 22 },
  { month: "يونيو", inquiries: 58, leads: 31 },
  { month: "يوليو", inquiries: 72, leads: 40 },
  { month: "أغسطس", inquiries: 95, leads: 54 },
  { month: "سبتمبر", inquiries: 110, leads: 68 },
  { month: "أكتوبر", inquiries: 135, leads: 82 },
];
