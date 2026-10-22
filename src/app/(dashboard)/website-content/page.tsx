"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  FileText,
  PhoneCall,
  Share2,
  Layout,
  Search,
  PlusCircle,
  Trash2,
  Edit2,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Bold,
  List,
  Type,
  CornerDownLeft,
  Eye,
  Lock,
  Award,
  Building2,
  ShieldCheck,
  Cpu,
  Banknote,
  Sparkles,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
import { apiClient } from "@/lib/services/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useToast } from "@/components/shared/toast-provider";
import {
  FAQ,
  WebsitePageContent,
  ContactSettings,
  SocialLink,
  HomepageContent,
  SeoDefaults,
  VisionPillar,
} from "@/types/content";

type ContentTab = "HOMEPAGE" | "PILLARS" | "CONTACT" | "SOCIAL" | "PAGES" | "FAQS" | "SEO";

interface DeleteTarget {
  type: "faq" | "social";
  id: string;
  name: string;
}

export default function WebsiteContentPage() {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<ContentTab>("HOMEPAGE");

  // Content States from Store
  const [faqs, setFaqs] = useState<FAQ[]>(MockStore.getFaqs());
  const [pages, setPages] = useState<WebsitePageContent[]>(MockStore.getPages());
  const [contactSettings, setContactSettings] = useState<ContactSettings>(MockStore.getContactSettings());
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(MockStore.getSocialLinks());
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(MockStore.getHomepageContent());
  const [seoDefaults, setSeoDefaults] = useState<SeoDefaults>(MockStore.getSeoDefaults());
  const [isSavingHomepage, setIsSavingHomepage] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Vision Pillars State (لماذا يختار النخبة؟)
  const [isSavingPillars, setIsSavingPillars] = useState(false);
  const [pillarsContent, setPillarsContent] = useState<{
    badge: string;
    title: string;
    subtitle: string;
    pillars: VisionPillar[];
  }>(() => {
    const hp = MockStore.getHomepageContent();
    return {
      badge: hp.pillarsBadge || "ركائز التميز المؤسسي",
      title: hp.pillarsTitle || 'لماذا يختار النخبة "إشراقة المستقبل"؟',
      subtitle:
        hp.pillarsSubtitle ||
        "نضع الشفافية والجودة الهندسية وراحة العميل في صدارة أولوياتنا منذ مرحلة المخططات الأولى وحتى تسليم المفتاح.",
      pillars:
        hp.pillars && hp.pillars.length === 4
          ? hp.pillars
          : [
              {
                id: "pillar-1",
                icon: "Building2",
                title: "معايير معمارية استثنائية",
                description:
                  "تصاميم عصرية مستوحاة من العمارة السلمانية الحديثة بأعلى معايير الإضاءة الطبيعية والواجهات الزجاجية العازلة للصوت والحرارة.",
              },
              {
                id: "pillar-2",
                icon: "ShieldCheck",
                title: "صكوك إلكترونية وضمانات شاملة",
                description:
                  "صكوك ملكية إلكترونية فورية مرخصة، مع ضمانات تصل إلى 10 سنوات على الهيكل الإنشائي والعوازل وتركيبات السباكة والكهرباء.",
              },
              {
                id: "pillar-3",
                icon: "Cpu",
                title: "تقنيات Smart Home ذكية",
                description:
                  "تكامل ذكي كامل للتحكم بالتكييف والإضاءة والمداخل والمسابح عبر تطبيقات الهواتف الذكية مع نظام توفير الطاقة الصديق للبيئة.",
              },
              {
                id: "pillar-4",
                icon: "Banknote",
                title: "عوائد استثمارية متنامية",
                description:
                  "دراسات جدوى متخصصة للمواقع الواعدة تضمن للمستثمر عوائد إيجارية مجزية وارتفاعاً مستمراً في القيمة الرأسمالية للعقار.",
              },
            ],
    };
  });

  // FAQ Add/Edit Modal
  const [faqModal, setFaqModal] = useState<{
    isOpen: boolean;
    isEdit: boolean;
    faqId?: string;
    question: string;
    answer: string;
    category: "GENERAL" | "BUYING" | "SELLING" | "RENTING";
  }>({
    isOpen: false,
    isEdit: false,
    question: "",
    answer: "",
    category: "GENERAL",
  });

  // Social Link Add/Edit Modal
  const [socialModal, setSocialModal] = useState<{
    isOpen: boolean;
    isEdit: boolean;
    linkId?: string;
    platform: SocialLink["platform"];
    title: string;
    url: string;
  }>({
    isOpen: false,
    isEdit: false,
    platform: "WHATSAPP",
    title: "",
    url: "",
  });

  // Delete Confirm Dialog (Password protected)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Active policy page & Rich editor
  const [activePolicySlug, setActivePolicySlug] = useState<"privacy-policy" | "terms-conditions">("privacy-policy");
  const [policyContent, setPolicyContent] = useState("");
  const [showPolicyPreview, setShowPolicyPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Image Upload File Input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMockStore(() => {
      setFaqs(MockStore.getFaqs());
      setPages(MockStore.getPages());
      setContactSettings(MockStore.getContactSettings());
      setSocialLinks(MockStore.getSocialLinks());
      const hp = MockStore.getHomepageContent();
      setHomepageContent(hp);
      if (hp.pillars && Array.isArray(hp.pillars) && hp.pillars.length === 4) {
        setPillarsContent({
          badge: hp.pillarsBadge || "ركائز التميز المؤسسي",
          title: hp.pillarsTitle || 'لماذا يختار النخبة "إشراقة المستقبل"؟',
          subtitle:
            hp.pillarsSubtitle ||
            "نضع الشفافية والجودة الهندسية وراحة العميل في صدارة أولوياتنا منذ مرحلة المخططات الأولى وحتى تسليم المفتاح.",
          pillars: hp.pillars,
        });
      }
      setSeoDefaults(MockStore.getSeoDefaults());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const p = pages.find((item) => item.slug === activePolicySlug);
    if (p) setPolicyContent(p.content);
  }, [activePolicySlug, pages]);

  // Insert formatting tag into textarea at cursor position
  const insertFormatting = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = policyContent.substring(start, end) || placeholder;
    const newText =
      policyContent.substring(0, start) +
      before +
      selectedText +
      after +
      policyContent.substring(end);

    setPolicyContent(newText);

    // Re-focus and set selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  // FAQ Handlers
  const handleSaveFaq = () => {
    if (!faqModal.question.trim() || !faqModal.answer.trim()) {
      toastError("خطأ", "يرجى تعبئة السؤال والإجابة");
      return;
    }

    if (faqModal.isEdit && faqModal.faqId) {
      MockStore.updateFaq(faqModal.faqId, {
        question: faqModal.question.trim(),
        answer: faqModal.answer.trim(),
        category: faqModal.category,
      });
      success("تم تحديث السؤال بنجاح", "تم حفظ التعديلات في قسم الأسئلة الشائعة.");
    } else {
      MockStore.addFaq({
        question: faqModal.question.trim(),
        answer: faqModal.answer.trim(),
        category: faqModal.category,
        displayOrder: faqs.length + 1,
        published: true,
      });
      success("تمت إضافة السؤال بنجاح", "تم نشر السؤال الجديد في قسم الأسئلة الشائعة.");
    }

    setFaqModal({
      isOpen: false,
      isEdit: false,
      question: "",
      answer: "",
      category: "GENERAL",
    });
  };

  // Social Handlers
  const handleSaveSocial = () => {
    if (!socialModal.title.trim() || !socialModal.url.trim()) {
      toastError("خطأ", "يرجى كتابة عنوان المنصة والرابط");
      return;
    }

    if (socialModal.isEdit && socialModal.linkId) {
      MockStore.updateSocialLink(socialModal.linkId, {
        platform: socialModal.platform,
        title: socialModal.title.trim(),
        url: socialModal.url.trim(),
      });
      success("تم تحديث الرابط بنجاح", `تم تحديث بيانات رابط (${socialModal.title}).`);
    } else {
      MockStore.addSocialLink(
        socialModal.platform,
        socialModal.title.trim(),
        socialModal.url.trim()
      );
      success("تمت إضافة الرابط بنجاح", `تمت إضافة حساب (${socialModal.title}) إلى الروابط.`);
    }

    setSocialModal({
      isOpen: false,
      isEdit: false,
      platform: "WHATSAPP",
      title: "",
      url: "",
    });
  };

  // Confirmed Delete (Password Protected)
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "faq") {
      MockStore.deleteFaq(deleteTarget.id);
      success("تم الحذف بنجاح", `تم حذف السؤال (${deleteTarget.name}) من الموقع.`);
    } else if (deleteTarget.type === "social") {
      MockStore.deleteSocialLink(deleteTarget.id);
      success("تم الحذف بنجاح", `تم حذف رابط (${deleteTarget.name}) من المنصة.`);
    }

    setDeleteTarget(null);
  };

  // Image Upload handler via Backend Supabase Media API
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toastError("حجم الملف كبير", "الحد الأقصى المسموح به لحجم الصورة هو 10 ميجابايت.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const res = await apiClient.uploadFile(file, "banners");
      if (res?.url) {
        setHomepageContent((prev) => ({
          ...prev,
          heroBannerImage: res.url,
        }));
        success("تم رفع الصورة بنجاح", "تم رفع الصورة إلى سحابة التخزين وتعيينها كبانر للهيرو.");
      } else {
        throw new Error("لم يتم إرجاع رابط الصورة من الخادم");
      }
    } catch (err: any) {
      console.error("Image upload failed:", err);
      toastError("تعذر رفع ملف الصورة", err?.message || "تأكد من الاتصال بالخادم أو أدخل رابط الصورة المباشر في خانة الرابط.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSavePolicy = () => {
    MockStore.updatePageContent(activePolicySlug, policyContent);
    success("تم حفظ محتوى الصفحة", "تم تحديث نصوص السياسة والشروط بنجاح.");
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    try {
      await MockStore.updateContactSettings(contactSettings);
      success("تم حفظ بيانات الاتصال", "تم تحديث أرقام التواصل وعناوين الفروع ومزامنتها بنجاح مع قاعدة البيانات والموقع.");
    } catch (err: any) {
      toastError("تعذر حفظ بيانات الاتصال", err?.message || "يرجى التحقق من الاتصال بالخادم والمحاولة مجدداً.");
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleToggleSocial = (id: string) => {
    MockStore.toggleSocialLink(id);
    success("تم تحديث حالة الرابط", "تم تفعيل / تعطيل ظهور الرابط على الموقع.");
  };

  const handleSaveHomepage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHomepage(true);
    try {
      await MockStore.updateHomepageContent(homepageContent);
      success("تم تحديث نصوص الصفحة الرئيسية", "تم حفظ إعدادات الهيرو والعناوين ومزامنتها بنجاح مع قاعدة البيانات والموقع.");
    } catch (err: any) {
      toastError("تعذر حفظ تعديلات الواجهة", err?.message || "يرجى التحقق من الاتصال بالخادم والمحاولة مجدداً.");
    } finally {
      setIsSavingHomepage(false);
    }
  };

  const handleSavePillars = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPillars(true);
    try {
      const updated: HomepageContent = {
        ...homepageContent,
        pillarsBadge: pillarsContent.badge,
        pillarsTitle: pillarsContent.title,
        pillarsSubtitle: pillarsContent.subtitle,
        pillars: pillarsContent.pillars,
      };
      setHomepageContent(updated);
      await MockStore.updateHomepageContent(updated);
      success("تم حفظ ركائز التميز بنجاح", "تم تحديث محتوى قسم 'لماذا يختار النخبة' ومزامنته مع الموقع فوراً.");
    } catch (err: any) {
      toastError("تعذر حفظ ركائز التميز", err?.message || "يرجى التحقق من الاتصال بالخادم والمحاولة مجدداً.");
    } finally {
      setIsSavingPillars(false);
    }
  };

  const handleSaveSeo = (e: React.FormEvent) => {
    e.preventDefault();
    MockStore.updateSeoDefaults(seoDefaults);
    success("تم حفظ إعدادات SEO العامة", "تم تحديث البيانات الوصفية الافتراضية للموقع.");
  };

  return (
    <ProtectedRoute module="websiteContent" action="view">
      <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="إدارة محتوى الموقع الإلكتروني"
        description="التحكم في المحتوى العام المنشور على الواجهة العامة: الأسئلة الشائعة، الصفحات القانونية، بيانات التواصل، الهيرو والسيو."
        breadcrumbs={[{ label: "محتوى الموقع" }]}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            صلاحية حصرية لمدير عام النظام (Super Admin)
          </span>
        }
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-border pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("HOMEPAGE")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "HOMEPAGE"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-secondary-text hover:text-primary-text hover:bg-zinc-100"
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>الواجهة الرئيسية (Hero Banner)</span>
        </button>

        <button
          onClick={() => setActiveTab("PILLARS")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "PILLARS"
              ? "bg-brand-charcoal text-brand-gold border border-brand-gold/40 shadow-xs"
              : "text-secondary-text hover:text-primary-text hover:bg-zinc-100"
          }`}
        >
          <Award className="w-4 h-4 text-brand-gold" />
          <span>لماذا يختار النخبة؟ (ركائز التميز)</span>
        </button>

        <button
          onClick={() => setActiveTab("CONTACT")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "CONTACT"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-secondary-text hover:text-primary-text hover:bg-zinc-100"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>بيانات التواصل وساعات العمل</span>
        </button>

        <button
          onClick={() => setActiveTab("SOCIAL")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "SOCIAL"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-secondary-text hover:text-primary-text hover:bg-zinc-100"
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>روابط التواصل الاجتماعي</span>
        </button>

        <button
          onClick={() => setActiveTab("PAGES")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "PAGES"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-secondary-text hover:text-primary-text hover:bg-zinc-100"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>السياسات والشروط المنسقة</span>
        </button>

        <button
          onClick={() => setActiveTab("FAQS")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "FAQS"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-secondary-text hover:text-primary-text hover:bg-zinc-100"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>الأسئلة الشائعة (FAQ)</span>
        </button>

        <button
          onClick={() => setActiveTab("SEO")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "SEO"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-secondary-text hover:text-primary-text hover:bg-zinc-100"
          }`}
        >
          <Search className="w-4 h-4" />
          <span>إعدادات SEO الافتراضية</span>
        </button>
      </div>

      {/* ===================== Tab A: FAQs ===================== */}
      {activeTab === "FAQS" && (
        <div className="space-y-4 text-right">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-primary-text">
                قائمة الأسئلة الشائعة والأجوبة ({faqs.length})
              </h3>
              <p className="text-xs text-secondary-text mt-0.5">
                تظهر هذه الأسئلة لزوار الموقع لتسهيل التعرف على خدمات إشراقة المستقبل.
              </p>
            </div>

            <ActionTooltip label="إضافة سؤال وجواب جديد" variant="gold">
              <button
                onClick={() => {
                  setFaqModal({
                    isOpen: true,
                    isEdit: false,
                    question: "",
                    answer: "",
                    category: "GENERAL",
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة سؤال وجواب</span>
              </button>
            </ActionTooltip>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs flex flex-col justify-between gap-3 group hover:border-brand-gold/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[11px] font-semibold text-brand-gold-deep bg-brand-gold-light px-2 py-0.5 rounded-md">
                      {faq.category === "BUYING" ? "الشراء" : faq.category === "SELLING" ? "البيع" : "عام"}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-primary-text">{faq.question}</h4>
                    <p className="text-xs sm:text-sm text-secondary-text leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Edit FAQ */}
                    <ActionTooltip label="تعديل السؤال والإجابة" variant="amber">
                      <button
                        onClick={() => {
                          setFaqModal({
                            isOpen: true,
                            isEdit: true,
                            faqId: faq.id,
                            question: faq.question,
                            answer: faq.answer,
                            category: faq.category,
                          });
                        }}
                        className="p-2 text-secondary-text hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </ActionTooltip>

                    {/* Delete FAQ (Password Protected) */}
                    <ActionTooltip label="حذف السؤال نهائياً (يتطلب كلمة المرور)" variant="rose">
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: "faq",
                            id: faq.id,
                            name: faq.question,
                          })
                        }
                        className="p-2 text-secondary-text hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </ActionTooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== Tab B: Legal Pages with Rich Toolbar ===================== */}
      {activeTab === "PAGES" && (
        <div className="space-y-4 text-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePolicySlug("privacy-policy")}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activePolicySlug === "privacy-policy"
                    ? "bg-brand-charcoal text-white font-bold"
                    : "bg-surface border border-neutral-border text-secondary-text hover:bg-zinc-100"
                }`}
              >
                سياسة الخصوصية
              </button>
              <button
                onClick={() => setActivePolicySlug("terms-conditions")}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activePolicySlug === "terms-conditions"
                    ? "bg-brand-charcoal text-white font-bold"
                    : "bg-surface border border-neutral-border text-secondary-text hover:bg-zinc-100"
                }`}
              >
                الشروط والأحكام
              </button>
            </div>

            {/* Toggle Preview */}
            <button
              onClick={() => setShowPolicyPreview(!showPolicyPreview)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-text bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPolicyPreview ? "العودة للتحرير" : "معاينة كما تظهر للزوار"}</span>
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-border-subtle">
              <h3 className="font-bold text-base text-primary-text">
                محرر النصوص المنسق: {activePolicySlug === "privacy-policy" ? "سياسة الخصوصية" : "الشروط والأحكام العامة"}
              </h3>
              <span className="text-xs text-secondary-text">يدعم تنسيق HTML والعناصر النقطية والخطوط</span>
            </div>

            {/* Rich Formatting Toolbar */}
            {!showPolicyPreview && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-warm-white border border-neutral-border rounded-xl text-xs">
                <span className="text-secondary-text px-2 text-[11px] font-semibold border-l border-neutral-border">
                  أدوات التنسيق:
                </span>

                <ActionTooltip label="خط عريض <b>" variant="gold">
                  <button
                    type="button"
                    onClick={() => insertFormatting("<b>", "</b>", "نص عريض")}
                    className="p-1.5 text-secondary-text hover:text-primary-text hover:bg-zinc-200 rounded-md cursor-pointer font-bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                </ActionTooltip>

                <ActionTooltip label="عنصر قائمة نقطية <li>" variant="gold">
                  <button
                    type="button"
                    onClick={() => insertFormatting("<li>", "</li>", "عنصر نقطي")}
                    className="p-1.5 text-secondary-text hover:text-primary-text hover:bg-zinc-200 rounded-md cursor-pointer"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </ActionTooltip>

                {/* Heading levels H1 to H6 */}
                <div className="flex items-center gap-1 border-x border-neutral-border px-1.5">
                  {[
                    { tag: "h1", name: "H1", title: "عنوان رئيسي ضخم <h1>", defaultText: "عنوان رئيسي ضخم" },
                    { tag: "h2", name: "H2", title: "عنوان رئيسي ثانٍ <h2>", defaultText: "عنوان رئيسي" },
                    { tag: "h3", name: "H3", title: "عنوان قسم فرعي <h3>", defaultText: "عنوان قسم" },
                    { tag: "h4", name: "H4", title: "عنوان بند <h4>", defaultText: "عنوان بند" },
                    { tag: "h5", name: "H5", title: "عنوان فرعي صغير <h5>", defaultText: "عنوان صغير" },
                    { tag: "h6", name: "H6", title: "عنوان فرعي دقيق <h6>", defaultText: "عنوان دقيق" },
                  ].map((h) => (
                    <ActionTooltip key={h.tag} label={h.title} variant="gold">
                      <button
                        type="button"
                        onClick={() => insertFormatting(`<${h.tag}>`, `</${h.tag}>`, h.defaultText)}
                        className="px-2 py-1 text-xs font-bold text-secondary-text hover:text-primary-text hover:bg-zinc-200 rounded-md cursor-pointer transition-colors"
                      >
                        {h.name}
                      </button>
                    </ActionTooltip>
                  ))}
                </div>

                <ActionTooltip label="تكبير حجم الخط (16px)" variant="gold">
                  <button
                    type="button"
                    onClick={() =>
                      insertFormatting(
                        "<span style=\"font-size: 16px; font-weight: 600;\">",
                        "</span>",
                        "نص بحجم أكبر"
                      )
                    }
                    className="p-1.5 text-secondary-text hover:text-primary-text hover:bg-zinc-200 rounded-md cursor-pointer"
                  >
                    <Type className="w-4 h-4" />
                  </button>
                </ActionTooltip>

                <ActionTooltip label="نزول سطر جديد <br/>" variant="gold">
                  <button
                    type="button"
                    onClick={() => insertFormatting("<br/>\n")}
                    className="p-1.5 text-secondary-text hover:text-primary-text hover:bg-zinc-200 rounded-md cursor-pointer"
                  >
                    <CornerDownLeft className="w-4 h-4" />
                  </button>
                </ActionTooltip>

                <ActionTooltip label="فاصل أفقي <hr/>" variant="gold">
                  <button
                    type="button"
                    onClick={() => insertFormatting("\n<hr/>\n")}
                    className="px-2 py-1 text-[11px] text-secondary-text hover:text-primary-text hover:bg-zinc-200 rounded-md cursor-pointer"
                  >
                    فاصل ──
                  </button>
                </ActionTooltip>
              </div>
            )}

            {/* Textarea or Preview */}
            {showPolicyPreview ? (
              <div
                className="w-full min-h-[300px] p-5 rounded-xl bg-warm-white border border-neutral-border text-xs sm:text-sm text-primary-text leading-relaxed whitespace-pre-wrap font-sans"
                dangerouslySetInnerHTML={{ __html: policyContent }}
              />
            ) : (
              <textarea
                ref={textareaRef}
                rows={14}
                value={policyContent}
                onChange={(e) => setPolicyContent(e.target.value)}
                placeholder="اكتب أو انسخ محتوى السياسة والشروط هنا، واستخدم شريط الأدوات بالأعلى لإضافة التنسيقات..."
                className="w-full p-4 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold resize-y leading-relaxed font-mono dir-ltr text-right"
              />
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-secondary-text">
                💡 التنسيقات المدعومة سيتم تفسيرها وعرضها كعناصر منسقة مباشرة في موقع الواجهة العامة.
              </span>

              <button
                onClick={handleSavePolicy}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات والنشر</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Tab C: Contact Details ===================== */}
      {activeTab === "CONTACT" && (
        <form onSubmit={handleSaveContact} className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-5">
          <h3 className="font-bold text-base text-primary-text pb-2 border-b border-neutral-border-subtle">
            بيانات التواصل العامة بالمملكة العربية السعودية
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">اسم الشركة الرسمي:</label>
              <input
                type="text"
                value={contactSettings.companyName}
                onChange={(e) => setContactSettings({ ...contactSettings, companyName: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">البريد الإلكتروني العام:</label>
              <input
                type="email"
                value={contactSettings.email}
                onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl dir-ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">رقم الهاتف الأساسي (الرقم الموحد):</label>
              <input
                type="text"
                value={contactSettings.contactPhone}
                onChange={(e) => setContactSettings({ ...contactSettings, contactPhone: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl dir-ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">رقم هاتف إضافي / أرضي:</label>
              <input
                type="text"
                value={contactSettings.secondaryPhone || ""}
                onChange={(e) => setContactSettings({ ...contactSettings, secondaryPhone: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl dir-ltr"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-primary-text mb-1">العنوان الرئيسي للمقر:</label>
              <input
                type="text"
                value={contactSettings.address}
                onChange={(e) => setContactSettings({ ...contactSettings, address: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-primary-text mb-1">ساعات وأيام العمل الرسمية:</label>
              <input
                type="text"
                value={contactSettings.workingHours}
                onChange={(e) => setContactSettings({ ...contactSettings, workingHours: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-border-subtle flex justify-end">
            <button
              type="submit"
              disabled={isSavingContact}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 rounded-xl shadow-xs cursor-pointer"
            >
              {isSavingContact ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ بيانات الاتصال</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ===================== Tab D: Social Links ===================== */}
      {activeTab === "SOCIAL" && (
        <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-border-subtle">
            <div>
              <h3 className="font-bold text-base text-primary-text">
                روابط قنوات التواصل الاجتماعي وحسابات المنصة
              </h3>
              <p className="text-xs text-secondary-text mt-0.5">
                إضافة وتعديل وحذف روابط السوشيال ميديا المعروضة في فوتر ومقدمة الموقع.
              </p>
            </div>

            <ActionTooltip label="إضافة رابط حساب جديد" variant="gold">
              <button
                onClick={() =>
                  setSocialModal({
                    isOpen: true,
                    isEdit: false,
                    platform: "WHATSAPP",
                    title: "",
                    url: "",
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة رابط جديد</span>
              </button>
            </ActionTooltip>
          </div>

          <div className="divide-y divide-neutral-border-subtle">
            {socialLinks.map((link) => (
              <div key={link.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="text-right overflow-hidden flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-primary-text">{link.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-mono">
                      {link.platform}
                    </span>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-gold-deep hover:underline dir-ltr block truncate mt-0.5"
                  >
                    {link.url}
                  </a>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Status Toggle */}
                  <button
                    onClick={() => handleToggleSocial(link.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      link.enabled
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    {link.enabled ? "مفعل وظاهر" : "معطل"}
                  </button>

                  {/* Edit */}
                  <ActionTooltip label="تعديل الرابط" variant="amber">
                    <button
                      onClick={() =>
                        setSocialModal({
                          isOpen: true,
                          isEdit: true,
                          linkId: link.id,
                          platform: link.platform,
                          title: link.title,
                          url: link.url,
                        })
                      }
                      className="p-1.5 text-secondary-text hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </ActionTooltip>

                  {/* Delete (Password Protected) */}
                  <ActionTooltip label="حذف الرابط نهائياً (يتطلب كلمة المرور)" variant="rose">
                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: "social",
                          id: link.id,
                          name: link.title,
                        })
                      }
                      className="p-1.5 text-secondary-text hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </ActionTooltip>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== Tab E: Homepage Hero with Local File Upload ===================== */}
      {activeTab === "HOMEPAGE" && (
        <form onSubmit={handleSaveHomepage} className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-5">
          <h3 className="font-bold text-base text-primary-text pb-2 border-b border-neutral-border-subtle">
            الواجهة الرئيسية للموقع (Hero Banner Section)
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">العنوان الرئيسي للهيرو (H1):</label>
              <input
                type="text"
                value={homepageContent.heroTitle}
                onChange={(e) => setHomepageContent({ ...homepageContent, heroTitle: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">العنوان الفرعي والوصف الترويجي:</label>
              <textarea
                rows={3}
                value={homepageContent.heroSubtitle}
                onChange={(e) => setHomepageContent({ ...homepageContent, heroSubtitle: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">نص زر الدعوة للإجراء (CTA):</label>
                <input
                  type="text"
                  value={homepageContent.ctaLabel}
                  onChange={(e) => setHomepageContent({ ...homepageContent, ctaLabel: e.target.value })}
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">شارة الهوية الترويجية:</label>
                <input
                  type="text"
                  value={homepageContent.badgeText}
                  onChange={(e) => setHomepageContent({ ...homepageContent, badgeText: e.target.value })}
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
                />
              </div>

              {/* Hero Banner Image: Upload from device only */}
              <div className="sm:col-span-2 space-y-3">
                <label className="block text-xs font-semibold text-primary-text">
                  صورة بانر الهيرو (واجهة الموقع):
                </label>

                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-neutral-border bg-warm-white">
                  {/* Image Preview */}
                  <div className="w-full sm:w-56 h-32 rounded-lg overflow-hidden border border-neutral-border bg-zinc-100 flex items-center justify-center shrink-0 relative group">
                    <img
                      src={
                        homepageContent.heroBannerImage ||
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
                      }
                      alt="Hero Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2 flex-1 text-right">
                    <p className="text-xs text-primary-text font-semibold">
                      رفع صورة مخصصة للهيرو من جهازك (JPG, PNG, WebP)
                    </p>
                    <p className="text-[11px] text-secondary-text">
                      يمكنك اختيار أي صورة تريدها ليتم رفعها وتثبيتها كخلفية رسمية لواجهة الموقع (الحد الأقصى 10 ميجابايت). وفي حال إزالة الصورة سيتم استرجاع الصورة الافتراضية تلقائياً.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>جارٍ رفع الصورة...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>اختيار صورة جديدة من جهازك</span>
                          </>
                        )}
                      </button>

                      {homepageContent.heroBannerImage &&
                        homepageContent.heroBannerImage !==
                          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80" && (
                          <button
                            type="button"
                            onClick={() =>
                              setHomepageContent((prev) => ({
                                ...prev,
                                heroBannerImage:
                                  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
                              }))
                            }
                            className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200"
                          >
                            استعادة الصورة الافتراضية
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-border-subtle flex justify-end">
            <button
              type="submit"
              disabled={isSavingHomepage || isUploadingImage}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 rounded-xl shadow-xs cursor-pointer transition-all"
            >
              {isSavingHomepage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ الحفظ والمزامنة...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ محتوى الهيرو</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ===================== Tab: Vision Pillars ("لماذا يختار النخبة؟") ===================== */}
      {activeTab === "PILLARS" && (
        <form onSubmit={handleSavePillars} className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-border-subtle gap-4">
            <div>
              <h3 className="font-bold text-base text-primary-text flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-gold" />
                <span>إدارة ركائز التميز المؤسسي (&quot;لماذا يختار النخبة إشراقة المستقبل؟&quot;)</span>
              </h3>
              <p className="text-xs text-secondary-text mt-1">
                التحكم الكامل بالعنوان الرئيسي، الوصف التمهيدي، والأربع ركائز الاستراتيجية المعروضة على الصفحة الرئيسية.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSavingPillars}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingPillars ? "جاري الحفظ..." : "حفظ ومزامنة ركائز التميز"}</span>
            </button>
          </div>

          {/* Section Headers Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">
                شارة القسم الترويجية (Badge):
              </label>
              <input
                type="text"
                value={pillarsContent.badge}
                onChange={(e) => setPillarsContent({ ...pillarsContent, badge: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
                placeholder="مثال: ركائز التميز المؤسسي"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">
                العنوان الرئيسي للقسم (H2):
              </label>
              <input
                type="text"
                value={pillarsContent.title}
                onChange={(e) => setPillarsContent({ ...pillarsContent, title: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl font-bold"
                placeholder='مثال: لماذا يختار النخبة "إشراقة المستقبل"؟'
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-primary-text mb-1">
                الوصف والتمهيد الاستراتيجي للقسم:
              </label>
              <textarea
                rows={2}
                value={pillarsContent.subtitle}
                onChange={(e) => setPillarsContent({ ...pillarsContent, subtitle: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
                placeholder="نضع الشفافية والجودة الهندسية وراحة العميل في صدارة أولوياتنا..."
              />
            </div>
          </div>

          {/* 4 Pillars Cards Grid */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-primary-text border-b border-neutral-border-subtle pb-2">
              النقاط الأربع الرئيسية (The 4 Pillars):
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pillarsContent.pillars.map((pillar, idx) => {
                const iconOptions = [
                  { id: "Building2", label: "معمارية / مباني", icon: Building2 },
                  { id: "ShieldCheck", label: "صكوك وضمانات", icon: ShieldCheck },
                  { id: "Cpu", label: "تقنيات Smart Home", icon: Cpu },
                  { id: "Banknote", label: "عوائد واستثمار", icon: Banknote },
                  { id: "Award", label: "تميز وجودة", icon: Award },
                  { id: "Sparkles", label: "فخامة وعصرية", icon: Sparkles },
                ];

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-warm-white/70 border border-neutral-border hover:border-brand-gold/60 transition-all space-y-4 shadow-2xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-border-subtle">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-charcoal text-white">
                        الركيزة #{idx + 1}
                      </span>
                      <span className="text-[11px] text-secondary-text">
                        تعديل العنوان والجملة والأيقونة
                      </span>
                    </div>

                    {/* Icon Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-text mb-1.5">
                        الأيقونة الرمزية:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {iconOptions.map((opt) => {
                          const IconComp = opt.icon;
                          const isSelected = pillar.icon === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                const next = [...pillarsContent.pillars];
                                next[idx] = { ...next[idx], icon: opt.id };
                                setPillarsContent({ ...pillarsContent, pillars: next });
                              }}
                              className={`p-2 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-brand-charcoal text-white border-brand-gold shadow-xs"
                                  : "bg-surface text-secondary-text border-neutral-border hover:bg-zinc-100"
                              }`}
                            >
                              <IconComp className={`w-4 h-4 ${isSelected ? "text-brand-gold" : ""}`} />
                              <span className="text-[10px] truncate max-w-[80px]">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-text mb-1">
                        عنوان النقطة:
                      </label>
                      <input
                        type="text"
                        value={pillar.title}
                        onChange={(e) => {
                          const next = [...pillarsContent.pillars];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setPillarsContent({ ...pillarsContent, pillars: next });
                        }}
                        className="w-full p-2.5 text-xs sm:text-sm bg-surface border border-neutral-border rounded-xl font-bold"
                        placeholder="مثال: معايير معمارية استثنائية"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-text mb-1">
                        الجملة / الوصف التفصيلي:
                      </label>
                      <textarea
                        rows={3}
                        value={pillar.description}
                        onChange={(e) => {
                          const next = [...pillarsContent.pillars];
                          next[idx] = { ...next[idx], description: e.target.value };
                          setPillarsContent({ ...pillarsContent, pillars: next });
                        }}
                        className="w-full p-2.5 text-xs sm:text-sm bg-surface border border-neutral-border rounded-xl leading-relaxed"
                        placeholder="تصاميم عصرية مستوحاة من العمارة السلمانية..."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Live Preview */}
          <div className="p-6 rounded-2xl bg-[#09090B] text-white border border-brand-gold/30 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold text-brand-gold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                معاينة حية لشكل القسم كما يظهر على الموقع الإلكتروني:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
                Live Preview
              </span>
            </div>

            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 text-[11px] font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>{pillarsContent.badge}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                {pillarsContent.title}
              </h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                {pillarsContent.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {pillarsContent.pillars.map((p, pIdx) => {
                const getIcon = (name: string) => {
                  switch (name) {
                    case "Building2":
                      return Building2;
                    case "ShieldCheck":
                      return ShieldCheck;
                    case "Cpu":
                      return Cpu;
                    case "Banknote":
                      return Banknote;
                    case "Sparkles":
                      return Sparkles;
                    default:
                      return Award;
                  }
                };
                const PkIcon = getIcon(p.icon);
                return (
                  <div key={pIdx} className="p-4 rounded-2xl bg-[#141418] border border-white/10 space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 flex items-center justify-center">
                      <PkIcon className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{p.title}</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-light">{p.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingPillars}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingPillars ? "جاري الحفظ..." : "حفظ ومزامنة ركائز التميز"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ===================== Tab F: SEO Defaults ===================== */}
      {activeTab === "SEO" && (
        <form onSubmit={handleSaveSeo} className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-5">
          <h3 className="font-bold text-base text-primary-text pb-2 border-b border-neutral-border-subtle">
            البيانات الوصفية الافتراضية لمحركات البحث (SEO Defaults)
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">عنوان الموقع الافتراضي (Site Title):</label>
              <input
                type="text"
                value={seoDefaults.websiteTitle}
                onChange={(e) => setSeoDefaults({ ...seoDefaults, websiteTitle: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">الوصف الميتاديتا الافتراضي (Meta Description):</label>
              <textarea
                rows={3}
                value={seoDefaults.defaultMetaDescription}
                onChange={(e) => setSeoDefaults({ ...seoDefaults, defaultMetaDescription: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">الكلمات الدلالية الافتراضية (Keywords):</label>
              <input
                type="text"
                value={seoDefaults.defaultKeywords}
                onChange={(e) => setSeoDefaults({ ...seoDefaults, defaultKeywords: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-border-subtle flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات SEO</span>
            </button>
          </div>
        </form>
      )}

      {/* ===================== Add / Edit FAQ Modal ===================== */}
      {faqModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() =>
            setFaqModal({
              isOpen: false,
              isEdit: false,
              question: "",
              answer: "",
              category: "GENERAL",
            })
          }
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl text-right animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle">
              <h3 className="text-base font-bold text-primary-text">
                {faqModal.isEdit ? "تعديل السؤال الشائع" : "إضافة سؤال وجواب جديد"}
              </h3>
              <button
                onClick={() =>
                  setFaqModal({
                    isOpen: false,
                    isEdit: false,
                    question: "",
                    answer: "",
                    category: "GENERAL",
                  })
                }
                className="p-1 text-secondary-text hover:text-primary-text rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  نص السؤال <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={faqModal.question}
                  onChange={(e) => setFaqModal({ ...faqModal, question: e.target.value })}
                  placeholder="مثال: كيف يتم سداد مقدم الحجز أو الإيجار؟"
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">التصنيف:</label>
                <select
                  value={faqModal.category}
                  onChange={(e) =>
                    setFaqModal({
                      ...faqModal,
                      category: e.target.value as "GENERAL" | "BUYING" | "SELLING" | "RENTING",
                    })
                  }
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl cursor-pointer"
                >
                  <option value="GENERAL">عام</option>
                  <option value="BUYING">الشراء والتعاقد</option>
                  <option value="SELLING">البيع وطرح العقارات</option>
                  <option value="RENTING">الإيجار وإدارة الأملاك</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  الإجابة التفصيلية <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={4}
                  value={faqModal.answer}
                  onChange={(e) => setFaqModal({ ...faqModal, answer: e.target.value })}
                  placeholder="اكتب الإجابة الشافية الواضحة للعملاء..."
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-border-subtle flex justify-end gap-2">
              <button
                onClick={() =>
                  setFaqModal({
                    isOpen: false,
                    isEdit: false,
                    question: "",
                    answer: "",
                    category: "GENERAL",
                  })
                }
                className="px-3.5 py-2 text-xs text-secondary-text hover:bg-zinc-100 rounded-xl border border-neutral-border cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveFaq}
                className="px-5 py-2 text-xs font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs cursor-pointer"
              >
                {faqModal.isEdit ? "حفظ التعديلات" : "نشر السؤال"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Add / Edit Social Link Modal ===================== */}
      {socialModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() =>
            setSocialModal({
              isOpen: false,
              isEdit: false,
              platform: "WHATSAPP",
              title: "",
              url: "",
            })
          }
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl text-right animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle">
              <h3 className="text-base font-bold text-primary-text">
                {socialModal.isEdit ? "تعديل رابط المنصة" : "إضافة رابط تواصل اجتماعي جديد"}
              </h3>
              <button
                onClick={() =>
                  setSocialModal({
                    isOpen: false,
                    isEdit: false,
                    platform: "WHATSAPP",
                    title: "",
                    url: "",
                  })
                }
                className="p-1 text-secondary-text hover:text-primary-text rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">المنصة:</label>
                <select
                  value={socialModal.platform}
                  onChange={(e) =>
                    setSocialModal({
                      ...socialModal,
                      platform: e.target.value as SocialLink["platform"],
                    })
                  }
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl cursor-pointer"
                >
                  <option value="WHATSAPP">واتساب (WhatsApp)</option>
                  <option value="X_TWITTER">منصة إكس / تويتر (X)</option>
                  <option value="INSTAGRAM">إنستغرام (Instagram)</option>
                  <option value="TIKTOK">تيك توك (TikTok)</option>
                  <option value="SNAPCHAT">سناب شات (Snapchat)</option>
                  <option value="LINKEDIN">لينكد إن (LinkedIn)</option>
                  <option value="YOUTUBE">يوتيوب (YouTube)</option>
                  <option value="FACEBOOK">فيسبوك (Facebook)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  اسم الحساب أو العنوان بالعربية <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={socialModal.title}
                  onChange={(e) => setSocialModal({ ...socialModal, title: e.target.value })}
                  placeholder="مثال: حساب إكس الرسمي، قناة يوتيوب..."
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  رابط الحساب (URL) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="url"
                  value={socialModal.url}
                  onChange={(e) => setSocialModal({ ...socialModal, url: e.target.value })}
                  placeholder="https://x.com/eshraqat_realestate"
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl dir-ltr focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-border-subtle flex justify-end gap-2">
              <button
                onClick={() =>
                  setSocialModal({
                    isOpen: false,
                    isEdit: false,
                    platform: "WHATSAPP",
                    title: "",
                    url: "",
                  })
                }
                className="px-3.5 py-2 text-xs text-secondary-text hover:bg-zinc-100 rounded-xl border border-neutral-border cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveSocial}
                className="px-5 py-2 text-xs font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs cursor-pointer"
              >
                {socialModal.isEdit ? "حفظ التعديلات" : "إضافة الرابط"}
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
        title="تأكيد الحذف الأمني لمحتوى الموقع"
        description={`هل أنت متأكد من حذف (${deleteTarget?.name || ""}) نهائياً من الموقع؟ يتطلب هذا الإجراء تأكيد صلاحية المشرف العام عبر إدخال كلمة المرور.`}
        confirmLabel="تأكيد الحذف النهائي"
        cancelLabel="إلغاء"
        variant="destructive"
        requirePassword={true}
      />
    </div>
  </ProtectedRoute>
  );
}
