"use client"

import { use } from "react"
import ProductForm from "../../../_components/ProductForm"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = use(params)

  return <ProductForm mode="edit" productId={resolvedParams.id} />
}