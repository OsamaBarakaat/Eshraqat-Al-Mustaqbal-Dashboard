import { ID } from "./common";

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";

export type LeadSource = "WEBSITE_INQUIRY" | "WHATSAPP" | "PHONE_CALL" | "REFERRAL" | "SOCIAL_MEDIA" | "WALK_IN";

export interface ClientTimelineEvent {
  id: string;
  type: "CALL" | "NOTE" | "MEETING" | "STATUS_CHANGE" | "INQUIRY";
  title: string;
  description: string;
  timestamp: string;
  authorName: string;
}

export interface Client {
  id: ID;
  name: string;
  phone: string;
  email?: string;
  status: LeadStatus;
  source: LeadSource;
  budgetMin?: number;
  budgetMax?: number;
  preferredCategory?: "RESIDENTIAL" | "COMMERCIAL" | "AGRICULTURAL";
  preferredLocation?: string;
  interestedPropertyId?: ID;
  interestedPropertyTitle?: string;
  assignedEmployeeId?: ID;
  assignedEmployeeName?: string;
  notes?: string;
  timeline: ClientTimelineEvent[];
  lastActivityAt: string;
  createdAt: string;
}
