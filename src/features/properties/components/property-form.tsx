"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  MapPin,
  Coins,
  Sparkles,
  Image as ImageIcon,
  Globe,
  Save,
  CheckCircle,
} from "lucide-react";
import { propertyFormSchema, PropertyFormValues } from "../schemas/property-schema";
import { Property, PropertyCategory, PropertyStatus } from "@/types/property";
import { AMENITIES_LIST } from "@/lib/constants";
import { MockStore } from "@/lib/services/mock-store";
import { useToast } from "@/components/shared/toast-provider";
import { cn } from "@/lib/utils";

interface PropertyFormProps {
  initialData?: Property;
  isEditing?: boolean;
}

export function PropertyForm({ initialData, isEditing = false }: PropertyFormProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default / initial values
  const defaultValues: Partial<PropertyFormValues> = {
    title: initialData?.title || "",
    code: initialData?.code || `ESH-${Math.floor(1000 + Math.random() * 9000)}`,
    shortDescription: initialData?.shortDescription || "",
    fullDescription: initialData?.fullDescription || "",
    category: initialData?.category || "RESIDENTIAL",
    purpose: initialData?.purpose || "SALE",
    status: initialData?.status || "PUBLISHED",
    price: initialData?.price || 1500000,
    currency: initialData?.currency || "ر.س",
    area: initialData?.area || 180,
    areaUnit: initialData?.areaUnit || "م²",
    maintenanceFee: initialData?.maintenanceFee || 0,
    country: initialData?.location.country || "المملكة العربية السعودية",
    city: initialData?.location.city || "الرياض",
    areaName: initialData?.location.area || "حي النرجس",
    streetAddress: initialData?.location.streetAddress || "",
    bedrooms: initialData?.specs.residential?.bedrooms || 3,
    bathrooms: initialData?.specs.residential?.bathrooms || 2,
    livingRooms: initialData?.specs.residential?.livingRooms || 1,
    floor: initialData?.specs.residential?.floor || 2,
    totalFloors: initialData?.specs.residential?.totalFloors || 5,
    furnishing: initialData?.specs.residential?.furnishing || "SEMI_FURNISHED",
    commercialCategory: initialData?.specs.commercial?.commercialCategory || "مكتب إداري",
    suitableActivity: initialData?.specs.commercial?.suitableActivity || "شركات ومكاتب",
    roomsCount: initialData?.specs.commercial?.roomsCount || 4,
    landClassification: initialData?.specs.agricultural?.landClassification || "زراعية مثمرة",
    waterAvailability: initialData?.specs.agricultural?.waterAvailability ?? true,
    waterSource: initialData?.specs.agricultural?.waterSource || "بئر ارتوازي",
    amenities: initialData?.amenities || ["تكييف مركزي", "موقف سيارات خاص", "أمن وحراسة 24/7"],
    primaryImageUrl:
      initialData?.images[0]?.url ||
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    seoTitle: initialData?.seo.seoTitle || "",
    metaDescription: initialData?.seo.metaDescription || "",
    slug: initialData?.seo.slug || "",
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: defaultValues as PropertyFormValues,
  });

  const selectedCategory = watch("category");
  const selectedAmenities = watch("amenities") || [];
  const primaryImageUrl = watch("primaryImageUrl");
  const title = watch("title");

  // Auto-generate slug from title if empty
  const handleGenerateSlug = () => {
    if (title) {
      const generated = title
        .trim()
        .toLowerCase()
        .replace(/[^\u0621-\u064A0-9a-zA-Z\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);
      setValue("slug", generated + `-${Date.now().toString().slice(-4)}`);
    }
  };

  const toggleAmenity = (amenity: string) => {
    const current = [...selectedAmenities];
    const index = current.indexOf(amenity);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(amenity);
    }
    setValue("amenities", current);
  };

  const onSubmit = (data: PropertyFormValues, statusOverride?: PropertyStatus) => {
    setIsSubmitting(true);
    try {
      const finalStatus = statusOverride || data.status;

      const propertyPayload = {
        code: data.code,
        title: data.title,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        category: data.category as PropertyCategory,
        purpose: data.purpose,
        status: finalStatus,
        price: Number(data.price),
        currency: data.currency,
        area: Number(data.area),
        areaUnit: data.areaUnit,
        maintenanceFee: data.maintenanceFee ? Number(data.maintenanceFee) : undefined,
        location: {
          country: data.country,
          city: data.city,
          area: data.areaName,
          streetAddress: data.streetAddress,
        },
        specs: {
          residential:
            data.category === "RESIDENTIAL"
              ? {
                  bedrooms: Number(data.bedrooms || 0),
                  bathrooms: Number(data.bathrooms || 0),
                  livingRooms: Number(data.livingRooms || 0),
                  floor: Number(data.floor || 0),
                  totalFloors: Number(data.totalFloors || 0),
                  furnishing: data.furnishing || "UNFURNISHED",
                }
              : undefined,
          commercial:
            data.category === "COMMERCIAL"
              ? {
                  commercialCategory: data.commercialCategory || "",
                  suitableActivity: data.suitableActivity || "",
                  roomsCount: Number(data.roomsCount || 0),
                  floor: Number(data.floor || 0),
                }
              : undefined,
          agricultural:
            data.category === "AGRICULTURAL"
              ? {
                  landClassification: data.landClassification || "",
                  waterAvailability: Boolean(data.waterAvailability),
                  waterSource: data.waterSource,
                }
              : undefined,
        },
        amenities: data.amenities,
        images: [
          {
            id: `img-${Date.now()}`,
            url: data.primaryImageUrl,
            caption: "صورة الغلاف الرئيسية",
            isPrimary: true,
          },
        ],
        seo: {
          seoTitle: data.seoTitle || data.title,
          metaDescription: data.metaDescription || data.shortDescription,
          slug: data.slug,
        },
      };

      if (isEditing && initialData) {
        MockStore.updateProperty(initialData.id, propertyPayload);
        success("تم تحديث العقار بنجاح", `تم حفظ التغييرات على العقار (${data.code}).`);
      } else {
        MockStore.addProperty(propertyPayload);
        success("تمت إضافة العقار بنجاح", `تم تسجيل العقار الجديد (${data.code}) في قاعدة البيانات.`);
      }

      router.push("/properties");
    } catch {
      toastError("خطأ", "حدث خطأ أثناء حفظ بيانات العقار.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d))} className="space-y-8 text-right">
      {/* Section A: Basic Info */}
      <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-border-subtle">
          <div className="p-2 rounded-xl bg-brand-gold-light text-brand-gold-deep">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-primary-text">أ. المعلومات الأساسية والتصنيف</h3>
            <p className="text-xs text-secondary-text mt-0.5">العنوان، الكود التعريفي، وصف العقار، ونوع المعاملة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              عنوان العقار <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="مثال: فيلا مستقلة بحمام سباحة خاص بالتجمع الخامس"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
            {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
          </div>

          {/* Property Code */}
          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              كود العقار المميز <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register("code")}
              placeholder="ESH-1001"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
            {errors.code && <p className="text-xs text-rose-500 mt-1">{errors.code.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              تصنيف العقار <span className="text-rose-500">*</span>
            </label>
            <select
              {...register("category")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold cursor-pointer"
            >
              <option value="RESIDENTIAL">سكني (فيلات، شقق، دوبلكس)</option>
              <option value="COMMERCIAL">تجاري وإداري (مكاتب، محلات، عيادات)</option>
              <option value="AGRICULTURAL">أراضي وزراعي (مزارع، أراضي استصلاح)</option>
            </select>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              الغرض من الطرح <span className="text-rose-500">*</span>
            </label>
            <select
              {...register("purpose")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold cursor-pointer"
            >
              <option value="SALE">للبيع والشراء</option>
              <option value="RENT">للإيجار</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              حالة النشر الحالية
            </label>
            <select
              {...register("status")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold cursor-pointer"
            >
              <option value="PUBLISHED">منشور ومتاح على الموقع</option>
              <option value="DRAFT">مسودة قيد المراجعة</option>
              <option value="SOLD">تم البيع</option>
              <option value="RENTED">تم التأجير</option>
              <option value="ARCHIVED">مؤرشف</option>
            </select>
          </div>

          {/* Short Description */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              الوصف الموجز (يظهر في كارت المعاينة السريعة) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register("shortDescription")}
              placeholder="ملخص جذاب من سطر واحد يبرز أهم مزايا العقار..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
            {errors.shortDescription && <p className="text-xs text-rose-500 mt-1">{errors.shortDescription.message}</p>}
          </div>

          {/* Full Description */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              الوصف التفصيلي الكامل <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              {...register("fullDescription")}
              placeholder="اكتب شرحاً وافياً عن التقسيم الداخلي، الإطلالة، مواصفات التشطيب، الخدمات المتوفرة في المنطقة..."
              className="w-full p-3.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold resize-y"
            />
            {errors.fullDescription && <p className="text-xs text-rose-500 mt-1">{errors.fullDescription.message}</p>}
          </div>
        </div>
      </div>

      {/* Section B: Location */}
      <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-border-subtle">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-primary-text">ب. الموقع الجغرافي والعنوان</h3>
            <p className="text-xs text-secondary-text mt-0.5">الدولة، المدينة، المنطقة، وتفاصيل العنوان</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">الدولة</label>
            <input
              type="text"
              {...register("country")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">المدينة</label>
            <input
              type="text"
              list="saudi-cities-list"
              {...register("city")}
              placeholder="الرياض، جدة، الدمام، مكة..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
            <datalist id="saudi-cities-list">
              <option value="الرياض" />
              <option value="مدينة جدة" />
              <option value="مكة المكرمة" />
              <option value="الدمام" />
              <option value="الخبر" />
              <option value="الخرج" />
              <option value="الدرعية" />
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">المنطقة أو الحي</label>
            <input
              type="text"
              list="saudi-districts-list"
              {...register("areaName")}
              placeholder="حي النرجس، حي الياسمين، حي الملقا..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
            <datalist id="saudi-districts-list">
              <option value="حي النرجس" />
              <option value="حي الياسمين" />
              <option value="حي الملقا" />
              <option value="حي حطين" />
              <option value="حي العليا" />
              <option value="حي الشاطئ" />
              <option value="حي الروضة" />
              <option value="حي الحمراء" />
              <option value="أبحر الشمالية" />
              <option value="حي العزيزية" />
              <option value="حي الفيصلية" />
              <option value="حي الحزام الذهبي" />
            </datalist>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              العنوان التفصيلي / اسم المشروع أو الشارع
            </label>
            <input
              type="text"
              {...register("streetAddress")}
              placeholder="طريق الملك فهد، تقاطع شارع التحلية، فيلا 14..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
          </div>
        </div>
      </div>

      {/* Section C: Pricing & Dimensions */}
      <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-border-subtle">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-primary-text">ج. السعر والمساحة والرسوم</h3>
            <p className="text-xs text-secondary-text mt-0.5">القيمة المالية، العملة، المساحة ووحدة القياس</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              السعر المطلوب <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              {...register("price")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-tabular focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
            {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">العملة</label>
            <select
              {...register("currency")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold cursor-pointer"
            >
              <option value="ر.س">ريال سعودي (ر.س)</option>
              <option value="ر.س / سنوي">ريال سعودي سنوياً (ر.س / سنوي)</option>
              <option value="ر.س / شهري">ريال سعودي شهرياً (ر.س / شهري)</option>
              <option value="USD">دولار أمريكي (USD)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              المساحة <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              {...register("area")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-tabular focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
            {errors.area && <p className="text-xs text-rose-500 mt-1">{errors.area.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">وحدة المساحة</label>
            <select
              {...register("areaUnit")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold cursor-pointer"
            >
              <option value="م²">متر مربع (م²)</option>
              <option value="فدان">فدان زراعي</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              وديعة الصيانة / الرسوم السنوية (اختياري)
            </label>
            <input
              type="number"
              {...register("maintenanceFee")}
              placeholder="مثال: 25000"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-tabular focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
          </div>
        </div>
      </div>

      {/* Section D: Category-Specific Specifications */}
      <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-border-subtle">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-primary-text">
              د. المواصفات المتكيفة حسب نوع العقار ({selectedCategory === "RESIDENTIAL" ? "سكني" : selectedCategory === "COMMERCIAL" ? "تجاري وإداري" : "أراضي وزراعي"})
            </h3>
            <p className="text-xs text-secondary-text mt-0.5">الحقول المعروضة تتغير تلقائياً حسب تصنيف العقار المختار أعلاه</p>
          </div>
        </div>

        {/* Residential Fields */}
        {selectedCategory === "RESIDENTIAL" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">غرف النوم</label>
              <input
                type="number"
                {...register("bedrooms")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">الحمامات</label>
              <input
                type="number"
                {...register("bathrooms")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">الريسبشن والمعيشة</label>
              <input
                type="number"
                {...register("livingRooms")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">رقم الطابق</label>
              <input
                type="number"
                {...register("floor")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">إجمالي الأدوار</label>
              <input
                type="number"
                {...register("totalFloors")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">حالة الفرش</label>
              <select
                {...register("furnishing")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
              >
                <option value="FURNISHED">مفروش بالكامل</option>
                <option value="SEMI_FURNISHED">نصف مفروش</option>
                <option value="UNFURNISHED">بدون فرش</option>
              </select>
            </div>
          </div>
        )}

        {/* Commercial Fields */}
        {selectedCategory === "COMMERCIAL" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">نوع العقار التجاري</label>
              <input
                type="text"
                {...register("commercialCategory")}
                placeholder="مكتب إداري، محل، معرض، كافيه..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">الأنشطة المناسبة</label>
              <input
                type="text"
                {...register("suitableActivity")}
                placeholder="شركات تكنولوجية، عيادات طبية..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">عدد المكاتب أو القاعات</label>
              <input
                type="number"
                {...register("roomsCount")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-tabular"
              />
            </div>
          </div>
        )}

        {/* Agricultural Fields */}
        {selectedCategory === "AGRICULTURAL" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">تصنيف الأرض</label>
              <input
                type="text"
                {...register("landClassification")}
                placeholder="زراعية مثمرة، استصلاح حديث..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">توفر مصدر المياه</label>
              <select
                {...register("waterAvailability")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
              >
                <option value="true">متوفر (بئر أو ري نيلي)</option>
                <option value="false">غير متوفر حالياً</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">مصدر الري</label>
              <input
                type="text"
                {...register("waterSource")}
                placeholder="بئر ارتوازي عذب، ترعة مباشرة..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section E: Features and Amenities */}
      <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-4">
        <h3 className="font-bold text-base text-primary-text pb-2 border-b border-neutral-border-subtle">
          هـ. المميزات والخدمات المتاحة
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {AMENITIES_LIST.map((amenity) => {
            const isChecked = selectedAmenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={cn(
                  "p-3 rounded-xl border text-xs font-medium text-right flex items-center justify-between transition-all",
                  isChecked
                    ? "bg-brand-gold-light border-brand-gold text-brand-charcoal font-semibold shadow-2xs"
                    : "bg-warm-white border-neutral-border text-secondary-text hover:bg-zinc-100"
                )}
              >
                <span>{amenity}</span>
                <span
                  className={cn(
                    "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mr-2",
                    isChecked
                      ? "bg-brand-gold border-brand-gold text-brand-charcoal"
                      : "border-zinc-300 bg-white"
                  )}
                >
                  {isChecked && <CheckCircle className="w-3 h-3 text-brand-charcoal" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section F: Media & Cover Image */}
      <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-border-subtle">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-primary-text">و. صور العقار والوسائط</h3>
            <p className="text-xs text-secondary-text mt-0.5">صورة الغلاف الرئيسية والصور الملحقة</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-primary-text mb-1.5">
            رابط صورة الغلاف الرئيسية <span className="text-rose-500">*</span>
          </label>
          <input
            type="url"
            {...register("primaryImageUrl")}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-mono dir-ltr focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
          />
          {errors.primaryImageUrl && <p className="text-xs text-rose-500 mt-1">{errors.primaryImageUrl.message}</p>}
        </div>

        {primaryImageUrl && (
          <div className="mt-3">
            <p className="text-xs text-secondary-text mb-2">معاينة الغلاف:</p>
            <div className="relative w-full max-w-sm aspect-video rounded-xl overflow-hidden border border-neutral-border bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={primaryImageUrl} alt="معاينة الغلاف" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
      </div>

      {/* Section G: SEO & Publication */}
      <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-border-subtle">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-primary-text">ز. تحسين محركات البحث والنشر (SEO)</h3>
            <p className="text-xs text-secondary-text mt-0.5">عنوان السيو، الوصف الميتاديتا، والرابط المخصص (Slug)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">عنوان السيو (SEO Title)</label>
            <input
              type="text"
              {...register("seoTitle")}
              placeholder="فيلا للبيع في التجمع الخامس | إشراقة المستقبل"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-primary-text">
                الرابط المخصص (Slug) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateSlug}
                className="text-[11px] font-semibold text-brand-gold-deep hover:underline"
              >
                توليد من العنوان
              </button>
            </div>
            <input
              type="text"
              {...register("slug")}
              placeholder="villa-mivida-fifth-settlement"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-mono dir-ltr focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
            {errors.slug && <p className="text-xs text-rose-500 mt-1">{errors.slug.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-primary-text mb-1.5">وصف الميتا (Meta Description)</label>
            <input
              type="text"
              {...register("metaDescription")}
              placeholder="وصف مختصر لمحركات البحث وجوجل..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
          </div>
        </div>
      </div>

      {/* Form Submission Actions */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-surface/95 backdrop-blur-md border border-neutral-border shadow-lg flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-xs sm:text-sm font-medium text-secondary-text hover:text-primary-text hover:bg-zinc-100 rounded-xl transition-colors border border-neutral-border"
        >
          إلغاء والعودة
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit((data) => onSubmit(data, "DRAFT"))}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-text bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-secondary-text" />
            <span>حفظ كمسودة</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs shadow-brand-gold/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isEditing ? "حفظ التعديلات" : "نشر العقار الآن"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
