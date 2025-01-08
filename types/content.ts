import { ContentType } from './common';

export interface Content {
  id: string;
  title: string;
  slug: string;
  body: string;
  type: ContentType;
  author?: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContentDto {
  title: string;
  slug: string;
  body: string;
  type: ContentType;
  author?: string;
  published?: boolean;
}

export interface UpdateContentDto {
  title?: string;
  slug?: string;
  body?: string;
  type?: ContentType;
  author?: string;
  published?: boolean;
}

