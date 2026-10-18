import { PropertyCategory, PropertyPurpose, PropertyStatus, FurnishingStatus } from "@/types/property";
import { AppointmentStatus } from "@/types/appointment";
import { LeadStatus, LeadSource } from "@/types/client";
import { InquiryStatus, InquiryType } from "@/types/inquiry";
import { RoleType } from "@/types/team";
import { StatusColor } from "@/types/common";

export const APP_NAME = "إشراقة المستقبل للعقارات";
export const APP_TAGLINE = "نحو غدٍ مشرق";

export const PROPERTY_CATEGORY_LABELS: Record<PropertyCategory, string> = {
  RESIDENTIAL: "سكني",
  COMMERCIAL: "تجاري وإداري",
  AGRICULTURAL: "أراضي وزراعي",
};

export const PROPERTY_PURPOSE_LABELS: Record<PropertyPurpose, string> = {
  SALE: "للبيع",
  RENT: "للإيجار",
};

export const PROPERTY_STATUS_CONFIG: Record<
  PropertyStatus,
  { label: string; color: StatusColor }
> = {
  PUBLISHED: { label: "منشور", color: "success" },
  DRAFT: { label: "مسودة", color: "warning" },
  ARCHIVED: { label: "مؤرشف", color: "neutral" },
  SOLD: { label: "تم البيع", color: "info" },
  RENTED: { label: "تم التأجير", color: "info" },
};

export const FURNISHING_LABELS: Record<FurnishingStatus, string> = {
  FURNISHED: "مفروش بالكامل",
  SEMI_FURNISHED: "نصف مفروش",
  UNFURNISHED: "بدون فرش (على المحارة / تشطيب)",
};

export const APPOINTMENT_STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: StatusColor }
> = {
  PENDING_CONFIRMATION: { label: "في انتظار التأكيد", color: "warning" },
  CONFIRMED: { label: "مؤكد", color: "success" },
  REJECTED: { label: "مرفوض", color: "destructive" },
  CANCELLED: { label: "ملغي", color: "neutral" },
  COMPLETED: { label: "مكتمل", color: "info" },
  NO_SHOW: { label: "لم يحضر العميل", color: "destructive" },
};

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: StatusColor }
> = {
  NEW: { label: "عميل جديد", color: "warning" },
  CONTACTED: { label: "تم التواصل", color: "info" },
  QUALIFIED: { label: "عميل مؤهل", color: "gold" },
  CONVERTED: { label: "تم التعاقد / حجز", color: "success" },
  LOST: { label: "فرصة ضائعة", color: "neutral" },
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE_INQUIRY: "استفسار موقع",
  WHATSAPP: "واتساب",
  PHONE_CALL: "اتصال هاتفي",
  REFERRAL: "توصية / ترشيح",
  SOCIAL_MEDIA: "سوشيال ميديا",
  WALK_IN: "زيارة مباشرة للفرع",
};

export const INQUIRY_STATUS_CONFIG: Record<
  InquiryStatus,
  { label: string; color: StatusColor }
> = {
  NEW: { label: "جديد لم يُقرأ", color: "warning" },
  IN_PROGRESS: { label: "قيد المتابعة", color: "info" },
  REPLIED: { label: "تم الرد", color: "success" },
  CLOSED: { label: "مغلق", color: "neutral" },
};

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  PROPERTY_INQUIRY: "استفسار عن عقار محدد",
  GENERAL_CONTACT: "تواصل عام",
  PRICE_REQUEST: "طلب تسعير / عرض أسعار",
  PARTNERSHIP: "شراكة أو عرض مطور",
};

export const ROLE_CONFIG: Record<RoleType, { label: string; description: string }> = {
  SUPER_ADMIN: {
    label: "مدير النظام العام",
    description: "صلاحيات مطلقة لإدارة كامل لوحة التحكم والمستخدمين والإعدادات",
  },
  MANAGER: {
    label: "مدير فرع / تنفيذي",
    description: "إدارة العقارات والعملاء والمواعيد وتقارير الفريق",
  },
  PROPERTY_MANAGER: {
    label: "مدير عقارات",
    description: "إدارة ونشر وتعديل قوائم العقارات والمشاريع والمواقع",
  },
  SALES_AGENT: {
    label: "مسؤول مبيعات ومعاينات",
    description: "متابعة العملاء المحتملين وطلبات المعاينات والاستفسارات الموكلة إليه",
  },
  CONTENT_EDITOR: {
    label: "محرر محتوى",
    description: "إدارة الأسئلة الشائعة، الشروط، محتوى الموقع ومقالات المدونة",
  },
};

export const AMENITIES_LIST = [
  "تكييف مركزي",
  "موقف سيارات خاص",
  "مصعد كهربائي",
  "أمن وحراسة 24/7",
  "كاميرات مراقبة",
  "حديقة خاصة",
  "حمام سباحة",
  "إطلالة بحرية / مفتوحة",
  "شرفة واسعة",
  "غرفة خادمة",
  "غاز طبيعي",
  "عداد مياه وكهرباء منفصل",
  "مولد كهربائي احتياطي",
  "صالات رياضية مشتركة",
  "أنظمة إطفاء ذكية",
];
