"use client";

import React, { useState, useEffect } from "react";
import {
  FolderGit2,
  Building,
  MapPin,
  PlusCircle,
  X,
} from "lucide-react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/components/shared/toast-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Project, Developer } from "@/types/project";

export default function ProjectsDevelopersPage() {
  const { success, info } = useToast();
  const [projects, setProjects] = useState<Project[]>(MockStore.getProjects());
  const [developers, setDevelopers] = useState<Developer[]>(MockStore.getDevelopers());

  const [activeTab, setActiveTab] = useState<"PROJECTS" | "DEVELOPERS">("PROJECTS");
  const [search, setSearch] = useState("");

  // Add Project Modal State
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDevId, setProjDevId] = useState("");
  const [projLocation, setProjLocation] = useState("");
  const [projType, setProjType] = useState("كمبوند سكني متكامل");
  const [projPrice, setProjPrice] = useState(5000000);
  const [projDesc, setProjDesc] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToMockStore(() => {
      setProjects(MockStore.getProjects());
      setDevelopers(MockStore.getDevelopers());
    });
    return unsubscribe;
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.developerName.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    );
  });

  const filteredDevelopers = developers.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.contactEmail.toLowerCase().includes(q);
  });

  const handleToggleProjectPublish = (proj: Project) => {
    MockStore.toggleProjectPublish(proj.id);
    if (!proj.published) {
      success("تم نشر المشروع", `أصبح المشروع (${proj.name}) منشوراً على الموقع.`);
    } else {
      info("تم إلغاء نشر المشروع", `تم تحويل المشروع (${proj.name}) إلى مسودة.`);
    }
  };

  const handleSaveNewProject = () => {
    if (!projName.trim() || !projLocation.trim()) return;
    const dev = developers.find((d) => d.id === projDevId) || developers[0];

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projName.trim(),
      developerId: dev.id,
      developerName: dev.name,
      coverImage:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      location: projLocation.trim(),
      projectType: projType,
      status: "UNDER_CONSTRUCTION",
      shortDescription: projDesc || "مشروع سكني واستثماري واعد.",
      fullDescription: projDesc || "تفاصيل ومواصفات المشروع الجديد.",
      startingPrice: Number(projPrice),
      published: true,
      createdAt: new Date().toISOString(),
    };

    projects.unshift(newProject);
    setProjects([...projects]);
    setProjectModalOpen(false);
    success("تمت إضافة المشروع بنجاح", `تم تسجيل مشروع (${newProject.name}).`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="المشاريع العقارية والمطورون"
        description="إدارة كبرى المشروعات السكنية والتجارية، وعرض شركات التطوير العقاري الشريكة على المنصة."
        breadcrumbs={[{ label: "المشاريع والمطورون" }]}
        primaryAction={
          <button
            onClick={() => {
              setProjName("");
              setProjDevId(developers[0]?.id || "");
              setProjLocation("القاهرة الجديدة");
              setProjDesc("");
              setProjectModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة مشروع جديد</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-border pb-1">
        <button
          onClick={() => setActiveTab("PROJECTS")}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === "PROJECTS"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-secondary-text hover:text-primary-text hover:bg-zinc-100"
          }`}
        >
          المشاريع العقارية ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab("DEVELOPERS")}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === "DEVELOPERS"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-secondary-text hover:text-primary-text hover:bg-zinc-100"
          }`}
        >
          المطورون العقاريون ({developers.length})
        </button>
      </div>

      {/* Search Toolbar */}
      <SearchFilterBar
        searchPlaceholder={activeTab === "PROJECTS" ? "بحث باسم المشروع، المطور، أو الموقع..." : "بحث باسم شركة التطوير العقاري..."}
        searchValue={search}
        onSearchChange={setSearch}
        isFiltered={Boolean(search)}
        onReset={() => setSearch("")}
        totalResults={activeTab === "PROJECTS" ? filteredProjects.length : filteredDevelopers.length}
      />

      {/* Tab 1: Projects Cards Grid */}
      {activeTab === "PROJECTS" && (
        <div>
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-2xl bg-surface border border-neutral-border shadow-xs overflow-hidden flex flex-col justify-between group hover:border-brand-gold/40 transition-all text-right"
                >
                  <div>
                    {/* Cover Image */}
                    <div className="relative aspect-video bg-zinc-200 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proj.coverImage}
                        alt={proj.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5">
                        <StatusBadge
                          label={proj.published ? "منشور" : "مسودة"}
                          variant={proj.published ? "success" : "warning"}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-brand-gold-deep font-semibold">
                        <Building className="w-3.5 h-3.5" />
                        <span>{proj.developerName}</span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-primary-text leading-snug">
                        {proj.name}
                      </h3>

                      <p className="text-xs text-secondary-text line-clamp-2 leading-relaxed">
                        {proj.shortDescription}
                      </p>

                      <div className="pt-2 flex items-center gap-1 text-xs text-secondary-text">
                        <MapPin className="w-3.5 h-3.5 text-brand-gold-deep shrink-0" />
                        <span className="truncate">{proj.location}</span>
                      </div>

                      {proj.startingPrice ? (
                        <p className="text-xs text-primary-text font-semibold pt-1">
                          الأسعار تبدأ من:{" "}
                          <span className="text-brand-charcoal font-bold font-tabular">
                            {formatCurrency(proj.startingPrice)}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-3 border-t border-neutral-border-subtle bg-warm-white/60 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleProjectPublish(proj)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        proj.published
                          ? "text-amber-800 bg-amber-100 hover:bg-amber-200"
                          : "text-emerald-800 bg-emerald-100 hover:bg-emerald-200"
                      }`}
                    >
                      {proj.published ? "إلغاء النشر" : "نشر المشروع"}
                    </button>

                    <span className="text-[11px] text-muted-text font-tabular">
                      تاريخ البدء: {formatDate(proj.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderGit2}
              title="لم يتم العثور على مشاريع مطابقة"
              description="جرّب تعديل كلمات البحث للعثور على المشاريع."
              actionLabel="إعادة ضبط البحث"
              onAction={() => setSearch("")}
              className="my-6"
            />
          )}
        </div>
      )}

      {/* Tab 2: Developers Cards Grid */}
      {activeTab === "DEVELOPERS" && (
        <div>
          {filteredDevelopers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDevelopers.map((dev) => (
                <div
                  key={dev.id}
                  className="rounded-2xl bg-surface border border-neutral-border p-5 shadow-xs flex flex-col justify-between text-right space-y-4 hover:border-brand-gold/40 transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 overflow-hidden border border-neutral-border shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={dev.logo} alt={dev.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <h3 className="font-bold text-sm sm:text-base text-primary-text truncate">
                        {dev.name}
                      </h3>
                      {dev.establishedYear && (
                        <span className="text-[11px] text-secondary-text block">
                          تأسست عام {dev.establishedYear}
                        </span>
                      )}
                      <span className="inline-block mt-1 text-[11px] font-bold text-brand-gold-deep bg-brand-gold-light px-2 py-0.5 rounded-md">
                        {dev.projectsCount} مشروع على المنصة
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-secondary-text leading-relaxed line-clamp-3">
                    {dev.description}
                  </p>

                  <div className="pt-3 border-t border-neutral-border-subtle text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-secondary-text">الخط الساخن:</span>
                      <strong className="text-primary-text font-tabular dir-ltr">{dev.contactPhone}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-text">البريد:</span>
                      <span className="text-primary-text dir-ltr">{dev.contactEmail}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Building}
              title="لم يتم العثور على مطورين عقاريين"
              description="جرّب تعديل كلمات البحث."
              actionLabel="إعادة ضبط البحث"
              onAction={() => setSearch("")}
              className="my-6"
            />
          )}
        </div>
      )}

      {/* Add Project Modal */}
      {projectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setProjectModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl text-right animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle">
              <h3 className="text-base font-bold text-primary-text">إضافة مشروع عقاري جديد</h3>
              <button
                onClick={() => setProjectModalOpen(false)}
                className="p-1 text-secondary-text hover:text-primary-text rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">اسم المشروع:</label>
                <input
                  type="text"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="مثال: كمبوند زايد ريزيدنس"
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">المطور العقاري:</label>
                <select
                  value={projDevId}
                  onChange={(e) => setProjDevId(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl cursor-pointer"
                >
                  {developers.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">الموقع:</label>
                <input
                  type="text"
                  value={projLocation}
                  onChange={(e) => setProjLocation(e.target.value)}
                  placeholder="مثال: الشيخ زايد، التجمع الخامس..."
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-primary-text mb-1">نوع المشروع:</label>
                  <input
                    type="text"
                    value={projType}
                    onChange={(e) => setProjType(e.target.value)}
                    placeholder="سكني متكامل، أبراج..."
                    className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-primary-text mb-1">يبدأ السعر من (ج.م):</label>
                  <input
                    type="number"
                    value={projPrice}
                    onChange={(e) => setProjPrice(Number(e.target.value))}
                    className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">نبذة عن المشروع:</label>
                <textarea
                  rows={3}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="مساحة المشروع، الخدمات، خطط السداد..."
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-border-subtle flex justify-end gap-2">
              <button
                onClick={() => setProjectModalOpen(false)}
                className="px-3.5 py-2 text-xs text-secondary-text hover:bg-zinc-100 rounded-xl border border-neutral-border"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveNewProject}
                className="px-5 py-2 text-xs font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs"
              >
                حفظ المشروع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
