/**
 * CSV Service - Servicio genérico para generación y descarga de archivos CSV
 */

export class CSVService {
  /**
   * Escapa valores especiales en CSV (comas, comillas, saltos de línea)
   */
  static escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }

    // Convertir a string
    let stringValue = String(value)

    // Si contiene comillas dobles, saltos de línea o comas, necesita ser escapado
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
      // Duplicar comillas dobles y envolver en comillas
      stringValue = '"' + stringValue.replace(/"/g, '""') + '"'
    }

    return stringValue
  }

  /**
   * Genera un string CSV a partir de datos y headers
   * @param data Array de objetos con los datos
   * @param headers Array de objetos con {key, label} para cada columna
   * @returns String en formato CSV
   */
  static generateCSV<T extends Record<string, any>>(
    data: T[],
    headers: Array<{ key: keyof T | string; label: string }>
  ): string {
    // UTF-8 BOM para que Excel reconozca correctamente los caracteres especiales
    const BOM = '\ufeff'

    // Crear fila de headers
    const headerRow = headers.map(h => this.escapeCSVValue(h.label)).join(',')

    // Crear filas de datos
    const dataRows = data.map(row => {
      return headers.map(header => {
        const value = this.getNestedValue(row, header.key as string)
        return this.escapeCSVValue(value)
      }).join(',')
    })

    // Combinar todo
    return BOM + [headerRow, ...dataRows].join('\n')
  }

  /**
   * Obtiene un valor anidado de un objeto usando notación de punto
   * Ejemplo: getNestedValue({a: {b: 'value'}}, 'a.b') => 'value'
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Dispara la descarga de un archivo CSV en el navegador
   * @param content Contenido del CSV
   * @param filename Nombre del archivo (sin extensión)
   */
  static downloadCSV(content: string, filename: string): void {
    // Crear blob con el contenido
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })

    // Crear link temporal para descarga
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    // Asegurar que el filename tenga extensión .csv
    const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', finalFilename)
    link.style.visibility = 'hidden'

    // Agregar al DOM, hacer click y remover
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Limpiar URL objeto
    URL.revokeObjectURL(url)
  }

  /**
   * Genera un timestamp formateado para nombres de archivo
   * Formato: YYYY-MM-DD-HHmmss
   */
  static generateTimestamp(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day}-${hours}${minutes}${seconds}`
  }

  /**
   * Genera y descarga un CSV en un solo paso
   * @param data Array de datos
   * @param headers Headers del CSV
   * @param baseFilename Nombre base del archivo (se le agregará timestamp)
   */
  static exportToCSV<T extends Record<string, any>>(
    data: T[],
    headers: Array<{ key: keyof T | string; label: string }>,
    baseFilename: string
  ): void {
    const content = this.generateCSV(data, headers)
    const timestamp = this.generateTimestamp()
    const filename = `${baseFilename}-${timestamp}`
    this.downloadCSV(content, filename)
  }
}

