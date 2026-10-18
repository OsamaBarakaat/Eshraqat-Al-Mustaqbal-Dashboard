import { ID } from "./common";

export interface District {
  id: ID;
  nameArabic: string;
  nameEnglish: string;
  cityId: ID;
  enabled: boolean;
  propertiesCount: number;
}

export interface City {
  id: ID;
  nameArabic: string;
  nameEnglish: string;
  provinceId: ID;
  enabled: boolean;
  districts: District[];
  propertiesCount: number;
}

export interface Province {
  id: ID;
  nameArabic: string;
  nameEnglish: string;
  country: string; // "المملكة العربية السعودية"
  enabled: boolean;
  cities: City[];
}
