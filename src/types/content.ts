import { ID } from "./common";

export interface FAQ {
  id: ID;
  question: string;
  answer: string;
  displayOrder: number;
  published: boolean;
  category: "GENERAL" | "BUYING" | "SELLING" | "RENTING";
}

export interface WebsitePageContent {
  id: ID;
  slug: "privacy-policy" | "terms-conditions" | "about-us";
  title: string;
  content: string;
  published: boolean;
  updatedAt: string;
}

export interface ContactSettings {
  companyName: string;
  contactPhone: string;
  secondaryPhone?: string;
  email: string;
  address: string;
  workingHours: string;
  locationMapUrl?: string;
}

export interface SocialLink {
  id: ID;
  platform: "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "SNAPCHAT" | "LINKEDIN" | "X";
  title: string;
  url: string;
  enabled: boolean;
}

export interface HomepageContent {
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  ctaLink: string;
  heroBannerImage: string;
  badgeText: string;
}

export interface SeoDefaults {
  websiteTitle: string;
  defaultMetaDescription: string;
  socialSharingImage: string;
  defaultKeywords: string;
}
