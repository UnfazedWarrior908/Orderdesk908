import React from 'react';
import {
  X,
  FileDown,
  Share2,
  Copy,
  Edit,
  CopyPlus,
  Trash2,
  Store,
  UserCheck,
  Calendar,
  Pill,
} from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { downloadOrderPdf } from '../../services/pdfGenerator';
import { shareOrderViaWhatsApp, copyOrderToClipboard } from '../../services/shareService';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onDuplicate: (order: Order) => void;
  onDeleteRequest: (order: Order) => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onDeleteRequest,
  onNotify,
}) => {
  if (!isOpen || !order) return null;

  const totalBoxes = order.items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  const handleDownload = () => {
    try {
      downloadOrderPdf(order);
      onNotify('PDF order sheet downloaded.', 'success');
    } catch (err) {
      console.error(err);
      onNotify('Error downloading PDF.', 'error');
    }
  };

  const handleShare = async () => {
    try {
      const res = await shareOrderViaWhatsApp(order);
      if (res.success) {
        onNotify('Opened WhatsApp sharing!', 'success');
      }
    } catch (err) {
      console.error(err);
      onNotify('Failed to share via WhatsApp.', 'error');
    }
  };

  const handleCopy = async () => {
    const ok = await copyOrderToClipboard(order);
    if (ok) {
      onNotify('Order text copied to clipboard!', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 bg-teal-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm tracking-wider text-teal-200">
                {order.orderNumber}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-800 text-teal-100 uppercase border border-teal-700">
                {order.status}
              </span>
            </div>
            <h3 className="font-bold text-base mt-0.5">{order.pharmacyName}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-teal-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                <Store className="w-3 h-3 text-teal-700" /> Pharmacy
              </span>
              <p className="font-bold text-slate-800 truncate">{order.pharmacyName}</p>
              <p className="text-[11px] text-slate-500 truncate">{order.pharmacyArea || 'Counter Sales'}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                <UserCheck className="w-3 h-3 text-teal-700" /> Booked By
              </span>
              <p className="font-bold text-slate-800 truncate">{order.receiverName}</p>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <Calendar className="w-2.5 h-2.5" />
                <span>{formatDateTime(order.date)}</span>
              </div>
            </div>
          </div>

          {/* Medicines List Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Item ({order.items.length})</span>
              <div className="flex items-center gap-6">
                <span>Qty &amp; Rate</span>
                <span>Amount</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {order.items.map((item, idx) => {
                const gross = typeof item.grossAmount === 'number' ? item.grossAmount : item.quantity * item.rate;
                return (
                  <div key={item.id || idx} className="p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900">{item.name}</span>
                          {item.strength && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold">
                              {item.strength}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.quantity} box{item.quantity > 1 ? 'es' : ''} × Rs. {item.rate.toLocaleString()} = Rs. {gross.toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-sm text-teal-950">
                          {formatCurrency(item.amount)}
                        </div>
                        <span className="text-[10px] text-slate-400">Net Amount</span>
                      </div>
                    </div>

                    {/* Discount badge if applied */}
                    {item.discountAmount > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg w-fit">
                        <span>
                          {item.discountType === 'percent' ? `${item.discountValue}% off` : `Rs. ${item.discountValue} off`}
                        </span>
                        <span>•</span>
                        <span>Saved {formatCurrency(item.discountAmount)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (before discounts):</span>
              <span className="font-semibold text-slate-800">{formatCurrency(order.subtotal)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Total Discount:</span>
                <span className="font-bold">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-teal-200 flex justify-between items-baseline font-black text-sm text-teal-950">
              <span>Grand Total:</span>
              <span className="text-base text-teal-800">{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
              <span className="font-bold text-amber-900 block mb-0.5">Notes:</span>
              <p className="text-slate-700 leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              className="py-2.5 px-3 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleShare}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopy}
              className="flex-1 py-2 px-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
              title="Copy text summary"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDuplicate(order);
              }}
              className="flex-1 py-2 px-2 rounded-xl border border-slate-200 hover:bg-white text-teal-800 font-semibold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
              title="Clone items into a new order"
            >
              <CopyPlus className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(order);
              }}
              className="flex-1 py-2 px-2 rounded-xl border border-slate-200 hover:bg-white text-teal-800 font-semibold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDeleteRequest(order);
              }}
              className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition cursor-pointer"
              title="Delete Order"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
