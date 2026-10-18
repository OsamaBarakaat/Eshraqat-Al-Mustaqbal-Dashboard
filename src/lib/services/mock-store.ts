"use client";

import { Property } from "@/types/property";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import { Client, LeadStatus } from "@/types/client";
import { Inquiry, InquiryStatus } from "@/types/inquiry";
import { AdminUser, Role, RoleType, ModuleType, ActionType } from "@/types/team";
import { Project, Developer } from "@/types/project";
import { FAQ, ContactSettings, SocialLink, HomepageContent, SeoDefaults, WebsitePageContent } from "@/types/content";
import { Province, City, District } from "@/types/location";
import { DashboardStats } from "@/types/stats";
import { AuditActivity } from "@/types/common";

import { INITIAL_PROPERTIES } from "../mock-data/properties";
import { INITIAL_APPOINTMENTS } from "../mock-data/appointments";
import { INITIAL_CLIENTS } from "../mock-data/clients";
import { INITIAL_INQUIRIES } from "../mock-data/inquiries";
import { INITIAL_USERS, INITIAL_ROLES } from "../mock-data/team";
import { INITIAL_PROJECTS, INITIAL_DEVELOPERS } from "../mock-data/projects";
import {
  INITIAL_FAQS,
  INITIAL_PAGES,
  INITIAL_CONTACT_SETTINGS,
  INITIAL_SOCIAL_LINKS,
  INITIAL_HOMEPAGE_CONTENT,
  INITIAL_SEO_DEFAULTS,
} from "../mock-data/content";
import { INITIAL_SAUDI_LOCATIONS } from "../mock-data/locations";

// In-memory singletons that persist during session
let propertiesState: Property[] = [...INITIAL_PROPERTIES];
const appointmentsState: Appointment[] = [...INITIAL_APPOINTMENTS];
const clientsState: Client[] = [...INITIAL_CLIENTS];
const inquiriesState: Inquiry[] = [...INITIAL_INQUIRIES];
let usersState: AdminUser[] = [...INITIAL_USERS];
let rolesState: Role[] = [...INITIAL_ROLES];
const projectsState: Project[] = [...INITIAL_PROJECTS];
const developersState: Developer[] = [...INITIAL_DEVELOPERS];
let locationsState: Province[] = [...INITIAL_SAUDI_LOCATIONS];
let faqsState: FAQ[] = [...INITIAL_FAQS];
const pagesState: WebsitePageContent[] = [...INITIAL_PAGES];
let contactSettingsState: ContactSettings = { ...INITIAL_CONTACT_SETTINGS };
let socialLinksState: SocialLink[] = [...INITIAL_SOCIAL_LINKS];
let homepageState: HomepageContent = { ...INITIAL_HOMEPAGE_CONTENT };
let seoState: SeoDefaults = { ...INITIAL_SEO_DEFAULTS };
let currentUserIdState: string = INITIAL_USERS[0].id;

let auditLogState: AuditActivity[] = [
  {
    id: "act-1",
    action: "تأكيد موعد معاينة",
    actorName: "أحمد منصور",
    actorRole: "مستشار مبيعات",
    targetType: "appointment",
    targetTitle: "معاينة دوبلكس الياسمين - د. هالة الشربيني",
    timestamp: "2026-10-18T16:10:00.000Z",
    details: "تم التنسيق هاتفياً وتأكيد الموعد غداً الساعة 3:30 عصراً",
  },
  {
    id: "act-2",
    action: "تحديث سعر عقار",
    actorName: "خالد عبد الرحيم",
    actorRole: "مدير عقارات",
    targetType: "property",
    targetTitle: "مكتب إداري بالملقا ESH-1003",
    timestamp: "2026-10-18T11:00:00.000Z",
    details: "تعديل القيمة الإيجارية السنوية إلى 180,000 ر.س",
  },
  {
    id: "act-3",
    action: "تسجيل استفسار جديد",
    actorName: "بوابة الموقع",
    actorRole: "النظام",
    targetType: "inquiry",
    targetTitle: "استفسار من م. طارق العسقلاني بخصوص فيلا النرجس",
    timestamp: "2026-10-18T10:15:00.000Z",
    details: "طلب معاينة فيلا النرجس شمال الرياض",
  },
];

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore
    }
  });
}

export function subscribeToMockStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const MockStore = {
  // Properties
  getProperties(): Property[] {
    return [...propertiesState];
  },
  getPropertyById(id: string): Property | undefined {
    return propertiesState.find((p) => p.id === id || p.code === id);
  },
  addProperty(property: Omit<Property, "id" | "createdAt" | "updatedAt" | "viewsCount" | "inquiriesCount">): Property {
    const newProperty: Property = {
      ...property,
      id: `prop-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewsCount: 0,
      inquiriesCount: 0,
    };
    propertiesState = [newProperty, ...propertiesState];
    MockStore.addAuditActivity({
      action: "إضافة عقار جديد",
      actorName: "أسامة بركات",
      actorRole: "مدير النظام",
      targetType: "property",
      targetTitle: `${newProperty.code} - ${newProperty.title}`,
    });
    notifyListeners();
    return newProperty;
  },
  updateProperty(id: string, updates: Partial<Property>): Property | null {
    const index = propertiesState.findIndex((p) => p.id === id);
    if (index === -1) return null;
    propertiesState[index] = {
      ...propertiesState[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    MockStore.addAuditActivity({
      action: "تعديل عقار",
      actorName: "خالد عبد الرحيم",
      actorRole: "مدير عقارات",
      targetType: "property",
      targetTitle: propertiesState[index].title,
    });
    notifyListeners();
    return propertiesState[index];
  },
  deleteProperty(id: string): boolean {
    const p = propertiesState.find((item) => item.id === id);
    if (!p) return false;
    propertiesState = propertiesState.filter((item) => item.id !== id);
    MockStore.addAuditActivity({
      action: "حذف عقار",
      actorName: "أسامة بركات",
      actorRole: "مدير النظام",
      targetType: "property",
      targetTitle: p.title,
    });
    notifyListeners();
    return true;
  },

  // Appointments
  getAppointments(): Appointment[] {
    return [...appointmentsState];
  },
  getAppointmentById(id: string): Appointment | undefined {
    return appointmentsState.find((a) => a.id === id);
  },
  updateAppointmentStatus(id: string, status: AppointmentStatus, reason?: string): Appointment | null {
    const index = appointmentsState.findIndex((a) => a.id === id);
    if (index === -1) return null;
    const current = appointmentsState[index];
    const updates: Partial<Appointment> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (status === "REJECTED" && reason) {
      updates.rejectionReason = reason;
    }
    if (status === "CANCELLED" && reason) {
      updates.cancellationReason = reason;
    }
    appointmentsState[index] = { ...current, ...updates };
    MockStore.addAuditActivity({
      action: `تحديث حالة المعاينة إلى (${status})`,
      actorName: "أحمد منصور",
      actorRole: "مستشار مبيعات",
      targetType: "appointment",
      targetTitle: `معاينة: ${current.customerName} - ${current.propertyTitle}`,
      details: reason,
    });
    notifyListeners();
    return appointmentsState[index];
  },
  assignAppointmentEmployee(id: string, employeeId: string, employeeName: string): Appointment | null {
    const index = appointmentsState.findIndex((a) => a.id === id);
    if (index === -1) return null;
    appointmentsState[index] = {
      ...appointmentsState[index],
      assignedEmployeeId: employeeId,
      assignedEmployeeName: employeeName,
      updatedAt: new Date().toISOString(),
    };
    notifyListeners();
    return appointmentsState[index];
  },

  // Clients
  getClients(): Client[] {
    return [...clientsState];
  },
  getClientById(id: string): Client | undefined {
    return clientsState.find((c) => c.id === id);
  },
  updateClientStatus(id: string, status: LeadStatus): Client | null {
    const index = clientsState.findIndex((c) => c.id === id);
    if (index === -1) return null;
    const client = clientsState[index];
    client.status = status;
    client.lastActivityAt = new Date().toISOString();
    client.timeline.unshift({
      id: `t-${Date.now()}`,
      type: "STATUS_CHANGE",
      title: "تغيير حالة العميل",
      description: `تم تحديث حالة العميل إلى (${status})`,
      timestamp: new Date().toISOString(),
      authorName: "المستخدم الحالي",
    });
    notifyListeners();
    return client;
  },
  addClientTimelineNote(id: string, note: string): Client | null {
    const index = clientsState.findIndex((c) => c.id === id);
    if (index === -1) return null;
    const client = clientsState[index];
    client.lastActivityAt = new Date().toISOString();
    client.timeline.unshift({
      id: `t-${Date.now()}`,
      type: "NOTE",
      title: "ملاحظة متابعة",
      description: note,
      timestamp: new Date().toISOString(),
      authorName: "أحمد منصور",
    });
    notifyListeners();
    return client;
  },

  // Inquiries
  getInquiries(): Inquiry[] {
    return [...inquiriesState];
  },
  updateInquiryStatus(id: string, status: InquiryStatus, replyNotes?: string): Inquiry | null {
    const index = inquiriesState.findIndex((i) => i.id === id);
    if (index === -1) return null;
    const inq = inquiriesState[index];
    inq.status = status;
    if (replyNotes) {
      inq.replyNotes = replyNotes;
      inq.repliedAt = new Date().toISOString();
    }
    notifyListeners();
    return inq;
  },

  // Team & Users
  getUsers(): AdminUser[] {
    return [...usersState];
  },
  getRoles(): Role[] {
    return [...rolesState];
  },
  addUser(user: Omit<AdminUser, "id" | "createdAt" | "lastActiveAt">): AdminUser {
    const newUser: AdminUser = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
    usersState = [...usersState, newUser];
    notifyListeners();
    return newUser;
  },
  updateUser(id: string, updates: Partial<AdminUser>): AdminUser | null {
    const index = usersState.findIndex((u) => u.id === id);
    if (index === -1) return null;
    usersState[index] = { ...usersState[index], ...updates };
    notifyListeners();
    return usersState[index];
  },
  deleteUser(id: string): boolean {
    const u = usersState.find((item) => item.id === id);
    if (!u) return false;
    usersState = usersState.filter((item) => item.id !== id);
    notifyListeners();
    return true;
  },

  // Current Auth Session & Permissions Checking
  getCurrentUser(): AdminUser {
    const user = usersState.find((u) => u.id === currentUserIdState);
    return user || usersState[0] || INITIAL_USERS[0];
  },
  setCurrentUser(userId: string): boolean {
    const user = usersState.find((u) => u.id === userId);
    if (!user) return false;
    currentUserIdState = userId;
    notifyListeners();
    return true;
  },
  getCurrentRole(): Role | undefined {
    const user = this.getCurrentUser();
    return rolesState.find((r) => r.name === user.role || r.id === user.role);
  },
  hasPermission(module: ModuleType, action: ActionType): boolean {
    const user = this.getCurrentUser();
    if (user.role === "SUPER_ADMIN") return true;
    const role = rolesState.find((r) => r.name === user.role || r.id === user.role);
    if (!role) return false;
    const perm = role.permissions.find((p) => p.module === module);
    return Boolean(perm?.actions.includes(action));
  },
  hasModuleAccess(module: ModuleType): boolean {
    const user = this.getCurrentUser();
    if (user.role === "SUPER_ADMIN") return true;
    const role = rolesState.find((r) => r.name === user.role || r.id === user.role);
    if (!role) return false;
    const perm = role.permissions.find((p) => p.module === module);
    return Boolean(perm && perm.actions.length > 0);
  },

  // Permissions & Roles customization
  toggleRolePermission(roleId: string, moduleKey: ModuleType, actionKey: ActionType): boolean {
    const role = rolesState.find((r) => r.id === roleId);
    if (!role) return false;
    let perm = role.permissions.find((p) => p.module === moduleKey);
    if (!perm) {
      perm = { module: moduleKey, actions: [actionKey] };
      role.permissions.push(perm);
    } else {
      const idx = perm.actions.indexOf(actionKey);
      if (idx > -1) {
        perm.actions.splice(idx, 1);
      } else {
        perm.actions.push(actionKey);
      }
    }
    notifyListeners();
    return true;
  },
  addCustomRole(nameArabic: string, description: string, permissions: Role["permissions"]): Role {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: `CUSTOM_ROLE_${Date.now()}` as RoleType,
      titleArabic: nameArabic,
      description,
      permissions,
    };
    rolesState = [...rolesState, newRole];
    notifyListeners();
    return newRole;
  },
  deleteRole(roleId: string): boolean {
    const role = rolesState.find((r) => r.id === roleId);
    if (!role) return false;
    if (role.name === "SUPER_ADMIN") return false;
    rolesState = rolesState.filter((r) => r.id !== roleId);
    notifyListeners();
    return true;
  },

  // Projects & Developers (kept in store)
  getProjects(): Project[] {
    return [...projectsState];
  },
  getDevelopers(): Developer[] {
    return [...developersState];
  },
  toggleProjectPublish(id: string): boolean {
    const p = projectsState.find((item) => item.id === id);
    if (!p) return false;
    p.published = !p.published;
    notifyListeners();
    return p.published;
  },

  // Saudi Locations (Provinces -> Cities -> Districts)
  getLocations(): Province[] {
    return [...locationsState];
  },
  addProvince(nameArabic: string, nameEnglish: string): Province {
    const newProv: Province = {
      id: `prov-${Date.now()}`,
      nameArabic,
      nameEnglish: nameEnglish || nameArabic,
      country: "المملكة العربية السعودية",
      enabled: true,
      cities: [],
    };
    locationsState = [...locationsState, newProv];
    notifyListeners();
    return newProv;
  },
  updateProvince(id: string, nameArabic: string, nameEnglish: string): boolean {
    const prov = locationsState.find((p) => p.id === id);
    if (!prov) return false;
    prov.nameArabic = nameArabic;
    prov.nameEnglish = nameEnglish;
    notifyListeners();
    return true;
  },
  deleteProvince(id: string): boolean {
    locationsState = locationsState.filter((p) => p.id !== id);
    notifyListeners();
    return true;
  },
  addCity(provinceId: string, nameArabic: string, nameEnglish: string): City | null {
    const prov = locationsState.find((p) => p.id === provinceId);
    if (!prov) return null;
    const newCity: City = {
      id: `city-${Date.now()}`,
      nameArabic,
      nameEnglish: nameEnglish || nameArabic,
      provinceId,
      enabled: true,
      districts: [],
      propertiesCount: 0,
    };
    prov.cities.push(newCity);
    notifyListeners();
    return newCity;
  },
  updateCity(provinceId: string, cityId: string, nameArabic: string, nameEnglish: string): boolean {
    const prov = locationsState.find((p) => p.id === provinceId);
    if (!prov) return false;
    const city = prov.cities.find((c) => c.id === cityId);
    if (!city) return false;
    city.nameArabic = nameArabic;
    city.nameEnglish = nameEnglish;
    notifyListeners();
    return true;
  },
  deleteCity(provinceId: string, cityId: string): boolean {
    const prov = locationsState.find((p) => p.id === provinceId);
    if (!prov) return false;
    prov.cities = prov.cities.filter((c) => c.id !== cityId);
    notifyListeners();
    return true;
  },
  addDistrict(provinceId: string, cityId: string, nameArabic: string, nameEnglish: string): District | null {
    const prov = locationsState.find((p) => p.id === provinceId);
    if (!prov) return null;
    const city = prov.cities.find((c) => c.id === cityId);
    if (!city) return null;
    const newDist: District = {
      id: `dist-${Date.now()}`,
      nameArabic,
      nameEnglish: nameEnglish || nameArabic,
      cityId,
      enabled: true,
      propertiesCount: 0,
    };
    city.districts.push(newDist);
    notifyListeners();
    return newDist;
  },
  updateDistrict(provinceId: string, cityId: string, districtId: string, nameArabic: string, nameEnglish: string): boolean {
    const prov = locationsState.find((p) => p.id === provinceId);
    if (!prov) return false;
    const city = prov.cities.find((c) => c.id === cityId);
    if (!city) return false;
    const dist = city.districts.find((d) => d.id === districtId);
    if (!dist) return false;
    dist.nameArabic = nameArabic;
    dist.nameEnglish = nameEnglish;
    notifyListeners();
    return true;
  },
  deleteDistrict(provinceId: string, cityId: string, districtId: string): boolean {
    const prov = locationsState.find((p) => p.id === provinceId);
    if (!prov) return false;
    const city = prov.cities.find((c) => c.id === cityId);
    if (!city) return false;
    city.districts = city.districts.filter((d) => d.id !== districtId);
    notifyListeners();
    return true;
  },

  // Content
  getFaqs(): FAQ[] {
    return [...faqsState];
  },
  addFaq(faq: Omit<FAQ, "id">): FAQ {
    const newFaq: FAQ = { ...faq, id: `faq-${Date.now()}` };
    faqsState = [...faqsState, newFaq];
    notifyListeners();
    return newFaq;
  },
  updateFaq(id: string, updates: Partial<FAQ>): boolean {
    const index = faqsState.findIndex((f) => f.id === id);
    if (index === -1) return false;
    faqsState[index] = { ...faqsState[index], ...updates };
    notifyListeners();
    return true;
  },
  deleteFaq(id: string): boolean {
    faqsState = faqsState.filter((f) => f.id !== id);
    notifyListeners();
    return true;
  },
  getPages(): WebsitePageContent[] {
    return [...pagesState];
  },
  updatePageContent(slug: string, content: string): boolean {
    const page = pagesState.find((p) => p.slug === slug);
    if (!page) return false;
    page.content = content;
    page.updatedAt = new Date().toISOString();
    notifyListeners();
    return true;
  },
  getContactSettings(): ContactSettings {
    return { ...contactSettingsState };
  },
  updateContactSettings(settings: Partial<ContactSettings>): ContactSettings {
    contactSettingsState = { ...contactSettingsState, ...settings };
    notifyListeners();
    return contactSettingsState;
  },
  getSocialLinks(): SocialLink[] {
    return [...socialLinksState];
  },
  addSocialLink(platform: SocialLink["platform"], title: string, url: string): SocialLink {
    const newLink: SocialLink = {
      id: `soc-${Date.now()}`,
      platform,
      title,
      url,
      enabled: true,
    };
    socialLinksState = [...socialLinksState, newLink];
    notifyListeners();
    return newLink;
  },
  updateSocialLink(id: string, updates: Partial<SocialLink>): boolean {
    const index = socialLinksState.findIndex((l) => l.id === id);
    if (index === -1) return false;
    socialLinksState[index] = { ...socialLinksState[index], ...updates };
    notifyListeners();
    return true;
  },
  deleteSocialLink(id: string): boolean {
    socialLinksState = socialLinksState.filter((l) => l.id !== id);
    notifyListeners();
    return true;
  },
  toggleSocialLink(id: string): boolean {
    const link = socialLinksState.find((l) => l.id === id);
    if (!link) return false;
    link.enabled = !link.enabled;
    notifyListeners();
    return link.enabled;
  },
  getHomepageContent(): HomepageContent {
    return { ...homepageState };
  },
  updateHomepageContent(content: Partial<HomepageContent>): HomepageContent {
    homepageState = { ...homepageState, ...content };
    notifyListeners();
    return homepageState;
  },
  getSeoDefaults(): SeoDefaults {
    return { ...seoState };
  },
  updateSeoDefaults(seo: Partial<SeoDefaults>): SeoDefaults {
    seoState = { ...seoState, ...seo };
    notifyListeners();
    return seoState;
  },

  // Audit Log
  getAuditLog(): AuditActivity[] {
    return [...auditLogState];
  },
  addAuditActivity(activity: Omit<AuditActivity, "id" | "timestamp">) {
    const newActivity: AuditActivity = {
      ...activity,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    auditLogState = [newActivity, ...auditLogState.slice(0, 19)];
  },

  // Dynamically computed Dashboard Stats
  getDashboardStats(): DashboardStats {
    const publishedProps = propertiesState.filter((p) => p.status === "PUBLISHED").length;
    const draftProps = propertiesState.filter((p) => p.status === "DRAFT").length;
    const archivedProps = propertiesState.filter((p) => p.status === "ARCHIVED").length;
    const pendingAppts = appointmentsState.filter((a) => a.status === "PENDING_CONFIRMATION").length;
    const confirmedAppts = appointmentsState.filter((a) => a.status === "CONFIRMED").length;
    const newInqs = inquiriesState.filter((i) => i.status === "NEW").length;
    const converted = clientsState.filter((c) => c.status === "CONVERTED").length;

    return {
      totalProperties: propertiesState.length,
      publishedProperties: publishedProps,
      draftProperties: draftProps,
      archivedProperties: archivedProps,
      totalProjects: 0, // projects temporarily hidden
      pendingAppointments: pendingAppts,
      upcomingAppointments: confirmedAppts,
      newInquiries: newInqs,
      totalClients: clientsState.length,
      convertedClients: converted,
    };
  },
};
