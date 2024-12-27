export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children: Category[];
  products: any[]; // Simplified for this example
  createdAt: string;
  updatedAt: string;
}


export interface CreateCategoryDto {
  name: string;
  parentId?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  parentId?: string | null;
}

