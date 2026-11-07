import { Order } from '../types';
import { getOrderPdfBlob } from './pdfGenerator';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export function formatWhatsAppSummary(order: Order): string {
  const totalBoxes = order.items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  
  let text = `*ORDER DESK — Medicine Distribution*\n`;
  text += `═══════════════════════\n`;
  text += `📋 *Order #:* ${order.orderNumber}\n`;
  text += `📅 *Date:* ${formatDateTime(order.date)}\n`;
  text += `🏥 *Pharmacy:* ${order.pharmacyName}\n`;
  if (order.pharmacyArea) {
    text += `📍 *Location:* ${order.pharmacyArea}\n`;
  }
  text += `👤 *Booked By:* ${order.receiverName || 'Order Desk'}\n`;
  text += `═══════════════════════\n`;
  text += `*ITEMS ORDERED (${order.items.length}):*\n\n`;

  order.items.forEach((item, idx) => {
    const strengthStr = item.strength ? ` (${item.strength})` : '';
    text += `${idx + 1}. *${item.name}*${strengthStr}\n`;
    text += `   ${item.quantity} box${item.quantity > 1 ? 'es' : ''} × Rs. ${item.rate.toLocaleString()} = Rs. ${(item.grossAmount || item.quantity * item.rate).toLocaleString()}`;
    if (item.discountAmount > 0) {
      const discTag = item.discountType === 'percent' ? `${item.discountValue}%` : `Rs. ${item.discountValue}`;
      text += `\n   Discount: ${discTag} (Saved Rs. ${item.discountAmount.toLocaleString()}) → *Net: Rs. ${item.amount.toLocaleString()}*`;
    } else {
      text += ` → *Net: Rs. ${item.amount.toLocaleString()}*`;
    }
    text += `\n\n`;
  });

  text += `═══════════════════════\n`;
  text += `Subtotal (Gross): ${formatCurrency(order.subtotal)}\n`;
  if (order.discountAmount > 0) {
    text += `Total Discount: -${formatCurrency(order.discountAmount)}\n`;
  }
  text += `*GRAND TOTAL: ${formatCurrency(order.grandTotal)}*\n`;
  text += `📦 Total Boxes: ${totalBoxes}\n`;

  if (order.notes) {
    text += `\n📝 *Notes:* ${order.notes}\n`;
  }
  text += `═══════════════════════\n`;
  text += `_Thank you for ordering with Order Desk_`;

  return text;
}

export async function shareOrderViaWhatsApp(order: Order): Promise<{ success: boolean; method: 'web-share-file' | 'whatsapp-link' | 'fallback' }> {
  const summaryText = formatWhatsAppSummary(order);
  const cleanName = (order.pharmacyName || 'Pharmacy').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${order.orderNumber}_${cleanName}.pdf`;

  // 1. Try Web Share API with PDF file (supported in modern mobile browsers like Chrome on Android)
  if (typeof navigator !== 'undefined' && 'canShare' in navigator && 'share' in navigator) {
    try {
      const pdfBlob = getOrderPdfBlob(order);
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      if (navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `Order ${order.orderNumber} - ${order.pharmacyName}`,
          text: summaryText,
          files: [pdfFile],
        });
        return { success: true, method: 'web-share-file' };
      }
    } catch (err: unknown) {
      // User aborted share or browser failed, fallback to direct WhatsApp URL
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, method: 'fallback' };
      }
      console.warn('Web Share API file share failed, falling back to WhatsApp text link:', err);
    }
  }

  // 2. Fallback: Open WhatsApp text link via https://api.whatsapp.com/send
  try {
    const encoded = encodeURIComponent(summaryText);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    return { success: true, method: 'whatsapp-link' };
  } catch (err) {
    console.error('Failed to open WhatsApp URL:', err);
    return { success: false, method: 'fallback' };
  }
}

export async function copyOrderToClipboard(order: Order): Promise<boolean> {
  try {
    const text = formatWhatsAppSummary(order);
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
