export interface DashboardStats {
  totalProperties: number;
  publishedProperties: number;
  draftProperties: number;
  archivedProperties: number;
  totalProjects: number;
  pendingAppointments: number;
  upcomingAppointments: number;
  newInquiries: number;
  totalClients: number;
  convertedClients: number;
}

export interface PropertyTypeDistribution {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AppointmentsTrendItem {
  date: string;
  requests: number;
  confirmed: number;
}

export interface InquiriesTrendItem {
  month: string;
  inquiries: number;
  leads: number;
}
