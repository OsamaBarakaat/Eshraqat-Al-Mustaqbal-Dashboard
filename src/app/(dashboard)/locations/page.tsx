"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Globe2,
  Building,
  PlusCircle,
  Search,
  ChevronLeft,
  Pencil,
  Trash2,
  X,
  Compass,
  FolderTree,
} from "lucide-react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useToast } from "@/components/shared/toast-provider";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Province, City, District } from "@/types/location";

interface DeleteTarget {
  level: "province" | "city" | "district";
  provinceId: string;
  cityId?: string;
  districtId?: string;
  name: string;
}

export default function LocationsPage() {
  const { success, error: toastError } = useToast();
  const [provinces, setProvinces] = useState<Province[]>(MockStore.getLocations());

  // Selection states
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("prov-riyadh");
  const [selectedCityId, setSelectedCityId] = useState<string>("city-riyadh");

  // Search states for each column
  const [provSearch, setProvSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [distSearch, setDistSearch] = useState("");

  // Modals for Add/Edit
  const [provinceModal, setProvinceModal] = useState<{
    isOpen: boolean;
    isEdit: boolean;
    province?: Province;
    nameAr: string;
    nameEn: string;
  }>({
    isOpen: false,
    isEdit: false,
    nameAr: "",
    nameEn: "",
  });

  const [cityModal, setCityModal] = useState<{
    isOpen: boolean;
    isEdit: boolean;
    provinceId: string;
    city?: City;
    nameAr: string;
    nameEn: string;
  }>({
    isOpen: false,
    isEdit: false,
    provinceId: "",
    nameAr: "",
    nameEn: "",
  });

  const [districtModal, setDistrictModal] = useState<{
    isOpen: boolean;
    isEdit: boolean;
    provinceId: string;
    cityId: string;
    district?: District;
    nameAr: string;
    nameEn: string;
  }>({
    isOpen: false,
    isEdit: false,
    provinceId: "",
    cityId: "",
    nameAr: "",
    nameEn: "",
  });

  // Delete Confirm Dialog
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Sync with store
  useEffect(() => {
    const unsubscribe = subscribeToMockStore(() => {
      const locs = MockStore.getLocations();
      setProvinces(locs);
    });
    return unsubscribe;
  }, []);

  // Currently selected province and city
  const selectedProvince = useMemo(() => {
    return provinces.find((p) => p.id === selectedProvinceId) || provinces[0];
  }, [provinces, selectedProvinceId]);

  const selectedCity = useMemo(() => {
    if (!selectedProvince) return undefined;
    return (
      selectedProvince.cities.find((c) => c.id === selectedCityId) ||
      selectedProvince.cities[0]
    );
  }, [selectedProvince, selectedCityId]);

  // Update selected IDs if selections become invalid
  useEffect(() => {
    if (selectedProvince && selectedProvince.id !== selectedProvinceId) {
      setSelectedProvinceId(selectedProvince.id);
    }
  }, [selectedProvince, selectedProvinceId]);

  useEffect(() => {
    if (selectedCity && selectedCity.id !== selectedCityId) {
      setSelectedCityId(selectedCity.id);
    }
  }, [selectedCity, selectedCityId]);

  // Overall counts
  const totalProvinces = provinces.length;
  const totalCities = useMemo(
    () => provinces.reduce((sum, p) => sum + p.cities.length, 0),
    [provinces]
  );
  const totalDistricts = useMemo(
    () =>
      provinces.reduce(
        (sum, p) =>
          sum + p.cities.reduce((cSum, c) => cSum + c.districts.length, 0),
        0
      ),
    [provinces]
  );

  // Filtered lists
  const filteredProvinces = useMemo(() => {
    if (!provSearch.trim()) return provinces;
    const q = provSearch.toLowerCase();
    return provinces.filter(
      (p) =>
        p.nameArabic.toLowerCase().includes(q) ||
        p.nameEnglish.toLowerCase().includes(q)
    );
  }, [provinces, provSearch]);

  const filteredCities = useMemo(() => {
    if (!selectedProvince) return [];
    if (!citySearch.trim()) return selectedProvince.cities;
    const q = citySearch.toLowerCase();
    return selectedProvince.cities.filter(
      (c) =>
        c.nameArabic.toLowerCase().includes(q) ||
        c.nameEnglish.toLowerCase().includes(q)
    );
  }, [selectedProvince, citySearch]);

  const filteredDistricts = useMemo(() => {
    if (!selectedCity) return [];
    if (!distSearch.trim()) return selectedCity.districts;
    const q = distSearch.toLowerCase();
    return selectedCity.districts.filter(
      (d) =>
        d.nameArabic.toLowerCase().includes(q) ||
        d.nameEnglish.toLowerCase().includes(q)
    );
  }, [selectedCity, distSearch]);

  // Save Province
  const handleSaveProvince = () => {
    if (!provinceModal.nameAr.trim()) {
      toastError("خطأ", "يرجى إدخال اسم المنطقة/المحافظة بالعربية");
      return;
    }
    if (provinceModal.isEdit && provinceModal.province) {
      MockStore.updateProvince(
        provinceModal.province.id,
        provinceModal.nameAr.trim(),
        provinceModal.nameEn.trim() || provinceModal.nameAr.trim()
      );
      success("تم التحديث", `تم تحديث بيانات (${provinceModal.nameAr}) بنجاح.`);
    } else {
      const newProv = MockStore.addProvince(
        provinceModal.nameAr.trim(),
        provinceModal.nameEn.trim() || provinceModal.nameAr.trim()
      );
      setSelectedProvinceId(newProv.id);
      success("تمت الإضافة", `تمت إضافة (${provinceModal.nameAr}) إلى المحافظات بنجاح.`);
    }
    setProvinceModal({ isOpen: false, isEdit: false, nameAr: "", nameEn: "" });
  };

  // Save City
  const handleSaveCity = () => {
    if (!cityModal.nameAr.trim()) {
      toastError("خطأ", "يرجى إدخال اسم المدينة بالعربية");
      return;
    }
    if (cityModal.isEdit && cityModal.city) {
      MockStore.updateCity(
        cityModal.provinceId,
        cityModal.city.id,
        cityModal.nameAr.trim(),
        cityModal.nameEn.trim() || cityModal.nameAr.trim()
      );
      success("تم التحديث", `تم تحديث بيانات (${cityModal.nameAr}) بنجاح.`);
    } else {
      const newCity = MockStore.addCity(
        cityModal.provinceId,
        cityModal.nameAr.trim(),
        cityModal.nameEn.trim() || cityModal.nameAr.trim()
      );
      if (newCity) {
        setSelectedCityId(newCity.id);
        success("تمت الإضافة", `تمت إضافة مدينة (${cityModal.nameAr}) بنجاح.`);
      }
    }
    setCityModal({ isOpen: false, isEdit: false, provinceId: "", nameAr: "", nameEn: "" });
  };

  // Save District
  const handleSaveDistrict = () => {
    if (!districtModal.nameAr.trim()) {
      toastError("خطأ", "يرجى إدخال اسم الحي بالعربية");
      return;
    }
    if (districtModal.isEdit && districtModal.district) {
      MockStore.updateDistrict(
        districtModal.provinceId,
        districtModal.cityId,
        districtModal.district.id,
        districtModal.nameAr.trim(),
        districtModal.nameEn.trim() || districtModal.nameAr.trim()
      );
      success("تم التحديث", `تم تحديث بيانات (${districtModal.nameAr}) بنجاح.`);
    } else {
      MockStore.addDistrict(
        districtModal.provinceId,
        districtModal.cityId,
        districtModal.nameAr.trim(),
        districtModal.nameEn.trim() || districtModal.nameAr.trim()
      );
      success("تمت الإضافة", `تمت إضافة حي (${districtModal.nameAr}) بنجاح.`);
    }
    setDistrictModal({ isOpen: false, isEdit: false, provinceId: "", cityId: "", nameAr: "", nameEn: "" });
  };

  // Handle Confirmed Delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.level === "province") {
      MockStore.deleteProvince(deleteTarget.provinceId);
      success("تم الحذف بنجاح", `تم حذف (${deleteTarget.name}) وكافة المدن والأحياء التابعة لها.`);
    } else if (deleteTarget.level === "city" && deleteTarget.cityId) {
      MockStore.deleteCity(deleteTarget.provinceId, deleteTarget.cityId);
      success("تم الحذف بنجاح", `تم حذف مدينة (${deleteTarget.name}) وكافة الأحياء التابعة لها.`);
    } else if (deleteTarget.level === "district" && deleteTarget.cityId && deleteTarget.districtId) {
      MockStore.deleteDistrict(deleteTarget.provinceId, deleteTarget.cityId, deleteTarget.districtId);
      success("تم الحذف بنجاح", `تم حذف حي (${deleteTarget.name}) بنجاح.`);
    }

    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="إدارة الهيكل الجغرافي (المملكة العربية السعودية)"
        description="إدارة شجرة المواقع الهرمية (المحافظات/المناطق الإدارية ← المدن والمراكز ← الأحياء السكنية) لدعم دقة البحث وفلترة العقارات."
        breadcrumbs={[{ label: "المواقع الجغرافية" }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="الدولة المعتمدة"
          value="المملكة العربية السعودية"
          icon={Globe2}
          subtitle="النطاق الجغرافي والتشغيلي الرئيسي"
          variant="gold"
        />
        <StatCard
          title="المناطق والمحافظات"
          value={totalProvinces}
          icon={Compass}
          subtitle="المناطق الإدارية بالمملكة"
          variant="info"
        />
        <StatCard
          title="المدن والمراكز"
          value={totalCities}
          icon={Building}
          subtitle="مدن ومراكز رئيسية"
          variant="gold"
        />
        <StatCard
          title="الأحياء والمناطق"
          value={totalDistricts}
          icon={MapPin}
          subtitle="أحياء سكنية وتجارية موثقة"
          variant="success"
        />
      </div>

      {/* Breadcrumb Indicator of Current Selection */}
      <div className="p-3.5 rounded-xl bg-warm-white border border-neutral-border text-xs flex items-center flex-wrap gap-2 text-secondary-text">
        <FolderTree className="w-4 h-4 text-brand-gold-deep shrink-0" />
        <span className="font-semibold text-primary-text">المسار الجغرافي المحدد:</span>
        <span className="px-2 py-0.5 rounded-md bg-zinc-200/80 text-primary-text font-bold">المملكة العربية السعودية</span>
        <span>←</span>
        <span className="px-2 py-0.5 rounded-md bg-brand-gold/20 text-brand-charcoal font-bold">
          {selectedProvince?.nameArabic || "لم يتم التحديد"}
        </span>
        <span>←</span>
        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold">
          {selectedCity?.nameArabic || "لم يتم التحديد"}
        </span>
        <span>←</span>
        <span className="text-secondary-text">
          ({selectedCity?.districts.length || 0} أحياء مسجلة)
        </span>
      </div>

      {/* 3-Column Hierarchy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ===================== Column 1: Provinces ===================== */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-3 flex flex-col h-[640px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle shrink-0">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-gold-deep" />
              <h3 className="font-bold text-sm sm:text-base text-primary-text">1. المناطق والمحافظات</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold-deep font-bold font-tabular">
                {provinces.length}
              </span>
            </div>

            <ActionTooltip label="إضافة منطقة/محافظة جديدة" variant="gold">
              <button
                onClick={() =>
                  setProvinceModal({
                    isOpen: true,
                    isEdit: false,
                    nameAr: "",
                    nameEn: "",
                  })
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-lg transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </ActionTooltip>
          </div>

          {/* Search */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-secondary-text absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={provSearch}
              onChange={(e) => setProvSearch(e.target.value)}
              placeholder="بحث في المناطق..."
              className="w-full pr-8 pl-3 py-1.5 text-xs bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-gold"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {filteredProvinces.length === 0 ? (
              <div className="py-12 text-center text-xs text-secondary-text">لا توجد مناطق مطابقة للبحث</div>
            ) : (
              filteredProvinces.map((prov) => {
                const isSelected = prov.id === selectedProvince?.id;
                return (
                  <div
                    key={prov.id}
                    onClick={() => {
                      setSelectedProvinceId(prov.id);
                      if (prov.cities.length > 0) {
                        setSelectedCityId(prov.cities[0].id);
                      }
                      setCitySearch("");
                      setDistSearch("");
                    }}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? "bg-brand-gold text-brand-charcoal border-brand-gold font-bold shadow-xs"
                        : "bg-warm-white text-primary-text border-neutral-border hover:bg-zinc-100"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-1">
                      <span className="block text-xs sm:text-sm font-semibold truncate">{prov.nameArabic}</span>
                      <span
                        className={`text-[11px] font-sans truncate block ${
                          isSelected ? "text-brand-charcoal/80 font-normal" : "text-secondary-text"
                        }`}
                      >
                        {prov.nameEnglish}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mr-2">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-tabular font-medium ${
                          isSelected
                            ? "bg-brand-charcoal text-brand-gold"
                            : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {prov.cities.length} مدن
                      </span>

                      {/* Edit Button */}
                      <ActionTooltip label={`تعديل (${prov.nameArabic})`} variant="amber">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProvinceModal({
                              isOpen: true,
                              isEdit: true,
                              province: prov,
                              nameAr: prov.nameArabic,
                              nameEn: prov.nameEnglish,
                            });
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSelected
                              ? "hover:bg-brand-charcoal/20 text-brand-charcoal"
                              : "hover:bg-amber-100 text-amber-700"
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </ActionTooltip>

                      {/* Delete Button */}
                      <ActionTooltip label={`حذف (${prov.nameArabic})`} variant="rose">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({
                              level: "province",
                              provinceId: prov.id,
                              name: prov.nameArabic,
                            });
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSelected
                              ? "hover:bg-brand-charcoal/20 text-rose-900"
                              : "hover:bg-rose-100 text-rose-600"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </ActionTooltip>

                      <ChevronLeft className={`w-4 h-4 transition-transform ${isSelected ? "text-brand-charcoal" : "text-zinc-400 group-hover:translate-x-0.5"}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ===================== Column 2: Cities ===================== */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-3 flex flex-col h-[640px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle shrink-0">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="font-bold text-sm sm:text-base text-primary-text">2. المدن والمراكز</h3>
                <p className="text-[11px] text-secondary-text truncate max-w-[140px] sm:max-w-[200px]">
                  في: {selectedProvince?.nameArabic || "—"}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold font-tabular">
                {selectedProvince?.cities.length || 0}
              </span>
            </div>

            {selectedProvince && (
              <ActionTooltip label={`إضافة مدينة إلى ${selectedProvince.nameArabic}`} variant="blue">
                <button
                  onClick={() =>
                    setCityModal({
                      isOpen: true,
                      isEdit: false,
                      provinceId: selectedProvince.id,
                      nameAr: "",
                      nameEn: "",
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </ActionTooltip>
            )}
          </div>

          {/* Search */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-secondary-text absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="بحث في المدن..."
              className="w-full pr-8 pl-3 py-1.5 text-xs bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {filteredCities.length === 0 ? (
              <div className="py-12 text-center text-xs text-secondary-text">
                {selectedProvince ? "لا توجد مدن مسجلة أو مطابقة للبحث" : "اختر منطقة أولاً"}
              </div>
            ) : (
              filteredCities.map((city) => {
                const isSelected = city.id === selectedCity?.id;
                return (
                  <div
                    key={city.id}
                    onClick={() => {
                      setSelectedCityId(city.id);
                      setDistSearch("");
                    }}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                        : "bg-warm-white text-primary-text border-neutral-border hover:bg-zinc-100"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-1">
                      <span className="block text-xs sm:text-sm font-semibold truncate">{city.nameArabic}</span>
                      <span
                        className={`text-[11px] font-sans truncate block ${
                          isSelected ? "text-blue-100 font-normal" : "text-secondary-text"
                        }`}
                      >
                        {city.nameEnglish}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mr-2">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-tabular font-medium ${
                          isSelected
                            ? "bg-blue-800 text-blue-100"
                            : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {city.districts.length} أحياء
                      </span>

                      {/* Edit Button */}
                      <ActionTooltip label={`تعديل (${city.nameArabic})`} variant="amber">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!selectedProvince) return;
                            setCityModal({
                              isOpen: true,
                              isEdit: true,
                              provinceId: selectedProvince.id,
                              city,
                              nameAr: city.nameArabic,
                              nameEn: city.nameEnglish,
                            });
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSelected
                              ? "hover:bg-blue-700 text-white"
                              : "hover:bg-amber-100 text-amber-700"
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </ActionTooltip>

                      {/* Delete Button */}
                      <ActionTooltip label={`حذف (${city.nameArabic})`} variant="rose">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!selectedProvince) return;
                            setDeleteTarget({
                              level: "city",
                              provinceId: selectedProvince.id,
                              cityId: city.id,
                              name: city.nameArabic,
                            });
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSelected
                              ? "hover:bg-blue-700 text-rose-200"
                              : "hover:bg-rose-100 text-rose-600"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </ActionTooltip>

                      <ChevronLeft className={`w-4 h-4 transition-transform ${isSelected ? "text-white" : "text-zinc-400 group-hover:translate-x-0.5"}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ===================== Column 3: Districts ===================== */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-3 flex flex-col h-[640px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm sm:text-base text-primary-text">3. الأحياء والمناطق</h3>
                <p className="text-[11px] text-secondary-text truncate max-w-[140px] sm:max-w-[200px]">
                  في: {selectedCity?.nameArabic || "—"}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-tabular">
                {selectedCity?.districts.length || 0}
              </span>
            </div>

            {selectedProvince && selectedCity && (
              <ActionTooltip label={`إضافة حي جديد إلى ${selectedCity.nameArabic}`} variant="emerald">
                <button
                  onClick={() =>
                    setDistrictModal({
                      isOpen: true,
                      isEdit: false,
                      provinceId: selectedProvince.id,
                      cityId: selectedCity.id,
                      nameAr: "",
                      nameEn: "",
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </ActionTooltip>
            )}
          </div>

          {/* Search */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-secondary-text absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={distSearch}
              onChange={(e) => setDistSearch(e.target.value)}
              placeholder="بحث في الأحياء..."
              className="w-full pr-8 pl-3 py-1.5 text-xs bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {filteredDistricts.length === 0 ? (
              <div className="py-12 text-center text-xs text-secondary-text">
                {selectedCity ? "لا توجد أحياء مسجلة في هذه المدينة" : "اختر مدينة أولاً"}
              </div>
            ) : (
              filteredDistricts.map((dist) => {
                return (
                  <div
                    key={dist.id}
                    className="p-3 rounded-xl border border-neutral-border bg-warm-white text-primary-text hover:bg-zinc-50 transition-all flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="block text-xs sm:text-sm font-semibold truncate">{dist.nameArabic}</span>
                      </div>
                      <span className="text-[11px] font-sans text-secondary-text truncate block mt-0.5">
                        {dist.nameEnglish}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mr-2">
                      {dist.propertiesCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-tabular bg-brand-gold/15 text-brand-gold-deep font-semibold">
                          {dist.propertiesCount} عقار
                        </span>
                      )}

                      {/* Edit Button */}
                      <ActionTooltip label={`تعديل (${dist.nameArabic})`} variant="amber">
                        <button
                          onClick={() => {
                            if (!selectedProvince || !selectedCity) return;
                            setDistrictModal({
                              isOpen: true,
                              isEdit: true,
                              provinceId: selectedProvince.id,
                              cityId: selectedCity.id,
                              district: dist,
                              nameAr: dist.nameArabic,
                              nameEn: dist.nameEnglish,
                            });
                          }}
                          className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </ActionTooltip>

                      {/* Delete Button */}
                      <ActionTooltip label={`حذف (${dist.nameArabic})`} variant="rose">
                        <button
                          onClick={() => {
                            if (!selectedProvince || !selectedCity) return;
                            setDeleteTarget({
                              level: "district",
                              provinceId: selectedProvince.id,
                              cityId: selectedCity.id,
                              districtId: dist.id,
                              name: dist.nameArabic,
                            });
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </ActionTooltip>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ===================== Modal: Province ===================== */}
      {provinceModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() =>
            setProvinceModal({ isOpen: false, isEdit: false, nameAr: "", nameEn: "" })
          }
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl text-right animate-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle">
              <h3 className="font-bold text-base text-primary-text">
                {provinceModal.isEdit ? "تعديل المنطقة / المحافظة" : "إضافة منطقة / محافظة إدارية"}
              </h3>
              <button
                onClick={() =>
                  setProvinceModal({ isOpen: false, isEdit: false, nameAr: "", nameEn: "" })
                }
                className="p-1.5 text-secondary-text hover:text-primary-text rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  الاسم بالعربية <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={provinceModal.nameAr}
                  onChange={(e) =>
                    setProvinceModal({ ...provinceModal, nameAr: e.target.value })
                  }
                  placeholder="مثال: منطقة الرياض، منطقة مكة المكرمة..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  الاسم بالإنجليزية
                </label>
                <input
                  type="text"
                  value={provinceModal.nameEn}
                  onChange={(e) =>
                    setProvinceModal({ ...provinceModal, nameEn: e.target.value })
                  }
                  placeholder="e.g. Riyadh Province, Makkah..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold dir-ltr text-left"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-border-subtle">
              <button
                onClick={() =>
                  setProvinceModal({ isOpen: false, isEdit: false, nameAr: "", nameEn: "" })
                }
                className="px-4 py-2 text-xs sm:text-sm text-secondary-text hover:bg-zinc-100 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveProvince}
                className="px-5 py-2 text-xs sm:text-sm font-bold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {provinceModal.isEdit ? "حفظ التعديلات" : "إضافة المنطقة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Modal: City ===================== */}
      {cityModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() =>
            setCityModal({ isOpen: false, isEdit: false, provinceId: "", nameAr: "", nameEn: "" })
          }
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl text-right animate-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle">
              <h3 className="font-bold text-base text-primary-text">
                {cityModal.isEdit ? "تعديل المدينة / المركز" : "إضافة مدينة / مركز جديد"}
              </h3>
              <button
                onClick={() =>
                  setCityModal({ isOpen: false, isEdit: false, provinceId: "", nameAr: "", nameEn: "" })
                }
                className="p-1.5 text-secondary-text hover:text-primary-text rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  الاسم بالعربية <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={cityModal.nameAr}
                  onChange={(e) =>
                    setCityModal({ ...cityModal, nameAr: e.target.value })
                  }
                  placeholder="مثال: مدينة جدة، الخرج، الدرعية..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  الاسم بالإنجليزية
                </label>
                <input
                  type="text"
                  value={cityModal.nameEn}
                  onChange={(e) =>
                    setCityModal({ ...cityModal, nameEn: e.target.value })
                  }
                  placeholder="e.g. Jeddah City, Al Kharj..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 dir-ltr text-left"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-border-subtle">
              <button
                onClick={() =>
                  setCityModal({ isOpen: false, isEdit: false, provinceId: "", nameAr: "", nameEn: "" })
                }
                className="px-4 py-2 text-xs sm:text-sm text-secondary-text hover:bg-zinc-100 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCity}
                className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {cityModal.isEdit ? "حفظ التعديلات" : "إضافة المدينة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Modal: District ===================== */}
      {districtModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() =>
            setDistrictModal({
              isOpen: false,
              isEdit: false,
              provinceId: "",
              cityId: "",
              nameAr: "",
              nameEn: "",
            })
          }
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl text-right animate-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle">
              <h3 className="font-bold text-base text-primary-text">
                {districtModal.isEdit ? "تعديل الحي / المنطقة" : "إضافة حي سكني / منطقة جديدة"}
              </h3>
              <button
                onClick={() =>
                  setDistrictModal({
                    isOpen: false,
                    isEdit: false,
                    provinceId: "",
                    cityId: "",
                    nameAr: "",
                    nameEn: "",
                  })
                }
                className="p-1.5 text-secondary-text hover:text-primary-text rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  اسم الحي بالعربية <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={districtModal.nameAr}
                  onChange={(e) =>
                    setDistrictModal({ ...districtModal, nameAr: e.target.value })
                  }
                  placeholder="مثال: حي النرجس، حي الياسمين، حي حطين..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  الاسم بالإنجليزية
                </label>
                <input
                  type="text"
                  value={districtModal.nameEn}
                  onChange={(e) =>
                    setDistrictModal({ ...districtModal, nameEn: e.target.value })
                  }
                  placeholder="e.g. An Narjis, Al Yasmin, Hittin..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 dir-ltr text-left"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-border-subtle">
              <button
                onClick={() =>
                  setDistrictModal({
                    isOpen: false,
                    isEdit: false,
                    provinceId: "",
                    cityId: "",
                    nameAr: "",
                    nameEn: "",
                  })
                }
                className="px-4 py-2 text-xs sm:text-sm text-secondary-text hover:bg-zinc-100 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveDistrict}
                className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {districtModal.isEdit ? "حفظ التعديلات" : "إضافة الحي"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Password Protected Confirm Dialog ===================== */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="تأكيد الحذف الأمني من الهيكل الجغرافي"
        description={`هل أنت متأكد من حذف (${deleteTarget?.name || ""})؟ هذا الإجراء سيؤدي إلى إزالة كافة التفرعات والمناطق المرتبطة به ولا يمكن التراجع عنه.`}
        confirmLabel="تأكيد الحذف النهائي"
        cancelLabel="إلغاء"
        variant="destructive"
        requirePassword={true}
      />
    </div>
  );
}
