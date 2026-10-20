import { z } from "zod";

export const propertyFormSchema = z.object({
  title: z.string().min(5, "عنوان العقار يجب ألا يقل عن 5 أحرف"),
  code: z.string().min(3, "كود العقار مطلوب ويجب ألا يقل عن 3 أحرف"),
  shortDescription: z.string().min(10, "الوصف القصير يجب ألا يقل عن 10 أحرف"),
  fullDescription: z.string().min(20, "الوصف التفصيلي يجب ألا يقل عن 20 حرفاً"),
  category: z.enum(["RESIDENTIAL", "COMMERCIAL", "AGRICULTURAL"]),
  purpose: z.enum(["SALE", "RENT"]),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED", "SOLD", "RENTED"]),

  // Pricing
  price: z.coerce.number().positive("السعر يجب أن يكون قيمة موجبة أكبر من صفر"),
  currency: z.string().default("ر.س"),
  hasDiscount: z.boolean().default(false).optional(),
  originalPrice: z.coerce.number().positive("السعر الأصلي يجب أن يكون قيمة موجبة").optional(),
  discountPercentage: z.coerce.number().min(1, "نسبة الخصم يجب أن تكون 1% على الأقل").max(99, "نسبة الخصم لا يمكن أن تتجاوز 99%").optional(),
  area: z.coerce.number().positive("المساحة يجب أن تكون قيمة موجبة أكبر من صفر"),
  areaUnit: z.enum(["م²", "فدان"]),
  maintenanceFee: z.coerce.number().optional(),

  // Location
  country: z.string().min(2, "اسم الدولة مطلوب"),
  city: z.string().min(2, "اسم المدينة مطلوب"),
  areaName: z.string().min(2, "اسم المنطقة أو الحي مطلوب"),
  streetAddress: z.string().optional(),

  // Specs
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  livingRooms: z.coerce.number().optional(),
  floor: z.coerce.number().optional(),
  totalFloors: z.coerce.number().optional(),
  furnishing: z.enum(["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"]).optional(),

  commercialCategory: z.string().optional(),
  suitableActivity: z.string().optional(),
  roomsCount: z.coerce.number().optional(),

  landClassification: z.string().optional(),
  waterAvailability: z.boolean().optional(),
  waterSource: z.string().optional(),

  // Amenities
  amenities: z.array(z.string()).default([]),

  // Media
  primaryImageUrl: z.string().min(1, "صورة الغلاف الرئيسية مطلوبة"),

  // SEO
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  slug: z.string().min(3, "الرابط المخصص (Slug) مطلوب"),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;
