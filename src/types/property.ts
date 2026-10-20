import { ID } from "./common";

export type PropertyCategory = "RESIDENTIAL" | "COMMERCIAL" | "AGRICULTURAL";

export type PropertyPurpose = "SALE" | "RENT";

export type PropertyStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED" | "SOLD" | "RENTED";

export type FurnishingStatus = "FURNISHED" | "SEMI_FURNISHED" | "UNFURNISHED";

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
}

export interface PropertyLocation {
  country: string;
  city: string;
  area: string;
  streetAddress?: string;
  latitude?: number;
  longitude?: number;
}

export interface ResidentialSpecs {
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  floor: number;
  totalFloors: number;
  furnishing: FurnishingStatus;
}

export interface CommercialSpecs {
  commercialCategory: string; // "مكتب", "محل تجاري", "معرض", "عيادة"
  suitableActivity: string;
  roomsCount: number;
  floor?: number;
}

export interface AgriculturalSpecs {
  landClassification: string; // "زراعية مروية", "استصلاح حديث", "بستان"
  waterAvailability: boolean;
  waterSource?: string; // "بئر ارتوازي", "ترعة مباشرة"
}

export interface PropertySpecs {
  residential?: ResidentialSpecs;
  commercial?: CommercialSpecs;
  agricultural?: AgriculturalSpecs;
}

export interface PropertySEO {
  seoTitle?: string;
  metaDescription?: string;
  slug: string;
}

export interface Property {
  id: ID;
  code: string; // e.g. "ESH-1042"
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: PropertyCategory;
  purpose: PropertyPurpose;
  status: PropertyStatus;
  
  // Pricing
  price: number;
  currency: string; // default "EGP"
  originalPrice?: number; // Price before discount (if discount is active)
  discountPercentage?: number; // Discount percentage (e.g. 10 for 10%)
  area: number; // in square meters or feddans
  areaUnit: "م²" | "فدان";
  maintenanceFee?: number;

  // Location
  location: PropertyLocation;

  // Specs
  specs: PropertySpecs;

  // Amenities
  amenities: string[];

  // Media
  images: PropertyImage[];

  // SEO & Publication
  seo: PropertySEO;

  // Timestamps & Stats
  createdAt: string;
  updatedAt: string;
  viewsCount: number;
  inquiriesCount: number;
  featured?: boolean;
}
