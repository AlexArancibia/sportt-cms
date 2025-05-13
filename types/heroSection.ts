import { Store } from './store'; // Asumiendo que existe la interfaz Store

export interface HeroSectionStyles {
  titleColor: string
  subtitleColor: string
  textAlign: string
  verticalAlign: string
  overlayType: "none" | "color" | "gradient"
  overlayColor: string
  overlayOpacity: number
  overlayGradient: {
    colorStart: string
    colorEnd: string
    angle: number
  }
  overlayGradientStartOpacity: number
  overlayGradientEndOpacity: number
  buttonVariant: string
  buttonSize: string
  contentWidth: {
    mobile: string
    tablet: string
    desktop: string
  }
  contentPadding: {
    mobile: string
    tablet: string
    desktop: string
  }
  height: {
    mobile: string
    tablet: string
    desktop: string
  }
  titleSize: {
    mobile: string
    tablet: string
    desktop: string
  }
  subtitleSize: {
    mobile: string
    tablet: string
    desktop: string
  }
  textShadow: string
  animation: string
  backgroundPosition: string
  backgroundSize: string
  [key: string]: any // Add index signature to allow string indexing
}

export interface HeroSectionMetadata {
  section?: string;
  tags?: string[];
  priority?: number;
  startDate?: string;
  endDate?: string;
  theme?: string;
  deviceVisibility?: {
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
  };
}

export interface HeroSection {
  id: string;
  storeId: string; // Añadido según schema (relación con Store)
  store?: Store; // Relación opcional
  title: string;
  subtitle?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  backgroundImage?: string | null;
  mobileBackgroundImage?: string | null;
  backgroundVideo?: string | null;
  mobileBackgroundVideo?: string | null;
  styles: HeroSectionStyles | Record<string, any>; // Tipado más específico
  metadata?: HeroSectionMetadata | null;
  isActive: boolean;
  createdAt: Date; // Cambiado a Date según Prisma
  updatedAt: Date; // Cambiado a Date según Prisma
}

export interface CreateHeroSectionDto {
  storeId: string; // Requerido según schema
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  mobileBackgroundImage?: string;
  backgroundVideo?: string;
  mobileBackgroundVideo?: string;
  buttonText?: string;
  buttonLink?: string;
  styles: HeroSectionStyles | Record<string, any>;
  metadata?: HeroSectionMetadata;
  isActive?: boolean;
}

export interface UpdateHeroSectionDto {
  title?: string;
  subtitle?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  backgroundImage?: string | null;
  mobileBackgroundImage?: string | null;
  backgroundVideo?: string | null;
  mobileBackgroundVideo?: string | null;
  styles?: HeroSectionStyles | Record<string, any>;
  metadata?: HeroSectionMetadata | null;
  isActive?: boolean;
}