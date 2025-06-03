
export interface TeamSectionStyles {
  layout: 'grid' | 'carousel' | 'list';
  gridColumns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: string;
  padding?: string;
  margin?: string;
}

export interface TeamSectionMetadata {
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface TeamSection {
  id: string;
  storeId: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  layout?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  isActive: boolean;
  position: number;
  styles?: TeamSectionStyles | null;
  metadata?: TeamSectionMetadata | null;
  members?: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamSectionDto {
  storeId: string;
  title: string;
  subtitle?: string;
  description?: string;
  layout?: string;
  backgroundColor?: string;
  textColor?: string;
  position?: number;
  styles?: TeamSectionStyles;
  metadata?: TeamSectionMetadata;
  isActive?: boolean;
}

export interface UpdateTeamSectionDto {
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  layout?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  position?: number;
  styles?: TeamSectionStyles | null;
  metadata?: TeamSectionMetadata | null;
  isActive?: boolean;
}



export interface TeamMember {
  id: string;
  teamSectionId: string;
  name: string;
  position: string;
  imageUrl?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  order: number;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamMemberDto {
  teamSectionId: string;
  name: string;
  position: string;
  imageUrl?: string;
  bio?: string;
  email?: string;
  phone?: string;
  order?: number;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  isActive?: boolean;
}

export interface UpdateTeamMemberDto {
  name?: string;
  position?: string;
  imageUrl?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  order?: number;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  isActive?: boolean;
}