import { ID } from "./common";

export interface Developer {
  id: ID;
  name: string;
  logo: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  websiteUrl?: string;
  establishedYear?: number;
  projectsCount: number;
  published: boolean;
  createdAt: string;
}

export type ProjectStatus = "UNDER_CONSTRUCTION" | "DELIVERED" | "UPCOMING" | "LAUNCHING_SOON";

export interface Project {
  id: ID;
  name: string;
  developerId: ID;
  developerName: string;
  coverImage: string;
  location: string;
  projectType: string; // "سكني متكامل", "أبراج تجارية", "كمبوند فاخر"
  status: ProjectStatus;
  shortDescription: string;
  fullDescription: string;
  unitsCount?: number;
  startingPrice?: number;
  deliveryDate?: string;
  published: boolean;
  createdAt: string;
}
