import React from 'react';
import { CheckCircle2, FileDown, Share2, Plus, Clock, Copy, X } from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { downloadOrderPdf } from '../../services/pdfGenerator';
import { shareOrderViaWhatsApp, copyOrderToClipboard } from '../../services/shareService';

interface OrderSavedModalProps {
  order: Order | null;
  isOpen: boolean;
  onStartNewOrder: () => void;
  onViewHistory: () => void;
  onClose: () => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const OrderSavedModal: React.FC<OrderSavedModalProps> = ({
  order,
  isOpen,
  onStartNewOrder,
  onViewHistory,
  onClose,
  onNotify,
}) => {
  if (!isOpen || !order) return null;

  const handleDownloadPdf = () => {
    try {
      downloadOrderPdf(order);
      onNotify('PDF order sheet downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      onNotify('Failed to generate PDF.', 'error');
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      const res = await shareOrderViaWhatsApp(order);
      if (res.success) {
        onNotify('Opened WhatsApp sharing!', 'success');
      }
    } catch (err) {
      console.error(err);
      onNotify('Could not trigger WhatsApp share.', 'error');
    }
  };

  const handleCopySummary = async () => {
    const ok = await copyOrderToClipboard(order);
    if (ok) {
      onNotify('Order text copied to clipboard!', 'success');
    } else {
      onNotify('Could not copy to clipboard.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden border border-teal-100 flex flex-col">
        {/* Top Celebration Header */}
        <div className="bg-gradient-to-b from-teal-800 to-teal-900 text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 text-teal-200 hover:text-white p-1 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg text-emerald-300">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h3 className="text-lg font-bold">Order Saved!</h3>
          <p className="text-teal-200 text-xs mt-0.5">Recorded to local browser storage</p>

          <div className="mt-3.5 inline-flex items-center px-3 py-1 rounded-full bg-teal-950/60 border border-teal-700/60 text-xs font-mono font-bold tracking-wider text-teal-100">
            {order.orderNumber}
          </div>
        </div>

        {/* Order Quick Summary Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Pharmacy</span>
            <span className="font-bold text-slate-800">{order.pharmacyName}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Booked By</span>
            <span className="font-medium text-slate-700">{order.receiverName}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Total Items</span>
            <span className="font-semibold text-slate-700">
              {order.items.length} items (
              {order.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)} boxes)
            </span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 text-emerald-700">
              <span>Total Discount</span>
              <span className="font-bold">-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm pt-2 font-bold text-teal-900">
            <span>Grand Total</span>
            <span className="text-base text-teal-800">{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadPdf}
              className="py-2.5 px-3 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          <button
            onClick={handleCopySummary}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Copy Text Summary</span>
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={onViewHistory}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>View History</span>
            </button>
            <button
              onClick={onStartNewOrder}
              className="flex-1 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Next Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
