export function decodeHTMLEntities(text: string | undefined | null): string {
  if (typeof text !== "string") {
    return ""
  }

  const entities: [string, string][] = [
    ["aacute", "á"],
    ["eacute", "é"],
    ["iacute", "í"],
    ["oacute", "ó"],
    ["uacute", "ú"],
    ["ntilde", "ñ"],
    ["Aacute", "Á"],
    ["Eacute", "É"],
    ["Iacute", "Í"],
    ["Oacute", "Ó"],
    ["Uacute", "Ú"],
    ["Ntilde", "Ñ"],
    ["nbsp", " "],
    ["amp", "&"],
    ["quot", '"'],
    ["lt", "<"],
    ["gt", ">"],
  ]

  let result = text

  try {
    // Replace named entities
    for (const [name, char] of entities) {
      const regex = new RegExp(`&${name};`, "gi")
      result = result.replace(regex, char)
    }

    // Replace numeric entities
    result = result.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(Number.parseInt(dec, 10)))

    // Replace remaining problematic characters
    result = result.replace(/Ã±/g, "ñ")
    result = result.replace(/Ã­/g, "í")
    result = result.replace(/Ã¡/g, "á")
    result = result.replace(/Ã©/g, "é")
    result = result.replace(/Ã³/g, "ó")
    result = result.replace(/Ãº/g, "ú")
  } catch (error) {
    console.error("Error in decodeHTMLEntities:", error)
    return text // Return original text if any error occurs
  }

  return result
}

/**
 * Genera un título estandarizado para productos y variantes en el carrito/órdenes
 * 
 * @param productTitle - Título del producto
 * @param variantTitle - Título de la variante
 * @returns Título estandarizado para mostrar en carrito/órdenes
 */
export function generateStandardizedProductTitle(productTitle: string, variantTitle: string): string {
  const product = productTitle.trim()
  const variant = variantTitle.trim()
  
  // Casos especiales que deben mostrar solo el producto
  const specialCases = ['default title', 'título por defecto', 'variante principal', 'principal']
  
  const normalizedVariant = variant.toLowerCase()
  const normalizedProduct = product.toLowerCase()
  
  // Si la variante es un caso especial, mostrar solo el producto
  if (specialCases.some(specialCase => normalizedVariant.includes(specialCase))) {
    return product
  }
  
  // Si la variante es igual al producto, mostrar solo el producto
  if (normalizedVariant === normalizedProduct) {
    return product
  }
  
  // Si la variante contiene el nombre del producto, mostrar solo la variante
  if (normalizedVariant.includes(normalizedProduct)) {
    return variant
  }
  
  // En todos los otros casos, combinar producto y variante
  return `${product} - ${variant}`
}

/**
 * Genera un título estandarizado usando objetos Product y ProductVariant
 * 
 * @param product - Objeto con propiedad title
 * @param variant - Objeto con propiedad title
 * @returns Título estandarizado para mostrar en carrito/órdenes
 */
export function generateStandardizedProductTitleFromObjects(
  product: { title: string }, 
  variant: { title: string }
): string {
  return generateStandardizedProductTitle(product.title, variant.title)
}


