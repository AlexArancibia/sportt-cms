// 'use client'

// import { useState, useMemo } from 'react'
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import * as XLSX from 'xlsx'
// import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
// import { Search, Upload, Plus } from 'lucide-react'
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { useMainStore } from '@/stores/mainStore'
// import { CreateProductDto } from '@/types/product'
// import { CreateCategoryDto } from '@/types/category'

// interface ProductData {
//   Handle: string
//   Title: string
//   Vendor: string
//   'Product Category': string
//   Type: string
//   Tags: string
//   'Option1 Name': string
//   'Option1 Value': string
//   'Variant Inventory Qty': string
//   'Variant Price': string
//   'Image Src': string
//   Status: string
// }

// export default function TestPage() {
//   const [excelData, setExcelData] = useState<ProductData[]>([])
//   const [searchTerm, setSearchTerm] = useState('')
//   const { createProduct, createCategory, categories } = useMainStore()
//   const [importProgress, setImportProgress] = useState<number>(0)
//   const [importTotal, setImportTotal] = useState<number>(0)
//   const [isImporting, setIsImporting] = useState<boolean>(false)
//   const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       const reader = new FileReader()
//       reader.onload = (evt) => {
//         const bstr = evt.target?.result
//         const wb = XLSX.read(bstr, { type: 'binary' })
//         const wsname = wb.SheetNames[0]
//         const ws = wb.Sheets[wsname]
//         const data = XLSX.utils.sheet_to_json(ws) as ProductData[]
//         setExcelData(data)
//       }
//       reader.readAsBinaryString(file)
//     }
//   }

//   const analysis = useMemo(() => {
//     if (!excelData.length) return null

//     const uniqueProducts = new Set(excelData.map(row => row.Handle?.split('-')[0]).filter(Boolean))
//     const variants = new Set(excelData.map(row => row['Option1 Value']).filter(Boolean))
//     const totalInventory = excelData.reduce((sum, row) => 
//       sum + (parseInt(row['Variant Inventory Qty']) || 0), 0
//     )
//     const inventoryByVariant = excelData.reduce((acc, row) => {
//       const variant = row['Option1 Value']
//       if (variant) {
//         acc[variant] = (acc[variant] || 0) + (parseInt(row['Variant Inventory Qty']) || 0)
//       }
//       return acc
//     }, {} as Record<string, number>)
//     const vendors = new Set(excelData.map(row => row.Vendor).filter(Boolean))
//     const productsByVendor = excelData.reduce((acc, row) => {
//       const vendor = row.Vendor
//       if (vendor) {
//         acc[vendor] = (acc[vendor] || 0) + 1
//       }
//       return acc
//     }, {} as Record<string, number>)

//     return {
//       totalProducts: uniqueProducts.size,
//       totalVariants: variants.size,
//       totalInventory,
//       inventoryByVariant,
//       vendors: Array.from(vendors),
//       productsByVendor,
//       variantsList: Array.from(variants)
//     }
//   }, [excelData])

//   const chartData = useMemo(() => {
//     if (!analysis) return []
//     return Object.entries(analysis.inventoryByVariant).map(([size, quantity]) => ({
//       size,
//       quantity
//     }))
//   }, [analysis])

//   const vendorChartData = useMemo(() => {
//     if (!analysis) return []
//     return Object.entries(analysis.productsByVendor).map(([vendor, count]) => ({
//       vendor,
//       count
//     }))
//   }, [analysis])

//   const filteredData = useMemo(() => {
//     return excelData.filter(row =>
//       (row.Title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
//       (row.Vendor?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
//       (row['Option1 Value']?.toLowerCase() || '').includes(searchTerm.toLowerCase())
//     )
//   }, [excelData, searchTerm])

//   const importProducts = async () => {
//     if (!selectedProduct) {
//       console.log("No product selected");
//       return;
//     }

//     setIsImporting(true);
//     setImportTotal(1);
//     setImportProgress(0);

//     const productRows = excelData.filter(row => row.Handle.startsWith(selectedProduct));
//     console.log(`Starting import for product: ${selectedProduct}`);
//     console.log(`Found ${productRows.length} variations for ${selectedProduct}`);

//     // Check if category exists, if not create it
//     const firstRow = productRows[0];
//     let categoryId = categories.find(c => c.name === firstRow['Product Category'])?.id;

//     if (!categoryId) {
//       console.log(`Creating new category: ${firstRow['Product Category']}`);
//       const newCategory: CreateCategoryDto = {
//         name: firstRow['Product Category'],
//         parentId: undefined
//       };
//       try {
//         const createdCategory = await createCategory(newCategory);
//         categoryId = createdCategory.id;
//         console.log(`Category created successfully with id: ${categoryId}`);
//       } catch (error) {
//         console.error(`Error creating category: ${error}`);
//         setIsImporting(false);
//         return;
//       }
//     }
//     console.log(`Using category: ${categoryId}`);

//     // Prepare product data
//     const productData: CreateProductDto = {
//       name: firstRow.Title,
//       description: firstRow.Type || '',
//       price: parseFloat(firstRow['Variant Price']),
//       quantity: productRows.reduce((sum, row) => sum + parseInt(row['Variant Inventory Qty']), 0),
//       isActive: firstRow.Status.toLowerCase() == 'active',
//       sku: firstRow.Handle,
//       provider: firstRow.Vendor,
//       categoryId: categoryId,
//       coverImage: firstRow['Image Src'] || null,
//       galleryImages: [],
//       variants: productRows.map(row => ({
//         price: parseFloat(row['Variant Price']),
//         quantity: parseInt(row['Variant Inventory Qty']),
//         attributes: {
//           [row['Option1 Name']]: row['Option1 Value']
//         },
//         imageUrl: row['Image Src'] || null
//       }))
//     };

//     console.log('Attempting to create product...');
//     console.log('Product payload:', JSON.stringify(productData, null, 2));
//     console.log('Variants:', productData.variants?.length || 0);
//     productData.variants?.forEach((variant, index) => {
//       console.log(`Variant ${index + 1}:`, JSON.stringify(variant, null, 2));
//     });

//     // Create product
//     try {
//       console.log(`Creating product: ${productData.name}`);
//       await createProduct(productData);
//       console.log(`Product created successfully: ${productData.name}`);
//       alert(`Product ${productData.name} imported successfully!`);
//     } catch (error) {
//       console.error(`Error creating product ${productData.name}: ${error}`);
//       console.error('Full error:', error);
//       alert(`Error importing product ${productData.name}. Check console for details.`);
//     }

//     setIsImporting(false);
//     setImportProgress(1);
//     setSelectedProduct(null);
//   };

//   return (
//     <div className="container mx-auto py-10">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold mb-4">Análisis de Productos</h1>
//         <div className="flex items-center gap-4">
//           <Input
//             type="file"
//             accept=".xlsx, .xls"
//             onChange={handleFileUpload}
//             className="max-w-xs"
//           />
//           <Button onClick={() => {
//             const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
//             if (fileInput) {
//               fileInput.click();
//             }
//           }}>
//             <Upload className="mr-2 h-4 w-4" />
//             Cargar Excel
//           </Button>
//           <Button onClick={importProducts} disabled={!selectedProduct || isImporting}>
//             <Plus className="mr-2 h-4 w-4" />
//             {isImporting 
//               ? `Importando... ${importProgress}/${importTotal}`
//               : selectedProduct 
//                 ? `Importar ${selectedProduct}`
//                 : 'Selecciona un producto'
//             }
//           </Button>
//         </div>
//         {isImporting && (
//           <div className="mt-2">
//             <progress value={importProgress} max={importTotal} className="w-full" />
//             <p className="text-sm text-muted-foreground mt-1">
//               Importando producto {importProgress} de {importTotal}
//             </p>
//           </div>
//         )}
//       </div>

//       {analysis && (
//         <>
//           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{analysis.totalProducts}</div>
//                 <p className="text-xs text-muted-foreground">
//                   Productos únicos sin contar variantes
//                 </p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Total Variantes</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{analysis.totalVariants}</div>
//                 <p className="text-xs text-muted-foreground">
//                   Tallas disponibles: {analysis.variantsList.join(', ')}
//                 </p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Inventario Total</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{analysis.totalInventory}</div>
//                 <p className="text-xs text-muted-foreground">
//                   Unidades en stock
//                 </p>
//               </CardContent>
//             </Card>
//           </div>

//           <div className="grid gap-4 md:grid-cols-2 mb-8">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Inventario por Talla</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={chartData}>
//                     <XAxis dataKey="size" />
//                     <YAxis />
//                     <Tooltip />
//                     <Bar dataKey="quantity" fill="#8884d8" name="Cantidad" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Productos por Marca</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={vendorChartData}>
//                     <XAxis dataKey="vendor" />
//                     <YAxis />
//                     <Tooltip />
//                     <Bar dataKey="count" fill="#82ca9d" name="Cantidad" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </CardContent>
//             </Card>
//           </div>

//           <div className="mb-4 flex items-center">
//             <Search className="mr-2 h-4 w-4 text-gray-400" />
//             <Input
//               placeholder="Buscar productos..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="max-w-sm"
//             />
//           </div>

//           <div className="border rounded-lg overflow-hidden">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Seleccionar</TableHead>
//                   <TableHead>Título</TableHead>
//                   <TableHead>Marca</TableHead>
//                   <TableHead>Categoría</TableHead>
//                   <TableHead>Talla</TableHead>
//                   <TableHead>Inventario</TableHead>
//                   <TableHead>Precio</TableHead>
//                   <TableHead>Estado</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredData.map((row, index) => {
//                   const isFirstVariant = index === 0 || row.Handle !== filteredData[index - 1].Handle;
//                   return (
//                     <TableRow key={index}>
//                       <TableCell>
//                         {isFirstVariant && (
//                           <Button
//                             onClick={() => setSelectedProduct(row.Handle.split('-')[0])}
//                             variant="outline"
//                             size="sm"
//                           >
//                             Select
//                           </Button>
//                         )}
//                       </TableCell>
//                       <TableCell>{row.Title}</TableCell>
//                       <TableCell>{row.Vendor}</TableCell>
//                       <TableCell>{row['Product Category']}</TableCell>
//                       <TableCell>{row['Option1 Value']}</TableCell>
//                       <TableCell>{row['Variant Inventory Qty']}</TableCell>
//                       <TableCell>S/ {row['Variant Price']}</TableCell>
//                       <TableCell>{row.Status}</TableCell>
//                     </TableRow>
//                   );
//                 })}
//               </TableBody>
//             </Table>
//           </div>
//         </>
//       )}
//     </div>
//   )
// }

import React from 'react'

function page() {
  return (
    <div>page</div>
  )
}

export default page