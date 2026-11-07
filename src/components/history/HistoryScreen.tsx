import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Store,
  FileDown,
  Share2,
  CopyPlus,
  Trash2,
  Clock,
  TrendingUp,
  FileText,
  Plus,
  Filter,
  X,
} from 'lucide-react';
import { Order, Pharmacy } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { downloadOrderPdf } from '../../services/pdfGenerator';
import { shareOrderViaWhatsApp } from '../../services/shareService';
import { OrderDetailModal } from './OrderDetailModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { ShowMoreButton, useShowMore } from '../common/ShowMoreButton';

interface HistoryScreenProps {
  orders: Order[];
  pharmacies: Pharmacy[];
  onStartNewOrder: () => void;
  onEditOrder: (order: Order) => void;
  onDuplicateOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

type DateFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month';

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  orders,
  pharmacies,
  onStartNewOrder,
  onEditOrder,
  onDuplicateOrder,
  onDeleteOrder,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [selectedPharmacyFilter, setSelectedPharmacyFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // Modals state
  const [activeDetailOrder, setActiveDetailOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Daily & Monthly Summary KPIs
  const summaryKpis = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayCount = 0;
    let todayAmount = 0;
    let monthAmount = 0;

    orders.forEach((o) => {
      const orderDateObj = new Date(o.date);
      const orderDateStr = !isNaN(orderDateObj.getTime())
        ? orderDateObj.toISOString().slice(0, 10)
        : '';

      if (orderDateStr === todayStr) {
        todayCount++;
        todayAmount += o.grandTotal;
      }

      if (orderDateObj >= startOfMonth) {
        monthAmount += o.grandTotal;
      }
    });

    return {
      todayCount,
      todayAmount,
      monthAmount,
      totalOrders: orders.length,
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter((order) => {
      // 1. Pharmacy filter
      if (selectedPharmacyFilter !== 'all' && order.pharmacyId !== selectedPharmacyFilter) {
        return false;
      }

      // 2. Date filter
      const oDate = new Date(order.date);
      const oDateStr = !isNaN(oDate.getTime()) ? oDate.toISOString().slice(0, 10) : '';

      if (dateFilter === 'today' && oDateStr !== todayStr) return false;
      if (dateFilter === 'yesterday' && oDateStr !== yesterdayStr) return false;
      if (dateFilter === 'week' && oDate < sevenDaysAgo) return false;
      if (dateFilter === 'month' && oDate < startOfMonth) return false;

      // 3. Search query
      if (q) {
        const inNumber = order.orderNumber.toLowerCase().includes(q);
        const inPharmacy = order.pharmacyName.toLowerCase().includes(q);
        const inReceiver = order.receiverName.toLowerCase().includes(q);
        const inMedicines = order.items.some((i) =>
          `${i.name} ${i.strength}`.toLowerCase().includes(q)
        );
        if (!inNumber && !inPharmacy && !inReceiver && !inMedicines) {
          return false;
        }
      }

      return true;
    });
  }, [orders, search, selectedPharmacyFilter, dateFilter]);

  // "Show More" pagination for filtered orders
  const pagination = useShowMore(filteredOrders.length, 10, 10);

  const handleDownloadPdf = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    try {
      downloadOrderPdf(order);
      onNotify(`Downloaded ${order.orderNumber} PDF`, 'success');
    } catch (err) {
      console.error(err);
      onNotify('Failed to download PDF', 'error');
    }
  };

  const handleShare = async (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    try {
      const res = await shareOrderViaWhatsApp(order);
      if (res.success) {
        onNotify('Opened WhatsApp sharing!', 'success');
      }
    } catch (err) {
      console.error(err);
      onNotify('Could not share on WhatsApp', 'error');
    }
  };

  const handleDuplicate = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    onDuplicateOrder(order);
  };

  const handleDeleteConfirm = () => {
    if (orderToDelete) {
      onDeleteOrder(orderToDelete.id);
      onNotify(`Order ${orderToDelete.orderNumber} deleted`, 'info');
      setOrderToDelete(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-4 space-y-3.5">
      {/* 1. DAILY & MONTHLY TOTALS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* Today's KPI */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-800 to-teal-900 text-white shadow-xs">
          <div className="flex items-center justify-between text-teal-200">
            <span className="text-[10px] uppercase font-bold tracking-wider">Today&apos;s Orders</span>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 text-base sm:text-lg font-black tracking-tight">
            {formatCurrency(summaryKpis.todayAmount)}
          </div>
          <div className="text-[11px] text-teal-200 mt-0.5">
            {summaryKpis.todayCount} order{summaryKpis.todayCount !== 1 ? 's' : ''} booked
          </div>
        </div>

        {/* Month's KPI */}
        <div className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">This Month</span>
            <TrendingUp className="w-3.5 h-3.5 text-teal-700" />
          </div>
          <div className="mt-1 text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {formatCurrency(summaryKpis.monthAmount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total booked volume</div>
        </div>

        {/* All-time count */}
        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200 shadow-xs flex items-center justify-between sm:block">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Total Recorded
            </span>
            <div className="mt-0.5 text-base sm:text-lg font-black text-slate-900">
              {summaryKpis.totalOrders} <span className="text-xs font-normal text-slate-500">Orders</span>
            </div>
          </div>
          <button
            onClick={onStartNewOrder}
            className="sm:mt-2 px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order #, Pharmacy, or medicine name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Pharmacy Filter Dropdown */}
          <div className="shrink-0 w-36 sm:w-44">
            <select
              value={selectedPharmacyFilter}
              onChange={(e) => setSelectedPharmacyFilter(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-700 truncate"
            >
              <option value="all">All Pharmacies</option>
              {pharmacies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { id: 'all' as DateFilter, label: 'All Dates' },
            { id: 'today' as DateFilter, label: 'Today' },
            { id: 'yesterday' as DateFilter, label: 'Yesterday' },
            { id: 'week' as DateFilter, label: 'Past 7 Days' },
            { id: 'month' as DateFilter, label: 'This Month' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setDateFilter(pill.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                dateFilter === pill.id
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ORDER CARDS LIST */}
      <div className="space-y-2.5">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">No matching orders found</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {orders.length === 0
                  ? 'You have not saved any orders yet.'
                  : 'Try clearing your search query or adjusting the date filters.'}
              </p>
            </div>
            {orders.length === 0 && (
              <button
                onClick={onStartNewOrder}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create First Order
              </button>
            )}
          </div>
        ) : (
          <>
            {filteredOrders.slice(0, pagination.visibleCount).map((order) => {
              const totalBoxes = order.items.reduce(
                (acc, item) => acc + (Number(item.quantity) || 0),
                0
              );

            return (
              <div
                key={order.id}
                onClick={() => setActiveDetailOrder(order)}
                className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/90 hover:border-teal-500/50 hover:shadow-md transition p-3.5 space-y-2.5 cursor-pointer active:scale-[0.99]"
              >
                {/* Top Row: Order #, Status, and Date */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200/60">
                      {order.orderNumber}
                    </span>
                    <span className="text-slate-400 text-[11px]">•</span>
                    <span className="text-slate-500 text-[11px]">{formatDateTime(order.date)}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                    {order.status}
                  </span>
                </div>

                {/* Middle Row: Pharmacy & Receiver */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                      <span>{order.pharmacyName}</span>
                    </h3>
                    <p className="text-xs text-slate-500 pl-5">
                      Booked by: <span className="font-semibold text-slate-700">{order.receiverName}</span>
                    </p>
                  </div>

                  {/* Grand Total */}
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Grand Total</div>
                    <div className="text-base font-black text-teal-950">
                      {formatCurrency(order.grandTotal)}
                    </div>
                  </div>
                </div>

                {/* Items Preview & Quick Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="text-slate-500 text-[11px] truncate flex-1">
                    <span className="font-bold text-slate-700">{order.items.length} items</span> ({totalBoxes} boxes):{' '}
                    <span className="text-slate-400 italic">
                      {order.items.map((i) => i.name).slice(0, 3).join(', ')}
                      {order.items.length > 3 ? '...' : ''}
                    </span>
                  </div>

                  {/* Quick Action Icons */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleDownloadPdf(e, order)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-800 hover:bg-teal-50 transition cursor-pointer"
                      title="Download PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleShare(e, order)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                      title="Share via WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDuplicate(e, order)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-800 hover:bg-teal-50 transition cursor-pointer"
                      title="Duplicate order items"
                    >
                      <CopyPlus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrderToDelete(order);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <ShowMoreButton
            totalCount={filteredOrders.length}
            visibleCount={pagination.visibleCount}
            onShowMore={pagination.showMore}
            onShowLess={pagination.showLess}
          />
        </>
      )}
    </div>

      {/* Modals */}
      <OrderDetailModal
        order={activeDetailOrder}
        isOpen={Boolean(activeDetailOrder)}
        onClose={() => setActiveDetailOrder(null)}
        onEdit={(order) => {
          setActiveDetailOrder(null);
          onEditOrder(order);
        }}
        onDuplicate={(order) => {
          setActiveDetailOrder(null);
          onDuplicateOrder(order);
        }}
        onDeleteRequest={(order) => {
          setActiveDetailOrder(null);
          setOrderToDelete(order);
        }}
        onNotify={onNotify}
      />

      <ConfirmModal
        isOpen={Boolean(orderToDelete)}
        title="Delete Order?"
        message={`Are you sure you want to delete Order #${orderToDelete?.orderNumber} for ${orderToDelete?.pharmacyName}? This cannot be undone.`}
        confirmLabel="Yes, Delete Order"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setOrderToDelete(null)}
      />
    </div>
  );
};
