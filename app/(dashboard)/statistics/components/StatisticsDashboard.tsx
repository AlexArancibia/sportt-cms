// StatisticsDashboard.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useMainStore } from '@/stores/mainStore';
import { useStatisticsStore } from '@/stores/statisticsStore';
import axios from 'axios';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as RadixSelect from '@/components/ui/select';
import { HeaderBar } from '@/components/HeaderBar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, AreaChart, Area, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Treemap } from 'recharts';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isAfter, isBefore } from "date-fns";

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e42', '#a855f7', '#14b8a6'];

type GroupedProductRowProps = { producto: string; variantes: any[] };

const GroupedProductRow: React.FC<GroupedProductRowProps & { rowColor?: string }> = ({ producto, variantes, rowColor }) => {
  const [open, setOpen] = React.useState(false);
  // Sumar valores de variantes
  const totalStockActual = variantes.reduce((acc: number, v: any) => acc + (v.stockActual || 0), 0);
  const totalStockMinimo = variantes.reduce((acc: number, v: any) => acc + (v.stockMinimo || 0), 0);
  const totalValorTotal = variantes.reduce((acc: number, v: any) => acc + (v.valorTotal || 0), 0);
  // Promedio de costo unitario
  const avgCostoUnitario = variantes.length ? (variantes.reduce((acc: number, v: any) => acc + (v.costoUnitario || 0), 0) / variantes.length) : 0;
  // Si el stock total actual es menor al mínimo, pintar la fila agrupada de rojo
  const groupedRowClass = twMerge(
    'font-semibold',
    rowColor || 'bg-muted/10 dark:bg-muted/5',
    totalStockActual < totalStockMinimo && 'bg-destructive/10 dark:bg-destructive/20'
  );
  return (
    <>
      <tr className={groupedRowClass}>
  <td className="px-4 py-2 text-left border-r min-w-[160px]">
          <button
            className="mr-2 text-primary hover:underline"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Ocultar variantes' : 'Ver variantes'}
          >
            {open ? '▼' : '▶'}
          </button>
          {producto}
        </td>
  <td className="px-4 py-2 text-center border-r min-w-[120px]"></td>
  <td className="px-4 py-2 text-center border-r min-w-[160px]"></td>
        <td className="px-4 py-2 text-center border-r font-bold">{totalStockActual}</td>
        <td className="px-4 py-2 text-center border-r font-bold">{totalStockMinimo}</td>
        <td className="px-4 py-2 text-center border-r font-bold">${avgCostoUnitario.toFixed(2)}</td>
        <td className="px-4 py-2 text-center font-bold">${totalValorTotal.toLocaleString()}</td>
      </tr>
      {open && variantes.length > 0 && (
        variantes.map((v: any) => (
          <motion.tr
            key={v.variantId}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={twMerge('text-xs', v.stockActual <= v.stockMinimo && 'bg-destructive/10 dark:bg-destructive/20')}
          >
            <td className="pl-8 px-4 py-2 text-left border-r min-w-[160px]">{v.nombre}</td>
            <td className="px-4 py-2 text-center border-r min-w-[120px]">{v.sku || ''}</td>
            <td className="px-4 py-2 text-center border-r min-w-[160px]">{v.nombre}</td>
            <td className="px-4 py-2 text-center border-r">{v.stockActual}</td>
            <td className="px-4 py-2 text-center border-r">{v.stockMinimo}</td>
            <td className="px-4 py-2 text-center border-r">${v.costoUnitario}</td>
            <td className="px-4 py-2 text-center">${v.valorTotal}</td>
          </motion.tr>
        ))
      )}
    </>
  );
}

const StatisticsDashboard: React.FC = () => {
  const { currentStore } = useMainStore();
  const { data, loading, error, fetchStatistics, setData } = useStatisticsStore();
  const [productSearch, setProductSearch] = useState('');
  const [variantSearch, setVariantSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Variantes disponibles según producto seleccionado
  const variantOptions = useMemo(() => {
    if (!data?.inventarioActual) return [];
    if (!productSearch || productSearch === 'all') {
      return data.inventarioActual.flatMap((p: any) => p.variantes);
    }
    const prod = data.inventarioActual.find((p: any) => p.producto === productSearch);
    return prod ? prod.variantes : [];
  }, [data, productSearch]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!currentStore) return;
    fetchStatistics(currentStore)
      .then(res => {
        console.log('Statistics response:', res);
        setData(res);
      })
      .catch(() => {});
  }, [currentStore, fetchStatistics, setData]);

// ✅ Filtrado de inventario (ahora con fechas también)
const filteredInventarioActual = useMemo(() => {
  if (!data?.inventarioActual) return [];
  let productos = data.inventarioActual;

  if (productSearch && productSearch !== 'all') {
    productos = productos.filter((p: any) => p.producto === productSearch);
  }

  return productos.map((p: any) => ({
    ...p,
    variantes: p.variantes.filter((v: any) => {
      // filtro por variante
      if (variantSearch && variantSearch !== 'all' && v.nombre !== variantSearch) {
        return false;
      }
      // filtro por fechas
      if (dateFrom || dateTo) {
        if (!v.fecha) return false;
        const fecha = parseISO(v.fecha);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (isBefore(fecha, fromDate) && fecha.getTime() !== fromDate.getTime()) return false;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          if (isAfter(fecha, toDate) && fecha.getTime() !== toDate.getTime()) return false;
        }
      }
      return true;
    }),
  }));
}, [data, productSearch, variantSearch, dateFrom, dateTo]);


// ✅ Productos más vendidos (ya tenía fechas, se mantiene igual)
const filteredProductosMasVendidos = useMemo(() => {
  if (!data?.productosMasVendidos) return [];
  let productos = data.productosMasVendidos;

  if (variantSearch && variantSearch !== 'all') {
    productos = productos.filter((v: any) => v.nombre === variantSearch);
  }

  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    productos = productos.filter((v: any) => {
      if (!v.fecha) return false;
      const fechaVenta = parseISO(v.fecha);
      return isAfter(fechaVenta, fromDate) || fechaVenta.getTime() === fromDate.getTime();
    });
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    productos = productos.filter((v: any) => {
      if (!v.fecha) return false;
      const fechaVenta = parseISO(v.fecha);
      return isBefore(fechaVenta, toDate) || fechaVenta.getTime() === toDate.getTime();
    });
  }

  return productos;
}, [data, variantSearch, dateFrom, dateTo]);


// ✅ Valor de inventario total (no depende de fechas)
const valorInventarioTotal = data?.valorInventarioTotal || 0;


// ✅ Alertas de stock bajo (no dependen de fechas)
const productosStockBajo = data?.alertasStockBajo?.length || 0;


// ✅ Inventario por productos (gráfico donut)
const productChartData = useMemo(() => {
  if (!filteredInventarioActual.length) return [];
  return filteredInventarioActual.map((p: any) => ({
    name: p.producto,
    value: p.variantes.reduce(
      (acc: number, v: any) => acc + (v.valorTotal || v.stockActual || 0),
      0
    ),
  }));
}, [filteredInventarioActual]);


// ✅ Ventas por periodo (respeta fechas)
// Ventas por periodo (30 días y comparación con mes pasado)
const ventasPorPeriodoComparativo = useMemo(() => {
  if (!data?.ventasPorPeriodo) return [];
  // Transformar estructura anidada en array plano
  console.log("data ventas: ", data.ventasPorPeriodo)
  const ventasPorPeriodoObj = data.ventasPorPeriodo;
  const ventasPlanas: { fecha: string; ventas: number }[] = [];
  Object.values(ventasPorPeriodoObj).forEach((mesObj: any) => {
    if (typeof mesObj !== 'object') return;
    Object.values(mesObj).forEach((semanaObj: any) => {
      if (typeof semanaObj !== 'object') return;
      Object.values(semanaObj).forEach((diasArr: any) => {
        if (Array.isArray(diasArr)) {
          diasArr.forEach((dia: any) => {
            if (dia && dia.fecha && typeof dia.ventas === 'number') {
              ventasPlanas.push({ fecha: dia.fecha, ventas: dia.ventas });
            }
          });
        }
      });
    });
  });

  // Determinar rango de fechas
  let fromDate: Date;
  let toDate: Date;
  if (dateFrom && dateTo) {
    fromDate = new Date(dateFrom);
    toDate = new Date(dateTo);
  } else if (dateFrom && !dateTo) {
    fromDate = new Date(dateFrom);
    toDate = new Date(dateFrom);
    toDate.setDate(fromDate.getDate() + 29);
  } else if (!dateFrom && dateTo) {
    toDate = new Date(dateTo);
    fromDate = new Date(dateTo);
    fromDate.setDate(toDate.getDate() - 29);
  } else {
    toDate = new Date();
    fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 29);
  }

  // Actual periodo
  const ventasActual = ventasPlanas.filter((v: any) => {
    if (!v.fecha) return false;
    const fechaVenta = parseISO(v.fecha);
    return fechaVenta >= fromDate && fechaVenta <= toDate;
  });

  // Periodo anterior (mismo rango pero mes pasado)
  const fromDateAnterior = new Date(fromDate.getTime());
  fromDateAnterior.setMonth(fromDateAnterior.getMonth() - 1);
  const toDateAnterior = new Date(toDate.getTime());
  toDateAnterior.setMonth(toDateAnterior.getMonth() - 1);
  const ventasAnterior = ventasPlanas.filter((v: any) => {
    if (!v.fecha) return false;
    const fechaVenta = parseISO(v.fecha);
    return fechaVenta >= fromDateAnterior && fechaVenta <= toDateAnterior;
  });

  // Agrupar por día y alinear mes anterior con mes actual, alineando por día del mes
  const agruparPorDiaSuperpuesto = (ventasActualArr: any[], ventasAnteriorArr: any[], baseDate: Date) => {
    const result: { fecha: string; ventasActual: number; ventasAnterior: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const fechaActual = new Date(baseDate);
      fechaActual.setDate(baseDate.getDate() + i);
      const keyActual = format(fechaActual, "yyyy-MM-dd");

      // Buscar la fecha correspondiente en el mes anterior (mismo día, mes anterior)
      const fechaAnterior = new Date(fechaActual);
      fechaAnterior.setMonth(fechaAnterior.getMonth() - 1);
      const keyAnterior = format(fechaAnterior, "yyyy-MM-dd");

      // Sumar ventas para el día actual
      const ventasActualDia = ventasActualArr
        .filter((v: any) => format(parseISO(v.fecha), "yyyy-MM-dd") === keyActual)
        .reduce((acc: number, v: any) => acc + v.ventas, 0);
      // Sumar ventas para el día correspondiente del mes anterior
      const ventasAnteriorDia = ventasAnteriorArr
        .filter((v: any) => format(parseISO(v.fecha), "yyyy-MM-dd") === keyAnterior)
        .reduce((acc: number, v: any) => acc + v.ventas, 0);

      result.push({
        fecha: keyActual,
        ventasActual: ventasActualDia || 0,
        ventasAnterior: ventasAnteriorDia || 0,
      });
    }
    return result;
  };

  const superpuesto = agruparPorDiaSuperpuesto(ventasActual, ventasAnterior, fromDate);
  console.log("data procesada: ",superpuesto)
  return superpuesto;
}, [data, dateFrom, dateTo]);


// ✅ Top productos para gráfico (ya usa filteredInventarioActual)
const topProductChartData = useMemo(() => {
  if (!productChartData.length) return [];
  const sorted = [...productChartData].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 10);
  const others = sorted.slice(10);
  if (others.length > 0) {
    const totalOthers = others.reduce((acc, cur) => acc + cur.value, 0);
    top.push({ name: "Otros", value: totalOthers });
  }
  return top;
}, [productChartData]);


// ✅ Productos agotados (también con fechas)
const productosAgotados = useMemo(() => {
  if (!filteredInventarioActual.length) return 0;
  return filteredInventarioActual.reduce((acc: number, p: any) => {
    const agotados = p.variantes.filter((v: any) => (v.stockActual || 0) === 0).length;
    return acc + agotados;
  }, 0);
}, [filteredInventarioActual]);


  return (
    <>
      <HeaderBar title="Estadísticas de Inventario y Ventas" />
      <ScrollArea>
        <div className="container-section">
          <div className="content-section box-container">
            {loading && (
              <div className="w-full flex justify-center items-center py-8">
                <span className="text-muted-foreground">Cargando estadísticas...</span>
              </div>
            )}

            {/* Filtros */}
            <div className="box-section">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full min-w-0">
                {/* Producto */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Producto</label>
                  <RadixSelect.Select value={productSearch} onValueChange={v => setProductSearch(v)}>
                    <RadixSelect.SelectTrigger className="w-full">
                      <RadixSelect.SelectValue placeholder="Selecciona producto" />
                    </RadixSelect.SelectTrigger>
                    <RadixSelect.SelectContent>
                      <RadixSelect.SelectItem value="all">Todos</RadixSelect.SelectItem>
                      {data?.inventarioActual?.map((p: any) => (
                        <RadixSelect.SelectItem key={p.productoId} value={p.producto}>
                          {p.producto}
                        </RadixSelect.SelectItem>
                      ))}
                    </RadixSelect.SelectContent>
                  </RadixSelect.Select>
                </div>

                {/* Variante */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Variante</label>
                  <RadixSelect.Select value={variantSearch} onValueChange={v => setVariantSearch(v)}>
                    <RadixSelect.SelectTrigger className="w-full">
                      <RadixSelect.SelectValue placeholder="Selecciona variante" />
                    </RadixSelect.SelectTrigger>
                    <RadixSelect.SelectContent>
                      <RadixSelect.SelectItem value="all">Todas</RadixSelect.SelectItem>
                      {variantOptions.map((v: any) => (
                        <RadixSelect.SelectItem key={v.variantId} value={v.nombre}>
                          {v.nombre}
                        </RadixSelect.SelectItem>
                      ))}
                    </RadixSelect.SelectContent>
                  </RadixSelect.Select>
                </div>

                {/* Fecha desde */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Fecha desde</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Fecha hasta */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Fecha hasta</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Botón borrar filtros */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setProductSearch('all');
                      setVariantSearch('all');
                      setDateFrom('');
                      setDateTo('');
                    }}
                  >
                    Borrar filtros
                  </Button>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="box-section grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="rounded-lg bg-muted/10 dark:bg-muted/5 p-4 flex flex-col items-center">
                <span className="text-xs text-muted-foreground">Valor Inventario Total</span>
                <span className="text-2xl font-bold">${valorInventarioTotal.toLocaleString()}</span>
              </div>

              <div className="rounded-lg bg-destructive/10 dark:bg-destructive/20 p-4 flex flex-col items-center">
                <span className="text-xs text-muted-foreground">Productos con Stock Bajo</span>
                <span className="text-2xl font-bold">{productosStockBajo}</span>
              </div>

              {/* NUEVO: Productos agotados */}
              <div className="rounded-lg bg-destructive/20 dark:bg-destructive/30 p-4 flex flex-col items-center">
                <span className="text-xs text-muted-foreground">Productos Agotados</span>
                <span className="text-2xl font-bold">{productosAgotados}</span>
              </div>
            </div>

            {/* Tabla agrupada por producto y variantes */}
            <div className="box-section p-0 mt-4">
              <div className="rounded-xl shadow mb-8 bg-background dark:bg-background mx-auto min-h-0 sm:min-h-[300px]" style={{ maxWidth: '1800px' }}>
                {/* Título fijo arriba */}
                <div className="font-semibold text-lg p-4 border-b text-center">
                  Inventario agrupado por producto y variantes
                </div>
                {/* Contenedor scrollable solo para la tabla */}
                <div className="p-4 overflow-y-auto overflow-x-auto" style={{ maxHeight: '60vh' }}>
                  <Table className="min-w-max w-full text-xs" style={{ borderSpacing: '0 8px', borderCollapse: 'separate' }}>
                    <thead>
                      <tr className="bg-muted/50 dark:bg-muted/30 text-xs">
                        <th className="text-left px-4 py-2 border-r">Producto</th>
                        <th className="text-center px-4 py-2 border-r">SKU</th>
                        <th className="text-center px-4 py-2 border-r min-w-[160px] sticky top-0 bg-muted/50 dark:bg-muted/30 z-10">Variante</th>
                        <th className="text-center px-4 py-2 border-r">Stock Actual</th>
                        <th className="text-center px-4 py-2 border-r">Stock Mínimo</th>
                        <th className="text-center px-4 py-2 border-r">Costo Unitario</th>
                        <th className="text-center px-4 py-2">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventarioActual.length ? (
                        filteredInventarioActual.map((p: any, idx: number) => (
                          <GroupedProductRow
                            key={p.productoId}
                            producto={p.producto}
                            variantes={p.variantes}
                            rowColor={idx % 2 === 0 ? 'bg-muted/10 dark:bg-muted/5' : 'bg-muted/20 dark:bg-muted/10'}
                          />
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center text-muted-foreground p-4">
                            Aún no hay info disponible
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
            {/* Tabla de productos mas vendidos */}
            <div className="box-section p-0 mt-4">
              <div className="rounded-xl shadow mb-8 bg-background dark:bg-background mx-auto min-h-0 sm:min-h-[200px]" style={{ maxWidth: '2200px' }}>
                {/* Título fijo arriba */}
                <div className="font-semibold text-lg p-4 border-b text-center">
                  Tabla de productos más vendidos
                </div>
                {/* Contenedor scrollable solo para la tabla */}
                <div className="p-4 overflow-y-auto overflow-x-auto" style={{ maxHeight: '40vh' }}>
                  <Table className="min-w-max w-full text-xs" style={{ borderSpacing: '0 8px', borderCollapse: 'separate' }}>
                    <thead>
                      <tr className="bg-muted/50 dark:bg-muted/30 text-xs">
                        <th className="text-left px-4 py-2 border-r min-w-[160px]">Producto</th>
                        <th className="text-center px-4 py-2 border-r min-w-[160px]">Variante</th>
                        <th className="text-center px-4 py-2 border-r">Ventas Totales</th>
                        <th className="text-center px-4 py-2">Ingresos Totales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(filteredProductosMasVendidos) && filteredProductosMasVendidos.length ? (
                        filteredProductosMasVendidos.map((v: any) => {
                          const info =
                            (data?.inventarioActual || [])
                              .flatMap((p: any) =>
                                p.variantes && Array.isArray(p.variantes)
                                  ? p.variantes.map((variant: any) => ({ ...variant, producto: p.producto }))
                                  : []
                              )
                              .find((variant: any) => variant.variantId === v.variantId) || {};
                          return (
                            <tr
                              key={v.variantId}
                              className={twMerge(
                                'text-xs',
                                v.ventasTotales === 0 && 'bg-destructive/10 dark:bg-destructive/20'
                              )}
                            >
                              <td className="pl-4 px-4 py-2 text-left border-r">{info.producto || v.producto || ''}</td>
                              <td className="px-4 py-2 text-center border-r">{info.nombre || v.nombre}</td>
                              <td className="px-4 py-2 text-center border-r">{v.ventasTotales}</td>
                              <td className="px-4 py-2 text-center">
                                {v.ingresosTotales > 0
                                  ? `$${Number(v.ingresosTotales).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}`
                                  : ''}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-muted-foreground p-4">
                            Aún no hay info disponible
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="box-section grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-xl shadow p-4 bg-background dark:bg-background w-full max-w-[1200px] mx-auto h-[500px]">
                <div className="font-semibold mb-2 text-lg">Ventas últimos 30 días vs mes anterior</div>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={ventasPorPeriodoComparativo}>
                    <defs>
                      <linearGradient id="colorVentasActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVentasAnterior" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#888" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#888" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="fecha"
                      type="category"
                      allowDuplicatedCategory={false}
                      tick={false}
                    />
                    <YAxis />
                    <Tooltip
                      content={({ label, payload }) => {
                        let fechaStr = '';
                        if (label) {
                          try {
                            fechaStr = format(parseISO(label), 'dd/MM/yyyy');
                          } catch {
                            fechaStr = String(label);
                          }
                        } else {
                          fechaStr = 'Sin fecha';
                        }
                        return (
                          <div className="p-2 rounded bg-background shadow text-xs">
                            <div className="font-semibold mb-1">{fechaStr}</div>
                            {payload?.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between gap-2">
                                <span>{item.name === 'ventasActual' ? 'Ventas actual' : 'Ventas mes anterior'}:</span>
                                <span className="font-bold">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    {/* Curva fantasma del mes anterior, alineada y superpuesta */}
                    <Area
                      type="monotone"
                      dataKey="ventasAnterior"
                      stroke="#888"
                      fillOpacity={0.2}
                      fill="url(#colorVentasAnterior)"
                      strokeDasharray="3 3"
                      name="Mes anterior"
                      isAnimationActive={false}
                      dot={false}
                      activeDot={false}
                      legendType="none"
                    />
                    {/* Curva actual */}
                    <Area 
                      type="monotone" 
                      dataKey="ventasActual"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorVentasActual)"
                      name="Actual"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl shadow p-4 bg-background dark:bg-background col-span-1 md:col-span-2">
                <div className="font-semibold mb-2 text-lg">
                  Participación de Productos en Inventario
                </div>
                <div className="text-xs text-muted-foreground mb-4">
                  Representa la proporción de cada producto en el inventario total.
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Donut Chart */}
                  <ResponsiveContainer width="100%" height={400} className="md:w-1/2">
                    <PieChart>
                      <Pie
                        data={topProductChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="40%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={150}
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(-1)}
                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                      >
                        {topProductChartData.map((entry: any, idx: number) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={COLORS[idx % COLORS.length]}
                            opacity={activeIndex === -1 ? 1 : activeIndex === idx ? 1 : 0.3}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Leyenda a la derecha */}
                  <div className="flex flex-col gap-2 md:w-1/2">
                    {topProductChartData.map((entry: any, idx: number) => (
                      <div
                        key={`legend-${idx}`}
                        className="flex items-center gap-2 cursor-pointer"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseLeave={() => setActiveIndex(-1)}
                      >
                        <div
                          className="w-4 h-4 rounded-sm"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-sm">
                          {entry.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>


            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive p-2 rounded mt-4">{error}</div>
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  );
};

export default StatisticsDashboard;
