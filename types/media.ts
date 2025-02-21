export interface MediaFile {
  filename: string
  mimetype: string
  size: number
  description: string
}

export interface UploadResponse {
  message: string
  filename: string
  mimetype: string
  size: number
  dto: {
    description: string
  }
}

export interface MediaResponse {
  message: string
  files?: MediaFile[]
  error?: string
}

export interface CreateFileDto {
  description: string
}