export type ID = string;

export type StatusColor = "success" | "warning" | "destructive" | "info" | "neutral" | "gold";

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AuditActivity {
  id: ID;
  action: string;
  actorName: string;
  actorRole: string;
  actorAvatar?: string;
  targetType: "property" | "appointment" | "inquiry" | "client" | "user" | "setting";
  targetTitle: string;
  timestamp: string;
  details?: string;
}
