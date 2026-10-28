import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users2,
  MailCheck,
  CalendarDays,
  ShieldCheck,
  Globe2,
  BarChart3,
  Settings,
  KeyRound,
  LucideIcon,
} from "lucide-react";
import { ModuleType } from "@/types/team";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  module?: ModuleType;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: "الرئيسية",
    items: [
      {
        title: "لوحة التحكم",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "إدارة العقارات",
    items: [
      {
        title: "العقارات",
        href: "/properties",
        icon: Building2,
        module: "properties",
      },
      {
        title: "المواقع الجغرافية",
        href: "/locations",
        icon: MapPin,
        module: "properties",
      },
    ],
  },
  {
    title: "إدارة العملاء والعمليات",
    items: [
      {
        title: "العملاء",
        href: "/clients",
        icon: Users2,
        module: "clients",
      },
      {
        title: "طلبات استعادة كلمة المرور",
        href: "/password-recovery",
        icon: KeyRound,
        module: "clients",
      },
      {
        title: "استفسارات الموقع",
        href: "/inquiries",
        icon: MailCheck,
        badge: "جديد",
        module: "inquiries",
      },
      {
        title: "المعاينات",
        href: "/appointments",
        icon: CalendarDays,
        module: "appointments",
      },
    ],
  },
  {
    title: "إدارة النظام والمحتوى",
    items: [
      {
        title: "المسؤولون والصلاحيات",
        href: "/team",
        icon: ShieldCheck,
        module: "team",
      },
      {
        title: "محتوى الموقع",
        href: "/website-content",
        icon: Globe2,
        module: "websiteContent",
      },
      {
        title: "التقارير",
        href: "/reports",
        icon: BarChart3,
        module: "reports",
      },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      {
        title: "الإعدادات العامة",
        href: "/settings",
        icon: Settings,
        module: "settings",
      },
    ],
  },
];
