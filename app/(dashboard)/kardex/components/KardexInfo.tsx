// KardexInfo.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useKardexStore } from '@/stores/kardexStore';
import { useMainStore } from '@/stores/mainStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Table } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as RadixSelect from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { utils, writeFile } from 'xlsx';
import { twMerge } from 'tailwind-merge';

import { HeaderBar } from '@/components/HeaderBar';
import { ScrollArea } from '@/components/ui/scroll-area';

const MOVEMENT_TYPES = ['VENTA', 'COMPRA', 'DEVOLUCIÓN'];

function exportToExcel(data: any) {
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Kardex');
  writeFile(wb, 'kardex.xlsx');
}

const KardexInfo: React.FC = () => {
  const minStock = 10;
  const [expanded, setExpanded] = useState<{[key: string]: boolean}>({});
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [chartOpen, setChartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    kardexData,
    filteredData,
    filters,
    setKardexData,
    setFilters,
    clearFilters,
    applyFilters,
    fetchKardex,
  } = useKardexStore();
  const [productSearch, setProductSearch] = useState("");
  const [variantSearch, setVariantSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [movementSearch, setMovementSearch] = useState("");

  const { currentStore } = useMainStore();
  useEffect(() => {
    if (!currentStore) return;
    setLoading(true);
    setError(null);
    fetchKardex(currentStore)
      .then((res: any) => {
        setKardexData(res);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || err.message || 'Error al cargar datos');
      })
      .finally(() => setLoading(false));
  }, [currentStore, fetchKardex, setKardexData]);

  // filteredData now comes from the store

  // Valor fijo para elementos por página
  const PAGE_SIZE = 15;
  const paginatedData = useMemo(() => {
    const start = ((filters.page || 1) - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, filters.page]);
  // Forzar pageSize fijo en la paginación
  useEffect(() => {
    if (filters.pageSize !== PAGE_SIZE) {
      setFilters({ pageSize: PAGE_SIZE });
    }
  }, [filters.pageSize]);

  const chartData = useMemo(() => {
    if (!selectedVariant) return [];
    const variant = filteredData.flatMap(p => p.variantes).find(v => v.id === selectedVariant);
    if (!variant) return [];
    return variant.movimientos.map((m: any) => ({
      fecha: m.fecha,
      entrada: m.entrada,
      salida: m.salida,
      stockFinal: m.stockFinal,
    }));
  }, [filteredData, selectedVariant]);

  const toggleExpand = (variantId: string) => {
    setExpanded((prev) => ({ ...prev, [variantId]: !prev[variantId] }));
  };

  const handleExport = () => {
    const exportRows = filteredData.flatMap((p: any) =>
      p.variantes.map((v: any) => ({
        producto: p.producto.nombre,
        variante: v.nombre,
        ...v.resumen,
      }))
    );
    exportToExcel(exportRows);
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    kardexData.forEach((p: any) => p.producto.categorias.forEach((c: string) => cats.add(c)));
    return Array.from(cats);
  }, [kardexData]);

  // Helper to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  return (
    <div className="bg-background">
      <HeaderBar title="Kardex Info" />
      <ScrollArea>
        <div className="container-section">
          <div className="content-section box-container">
            <div className="box-section">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
                {/* Producto Dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Producto</label>
                  <RadixSelect.Select
                    value={filters.productId}
                    onValueChange={v => {
                      setFilters({ productId: v, variantId: 'all' });
                    }}
                  >
                    <RadixSelect.SelectTrigger className="w-full">
                      <RadixSelect.SelectValue placeholder="Selecciona producto" />
                    </RadixSelect.SelectTrigger>
                    <RadixSelect.SelectContent>
                      <RadixSelect.SelectItem value="all">Todos</RadixSelect.SelectItem>
                      {kardexData.map(p => (
                        <RadixSelect.SelectItem key={p.producto.id} value={p.producto.id}>{p.producto.nombre}</RadixSelect.SelectItem>
                      ))}
                    </RadixSelect.SelectContent>
                  </RadixSelect.Select>
                </div>
                {/* Variante Dropdown, solo si hay producto seleccionado */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Variante</label>
                  <RadixSelect.Select
                    value={filters.variantId}
                    onValueChange={v => setFilters({ variantId: v })}
                    disabled={filters.productId === 'all'}
                  >
                    <RadixSelect.SelectTrigger className="w-full">
                      <RadixSelect.SelectValue placeholder={filters.productId === 'all' ? 'Selecciona producto primero' : 'Selecciona variante'} />
                    </RadixSelect.SelectTrigger>
                    <RadixSelect.SelectContent>
                      <RadixSelect.SelectItem value="all">Todas</RadixSelect.SelectItem>
                      {filters.productId !== 'all' && kardexData.find(p => p.producto.id === filters.productId)?.variantes.map(v => (
                        <RadixSelect.SelectItem key={v.id} value={v.id}>{v.nombre}</RadixSelect.SelectItem>
                      ))}
                    </RadixSelect.SelectContent>
                  </RadixSelect.Select>
                </div>
                {/* Categoría Dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Categoría</label>
                  <RadixSelect.Select value={filters.category} onValueChange={v => setFilters({ category: v })}>
                    <RadixSelect.SelectTrigger className="w-full">
                      <RadixSelect.SelectValue placeholder="Categoría" />
                    </RadixSelect.SelectTrigger>
                    <RadixSelect.SelectContent>
                      <RadixSelect.SelectItem value="all">Todas</RadixSelect.SelectItem>
                      {Array.from(new Set(kardexData.flatMap(p => p.producto.categorias))).map(c => (
                        <RadixSelect.SelectItem key={c} value={c}>{c}</RadixSelect.SelectItem>
                      ))}
                    </RadixSelect.SelectContent>
                  </RadixSelect.Select>
                </div>
                {/* Tipo de movimiento Dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Tipo de movimiento</label>
                  <RadixSelect.Select value={filters.movementType} onValueChange={v => setFilters({ movementType: v })}>
                    <RadixSelect.SelectTrigger className="w-full">
                      <RadixSelect.SelectValue placeholder="Tipo de movimiento" />
                    </RadixSelect.SelectTrigger>
                    <RadixSelect.SelectContent>
                      <RadixSelect.SelectItem value="all">Todos</RadixSelect.SelectItem>
                      {MOVEMENT_TYPES.map(t => (
                        <RadixSelect.SelectItem key={t} value={t}>{t}</RadixSelect.SelectItem>
                      ))}
                    </RadixSelect.SelectContent>
                  </RadixSelect.Select>
                </div>
                {/* Fecha desde */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Fecha desde</label>
                  <Input type="date" value={filters.dateFrom || ''} onChange={e => setFilters({ dateFrom: e.target.value })} className="w-full" placeholder="Desde" />
                </div>
                {/* Fecha hasta */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Fecha hasta</label>
                  <Input type="date" value={filters.dateTo || ''} onChange={e => setFilters({ dateTo: e.target.value })} className="w-full" placeholder="Hasta" />
                </div>
              </div>
            </div>
            <div className="box-section flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 w-full">
              <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">Limpiar filtros</Button>
              <Button onClick={applyFilters} className="w-full sm:w-auto">Aplicar filtros</Button>
              <Button onClick={handleExport} className="w-full sm:w-auto">Exportar a Excel</Button>
              {error && (
                <div className="bg-destructive/10 text-destructive p-2 rounded mt-4">{error}</div>
              )}
            </div>
            <div className="box-section p-0">
              <div className="flex flex-col items-center justify-center w-full">
                <div
                  className="rounded-xl shadow p-4 mb-8 bg-background dark:bg-background min-h-0 sm:min-h-[300px] w-full flex flex-col items-center justify-center"
                  style={{ maxHeight: '60vh', height: '100%', overflowY: 'auto', overflowX: 'auto', maxWidth: '100%' }}
                >
                  <div className="overflow-x-auto w-full flex justify-center">
                    <Table className="min-w-max mx-auto">
                    <thead>
                      <tr className="bg-muted/50 dark:bg-muted/30 text-xs">
                        <th className="border-r border-border bg-background dark:bg-background px-2 py-2">Producto</th>
                        <th className="border-r border-border bg-muted/5 dark:bg-muted/10 px-2 py-2">Variante</th>
                        <th className="border-r border-border bg-background dark:bg-background px-2 py-2">Stock Inicial</th>
                        <th className="border-r border-border bg-muted/5 dark:bg-muted/10 px-2 py-2">Entradas</th>
                        <th className="border-r border-border bg-background dark:bg-background px-2 py-2">Salidas</th>
                        <th className="border-r border-border bg-muted/5 dark:bg-muted/10 px-2 py-2">Stock Final</th>
                        <th className="border-r border-border bg-background dark:bg-background px-2 py-2">Costo Unitario Promedio</th>
                        <th className="border-r border-border bg-muted/5 dark:bg-muted/10 px-2 py-2">Valor Total</th>
                        <th className="bg-background dark:bg-background px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((p: any) =>
                        p.variantes.map((v: any) => (
                          <React.Fragment key={v.id}>
                            <tr className={twMerge("border-b text-xs", v.resumen.stockFinal < minStock && "bg-destructive/10 dark:bg-destructive/20")}> 
                              <td className="border-r border-border bg-background dark:bg-background px-2 py-1">{truncateText(p.producto.nombre, 18)}</td>
                              <td className="border-r border-border bg-muted/5 dark:bg-muted/10 px-2 py-1">{truncateText(v.nombre, 18)}</td>
                              <td className="border-r border-border bg-background dark:bg-background px-2 py-1">{v.resumen.stockInicial}</td>
                              <td className="border-r border-border bg-muted/5 dark:bg-muted/10 px-2 py-1">{v.resumen.totalEntradas}</td>
                              <td className="border-r border-border bg-background dark:bg-background px-2 py-1">{v.resumen.totalSalidas}</td>
                              <td className="border-r border-border bg-muted/5 dark:bg-muted/10 px-2 py-1">
                                {v.resumen.stockFinal}
                                {v.resumen.stockFinal < minStock && (
                                  <span className="ml-2 text-xs text-destructive font-bold">Crítico</span>
                                )}
                              </td>
                              <td className="border-r border-border bg-background dark:bg-background px-2 py-1">{v.resumen.costoUnitarioPromedio}</td>
                              <td className="border-r border-border bg-muted/5 dark:bg-muted/10 px-2 py-1">{v.resumen.valorTotal}</td>
                              <td className="bg-background dark:bg-background px-2 py-1">
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => toggleExpand(v.id)}>
                                    {expanded[v.id] ? 'Cerrar' : 'Ver movimientos'}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setSelectedVariant(selectedVariant === v.id ? null : v.id)}>
                                    {selectedVariant === v.id ? 'Cerrar gráfico' : 'Ver gráfico'}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            <AnimatePresence>
                              {expanded[v.id] && (
                                <motion.tr
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="bg-muted/10 dark:bg-muted/5 text-xs"
                                >
                                  <td colSpan={9}>
                                    <div className="p-2">
                                      {v.movimientos.length > 0 ? (
                                        <Table>
                                          <thead>
                                            <tr className="text-xs">
                                              <th>Fecha</th>
                                              <th>Tipo</th>
                                              <th>Referencia</th>
                                              <th>Entradas</th>
                                              <th>Salidas</th>
                                              <th>Stock Final</th>
                                              <th>Costo Unitario</th>
                                              <th>Costo Total</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {v.movimientos.map((m: any, idx: number) => (
                                              <tr key={idx} className="text-xs">
                                                <td>{m.fecha}</td>
                                                <td>{m.tipo}</td>
                                                <td>{m.referencia}</td>
                                                <td>{m.entrada}</td>
                                                <td>{m.salida}</td>
                                                <td>{m.stockFinal}</td>
                                                <td>{m.costoUnitario}</td>
                                                <td>{m.costoTotal}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </Table>
                                      ) : (
                                        <div className="text-muted-foreground p-4">Aún no hay info disponible</div>
                                      )}
                                    </div>
                                  </td>
                                </motion.tr>
                              )}
                            </AnimatePresence>
                            {selectedVariant === v.id && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-muted/10 dark:bg-muted/5 text-xs"
                              >
                                <td colSpan={9}>
                                  <div className="p-2">
                                    {chartData.length > 0 ? (
                                      <div className="w-full h-[300px] sm:h-[400px] overflow-x-auto">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={chartData}>
                                            <XAxis dataKey="fecha" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="entrada" stroke="#22c55e" name="Entradas" />
                                            <Line type="monotone" dataKey="salida" stroke="#ef4444" name="Salidas" />
                                            <Line type="monotone" dataKey="stockFinal" stroke="#3b82f6" name="Stock Final" />
                                          </LineChart>
                                        </ResponsiveContainer>
                                      </div>
                                    ) : (
                                      <div className="text-muted-foreground p-4">Aún no hay info disponible</div>
                                    )}
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
                {/* Paginación compacta centrada debajo de la tabla */}
                <div className="flex items-center justify-center gap-1 mt-4 w-full">
                    <div className="flex justify-center mt-6">
                      <Pagination>
                        <PaginationContent>
                          {/* Flecha izquierda */}
                          <PaginationItem>
                            <PaginationLink
                              isActive={false}
                              onClick={() => {
                                if (filters.page > 1) setFilters({ page: filters.page - 1 });
                              }}
                            >
                              ←
                            </PaginationLink>
                          </PaginationItem>
                          {/* Páginas visibles (máximo 5) */}
                          {(() => {
                            const totalPages = Math.max(1, Math.ceil(filteredData.length / filters.pageSize));
                            const visiblePages = 5;
                            let start = Math.max(1, filters.page - Math.floor(visiblePages / 2));
                            let end = Math.min(totalPages, start + visiblePages - 1);
                            if (end - start < visiblePages - 1) {
                              start = Math.max(1, end - visiblePages + 1);
                            }
                            return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(pageNum => (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  isActive={filters.page === pageNum}
                                  onClick={() => { setFilters({ page: pageNum }); }}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            ));
                          })()}
                          {/* Flecha derecha */}
                          <PaginationItem>
                            <PaginationLink
                              isActive={false}
                              onClick={() => {
                                const totalPages = Math.max(1, Math.ceil(filteredData.length / filters.pageSize));
                                if (filters.page < totalPages) setFilters({ page: filters.page + 1 });
                              }}
                            >
                              →
                            </PaginationLink>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default KardexInfo;
