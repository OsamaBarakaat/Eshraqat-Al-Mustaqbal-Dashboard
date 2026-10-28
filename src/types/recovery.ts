export type PasswordRecoveryStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "EXPIRED";

export interface PasswordRecoveryClient {
  id: string;
  name: string;
  email?: string;
  phone: string;
  region?: string;
  status?: string;
}

export interface PasswordRecoveryReviewer {
  id: string;
  name: string;
  email: string;
}

export interface PasswordRecoveryRequest {
  id: string;
  clientId: string;
  requestedEmail?: string;
  requestedPhone?: string;
  status: PasswordRecoveryStatus;
  adminNotes?: string;
  reviewedAt?: string;
  reviewedById?: string;
  resetToken?: string;
  resetTokenExpiresAt?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
  client?: PasswordRecoveryClient;
  reviewedBy?: PasswordRecoveryReviewer;
  resetUrl?: string;
}

export interface QueryRecoveryRequestsParams {
  status?: PasswordRecoveryStatus;
  search?: string;
  page?: number;
  limit?: number;
}
