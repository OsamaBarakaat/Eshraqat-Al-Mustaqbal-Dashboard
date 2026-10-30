"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  UploadCloud,
  Upload,
  Trash2,
  Plus,
  Star,
  Layers,
  Tag,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { propertyFormSchema, PropertyFormValues } from "../schemas/property-schema";
import { Property, PropertyCategory, PropertyStatus, PropertyImage } from "@/types/property";
import { Province, District } from "@/types/location";
import { AMENITIES_LIST } from "@/lib/constants";
import { MockStore } from "@/lib/services/mock-store";
import { apiClient } from "@/lib/services/api-client";
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

  // Locations loaded dynamically from MockStore
  const [provinces, setProvinces] = useState<Province[]>(() => MockStore.getLocations());

  useEffect(() => {
    const unsubscribe = MockStore.subscribe(() => {
      setProvinces(MockStore.getLocations());
    });
    return unsubscribe;
  }, []);

  // Flattened enabled cities across Saudi provinces
  const allCities = useMemo(() => {
    const list: { id: string; name: string; provinceName: string; districts: District[] }[] = [];
    provinces
      .filter((p) => p.enabled)
      .forEach((p) => {
        p.cities
          .filter((c) => c.enabled)
          .forEach((c) => {
            list.push({
              id: c.id,
              name: c.nameArabic,
              provinceName: p.nameArabic,
              districts: c.districts.filter((d) => d.enabled),
            });
          });
      });
    return list;
  }, [provinces]);

  // Secondary gallery images (all images excluding the primary cover)
  const [galleryImages, setGalleryImages] = useState<PropertyImage[]>(() => {
    if (initialData?.images && initialData.images.length > 0) {
      const primaryImg = initialData.images.find((img) => img.isPrimary) || initialData.images[0];
      return initialData.images.filter((img) => img !== primaryImg);
    }
    return [];
  });

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

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
    hasDiscount: Boolean(initialData?.originalPrice && initialData.originalPrice > initialData.price),
    originalPrice: initialData?.originalPrice || undefined,
    discountPercentage:
      initialData?.discountPercentage ||
      (initialData?.originalPrice && initialData.originalPrice > initialData.price
        ? Math.round(((initialData.originalPrice - initialData.price) / initialData.originalPrice) * 100)
        : undefined),
    area: initialData?.area || 180,
    areaUnit: initialData?.areaUnit || "م²",
    maintenanceFee: initialData?.maintenanceFee || 0,
    country: "المملكة العربية السعودية",
    city: initialData?.location.city || "مدينة الرياض",
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
      initialData?.images?.find((img) => img.isPrimary)?.url ||
      initialData?.images?.[0]?.url ||
      "",
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
  const selectedCity = watch("city");
  const selectedArea = watch("areaName");
  const hasDiscount = Boolean(watch("hasDiscount"));
  const price = watch("price") as number | undefined;
  const originalPrice = watch("originalPrice") as number | undefined;
  const discountPercentage = watch("discountPercentage") as number | undefined;
  const currency = (watch("currency") as string) || "ر.س";

  // Dynamic available districts according to the selected city
  const availableDistricts = useMemo(() => {
    if (!selectedCity) return [];
    const found = allCities.find(
      (c) => c.name === selectedCity || c.name.includes(selectedCity) || selectedCity.includes(c.name)
    );
    return found ? found.districts : [];
  }, [allCities, selectedCity]);

  // Handle City Change: update city and select first district
  const handleCityChange = (newCity: string) => {
    setValue("city", newCity, { shouldValidate: true });
    const found = allCities.find(
      (c) => c.name === newCity || c.name.includes(newCity) || newCity.includes(c.name)
    );
    if (found && found.districts.length > 0) {
      setValue("areaName", found.districts[0].nameArabic, { shouldValidate: true });
    } else {
      setValue("areaName", "", { shouldValidate: true });
    }
  };

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

  // Primary Cover image file upload from device with live cloud upload
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toastError("نوع الملف غير مدعوم", "يرجى اختيار ملف صورة صالح (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toastError("حجم الملف كبير", "الحد الأقصى المسموح به لحجم صورة الغلاف هو 10 ميجابايت.");
      return;
    }

    setIsUploadingCover(true);
    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setValue("primaryImageUrl", localPreview, { shouldValidate: true });

    try {
      const res = await apiClient.uploadFile(file, "properties");
      if (res?.url) {
        setValue("primaryImageUrl", res.url, { shouldValidate: true });
        success("تم رفع صورة الغلاف بنجاح", "تم حفظ صورة الغلاف في التخزين السحابي.");
      } else {
        throw new Error("لم يتم إرجاع رابط الصورة");
      }
    } catch (err: any) {
      console.error("Cover image upload failed:", err);
      setValue("primaryImageUrl", initialData?.images?.find((i) => i.isPrimary)?.url || "", { shouldValidate: true });
      toastError("فشل رفع صورة الغلاف", "تعذر رفع صورة الغلاف إلى السحابة، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsUploadingCover(false);
      e.target.value = "";
    }
  };

  // Gallery multi-images upload from device with live cloud upload
  const handleGalleryFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    let oversizedCount = 0;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) {
        oversizedCount++;
        return;
      }
      validFiles.push(file);
    });

    if (oversizedCount > 0) {
      toastError("تنبيه الحجم", `تم استبعاد ${oversizedCount} صور لتجاوزها حجم 10 ميجابايت.`);
    }

    if (validFiles.length === 0) return;

    setIsUploadingGallery(true);
    const tempIds = validFiles.map((_, i) => `temp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`);

    // Add local preview images immediately
    const previewImages: PropertyImage[] = validFiles.map((file, i) => ({
      id: tempIds[i],
      url: URL.createObjectURL(file),
      caption: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "صورة من العقار",
      isPrimary: false,
    }));
    setGalleryImages((prev) => [...prev, ...previewImages]);

    try {
      const uploadRes = await apiClient.uploadMultipleFiles(validFiles, "properties");
      if (uploadRes && Array.isArray(uploadRes) && uploadRes.length > 0) {
        setGalleryImages((prev) =>
          prev
            .map((img) => {
              const idx = tempIds.indexOf(img.id);
              if (idx !== -1) {
                if (uploadRes[idx]?.url) {
                  return { ...img, id: `img-${Date.now()}-${idx}`, url: uploadRes[idx].url };
                }
                // Drop items in the batch that failed to produce a valid URL
                return null;
              }
              return img;
            })
            .filter((img): img is PropertyImage => img !== null)
        );
        success("تم رفع الصور بنجاح", `تم رفع ${uploadRes.length} صور إلى التخزين السحابي.`);
      } else {
        throw new Error("لم يتم إرجاع روابط الصور من السيرفر");
      }
    } catch (err: any) {
      console.error("Gallery upload to backend failed:", err);
      // Remove temporary blob previews on failure to prevent saving invalid URLs
      setGalleryImages((prev) => prev.filter((img) => !tempIds.includes(img.id)));
      toastError("فشل رفع الصور", "تعذر رفع الصور إلى التخزين السحابي، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsUploadingGallery(false);
      e.target.value = "";
    }
  };

  const removeGalleryImage = (id: string) => {
    setGalleryImages((prev) => prev.filter((img) => img.id !== id));
  };

  const updateImageCaption = (id: string, caption: string) => {
    setGalleryImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, caption } : img))
    );
  };

  const makeImagePrimary = (galleryImg: PropertyImage) => {
    const currentPrimaryUrl = watch("primaryImageUrl");
    if (currentPrimaryUrl) {
      setGalleryImages((prev) => [
        ...prev.filter((img) => img.id !== galleryImg.id),
        {
          id: `img-${Date.now()}`,
          url: currentPrimaryUrl,
          caption: "صورة العقار",
          isPrimary: false,
        },
      ]);
    } else {
      setGalleryImages((prev) => prev.filter((img) => img.id !== galleryImg.id));
    }
    setValue("primaryImageUrl", galleryImg.url, { shouldValidate: true });
    success("تم تعيين الغلاف", "تم تعيين هذه الصورة كغلاف رئيسي للعقار بنجاح.");
  };

  const removePrimaryImage = () => {
    setValue("primaryImageUrl", "", { shouldValidate: true });
  };

  // Discount change handlers
  const handleToggleDiscount = (enabled: boolean) => {
    setValue("hasDiscount", enabled, { shouldValidate: true });
    if (enabled) {
      const currentPrice = Number(watch("price")) || 1500000;
      const currentOriginal = Number(watch("originalPrice"));
      if (!currentOriginal || currentOriginal <= currentPrice) {
        setValue("originalPrice", currentPrice, { shouldValidate: true });
        setValue("discountPercentage", 10, { shouldValidate: true });
        const discountedPrice = Math.round(currentPrice * 0.9);
        setValue("price", discountedPrice, { shouldValidate: true });
      }
    } else {
      const orig = Number(watch("originalPrice"));
      if (orig && orig > 0) {
        setValue("price", orig, { shouldValidate: true });
      }
      setValue("originalPrice", undefined, { shouldValidate: true });
      setValue("discountPercentage", undefined, { shouldValidate: true });
    }
  };

  const handleOriginalPriceChange = (newOrig: number) => {
    setValue("originalPrice", newOrig, { shouldValidate: true });
    const pct = Number(watch("discountPercentage"));
    if (pct > 0 && newOrig > 0) {
      const discounted = Math.round(newOrig * (1 - pct / 100));
      setValue("price", discounted, { shouldValidate: true });
    } else if (newOrig > 0 && Number(watch("price")) > 0 && newOrig > Number(watch("price"))) {
      const calculatedPct = Math.round(((newOrig - Number(watch("price"))) / newOrig) * 100);
      setValue("discountPercentage", calculatedPct, { shouldValidate: true });
    }
  };

  const handleDiscountPercentageChange = (pct: number) => {
    setValue("discountPercentage", pct, { shouldValidate: true });
    const orig = Number(watch("originalPrice")) || Number(watch("price"));
    if (orig > 0) {
      if (!watch("originalPrice")) {
        setValue("originalPrice", orig, { shouldValidate: true });
      }
      const discounted = Math.round(orig * (1 - pct / 100));
      setValue("price", discounted, { shouldValidate: true });
    }
  };

  const handleFinalPriceChange = (finalP: number) => {
    setValue("price", finalP, { shouldValidate: true });
    const orig = Number(watch("originalPrice"));
    if (orig > finalP && orig > 0) {
      const calculatedPct = Math.round(((orig - finalP) / orig) * 100);
      setValue("discountPercentage", calculatedPct, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: PropertyFormValues, statusOverride?: PropertyStatus) => {
    if (isUploadingCover || isUploadingGallery) {
      toastError("يرجى الانتظار", "جاري رفع الصور حالياً، يرجى الانتظار حتى اكتمال الرفع قبل الحفظ.");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalStatus = statusOverride || data.status;

      // Construct complete images array (exclude raw temporary blob: URLs)
      const finalImages: PropertyImage[] = [];

      // 1. Primary Cover Image
      if (data.primaryImageUrl && !data.primaryImageUrl.startsWith("blob:")) {
        finalImages.push({
          id: initialData?.images?.find((img) => img.isPrimary)?.id || `img-primary-${Date.now()}`,
          url: data.primaryImageUrl,
          caption: "صورة الغلاف الرئيسية",
          isPrimary: true,
        });
      }

      // 2. Additional Gallery Images
      galleryImages
        .filter((img) => !img.url.startsWith("blob:"))
        .forEach((img, idx) => {
          finalImages.push({
            ...img,
            id: img.id || `img-gallery-${idx}-${Date.now()}`,
            isPrimary: false,
          });
        });

      // 3. Fallback default if empty
      if (finalImages.length === 0) {
        finalImages.push({
          id: `img-default-${Date.now()}`,
          url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
          caption: "صورة افتراضية للعقار",
          isPrimary: true,
        });
      }

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
        originalPrice:
          data.hasDiscount && data.originalPrice && Number(data.originalPrice) > Number(data.price)
            ? Number(data.originalPrice)
            : undefined,
        discountPercentage:
          data.hasDiscount && data.originalPrice && Number(data.originalPrice) > Number(data.price)
            ? (data.discountPercentage
                ? Number(data.discountPercentage)
                : Math.round(((Number(data.originalPrice) - Number(data.price)) / Number(data.originalPrice)) * 100))
            : undefined,
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
                  waterAvailability: data.waterAvailability === true || String(data.waterAvailability) === "true",
                  waterSource: data.waterSource,
                }
              : undefined,
        },
        amenities: data.amenities,
        images: finalImages,
        seo: {
          seoTitle: data.seoTitle || data.title,
          metaDescription: data.metaDescription || data.shortDescription,
          slug: data.slug,
        },
      };

      if (isEditing && initialData) {
        await MockStore.updateProperty(initialData.id, propertyPayload);
        success("تم تحديث العقار بنجاح", `تم حفظ التغييرات على العقار (${data.code}).`);
      } else {
        await MockStore.addProperty(propertyPayload);
        success("تمت إضافة العقار بنجاح", `تم تسجيل العقار الجديد (${data.code}) في قاعدة البيانات.`);
      }

      router.push("/properties");
      router.refresh();
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
            <label className="block text-xs font-semibold text-primary-text mb-1.5 flex items-center justify-between">
              <span>الدولة</span>
              <span className="text-[10px] text-secondary-text font-normal">(ثابتة)</span>
            </label>
            <input
              type="text"
              {...register("country")}
              value="المملكة العربية السعودية"
              readOnly
              tabIndex={-1}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-zinc-100/80 border border-neutral-border rounded-xl text-secondary-text font-medium cursor-not-allowed select-none focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              المدينة <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold cursor-pointer"
            >
              <option value="" disabled>
                اختر المدينة...
              </option>
              {provinces
                .filter((p) => p.enabled)
                .map((p) => (
                  <optgroup key={p.id} label={p.nameArabic}>
                    {p.cities
                      .filter((c) => c.enabled)
                      .map((c) => (
                        <option key={c.id} value={c.nameArabic}>
                          {c.nameArabic}
                        </option>
                      ))}
                  </optgroup>
                ))}
            </select>
            {errors.city && <p className="text-xs text-rose-500 mt-1">{errors.city.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              المنطقة أو الحي <span className="text-rose-500">*</span>
            </label>
            <select
              {...register("areaName")}
              disabled={availableDistricts.length === 0 && !selectedArea}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold cursor-pointer disabled:bg-zinc-100 disabled:cursor-not-allowed"
            >
              {availableDistricts.length === 0 && !selectedArea ? (
                <option value="">اختر المدينة أولاً لتحديد الحي</option>
              ) : (
                <>
                  {selectedArea && !availableDistricts.some((d) => d.nameArabic === selectedArea) && (
                    <option value={selectedArea}>{selectedArea} (مخصص)</option>
                  )}
                  {availableDistricts.map((d) => (
                    <option key={d.id} value={d.nameArabic}>
                      {d.nameArabic}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.areaName && <p className="text-xs text-rose-500 mt-1">{errors.areaName.message}</p>}
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-primary-text mb-1.5">
              الوصف التفصيلي الكامل للموقع / العنوان أو اسم الشارع والمعلم
            </label>
            <input
              type="text"
              {...register("streetAddress")}
              placeholder="مثال: شمال طريق الملك سلمان، حي النرجس، الكيلو الثاني، بالقرب من..."
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
            <label className="block text-xs font-semibold text-primary-text mb-1.5 flex items-center justify-between">
              <span>
                {hasDiscount ? "السعر النهائي بعد الخصم" : "السعر المطلوب"}{" "}
                <span className="text-rose-500">*</span>
              </span>
              {hasDiscount && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  خصم مفعّل
                </span>
              )}
            </label>
            <input
              type="number"
              {...register("price")}
              className={cn(
                "w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl font-tabular focus:outline-hidden focus:ring-2",
                hasDiscount
                  ? "bg-emerald-50/50 border-emerald-300 text-emerald-900 font-bold focus:ring-emerald-500 focus:bg-white"
                  : "bg-warm-white border-neutral-border focus:bg-white focus:ring-brand-gold"
              )}
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

        {/* Special Offer & Discount Subsection */}
        <div className="pt-4 border-t border-neutral-border-subtle space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-50/70 to-warm-white border border-amber-200/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-primary-text block">
                  عروض وخصومات السعر (Special Offer / Discount)
                </span>
                <span className="text-[11px] text-secondary-text">
                  تفعيل خصم تسويقي على هذا العقار لإظهار السعر القديم مشطوباً ونسبة التوفير لجذب العملاء
                </span>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(hasDiscount)}
                onChange={(e) => handleToggleDiscount(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="mr-2 text-xs font-semibold text-primary-text select-none">
                {hasDiscount ? "الخصم مفعّل" : "تفعيل الخصم"}
              </span>
            </label>
          </div>

          {hasDiscount && (
            <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Original Price before discount */}
                <div>
                  <label className="block text-xs font-bold text-primary-text mb-1.5 flex items-center justify-between">
                    <span>السعر الأصلي قبل الخصم ({currency}) <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    value={originalPrice !== undefined && originalPrice !== null ? String(originalPrice) : ""}
                    onChange={(e) => handleOriginalPriceChange(Number(e.target.value))}
                    placeholder="مثال: 2000000"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-neutral-border rounded-xl font-tabular focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  {errors.originalPrice && (
                    <p className="text-xs text-rose-500 mt-1">{errors.originalPrice.message}</p>
                  )}
                </div>

                {/* 2. Discount Percentage with quick buttons */}
                <div>
                  <label className="block text-xs font-bold text-primary-text mb-1.5 flex items-center justify-between">
                    <span>نسبة الخصم (%)</span>
                    <span className="text-[11px] text-emerald-700 font-bold font-tabular">
                      {discountPercentage ? `${discountPercentage}%` : "0%"}
                    </span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={discountPercentage !== undefined && discountPercentage !== null ? String(discountPercentage) : ""}
                    onChange={(e) => handleDiscountPercentageChange(Number(e.target.value))}
                    placeholder="مثال: 10"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-neutral-border rounded-xl font-tabular focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  {/* Quick percentage pills */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[5, 10, 15, 20, 25, 30].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleDiscountPercentageChange(pct)}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer font-tabular",
                          Number(discountPercentage) === pct
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                            : "bg-white text-secondary-text hover:text-primary-text hover:bg-zinc-50 border-neutral-border"
                        )}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Final Price after discount */}
                <div>
                  <label className="block text-xs font-bold text-primary-text mb-1.5 flex items-center justify-between">
                    <span>السعر النهائي بعد الخصم ({currency}) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      السعر المعروض
                    </span>
                  </label>
                  <input
                    type="number"
                    value={price !== undefined && price !== null ? String(price) : ""}
                    onChange={(e) => handleFinalPriceChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border-2 border-emerald-400 rounded-xl font-tabular font-bold text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                  {errors.price && (
                    <p className="text-xs text-rose-500 mt-1">{errors.price.message}</p>
                  )}
                </div>
              </div>

              {/* Live Preview Card */}
              {Boolean(originalPrice && price && Number(originalPrice) > Number(price)) && (
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-lg bg-rose-50 text-rose-600">
                      <TrendingDown className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-tabular">
                          {Number(price).toLocaleString()} {currency}
                        </span>
                        <span className="text-xs text-zinc-400 line-through font-tabular">
                          {Number(originalPrice).toLocaleString()} {currency}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[11px] font-bold shadow-2xs">
                          خصم {discountPercentage || Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-0.5 font-medium">
                        قيمة التوفير المباشر للعميل: <strong>{(Number(originalPrice) - Number(price)).toLocaleString()} {currency}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-secondary-text font-normal">
                    * هذا الشكل المعتمد الذي سيظهر في بطاقة العقار وتفاصيل العرض
                  </span>
                </div>
              )}
            </div>
          )}
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
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl cursor-pointer"
              >
                <option value="true">متوفر (بئر أو ري نيلي)</option>
                <option value="false">غير متوفر حالياً</option>
              </select>
              {errors.waterAvailability && (
                <p className="text-xs text-rose-500 mt-1">{errors.waterAvailability.message}</p>
              )}
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
      <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-border-subtle">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-primary-text">و. صور العقار والوسائط</h3>
            <p className="text-xs text-secondary-text mt-0.5">
              صورة الغلاف الرئيسية وصور المعرض الإضافية يتم تحميلها مباشرة من جهازك
            </p>
          </div>
        </div>

        {/* 1. Primary Cover Image (Single file upload from device) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-primary-text">
                صورة الغلاف الرئيسية <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-secondary-text mt-0.5">
                تظهر كصورة بارزة في بطاقة العقار، نتائج البحث، وتصدّر صفحة تفاصيل العقار
              </p>
            </div>
            {primaryImageUrl && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                <span>الغلاف محدد</span>
              </span>
            )}
          </div>

          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverFileChange}
          />

          {primaryImageUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-neutral-border bg-zinc-900 group shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primaryImageUrl}
                alt="صورة الغلاف الرئيسية"
                className="w-full h-56 sm:h-72 object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              />

              {/* Uploading Spinner Overlay */}
              {isUploadingCover && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-20">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
                  <span className="text-xs font-semibold">جاري رفع صورة الغلاف إلى التخزين السحابي...</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-between p-4">
                <div className="flex justify-end">
                  <span className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10">
                    <Star className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" />
                    صورة الغلاف الرسمية
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploadingCover}
                    onClick={() => coverFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-brand-charcoal bg-white/95 hover:bg-white disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    {isUploadingCover ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingCover ? "جاري الرفع..." : "تغيير صورة الغلاف من جهازك"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={removePrimaryImage}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-white/95 hover:bg-rose-50 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الغلاف</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => coverFileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
                errors.primaryImageUrl
                  ? "border-rose-400 bg-rose-50/30 hover:bg-rose-50/50"
                  : "border-neutral-border hover:border-brand-gold bg-warm-white/70 hover:bg-brand-gold/5"
              )}
            >
              <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-700">
                {isUploadingCover ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-primary-text">
                  {isUploadingCover
                    ? "جاري رفع صورة الغلاف إلى السحابة..."
                    : "انقر هنا لاختيار صورة الغلاف الرئيسية من جهازك"}
                </p>
                <p className="text-xs text-secondary-text">
                  صيغ مدعومة: JPG، PNG، WebP (حتى 10 ميجابايت)
                </p>
              </div>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs cursor-pointer pointer-events-none"
              >
                {isUploadingCover ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{isUploadingCover ? "جاري الرفع..." : "استعراض جهازك واختيار الغلاف"}</span>
              </button>
            </div>
          )}
          {errors.primaryImageUrl && (
            <p className="text-xs text-rose-500 font-medium">{errors.primaryImageUrl.message}</p>
          )}
        </div>

        {/* 2. Gallery Images Multi-Upload (Multiple files upload from device) */}
        <div className="pt-5 border-t border-neutral-border-subtle space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <label className="block text-xs font-bold text-primary-text">
                  صور المعرض الإضافية
                </label>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-secondary-text">
                  {galleryImages.length} صور مرفوعة
                </span>
              </div>
              <p className="text-[11px] text-secondary-text mt-0.5">
                يمكنك اختيار عدة صور معاً من جهازك للغرف والمرافق والتشطيبات لعرضها في سلايدر الصور
              </p>
            </div>

            <button
              type="button"
              disabled={isUploadingGallery}
              onClick={() => galleryFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {isUploadingGallery ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isUploadingGallery ? "جاري الرفع..." : "إضافة صور متعددة من جهازك"}</span>
            </button>
          </div>

          <input
            ref={galleryFileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleGalleryFilesChange}
          />

          {galleryImages.length === 0 ? (
            <div
              onClick={() => galleryFileInputRef.current?.click()}
              className="border border-dashed border-neutral-border rounded-xl p-6 text-center cursor-pointer bg-warm-white/40 hover:bg-zinc-100/60 transition-all flex flex-col items-center justify-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-zinc-100 text-secondary-text">
                <Layers className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-primary-text">
                لا توجد صور إضافية في المعرض حالياً
              </p>
              <p className="text-[11px] text-secondary-text">
                اضغط هنا لرفع عدة صور دفعة واحدة من جهازك وإظهارها في شريحة المعاينة (Swiper)
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((img, idx) => (
                <div
                  key={img.id}
                  className="rounded-xl border border-neutral-border bg-surface p-2.5 space-y-2 shadow-2xs group"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-100 border border-neutral-border-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.caption || `صورة ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono">
                      #{idx + 1}
                    </span>

                    {/* Gallery Item Uploading Spinner */}
                    {(img.url.startsWith("blob:") || img.id.startsWith("temp-")) && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1 z-10">
                        <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
                        <span className="text-[10px] font-medium">جاري الرفع...</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                      <button
                        type="button"
                        onClick={() => makeImagePrimary(img)}
                        title="تعيين كغلاف رئيسي"
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-brand-charcoal text-xs font-medium flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-[10px]">كغلاف</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(img.id)}
                        title="حذف الصورة"
                        className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs shadow-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={img.caption || ""}
                    onChange={(e) => updateImageCaption(img.id, e.target.value)}
                    placeholder="وصف مختصر (اختياري)..."
                    className="w-full px-2 py-1 text-xs bg-warm-white border border-neutral-border rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
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
            disabled={isSubmitting || isUploadingCover || isUploadingGallery}
            onClick={handleSubmit((data) => onSubmit(data, "DRAFT"))}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-text bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save className="w-4 h-4 text-secondary-text" />
            <span>حفظ كمسودة</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isUploadingCover || isUploadingGallery}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs shadow-brand-gold/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
          >
            {isUploadingCover || isUploadingGallery ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-brand-charcoal" />
                <span>جاري رفع الصور...</span>
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-brand-charcoal" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{isEditing ? "حفظ التعديلات" : "نشر العقار الآن"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
