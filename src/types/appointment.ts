import { ID } from "./common";

export type AppointmentStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export interface Appointment {
  id: ID;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  propertyId: ID;
  propertyCode: string;
  propertyTitle: string;
  propertyLocation: string;
  requestedDate: string; // YYYY-MM-DD
  requestedTime: string; // HH:mm
  status: AppointmentStatus;
  assignedEmployeeId?: ID;
  assignedEmployeeName?: string;
  notes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}
