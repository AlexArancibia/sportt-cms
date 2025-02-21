import type { ContentType } from "./common"
import type { User } from "./user"

export interface Content {
  id: string
  title: string
  slug: string
  body?: string
  type: ContentType
  authorId?: string
  author?: User
  published: boolean
  publishedAt?: Date
  featuredImage?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface CreateContentDto {
  title: string
  slug: string
  body?: string
  type: ContentType
  authorId?: string
  published: boolean
  publishedAt?: Date
  featuredImage?: string
  metadata?: Record<string, any>
}

export interface UpdateContentDto {
  title?: string
  slug?: string
  body?: string
  type?: ContentType
  authorId?: string
  published?: boolean
  publishedAt?: Date
  featuredImage?: string
  metadata?: Record<string, any>
}

