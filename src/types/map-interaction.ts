export interface MapInteractionClient {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  region?: string;
}

export interface MapInteractionProperty {
  id: string;
  title: string;
  code: string;
  category?: string;
  purpose?: string;
  city?: string;
  areaName?: string;
  streetAddress?: string;
  googleMapsUrl?: string;
  price?: number;
  currency?: string;
}

export interface MapInteraction {
  id: string;
  clientId: string;
  propertyId: string;
  createdAt: string;
  client: MapInteractionClient;
  property: MapInteractionProperty;
}

export interface MapInteractionStats {
  totalInteractions: number;
  todayInteractions: number;
  uniqueClients: number;
}
