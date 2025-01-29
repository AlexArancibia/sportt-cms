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

