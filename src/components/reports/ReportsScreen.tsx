import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  Filter,
  FileDown,
  Share2,
  FileSpreadsheet,
  MoreVertical,
  Users,
  Store,
  Pill,
  TrendingUp,
  Package,
  DollarSign,
  ChevronRight,
  RotateCcw,
  Clock,
  Eye,
} from 'lucide-react';
import { Order, Pharmacy, Receiver } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  ReportFilterState,
  BookerSummary,
  PharmacySummary,
  ItemSummary,
  ReportSummaryTotals,
  downloadReportPdf,
  downloadReportCsv,
  formatReportWhatsAppSummary,
} from '../../services/reportExport';
import { ShowMoreButton, useShowMore } from '../common/ShowMoreButton';
import { OrderDetailModal } from '../history/OrderDetailModal';

interface ReportsScreenProps {
  orders: Order[];
  pharmacies: Pharmacy[];
  receivers: Receiver[];
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
  onViewOrderDetails?: (order: Order) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  orders,
  pharmacies,
  receivers,
  onNotify,
}) => {
  // Helper to format Date to YYYY-MM-DD in local time
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Default to 'month'
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dateRangePreset, setDateRangePreset] = useState<ReportFilterState['dateRangePreset']>('month');
  const [fromDate, setFromDate] = useState<string>(formatLocalDate(firstOfMonth));
  const [toDate, setToDate] = useState<string>(formatLocalDate(today));
  const [selectedReceiverId, setSelectedReceiverId] = useState<string>('all');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('all');

  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  // Modal & Menus
  const [activeDetailOrder, setActiveDetailOrder] = useState<Order | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set quick date preset
  const applyPreset = (preset: ReportFilterState['dateRangePreset']) => {
    const now = new Date();
    setDateRangePreset(preset);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    if (preset === 'today') {
      const d = formatLocalDate(now);
      setFromDate(d);
      setToDate(d);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const d = formatLocalDate(y);
      setFromDate(d);
      setToDate(d);
    } else if (preset === 'week') {
      const startOfWeek = new Date(now);
      const day = now.getDay() || 7; // 1 (Mon) to 7 (Sun)
      startOfWeek.setDate(now.getDate() - (day - 1));
      setFromDate(formatLocalDate(startOfWeek));
      setToDate(formatLocalDate(now));
    } else if (preset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(formatLocalDate(start));
      setToDate(formatLocalDate(now));
    } else if (preset === 'last-month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setFromDate(formatLocalDate(start));
      setToDate(formatLocalDate(end));
    }
  };

  // Filter state bundle
  const filterState: ReportFilterState = useMemo(() => ({
    dateRangePreset,
    fromDate,
    toDate,
    selectedReceiverId,
    selectedPharmacyId,
  }), [dateRangePreset, fromDate, toDate, selectedReceiverId, selectedPharmacyId]);

  // Filtered orders with instant indexed matching
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Date check
      const orderDateStr = order.date ? order.date.slice(0, 10) : '';
      if (fromDate && orderDateStr < fromDate) return false;
      if (toDate && orderDateStr > toDate) return false;

      // Booker check (support unassigned orders)
      if (selectedReceiverId !== 'all') {
        const orderReceiver = order.receiverId || 'unassigned';
        if (orderReceiver !== selectedReceiverId) return false;
      }

      // Pharmacy check
      if (selectedPharmacyId !== 'all' && order.pharmacyId !== selectedPharmacyId) {
        return false;
      }

      return true;
    });
  }, [orders, fromDate, toDate, selectedReceiverId, selectedPharmacyId]);

  // Overall Totals
  const totals: ReportSummaryTotals = useMemo(() => {
    let totalBoxes = 0;
    let grossSales = 0;
    let totalDiscount = 0;
    let netSales = 0;

    filteredOrders.forEach((o) => {
      netSales += o.grandTotal || 0;
      totalDiscount += o.discountAmount || 0;
      grossSales += (o.subtotal || o.grandTotal) || 0;

      o.items.forEach((item) => {
        totalBoxes += (Number(item.quantity) || 0);
      });
    });

    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? netSales / totalOrders : 0;

    return {
      totalOrders,
      totalBoxes,
      grossSales,
      totalDiscount,
      netSales,
      avgOrderValue,
    };
  }, [filteredOrders]);

  // Booker-wise breakdown
  const bookerBreakdown: BookerSummary[] = useMemo(() => {
    const map = new Map<string, BookerSummary>();

    filteredOrders.forEach((order) => {
      const recId = order.receiverId || 'unassigned';
      const recName = order.receiverName || 'Unassigned Booker';

      let existing = map.get(recId);
      if (!existing) {
        existing = {
          receiverId: recId,
          receiverName: recName,
          orderCount: 0,
          totalBoxes: 0,
          grossSales: 0,
          totalDiscount: 0,
          netSales: 0,
        };
        map.set(recId, existing);
      }

      existing.orderCount += 1;
      existing.grossSales += (order.subtotal || order.grandTotal) || 0;
      existing.totalDiscount += (order.discountAmount || 0);
      existing.netSales += (order.grandTotal || 0);

      order.items.forEach((item) => {
        existing!.totalBoxes += (Number(item.quantity) || 0);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.netSales - a.netSales);
  }, [filteredOrders]);

  // Pharmacy-wise breakdown
  const pharmacyBreakdown: PharmacySummary[] = useMemo(() => {
    const map = new Map<string, PharmacySummary>();

    filteredOrders.forEach((order) => {
      const pId = order.pharmacyId;
      const pName = order.pharmacyName || 'Unknown Pharmacy';

      let existing = map.get(pId);
      if (!existing) {
        existing = {
          pharmacyId: pId,
          pharmacyName: pName,
          orderCount: 0,
          totalBoxes: 0,
          netSales: 0,
        };
        map.set(pId, existing);
      }

      existing.orderCount += 1;
      existing.netSales += (order.grandTotal || 0);

      order.items.forEach((item) => {
        existing!.totalBoxes += (Number(item.quantity) || 0);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.netSales - a.netSales);
  }, [filteredOrders]);

  // Item-wise breakdown (Most sold medicines)
  const itemBreakdown: ItemSummary[] = useMemo(() => {
    const map = new Map<string, ItemSummary>();

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = `${item.name}-${item.strength || ''}`;
        let existing = map.get(key);
        if (!existing) {
          existing = {
            name: item.name,
            strength: item.strength,
            totalBoxes: 0,
            netSales: 0,
          };
          map.set(key, existing);
        }

        existing.totalBoxes += (Number(item.quantity) || 0);
        existing.netSales += (Number(item.amount) || 0);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalBoxes - a.totalBoxes);
  }, [filteredOrders]);

  // Daily Chart Data for the Period
  const dailyChartData = useMemo(() => {
    const map = new Map<string, number>();

    filteredOrders.forEach((order) => {
      const day = order.date ? order.date.slice(0, 10) : '';
      if (day) {
        map.set(day, (map.get(day) || 0) + (order.grandTotal || 0));
      }
    });

    // Sort by chronological date
    const sorted = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({
        date,
        label: date.slice(5), // MM-DD
        amount,
      }));

    const maxAmount = Math.max(...sorted.map((d) => d.amount), 1);
    return { data: sorted, maxAmount };
  }, [filteredOrders]);

  // "Show More" pagination state for each list
  const bookersPagination = useShowMore(bookerBreakdown.length, 10, 10);
  const pharmaciesPagination = useShowMore(pharmacyBreakdown.length, 10, 10);
  const itemsPagination = useShowMore(itemBreakdown.length, 10, 10);
  const ordersPagination = useShowMore(filteredOrders.length, 10, 10);

  // Handlers for Exports
  const handleExportPdf = () => {
    setIsMoreMenuOpen(false);
    try {
      downloadReportPdf(
        totals,
        bookerBreakdown,
        pharmacyBreakdown,
        itemBreakdown,
        filteredOrders,
        filterState,
        receivers,
        pharmacies
      );
      onNotify('Report PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      onNotify('Failed to generate PDF report', 'error');
    }
  };

  const handleExportCsv = () => {
    setIsMoreMenuOpen(false);
    try {
      downloadReportCsv(totals, bookerBreakdown, filteredOrders, filterState);
      onNotify('Report CSV downloaded!', 'success');
    } catch (err) {
      console.error(err);
      onNotify('Failed to export CSV', 'error');
    }
  };

  const handleShareWhatsApp = async () => {
    setIsMoreMenuOpen(false);
    try {
      const summaryText = formatReportWhatsAppSummary(totals, bookerBreakdown, filterState);
      if (navigator.share) {
        await navigator.share({
          title: 'Order Desk Sales Report',
          text: summaryText,
        });
        onNotify('Opened report share!', 'success');
      } else {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        onNotify('Opened WhatsApp with report summary', 'success');
      }
    } catch (err) {
      console.error(err);
      onNotify('Could not share report on WhatsApp', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-4 space-y-3.5">
      {/* 1. TOP CONTROLS & FILTER SECTION */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs p-3.5 space-y-3">
        {/* Title and Top Actions */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                Money Record &amp; Booker Report
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Last updated: {lastUpdated}
                </span>
                <span>•</span>
                <span className="text-teal-800 font-semibold">{filteredOrders.length} orders matched</span>
              </div>
            </div>
          </div>

          {/* Export & Actions Button + Discreet Menu */}
          <div className="relative" ref={moreMenuRef}>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportPdf}
                className="px-2.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                title="Download PDF Report"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((v) => !v)}
                className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                title="More report options"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Discreet Menu */}
            {isMoreMenuOpen && (
              <div className="absolute right-0 top-10 z-40 w-48 rounded-2xl bg-white shadow-xl border border-slate-200/80 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-teal-700" />
                  <span>Download PDF Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export as CSV</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                {/* Hidden WhatsApp Share per user requirement */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Share on WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Date Range Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'last-month', label: 'Last Month' },
            { id: 'custom', label: 'Custom Range' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer touch-manipulation text-[11px] ${
                dateRangePreset === preset.id
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/90 text-slate-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Date Pickers & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* From Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDateRangePreset('custom');
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-700"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDateRangePreset('custom');
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-700"
            />
          </div>

          {/* Booker Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Booker (Receiver)
            </label>
            <select
              value={selectedReceiverId}
              onChange={(e) => setSelectedReceiverId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-700 truncate"
            >
              <option value="all">All Bookers ({receivers.length})</option>
              {receivers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pharmacy Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Pharmacy (Optional)
            </label>
            <select
              value={selectedPharmacyId}
              onChange={(e) => setSelectedPharmacyId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-700 truncate"
            >
              <option value="all">All Pharmacies ({pharmacies.length})</option>
              {pharmacies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* Total Orders */}
        <div className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Orders</span>
            <Calendar className="w-3.5 h-3.5 text-teal-700" />
          </div>
          <div className="mt-1 text-base sm:text-lg font-black text-slate-900">
            {totals.totalOrders}
          </div>
          <span className="text-[11px] text-slate-500">Booked orders in period</span>
        </div>

        {/* Total Boxes */}
        <div className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Boxes</span>
            <Package className="w-3.5 h-3.5 text-teal-700" />
          </div>
          <div className="mt-1 text-base sm:text-lg font-black text-slate-900">
            {totals.totalBoxes.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Medicine units/boxes</span>
        </div>

        {/* Gross Sales */}
        <div className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gross Sales</span>
            <DollarSign className="w-3.5 h-3.5 text-teal-700" />
          </div>
          <div className="mt-1 text-base sm:text-lg font-black text-slate-900 truncate">
            {formatCurrency(totals.grossSales)}
          </div>
          <span className="text-[11px] text-slate-500">Before any discounts</span>
        </div>

        {/* Total Discount Given */}
        <div className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Discount</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 text-base sm:text-lg font-black text-emerald-800 truncate">
            -{formatCurrency(totals.totalDiscount)}
          </div>
          <span className="text-[11px] text-emerald-700">All item &amp; extra savings</span>
        </div>

        {/* Net Sales (Primary Hero) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-800 to-teal-900 text-white shadow-xs">
          <div className="flex items-center justify-between text-teal-200">
            <span className="text-[10px] font-bold uppercase tracking-wider">Net Sales</span>
            <DollarSign className="w-3.5 h-3.5 text-teal-300" />
          </div>
          <div className="mt-1 text-base sm:text-lg font-black text-white truncate">
            {formatCurrency(totals.netSales)}
          </div>
          <span className="text-[11px] text-teal-200">Final collected revenue</span>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Order Value</span>
            <TrendingUp className="w-3.5 h-3.5 text-teal-700" />
          </div>
          <div className="mt-1 text-base sm:text-lg font-black text-slate-900 truncate">
            {formatCurrency(totals.avgOrderValue)}
          </div>
          <span className="text-[11px] text-slate-500">Average basket size</span>
        </div>
      </div>

      {/* 3. DAILY SALES CHART (SVG Bar / Trend Chart) */}
      {dailyChartData.data.length > 0 && (
        <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Daily Net Sales Trend
            </h3>
            <span className="text-[11px] text-slate-400">
              Peak: {formatCurrency(dailyChartData.maxAmount)}
            </span>
          </div>

          <div className="h-28 w-full flex items-end gap-1.5 pt-3 pb-1 overflow-x-auto no-scrollbar">
            {dailyChartData.data.map((day) => {
              const heightPercent = Math.max(8, Math.round((day.amount / dailyChartData.maxAmount) * 100));
              return (
                <div
                  key={day.date}
                  className="flex-1 min-w-[28px] max-w-[48px] h-full flex flex-col items-center justify-end group cursor-pointer relative"
                  title={`${day.date}: ${formatCurrency(day.amount)}`}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-20">
                    {formatCurrency(day.amount)}
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full rounded-t-md bg-teal-700 hover:bg-teal-600 transition-all shadow-xs"
                  />
                  {/* Label */}
                  <span className="text-[9px] text-slate-400 font-semibold mt-1 truncate">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. BOOKER-WISE REPORT TABLE */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-800" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Booker-Wise Performance
            </h3>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-teal-800 text-white">
              {bookerBreakdown.length}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Tap booker to filter orders</span>
        </div>

        {bookerBreakdown.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No booker data found in this period.
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[520px]">
                <thead>
                  <tr className="bg-slate-50/90 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="py-2 px-3">Booker (Receiver)</th>
                    <th className="py-2 px-2 text-center">Orders</th>
                    <th className="py-2 px-2 text-center">Boxes</th>
                    <th className="py-2 px-2 text-right">Gross</th>
                    <th className="py-2 px-2 text-right">Discount</th>
                    <th className="py-2 px-3 text-right">Net Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookerBreakdown.slice(0, bookersPagination.visibleCount).map((b, idx) => (
                    <tr
                      key={b.receiverId}
                      onClick={() => {
                        setSelectedReceiverId(b.receiverId);
                        onNotify(`Filtered report for booker: ${b.receiverName}`, 'info');
                      }}
                      className={`hover:bg-teal-50/50 cursor-pointer transition ${
                        idx % 2 === 0 ? 'bg-white/80' : 'bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-normal">{idx + 1}.</span>
                        <span>{b.receiverName}</span>
                        {selectedReceiverId === b.receiverId && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-100 text-teal-800">
                            Active Filter
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-700">{b.orderCount}</td>
                      <td className="py-2 px-2 text-center font-semibold text-slate-600">{b.totalBoxes}</td>
                      <td className="py-2 px-2 text-right font-medium text-slate-500">{formatCurrency(b.grossSales)}</td>
                      <td className="py-2 px-2 text-right font-medium text-emerald-700">
                        {b.totalDiscount > 0 ? `-${formatCurrency(b.totalDiscount)}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-teal-950">{formatCurrency(b.netSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ShowMoreButton
              totalCount={bookerBreakdown.length}
              visibleCount={bookersPagination.visibleCount}
              onShowMore={bookersPagination.showMore}
              onShowLess={bookersPagination.showLess}
            />
          </div>
        )}
      </div>

      {/* 5. PHARMACY-WISE REVENUE BREAKDOWN */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-teal-800" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Pharmacy Revenue Breakdown
            </h3>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-teal-800 text-white">
              {pharmacyBreakdown.length}
            </span>
          </div>
        </div>

        {pharmacyBreakdown.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No pharmacy orders in this period.
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[420px]">
                <thead>
                  <tr className="bg-slate-50/90 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="py-2 px-3">Pharmacy Name</th>
                    <th className="py-2 px-2 text-center">Orders</th>
                    <th className="py-2 px-2 text-center">Boxes</th>
                    <th className="py-2 px-3 text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pharmacyBreakdown.slice(0, pharmaciesPagination.visibleCount).map((p, idx) => (
                    <tr
                      key={p.pharmacyId}
                      className={`hover:bg-teal-50/50 transition ${
                        idx % 2 === 0 ? 'bg-white/80' : 'bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-normal">{idx + 1}.</span>
                        <span>{p.pharmacyName}</span>
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-700">{p.orderCount}</td>
                      <td className="py-2 px-2 text-center font-semibold text-slate-600">{p.totalBoxes}</td>
                      <td className="py-2 px-3 text-right font-black text-teal-950">{formatCurrency(p.netSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ShowMoreButton
              totalCount={pharmacyBreakdown.length}
              visibleCount={pharmaciesPagination.visibleCount}
              onShowMore={pharmaciesPagination.showMore}
              onShowLess={pharmaciesPagination.showLess}
            />
          </div>
        )}
      </div>

      {/* 6. TOP SOLD MEDICINES IN PERIOD */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-teal-800 rotate-45" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Most Sold Medicines (Volume &amp; Revenue)
            </h3>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-teal-800 text-white">
              {itemBreakdown.length}
            </span>
          </div>
        </div>

        {itemBreakdown.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No item data in this period.
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[420px]">
                <thead>
                  <tr className="bg-slate-50/90 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="py-2 px-3">Medicine &amp; Strength</th>
                    <th className="py-2 px-3 text-center">Boxes Sold</th>
                    <th className="py-2 px-3 text-right">Net Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemBreakdown.slice(0, itemsPagination.visibleCount).map((item, idx) => (
                    <tr
                      key={`${item.name}-${idx}`}
                      className={`hover:bg-teal-50/50 transition ${
                        idx % 2 === 0 ? 'bg-white/80' : 'bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-normal">{idx + 1}.</span>
                        <span>{item.name}</span>
                        {item.strength && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {item.strength}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-teal-900">{item.totalBoxes} boxes</td>
                      <td className="py-2 px-3 text-right font-black text-slate-900">{formatCurrency(item.netSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ShowMoreButton
              totalCount={itemBreakdown.length}
              visibleCount={itemsPagination.visibleCount}
              onShowMore={itemsPagination.showMore}
              onShowLess={itemsPagination.showLess}
            />
          </div>
        )}
      </div>

      {/* 7. DETAILED ORDERS LIST (Paginated with Show More) */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Detailed Orders in Period
            </h3>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-teal-800 text-white">
              {filteredOrders.length}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Tap order to inspect lines</span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-slate-800">No orders in this period</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Try selecting another date range (e.g. This Month or All Time) or clearing the booker/pharmacy filter.
            </p>
          </div>
        ) : (
          <div>
            <div className="divide-y divide-slate-100">
              {filteredOrders.slice(0, ordersPagination.visibleCount).map((order) => {
                const totalBoxes = order.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

                return (
                  <div
                    key={order.id}
                    onClick={() => setActiveDetailOrder(order)}
                    className="p-3 hover:bg-teal-50/50 cursor-pointer transition flex items-center justify-between gap-2.5 active:scale-[0.99]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {order.orderNumber}
                        </span>
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {order.pharmacyName}
                        </span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          Booker: {order.receiverName || 'Unassigned'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>{order.date ? order.date.slice(0, 10) : ''}</span>
                        <span>•</span>
                        <span>{order.items.length} meds ({totalBoxes} bxs)</span>
                        {order.discountAmount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">
                              Disc: -{formatCurrency(order.discountAmount)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-1.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-tight">Net Amount</span>
                        <span className="font-black text-xs sm:text-sm text-teal-950">
                          {formatCurrency(order.grandTotal)}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                );
              })}
            </div>

            <ShowMoreButton
              totalCount={filteredOrders.length}
              visibleCount={ordersPagination.visibleCount}
              onShowMore={ordersPagination.showMore}
              onShowLess={ordersPagination.showLess}
            />
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {activeDetailOrder && (
        <OrderDetailModal
          order={activeDetailOrder}
          isOpen={Boolean(activeDetailOrder)}
          onClose={() => setActiveDetailOrder(null)}
          onEdit={() => {}}
          onDuplicate={() => {}}
          onDeleteRequest={() => {}}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
