import { ID } from "./common";

export type InquiryStatus = "NEW" | "IN_PROGRESS" | "REPLIED" | "CLOSED";

export type InquiryType = "PROPERTY_INQUIRY" | "GENERAL_CONTACT" | "PRICE_REQUEST" | "PARTNERSHIP";

export interface Inquiry {
  id: ID;
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  type: InquiryType;
  relatedPropertyId?: ID;
  relatedPropertyTitle?: string;
  relatedPropertyCode?: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  assignedEmployeeId?: ID;
  assignedEmployeeName?: string;
  replyNotes?: string;
  submittedAt: string;
  repliedAt?: string;
}
