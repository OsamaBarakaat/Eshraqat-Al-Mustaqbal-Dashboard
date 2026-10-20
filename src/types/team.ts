import { ID } from "./common";

export type RoleType =
  | "SUPER_ADMIN"
  | "MANAGER"
  | "PROPERTY_MANAGER"
  | "SALES_AGENT"
  | "CONTENT_EDITOR"
  | (string & {});

export type ModuleType =
  | "properties"
  | "projects"
  | "clients"
  | "inquiries"
  | "appointments"
  | "websiteContent"
  | "reports"
  | "team"
  | "settings"
  | "locations";

export type ActionType =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "publish"
  | "assign"
  | "managePermissions";

export interface Permission {
  module: ModuleType;
  actions: ActionType[];
}

export interface Role {
  id: ID;
  name: RoleType;
  titleArabic: string;
  description: string;
  permissions: Permission[];
}

export interface AdminUser {
  id: ID;
  name: string;
  email: string;
  phone: string;
  role: RoleType;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  avatar?: string;
  department?: string;
  lastActiveAt: string;
  createdAt: string;
}
