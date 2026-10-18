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
} from "lucide-react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
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
} from "@/types/content";

type ContentTab = "FAQS" | "PAGES" | "CONTACT" | "SOCIAL" | "HOMEPAGE" | "SEO";

interface DeleteTarget {
  type: "faq" | "social";
  id: string;
  name: string;
}

export default function WebsiteContentPage() {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<ContentTab>("FAQS");

  // Content States from Store
  const [faqs, setFaqs] = useState<FAQ[]>(MockStore.getFaqs());
  const [pages, setPages] = useState<WebsitePageContent[]>(MockStore.getPages());
  const [contactSettings, setContactSettings] = useState<ContactSettings>(MockStore.getContactSettings());
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(MockStore.getSocialLinks());
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(MockStore.getHomepageContent());
  const [seoDefaults, setSeoDefaults] = useState<SeoDefaults>(MockStore.getSeoDefaults());

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
      setHomepageContent(MockStore.getHomepageContent());
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

  // Image Upload handler via FileReader
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastError("حجم الملف كبير", "الحد الأقصى المسموح به لحجم الصورة هو 5 ميجابايت.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setHomepageContent((prev) => ({
        ...prev,
        heroBannerImage: result,
      }));
      success("تم تحميل الصورة بنجاح", "تم تجهيز صورة الهيرو للعرض. احفظ التعديلات لاعتمادها.");
    };
    reader.readAsDataURL(file);
  };

  const handleSavePolicy = () => {
    MockStore.updatePageContent(activePolicySlug, policyContent);
    success("تم حفظ محتوى الصفحة", "تم تحديث نصوص السياسة والشروط بنجاح.");
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    MockStore.updateContactSettings(contactSettings);
    success("تم حفظ بيانات الاتصال", "تم تحديث أرقام التواصل وعناوين الفروع.");
  };

  const handleToggleSocial = (id: string) => {
    MockStore.toggleSocialLink(id);
    success("تم تحديث حالة الرابط", "تم تفعيل / تعطيل ظهور الرابط على الموقع.");
  };

  const handleSaveHomepage = (e: React.FormEvent) => {
    e.preventDefault();
    MockStore.updateHomepageContent(homepageContent);
    success("تم تحديث نصوص الصفحة الرئيسية", "تم حفظ إعدادات الهيرو والعناوين الترويجية.");
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
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ بيانات الاتصال</span>
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

              {/* Local File Upload for Hero Banner */}
              <div className="sm:col-span-2 space-y-3">
                <label className="block text-xs font-semibold text-primary-text">
                  صورة بانر الهيرو (تحميل مباشر من الجهاز بدلاً من رابط URL):
                </label>

                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-neutral-border bg-warm-white">
                  {/* Image Preview */}
                  <div className="w-full sm:w-48 h-28 rounded-lg overflow-hidden border border-neutral-border bg-zinc-100 flex items-center justify-center shrink-0 relative group">
                    {homepageContent.heroBannerImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={homepageContent.heroBannerImage}
                        alt="Hero Banner Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-secondary-text gap-1">
                        <ImageIcon className="w-8 h-8 text-zinc-400" />
                        <span className="text-[11px]">لا توجد صورة</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 text-right">
                    <p className="text-xs text-primary-text font-semibold">
                      اختر صورة عالية الدقة بصيغة JPG أو PNG أو WebP من جهازك
                    </p>
                    <p className="text-[11px] text-secondary-text">
                      يتم حفظ الصورة محلياً واستعراضها فوراً كخلفية رسمية لواجهة الموقع (بحد أقصى 5 ميجابايت).
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-lg transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>تحميل صورة من جهازك</span>
                      </button>

                      {homepageContent.heroBannerImage && (
                        <button
                          type="button"
                          onClick={() =>
                            setHomepageContent((prev) => ({
                              ...prev,
                              heroBannerImage: "",
                            }))
                          }
                          className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          إزالة الصورة
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
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ محتوى الهيرو</span>
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
