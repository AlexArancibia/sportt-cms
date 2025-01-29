export function slugify(text: string) {
  const charMap: { [key: string]: string } = {
    á: "a",
    é: "e",
    í: "i",
    ó: "o",
    ú: "u",
    ü: "u",
    ñ: "n",
    Á: "A",
    É: "E",
    Í: "I",
    Ó: "O",
    Ú: "U",
    Ü: "U",
    Ñ: "N",
  }

  return text
    .toString()
    .toLowerCase()
    .trim()
    .split("")
    .map((char) => charMap[char] || char)
    .join("") // Replace special characters
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
}

