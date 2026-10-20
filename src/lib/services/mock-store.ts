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
import { apiClient } from "./api-client";

import {
  INITIAL_CONTACT_SETTINGS,
  INITIAL_HOMEPAGE_CONTENT,
  INITIAL_SEO_DEFAULTS,
} from "../mock-data/content";

// ==========================================
// IN-MEMORY CACHE (DYNAMIC - SYNCS WITH POSTGRESQL/SUPABASE)
// ==========================================
let propertiesState: Property[] = [];
let appointmentsState: Appointment[] = [];
let clientsState: Client[] = [];
let inquiriesState: Inquiry[] = [];
let usersState: AdminUser[] = [];
let rolesState: Role[] = [];
const projectsState: Project[] = [];
const developersState: Developer[] = [];
let locationsState: Province[] = [];
let faqsState: FAQ[] = [];
let pagesState: WebsitePageContent[] = [];
let contactSettingsState: ContactSettings = { ...INITIAL_CONTACT_SETTINGS };
let socialLinksState: SocialLink[] = [];
let homepageState: HomepageContent = { ...INITIAL_HOMEPAGE_CONTENT };
let seoState: SeoDefaults = { ...INITIAL_SEO_DEFAULTS };

const defaultAdminUser: AdminUser = {
  id: "admin-default",
  name: "م. أسامة (المدير العام)",
  email: "admin@eshraqat.sa",
  role: "SUPER_ADMIN",
  status: "ACTIVE",
  phone: "+966 50 123 4567",
  department: "الإدارة العامة",
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
};

let currentUserIdState: string = defaultAdminUser.id;
let currentUserObj: AdminUser = { ...defaultAdminUser };
let isInitializedFromBackend = false;
let isLoadingBackend = false;

let auditLogState: AuditActivity[] = [];

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

// ==========================================
// DATA MAPPERS (Backend <-> Dashboard)
// ==========================================
function mapBackendPropertyToDashboard(p: any): Property {
  return {
    id: p.id,
    code: p.code,
    title: p.title,
    shortDescription: p.shortDescription,
    fullDescription: p.fullDescription,
    category: p.category,
    purpose: p.purpose,
    status: p.status,
    price: Number(p.price),
    currency: p.currency || "ر.س",
    originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
    discountPercentage: p.discountPercentage ?? undefined,
    area: Number(p.area),
    areaUnit: p.areaUnit || "م²",
    maintenanceFee: p.maintenanceFee ? Number(p.maintenanceFee) : undefined,
    location: {
      country: p.country || "المملكة العربية السعودية",
      city: p.city,
      area: p.areaName,
      streetAddress: p.streetAddress || undefined,
      latitude: p.latitude ?? undefined,
      longitude: p.longitude ?? undefined,
    },
    specs: {
      residential:
        p.category === "RESIDENTIAL"
          ? {
              bedrooms: p.residentialBedrooms || 0,
              bathrooms: p.residentialBathrooms || 0,
              livingRooms: p.residentialLivingRooms || 0,
              floor: p.residentialFloor || 0,
              totalFloors: p.residentialTotalFloors || 0,
              furnishing: p.residentialFurnishing || "UNFURNISHED",
            }
          : undefined,
      commercial:
        p.category === "COMMERCIAL"
          ? {
              commercialCategory: p.commercialCategory || "",
              suitableActivity: p.commercialSuitableActivity || "",
              roomsCount: p.commercialRoomsCount || 0,
              floor: p.commercialFloor ?? undefined,
            }
          : undefined,
      agricultural:
        p.category === "AGRICULTURAL"
          ? {
              landClassification: p.landClassification || "",
              waterAvailability: Boolean(p.waterAvailability),
              waterSource: p.waterSource || undefined,
            }
          : undefined,
    },
    amenities: p.amenities || [],
    images: (p.images || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      caption: img.caption || undefined,
      isPrimary: Boolean(img.isPrimary),
    })),
    seo: {
      seoTitle: p.seoTitle || p.title,
      metaDescription: p.metaDescription || p.shortDescription,
      slug: p.slug,
    },
    createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date(p.createdAt).toISOString(),
    updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : new Date(p.updatedAt).toISOString(),
    viewsCount: p.viewsCount || 0,
    inquiriesCount: p.inquiriesCount || 0,
    featured: Boolean(p.featured),
  };
}

function mapDashboardPropertyToBackend(p: Partial<Property>): any {
  return {
    code: p.code,
    title: p.title,
    shortDescription: p.shortDescription,
    fullDescription: p.fullDescription,
    category: p.category,
    purpose: p.purpose,
    status: p.status,
    price: Number(p.price),
    currency: p.currency || "ر.س",
    originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
    discountPercentage: p.discountPercentage ?? undefined,
    area: Number(p.area),
    areaUnit: p.areaUnit || "م²",
    maintenanceFee: p.maintenanceFee ? Number(p.maintenanceFee) : undefined,
    country: p.location?.country || "المملكة العربية السعودية",
    city: p.location?.city || "الرياض",
    areaName: p.location?.area || "حي النرجس",
    streetAddress: p.location?.streetAddress,
    latitude: p.location?.latitude,
    longitude: p.location?.longitude,
    residentialBedrooms: p.specs?.residential?.bedrooms,
    residentialBathrooms: p.specs?.residential?.bathrooms,
    residentialLivingRooms: p.specs?.residential?.livingRooms,
    residentialFloor: p.specs?.residential?.floor,
    residentialTotalFloors: p.specs?.residential?.totalFloors,
    residentialFurnishing: p.specs?.residential?.furnishing,
    commercialCategory: p.specs?.commercial?.commercialCategory,
    commercialSuitableActivity: p.specs?.commercial?.suitableActivity,
    commercialRoomsCount: p.specs?.commercial?.roomsCount,
    commercialFloor: p.specs?.commercial?.floor,
    landClassification: p.specs?.agricultural?.landClassification,
    waterAvailability: p.specs?.agricultural?.waterAvailability,
    waterSource: p.specs?.agricultural?.waterSource,
    amenities: p.amenities || [],
    seoTitle: p.seo?.seoTitle,
    metaDescription: p.seo?.metaDescription,
    slug: p.seo?.slug,
    images: (p.images || []).map((img, idx) => ({
      url: img.url,
      caption: img.caption,
      isPrimary: img.isPrimary !== undefined ? img.isPrimary : idx === 0,
      displayOrder: idx,
    })),
  };
}

function mapBackendUserToDashboard(u: any): AdminUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role?.code || u.roleCode || "SALES_AGENT",
    status: u.status || "ACTIVE",
    avatar: u.avatar || undefined,
    department: u.department || undefined,
    lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : new Date().toISOString(),
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
  };
}

function mapBackendRoleToDashboard(r: any): Role {
  return {
    id: r.id,
    name: r.code as RoleType,
    titleArabic: r.titleArabic,
    description: r.description,
    permissions: (r.permissions || []).map((p: any) => ({
      module: p.module as ModuleType,
      actions: p.actions as ActionType[],
    })),
  };
}

// ==========================================
// CENTRAL DYNAMIC STORE
// ==========================================
export const MockStore = {
  subscribe(listener: Listener): () => void {
    return subscribeToMockStore(listener);
  },

  // ------------------------------------------
  // LIVE INITIALIZATION & AUTH
  // ------------------------------------------
  async initFromBackend() {
    if (typeof window === "undefined") return;

    try {
      // 1. Try to load user profile if token exists
      const token = localStorage.getItem("eshraqat_access_token");
      if (token) {
        try {
          const profile = await apiClient.get<any>("/auth/me");
          if (profile) {
            currentUserObj = mapBackendUserToDashboard(profile);
            currentUserIdState = profile.id;
          }
        } catch {
          // Token might be expired
        }
      }

      isLoadingBackend = true;
      // 2. Load Core Modules in parallel
      const [
        propertiesRes,
        locationsRes,
        appointmentsRes,
        clientsRes,
        inquiriesRes,
        usersRes,
        rolesRes,
        homepageRes,
        contactRes,
        seoRes,
        faqsRes,
        socialRes,
        pagesRes,
        auditRes,
      ] = await Promise.allSettled([
        apiClient.get<any>("/properties", { limit: 100 }),
        apiClient.get<any>("/locations"),
        apiClient.get<any>("/appointments", { limit: 100 }),
        apiClient.get<any>("/clients", { limit: 100 }),
        apiClient.get<any>("/inquiries", { limit: 100 }),
        apiClient.get<any>("/users", { limit: 100 }),
        apiClient.get<any>("/roles"),
        apiClient.get<any>("/cms/homepage"),
        apiClient.get<any>("/cms/contact"),
        apiClient.get<any>("/cms/seo"),
        apiClient.get<any>("/cms/faqs"),
        apiClient.get<any>("/cms/social-links"),
        apiClient.get<any>("/cms/pages"),
        apiClient.get<any>("/audit-logs", { limit: 15 }),
      ]);

      if (propertiesRes.status === "fulfilled" && propertiesRes.value?.items) {
        propertiesState = propertiesRes.value.items.map(mapBackendPropertyToDashboard);
      } else {
        try {
          const pubProps = await apiClient.get<any>("/properties/public", { limit: 100 });
          if (pubProps?.items) {
            propertiesState = pubProps.items.map(mapBackendPropertyToDashboard);
          }
        } catch {
          // keep initial properties
        }
      }

      if (locationsRes.status === "fulfilled" && Array.isArray(locationsRes.value)) {
        locationsState = locationsRes.value.map((prov: any) => ({
          id: prov.id,
          nameArabic: prov.nameArabic,
          nameEnglish: prov.nameEnglish,
          country: prov.country || "المملكة العربية السعودية",
          enabled: prov.enabled ?? true,
          cities: (prov.cities || []).map((city: any) => ({
            id: city.id,
            provinceId: prov.id,
            nameArabic: city.nameArabic,
            nameEnglish: city.nameEnglish,
            enabled: city.enabled ?? true,
            propertiesCount: city._count?.properties || 0,
            districts: (city.districts || []).map((dist: any) => ({
              id: dist.id,
              cityId: city.id,
              nameArabic: dist.nameArabic,
              nameEnglish: dist.nameEnglish,
              enabled: dist.enabled ?? true,
              propertiesCount: dist._count?.properties || 0,
            })),
          })),
        }));
      } else {
        try {
          const pubLocs = await apiClient.get<any>("/locations/public");
          if (Array.isArray(pubLocs)) {
            locationsState = pubLocs.map((prov: any) => ({
              id: prov.id,
              nameArabic: prov.nameArabic,
              nameEnglish: prov.nameEnglish,
              country: prov.country || "المملكة العربية السعودية",
              enabled: prov.enabled ?? true,
              cities: (prov.cities || []).map((city: any) => ({
                id: city.id,
                provinceId: prov.id,
                nameArabic: city.nameArabic,
                nameEnglish: city.nameEnglish,
                enabled: city.enabled ?? true,
                propertiesCount: city._count?.properties || 0,
                districts: (city.districts || []).map((dist: any) => ({
                  id: dist.id,
                  cityId: city.id,
                  nameArabic: dist.nameArabic,
                  nameEnglish: dist.nameEnglish,
                  enabled: dist.enabled ?? true,
                  propertiesCount: dist._count?.properties || 0,
                })),
              })),
            }));
          }
        } catch {
          // keep initial locations
        }
      }

      if (appointmentsRes.status === "fulfilled" && appointmentsRes.value?.items) {
        appointmentsState = appointmentsRes.value.items;
      }

      if (clientsRes.status === "fulfilled" && clientsRes.value?.items) {
        clientsState = clientsRes.value.items;
      }

      if (inquiriesRes.status === "fulfilled" && inquiriesRes.value?.items) {
        inquiriesState = inquiriesRes.value.items;
      }

      if (usersRes.status === "fulfilled" && usersRes.value?.items) {
        usersState = usersRes.value.items.map(mapBackendUserToDashboard);
      }

      if (rolesRes.status === "fulfilled" && Array.isArray(rolesRes.value)) {
        rolesState = rolesRes.value.map(mapBackendRoleToDashboard);
      }

      if (homepageRes.status === "fulfilled" && homepageRes.value) {
        homepageState = homepageRes.value;
      }

      if (contactRes.status === "fulfilled" && contactRes.value) {
        contactSettingsState = contactRes.value;
      }

      if (seoRes.status === "fulfilled" && seoRes.value) {
        seoState = seoRes.value;
      }

      if (faqsRes.status === "fulfilled" && Array.isArray(faqsRes.value)) {
        faqsState = faqsRes.value;
      }

      if (socialRes.status === "fulfilled" && Array.isArray(socialRes.value)) {
        socialLinksState = socialRes.value;
      }

      if (pagesRes.status === "fulfilled" && Array.isArray(pagesRes.value)) {
        pagesState = pagesRes.value;
      }

      // 3. Map Real Audit Activity Log from Backend
      if (auditRes.status === "fulfilled" && auditRes.value?.items && Array.isArray(auditRes.value.items)) {
        auditLogState = auditRes.value.items.map((log: any) => ({
          id: log.id,
          action: log.action,
          actorName: log.actorName,
          actorRole: log.actorRole,
          targetType: log.targetType,
          targetTitle: log.targetTitle,
          timestamp: log.createdAt || new Date().toISOString(),
          details: log.details,
        }));
      }

      // If CMS endpoints failed, fallback to public bootstrap
      if (homepageRes.status !== "fulfilled" || contactRes.status !== "fulfilled") {
        try {
          const boot = await apiClient.get<any>("/cms/public/bootstrap");
          if (boot) {
            if (boot.homepage) homepageState = boot.homepage;
            if (boot.contact) contactSettingsState = boot.contact;
            if (boot.seo) seoState = boot.seo;
            if (Array.isArray(boot.socialLinks)) socialLinksState = boot.socialLinks;
            if (Array.isArray(boot.faqs)) faqsState = boot.faqs;
            if (Array.isArray(boot.pages)) pagesState = boot.pages;
          }
        } catch {
          // keep initial cms
        }
      }

      isInitializedFromBackend = true;
      notifyListeners();
    } catch {
      // Keep state as is
    } finally {
      isLoadingBackend = false;
      notifyListeners();
    }
  },

  async login(email: string, password: string):Promise<any> {
    const res = await apiClient.post<any>("/auth/login", { email, password });
    if (res?.tokens?.accessToken) {
      apiClient.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
      if (res.user) {
        currentUserObj = mapBackendUserToDashboard(res.user);
        currentUserIdState = res.user.id;
        if (res.user.role) {
          const mappedRole = mapBackendRoleToDashboard(res.user.role);
          const existingIdx = rolesState.findIndex((r) => r.id === mappedRole.id);
          if (existingIdx > -1) {
            rolesState[existingIdx] = mappedRole;
          } else {
            rolesState.push(mappedRole);
          }
        }
      }
      // Re-sync all live data from backend
      await this.initFromBackend();
    }
    return res;
  },

  logout() {
    apiClient.clearTokens();
    currentUserObj = { ...defaultAdminUser };
    currentUserIdState = defaultAdminUser.id;
    propertiesState = [];
    appointmentsState = [];
    clientsState = [];
    inquiriesState = [];
    usersState = [];
    rolesState = [];
    auditLogState = [];
    isInitializedFromBackend = false;
    notifyListeners();
  },

  // ------------------------------------------
  // PROPERTIES
  // ------------------------------------------
  getProperties(): Property[] {
    return [...propertiesState];
  },

  getPropertyById(id: string): Property | undefined {
    return propertiesState.find((p) => p.id === id || p.code === id);
  },

  addProperty(property: Omit<Property, "id" | "createdAt" | "updatedAt" | "viewsCount" | "inquiriesCount">): Property {
    const tempId = `prop-${Date.now()}`;
    const newProperty: Property = {
      ...property,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewsCount: 0,
      inquiriesCount: 0,
    };

    // Optimistic UI update
    propertiesState = [newProperty, ...propertiesState];
    MockStore.addAuditActivity({
      action: "إضافة عقار جديد",
      actorName: currentUserObj.name || "المدير العام",
      actorRole: currentUserObj.role || "SUPER_ADMIN",
      targetType: "property",
      targetTitle: `${newProperty.code} - ${newProperty.title}`,
    });
    notifyListeners();

    // Async call to live backend
    const payload = mapDashboardPropertyToBackend(property);
    apiClient
      .post("/properties", payload)
      .then((created) => {
        if (created?.id) {
          const mapped = mapBackendPropertyToDashboard(created);
          propertiesState = propertiesState.map((p) => (p.id === tempId ? mapped : p));
          notifyListeners();
        }
      })
      .catch((err) => {
        console.error("Failed to persist property to backend:", err);
      });

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
      actorName: currentUserObj.name || "المدير العام",
      actorRole: currentUserObj.role || "SUPER_ADMIN",
      targetType: "property",
      targetTitle: propertiesState[index].title,
    });
    notifyListeners();

    // Async call to live backend
    const payload = mapDashboardPropertyToBackend(propertiesState[index]);
    apiClient
      .put(`/properties/${id}`, payload)
      .then((updated) => {
        if (updated?.id) {
          propertiesState[index] = mapBackendPropertyToDashboard(updated);
          notifyListeners();
        }
      })
      .catch((err) => {
        console.error("Failed to update property on backend:", err);
      });

    return propertiesState[index];
  },

  deleteProperty(id: string): boolean {
    const p = propertiesState.find((item) => item.id === id);
    if (!p) return false;

    propertiesState = propertiesState.filter((item) => item.id !== id);
    MockStore.addAuditActivity({
      action: "حذف عقار",
      actorName: currentUserObj.name || "المدير العام",
      actorRole: currentUserObj.role || "SUPER_ADMIN",
      targetType: "property",
      targetTitle: p.title,
    });
    notifyListeners();

    // Async call to live backend
    apiClient.delete(`/properties/${id}`).catch((err) => {
      console.error("Failed to delete property on backend:", err);
    });

    return true;
  },

  // ------------------------------------------
  // APPOINTMENTS
  // ------------------------------------------
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
    if (status === "REJECTED" && reason) updates.rejectionReason = reason;
    if (status === "CANCELLED" && reason) updates.cancellationReason = reason;

    appointmentsState[index] = { ...current, ...updates };
    MockStore.addAuditActivity({
      action: `تحديث حالة المعاينة إلى (${status})`,
      actorName: currentUserObj.name || "المدير العام",
      actorRole: currentUserObj.role || "SUPER_ADMIN",
      targetType: "appointment",
      targetTitle: `معاينة: ${current.customerName} - ${current.propertyTitle}`,
      details: reason,
    });
    notifyListeners();

    // Async call to live backend
    apiClient
      .patch(`/appointments/${id}/status`, {
        status,
        rejectionReason: updates.rejectionReason,
        cancellationReason: updates.cancellationReason,
      })
      .catch((err) => {
        console.error("Failed to update appointment status on backend:", err);
      });

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

    // Async call to live backend
    apiClient.patch(`/appointments/${id}/assign`, { assignedEmployeeId: employeeId }).catch((err) => {
      console.error("Failed to assign appointment employee on backend:", err);
    });

    return appointmentsState[index];
  },

  // ------------------------------------------
  // CLIENTS & CRM
  // ------------------------------------------
  getClients(): Client[] {
    return [...clientsState];
  },

  getClientById(id: string): Client | undefined {
    return clientsState.find((c) => c.id === id);
  },

  updateClientStatus(id: string, status: LeadStatus, reason?: string): Client | null {
    const index = clientsState.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const client = clientsState[index];
    client.status = status;
    client.lastActivityAt = new Date().toISOString();
    client.timeline.unshift({
      id: `t-${Date.now()}`,
      type: "STATUS_CHANGE",
      title: "تغيير حالة العميل",
      description: reason || `تم تحديث حالة العميل إلى (${status})`,
      timestamp: new Date().toISOString(),
      authorName: currentUserObj.name || "المدير العام",
    });
    notifyListeners();

    // Async call to live backend
    apiClient.patch(`/clients/${id}/status`, { status, reason }).catch((err) => {
      console.error("Failed to update client status on backend:", err);
    });

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
      authorName: currentUserObj.name || "المدير العام",
    });
    notifyListeners();

    // Async call to live backend
    apiClient
      .post(`/clients/${id}/timeline`, {
        type: "NOTE",
        title: "ملاحظة متابعة",
        description: note,
      })
      .catch((err) => {
        console.error("Failed to add client timeline note on backend:", err);
      });

    return client;
  },

  // ------------------------------------------
  // INQUIRIES
  // ------------------------------------------
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

    // Async call to live backend
    if (replyNotes) {
      apiClient.patch(`/inquiries/${id}/reply`, { replyNotes }).catch((err) => {
        console.error("Failed to reply inquiry on backend:", err);
      });
    } else {
      apiClient.patch(`/inquiries/${id}/status`, { status }).catch((err) => {
        console.error("Failed to update inquiry status on backend:", err);
      });
    }

    return inq;
  },

  // ------------------------------------------
  // TEAM & USERS & ROLES
  // ------------------------------------------
  getUsers(): AdminUser[] {
    return [...usersState];
  },

  getRoles(): Role[] {
    return [...rolesState];
  },

  addUser(user: Omit<AdminUser, "id" | "createdAt" | "lastActiveAt">): AdminUser {
    const tempId = `user-${Date.now()}`;
    const newUser: AdminUser = {
      ...user,
      id: tempId,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
    usersState = [...usersState, newUser];
    notifyListeners();

    // Find roleId
    const matchingRole = rolesState.find((r) => r.name === user.role || r.id === user.role);
    apiClient
      .post("/users", {
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        roleId: matchingRole?.id || rolesState[0]?.id,
      })
      .then((created) => {
        if (created?.id) {
          usersState = usersState.map((u) => (u.id === tempId ? mapBackendUserToDashboard(created) : u));
          notifyListeners();
        }
      })
      .catch((err) => {
        console.error("Failed to add user on backend:", err);
      });

    return newUser;
  },

  updateUser(id: string, updates: Partial<AdminUser>): AdminUser | null {
    const index = usersState.findIndex((u) => u.id === id);
    if (index === -1) return null;

    usersState[index] = { ...usersState[index], ...updates };
    notifyListeners();

    const matchingRole = updates.role ? rolesState.find((r) => r.name === updates.role || r.id === updates.role) : undefined;
    apiClient
      .put(`/users/${id}`, {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        department: updates.department,
        roleId: matchingRole?.id,
      })
      .catch((err) => {
        console.error("Failed to update user on backend:", err);
      });

    return usersState[index];
  },

  deleteUser(id: string): boolean {
    const u = usersState.find((item) => item.id === id);
    if (!u) return false;

    usersState = usersState.filter((item) => item.id !== id);
    notifyListeners();

    apiClient.delete(`/users/${id}`).catch((err) => {
      console.error("Failed to delete user on backend:", err);
    });

    return true;
  },

  // ------------------------------------------
  // AUTH SESSION & PERMISSIONS
  // ------------------------------------------
  getCurrentUser(): AdminUser {
    if (currentUserIdState) {
      const found = usersState.find((u) => u.id === currentUserIdState);
      if (found) return found;
    }
    return currentUserObj || usersState[0] || defaultAdminUser;
  },

  setCurrentUser(userId: string): boolean {
    const user = usersState.find((u) => u.id === userId);
    if (!user) return false;
    currentUserIdState = userId;
    currentUserObj = { ...user };
    notifyListeners();
    return true;
  },

  getCurrentRole(): Role | undefined {
    const user = this.getCurrentUser();
    const found = rolesState.find((r) => r.name === user.role || r.id === user.role);
    if (found) return found;
    if (user.role === "SUPER_ADMIN") {
      return {
        id: "role-super-admin",
        name: "SUPER_ADMIN",
        titleArabic: "مدير عام النظام",
        description: "صلاحيات مطلقة لإدارة كامل وحدات النظام والمستخدمين والصلاحيات",
        permissions: [
          { module: "properties", actions: ["view", "create", "edit", "delete", "publish", "assign", "managePermissions"] },
          { module: "appointments", actions: ["view", "create", "edit", "delete", "publish", "assign", "managePermissions"] },
          { module: "clients", actions: ["view", "create", "edit", "delete", "publish", "assign", "managePermissions"] },
          { module: "inquiries", actions: ["view", "create", "edit", "delete", "publish", "assign", "managePermissions"] },
          { module: "websiteContent", actions: ["view", "create", "edit", "delete", "publish", "assign", "managePermissions"] },
          { module: "reports", actions: ["view", "create", "edit", "delete", "publish", "assign", "managePermissions"] },
          { module: "team", actions: ["view", "create", "edit", "delete", "publish", "assign", "managePermissions"] },
          { module: "settings", actions: ["view", "create", "edit", "delete", "publish", "assign", "managePermissions"] },
          { module: "locations", actions: ["view", "create", "edit", "delete", "publish", "assign", "managePermissions"] },
        ],
      };
    }
    return undefined;
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

    // Async sync with live backend
    apiClient
      .put(`/roles/${roleId}`, {
        titleArabic: role.titleArabic,
        description: role.description,
        permissions: role.permissions,
      })
      .catch((err) => {
        console.error("Failed to sync role permissions on backend:", err);
      });

    return true;
  },

  addCustomRole(nameArabic: string, description: string, permissions: Role["permissions"]): Role {
    const tempId = `role-${Date.now()}`;
    const newRole: Role = {
      id: tempId,
      name: `CUSTOM_ROLE_${Date.now()}` as RoleType,
      titleArabic: nameArabic,
      description,
      permissions,
    };
    rolesState = [...rolesState, newRole];
    notifyListeners();

    apiClient
      .post("/roles", {
        code: "CUSTOM",
        titleArabic: nameArabic,
        description,
        permissions,
      })
      .then((created) => {
        if (created?.id) {
          rolesState = rolesState.map((r) => (r.id === tempId ? mapBackendRoleToDashboard(created) : r));
          notifyListeners();
        }
      })
      .catch((err) => {
        console.error("Failed to add custom role on backend:", err);
      });

    return newRole;
  },

  deleteRole(roleId: string): boolean {
    const role = rolesState.find((r) => r.id === roleId);
    if (!role) return false;
    if (role.name === "SUPER_ADMIN") return false;

    rolesState = rolesState.filter((r) => r.id !== roleId);
    notifyListeners();

    apiClient.delete(`/roles/${roleId}`).catch((err) => {
      console.error("Failed to delete role on backend:", err);
    });

    return true;
  },

  // ------------------------------------------
  // PROJECTS & DEVELOPERS
  // ------------------------------------------
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

  // ------------------------------------------
  // SAUDI LOCATIONS
  // ------------------------------------------
  getLocations(): Province[] {
    return [...locationsState];
  },

  addProvince(nameArabic: string, nameEnglish: string): Province {
    const tempId = `prov-${Date.now()}`;
    const newProv: Province = {
      id: tempId,
      nameArabic,
      nameEnglish: nameEnglish || nameArabic,
      country: "المملكة العربية السعودية",
      enabled: true,
      cities: [],
    };
    locationsState = [...locationsState, newProv];
    notifyListeners();

    apiClient
      .post("/locations/provinces", { nameArabic, nameEnglish: nameEnglish || nameArabic })
      .then((created) => {
        if (created?.id) {
          locationsState = locationsState.map((p) => (p.id === tempId ? { ...p, id: created.id } : p));
          notifyListeners();
        }
      })
      .catch((err) => {
        console.error("Failed to add province on backend:", err);
      });

    return newProv;
  },

  updateProvince(id: string, nameArabic: string, nameEnglish: string): boolean {
    const prov = locationsState.find((p) => p.id === id);
    if (!prov) return false;
    prov.nameArabic = nameArabic;
    prov.nameEnglish = nameEnglish;
    notifyListeners();

    apiClient.put(`/locations/provinces/${id}`, { nameArabic, nameEnglish }).catch((err) => {
      console.error("Failed to update province on backend:", err);
    });
    return true;
  },

  deleteProvince(id: string): boolean {
    locationsState = locationsState.filter((p) => p.id !== id);
    notifyListeners();
    apiClient.delete(`/locations/provinces/${id}`).catch((err) => {
      console.error("Failed to delete province on backend:", err);
    });
    return true;
  },

  addCity(provinceId: string, nameArabic: string, nameEnglish: string): City | null {
    const prov = locationsState.find((p) => p.id === provinceId);
    if (!prov) return null;

    const tempId = `city-${Date.now()}`;
    const newCity: City = {
      id: tempId,
      nameArabic,
      nameEnglish: nameEnglish || nameArabic,
      provinceId,
      enabled: true,
      districts: [],
      propertiesCount: 0,
    };
    prov.cities.push(newCity);
    notifyListeners();

    apiClient
      .post("/locations/cities", { provinceId, nameArabic, nameEnglish: nameEnglish || nameArabic })
      .then((created) => {
        if (created?.id) {
          newCity.id = created.id;
          notifyListeners();
        }
      })
      .catch((err) => {
        console.error("Failed to add city on backend:", err);
      });

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

    apiClient.put(`/locations/cities/${cityId}`, { nameArabic, nameEnglish }).catch((err) => {
      console.error("Failed to update city on backend:", err);
    });
    return true;
  },

  deleteCity(provinceId: string, cityId: string): boolean {
    const prov = locationsState.find((p) => p.id === provinceId);
    if (!prov) return false;
    prov.cities = prov.cities.filter((c) => c.id !== cityId);
    notifyListeners();

    apiClient.delete(`/locations/cities/${cityId}`).catch((err) => {
      console.error("Failed to delete city on backend:", err);
    });
    return true;
  },

  addDistrict(provinceId: string, cityId: string, nameArabic: string, nameEnglish: string): District | null {
    const prov = locationsState.find((p) => p.id === provinceId);
    if (!prov) return null;
    const city = prov.cities.find((c) => c.id === cityId);
    if (!city) return null;

    const tempId = `dist-${Date.now()}`;
    const newDist: District = {
      id: tempId,
      nameArabic,
      nameEnglish: nameEnglish || nameArabic,
      cityId,
      enabled: true,
      propertiesCount: 0,
    };
    city.districts.push(newDist);
    notifyListeners();

    apiClient
      .post("/locations/districts", { cityId, nameArabic, nameEnglish: nameEnglish || nameArabic })
      .then((created) => {
        if (created?.id) {
          newDist.id = created.id;
          notifyListeners();
        }
      })
      .catch((err) => {
        console.error("Failed to add district on backend:", err);
      });

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

    apiClient.put(`/locations/districts/${districtId}`, { nameArabic, nameEnglish }).catch((err) => {
      console.error("Failed to update district on backend:", err);
    });
    return true;
  },

  deleteDistrict(provinceId: string, cityId: string, districtId: string): boolean {
    const prov = locationsState.find((p) => p.id === provinceId);
    if (!prov) return false;
    const city = prov.cities.find((c) => c.id === cityId);
    if (!city) return false;
    city.districts = city.districts.filter((d) => d.id !== districtId);
    notifyListeners();

    apiClient.delete(`/locations/districts/${districtId}`).catch((err) => {
      console.error("Failed to delete district on backend:", err);
    });
    return true;
  },

  // ------------------------------------------
  // CMS & WEBSITE CONTENT
  // ------------------------------------------
  getFaqs(): FAQ[] {
    return [...faqsState];
  },

  addFaq(faq: Omit<FAQ, "id">): FAQ {
    const tempId = `faq-${Date.now()}`;
    const newFaq: FAQ = { ...faq, id: tempId };
    faqsState = [...faqsState, newFaq];
    notifyListeners();

    apiClient
      .post("/cms/faqs", faq)
      .then((created) => {
        if (created?.id) {
          newFaq.id = created.id;
          notifyListeners();
        }
      })
      .catch((err) => {
        console.error("Failed to add FAQ on backend:", err);
      });

    return newFaq;
  },

  updateFaq(id: string, updates: Partial<FAQ>): boolean {
    const index = faqsState.findIndex((f) => f.id === id);
    if (index === -1) return false;
    faqsState[index] = { ...faqsState[index], ...updates };
    notifyListeners();

    apiClient.put(`/cms/faqs/${id}`, updates).catch((err) => {
      console.error("Failed to update FAQ on backend:", err);
    });
    return true;
  },

  deleteFaq(id: string): boolean {
    faqsState = faqsState.filter((f) => f.id !== id);
    notifyListeners();
    apiClient.delete(`/cms/faqs/${id}`).catch((err) => {
      console.error("Failed to delete FAQ on backend:", err);
    });
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

    apiClient.put(`/cms/pages/${page.id || slug}`, { content }).catch((err) => {
      console.error("Failed to update page content on backend:", err);
    });
    return true;
  },

  getContactSettings(): ContactSettings {
    return { ...contactSettingsState };
  },

  updateContactSettings(settings: Partial<ContactSettings>): ContactSettings {
    contactSettingsState = { ...contactSettingsState, ...settings };
    notifyListeners();

    apiClient.put("/cms/contact", contactSettingsState).catch((err) => {
      console.error("Failed to update contact settings on backend:", err);
    });
    return contactSettingsState;
  },

  getSocialLinks(): SocialLink[] {
    return [...socialLinksState];
  },

  addSocialLink(platform: SocialLink["platform"], title: string, url: string): SocialLink {
    const tempId = `soc-${Date.now()}`;
    const newLink: SocialLink = {
      id: tempId,
      platform,
      title,
      url,
      enabled: true,
    };
    socialLinksState = [...socialLinksState, newLink];
    notifyListeners();

    apiClient
      .post("/cms/social-links", { platform, title, url, enabled: true })
      .then((created) => {
        if (created?.id) {
          newLink.id = created.id;
          notifyListeners();
        }
      })
      .catch((err) => {
        console.error("Failed to add social link on backend:", err);
      });

    return newLink;
  },

  updateSocialLink(id: string, updates: Partial<SocialLink>): boolean {
    const index = socialLinksState.findIndex((l) => l.id === id);
    if (index === -1) return false;
    socialLinksState[index] = { ...socialLinksState[index], ...updates };
    notifyListeners();

    apiClient.put(`/cms/social-links/${id}`, updates).catch((err) => {
      console.error("Failed to update social link on backend:", err);
    });
    return true;
  },

  deleteSocialLink(id: string): boolean {
    socialLinksState = socialLinksState.filter((l) => l.id !== id);
    notifyListeners();
    apiClient.delete(`/cms/social-links/${id}`).catch((err) => {
      console.error("Failed to delete social link on backend:", err);
    });
    return true;
  },

  toggleSocialLink(id: string): boolean {
    const link = socialLinksState.find((l) => l.id === id);
    if (!link) return false;
    link.enabled = !link.enabled;
    notifyListeners();

    apiClient.put(`/cms/social-links/${id}`, { enabled: link.enabled }).catch((err) => {
      console.error("Failed to toggle social link on backend:", err);
    });
    return link.enabled;
  },

  getHomepageContent(): HomepageContent {
    return { ...homepageState };
  },

  updateHomepageContent(content: Partial<HomepageContent>): HomepageContent {
    homepageState = { ...homepageState, ...content };
    notifyListeners();

    apiClient.put("/cms/homepage", homepageState).catch((err) => {
      console.error("Failed to update homepage content on backend:", err);
    });
    return homepageState;
  },

  getSeoDefaults(): SeoDefaults {
    return { ...seoState };
  },

  updateSeoDefaults(seo: Partial<SeoDefaults>): SeoDefaults {
    seoState = { ...seoState, ...seo };
    notifyListeners();

    apiClient.put("/cms/seo", seoState).catch((err) => {
      console.error("Failed to update SEO defaults on backend:", err);
    });
    return seoState;
  },

  // ------------------------------------------
  // AUDIT LOG (LIVE & PERSISTENT)
  // ------------------------------------------
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
    notifyListeners();

    // Async persist to live backend database in PostgreSQL
    apiClient
      .post("/audit-logs", {
        actorName: newActivity.actorName,
        actorRole: newActivity.actorRole,
        action: newActivity.action,
        targetType: newActivity.targetType,
        targetTitle: newActivity.targetTitle,
        details: newActivity.details,
      })
      .then((created) => {
        if (created?.id) {
          newActivity.id = created.id;
          notifyListeners();
        }
      })
      .catch((err) => {
        console.warn("Failed to persist audit log on backend:", err);
      });
  },

  isLoading(): boolean {
    return isLoadingBackend;
  },

  isLoaded(): boolean {
    return isInitializedFromBackend;
  },

  // ------------------------------------------
  // STATS
  // ------------------------------------------
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
      totalProjects: 0,
      pendingAppointments: pendingAppts,
      upcomingAppointments: confirmedAppts,
      newInquiries: newInqs,
      totalClients: clientsState.length,
      convertedClients: converted,
    };
  },
};

// Auto-trigger backend sync on client load
if (typeof window !== "undefined" && !isInitializedFromBackend) {
  setTimeout(() => {
    MockStore.initFromBackend();
  }, 100);
}
