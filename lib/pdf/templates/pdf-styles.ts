/**
 * Reusable CSS styles for PDF generation
 * Optimized for print media - Compact design with proper page breaks
 */

export const getPDFStyles = (primaryColor: string, secondaryColor: string) => `
  <style>
    /* Import Manrope font from Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap');

    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #333;
      background: white;
    }

    /* Page setup for print - reduced margins for more content */
    @page {
      size: A4;
      margin: 10mm;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      /* Hide print button and unnecessary elements */
      .no-print {
        display: none !important;
      }

      /* Overflow handling */
      * {
        overflow: visible !important;
        overflow-x: visible !important;
        overflow-y: visible !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }

      /* Sections: allow automatic page breaks */
      .product-section {
        page-break-before: auto;
        break-before: auto;
      }

      /* Section titles: never break after title, keep with content */
      .section-title {
        page-break-after: avoid;
        break-after: avoid;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Product cards/rows: never break inside */
      .product-card,
      .product-row,
      .product-table-row {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Variant items: keep together */
      .product-variant-item,
      .variant-row {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Product grids: allow wrapping but avoid breaking cards */
      .products-grid {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Tables: avoid breaking table rows */
      .products-table tbody tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }

    /* Header styles - more compact */
    .pdf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 2px solid ${primaryColor};
      margin-bottom: 15px;
    }

    .pdf-header-left {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .pdf-logo {
      max-width: 80px;
      max-height: 40px;
      object-fit: contain;
    }

    .pdf-title {
      font-size: 18pt;
      font-weight: bold;
      color: ${primaryColor};
      margin: 0;
      line-height: 1.2;
    }

    .pdf-subtitle {
      font-size: 9pt;
      color: #666;
      margin-top: 2px;
    }

    .pdf-header-right {
      text-align: right;
    }

    .pdf-count {
      font-size: 11pt;
      font-weight: bold;
      color: ${secondaryColor};
    }

    /* Section titles */
    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: ${primaryColor};
      margin: 20px 0 10px 0;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }

    /* Grid layout - more compact */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 10px;
      margin: 10px 0;
    }

    .product-card {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px;
      background: white;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .product-card-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .product-card-image {
      width: 100%;
      height: 120px;
      object-fit: contain;
      border-radius: 3px;
      margin-bottom: 6px;
      background: #f5f5f5;
    }

    .product-card-title {
      font-size: 10pt;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
      line-height: 1.3;
      word-wrap: break-word;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .product-card-vendor {
      font-size: 8pt;
      color: #666;
      margin-bottom: 4px;
    }

    .product-card-info {
      font-size: 8pt;
      color: #666;
      display: flex;
      gap: 8px;
    }

    .product-card-price {
      font-size: 11pt;
      font-weight: bold;
      color: ${primaryColor};
      margin-top: 4px;
    }

    /* Variants display */
    .product-variants {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
    }

    .product-variant-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 4px;
      background: #f9f9f9;
      border-radius: 3px;
      font-size: 8pt;
    }

    .variant-title {
      font-weight: 600;
      color: #333;
    }

    .variant-details {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 7.5pt;
      color: #666;
    }

    .variant-sku {
      font-family: 'Courier New', monospace;
    }

    .variant-stock {
      color: #666;
    }

    .variant-price {
      font-weight: bold;
      color: ${primaryColor};
    }

    /* List layout - more compact */
    .products-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 10px 0;
    }

    .product-row {
      display: flex;
      gap: 10px;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .product-row-image {
      width: 60px;
      height: 60px;
      object-fit: contain;
      border-radius: 3px;
      flex-shrink: 0;
      background: #f5f5f5;
    }

    .product-row-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .product-row-title {
      font-size: 10pt;
      font-weight: 600;
      color: #333;
      word-wrap: break-word;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .product-row-vendor {
      font-size: 8pt;
      color: #666;
    }

    .product-variants-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-top: 4px;
    }

    .variant-row {
      display: flex;
      gap: 8px;
      padding: 3px 6px;
      background: #f9f9f9;
      border-radius: 3px;
      font-size: 8pt;
      flex-wrap: wrap;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .variant-name {
      font-weight: 600;
      color: #333;
    }

    .variant-info {
      color: #666;
      font-family: 'Courier New', monospace;
    }

    .product-row-meta {
      display: flex;
      gap: 10px;
      font-size: 8pt;
      color: #666;
    }

    .product-row-price {
      font-size: 11pt;
      font-weight: bold;
      color: ${primaryColor};
      align-self: flex-start;
      white-space: nowrap;
    }

    /* Table layout - more compact */
    .products-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 9pt;
    }

    .products-table thead {
      background: ${primaryColor};
      color: white;
    }

    .products-table th {
      padding: 6px 8px;
      text-align: left;
      font-size: 9pt;
      font-weight: 600;
    }

    .products-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #ddd;
      font-size: 8.5pt;
      word-wrap: break-word;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .product-table-image {
      width: 40px;
      height: 40px;
      object-fit: contain;
      border-radius: 3px;
      background: #f5f5f5;
    }

    .product-table-title {
      font-weight: 600;
      color: #333;
      word-wrap: break-word;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .variant-name-cell {
      font-size: 8pt;
      color: #555;
    }

    .product-table-price {
      font-weight: bold;
      color: ${primaryColor};
      white-space: nowrap;
    }

    .product-table-sku {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      color: #666;
    }

    .product-table-stock {
      text-align: center;
      white-space: nowrap;
    }

    /* Print button (hidden in print) */
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${primaryColor};
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 11pt;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    }

    .print-button:hover {
      opacity: 0.9;
    }

    @media print {
      .print-button {
        display: none;
      }
    }

    /* No images fallback */
    .no-image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      color: #999;
      font-size: 8pt;
    }

    /* Utility classes */
    .text-muted {
      color: #666;
    }
  </style>
`
