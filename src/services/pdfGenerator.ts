import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';
import { StorageService } from './storage';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export function createOrderPdf(order: Order): jsPDF {
  const profile = StorageService.getProfile();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Colors
  const tealPrimary = [15, 118, 110]; // #0f766e
  const tealDark = [17, 94, 89]; // #115e59
  const slateDark = [15, 23, 42]; // #0f172a
  const slateMuted = [100, 116, 139]; // #64748b
  const slateBorder = [226, 232, 240]; // #e2e8f0

  // 1. Top Header Banner
  doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.rect(margin, margin, pageWidth - margin * 2, 24, 'F');

  // White Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(profile.companyName || 'ORDER DESK PHARMA DISTRIBUTOR', margin + 6, margin + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(204, 251, 241); // teal-100
  doc.text(profile.tagline || 'Authorized Wholesale Medicine Supply & Distribution', margin + 6, margin + 16);
  doc.text(`Helpline: ${profile.contactNumber || '+92 300 1234567'}`, margin + 6, margin + 20.5);

  // Memo Label on right of banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('ORDER MEMO / INVOICE', pageWidth - margin - 6, margin + 11, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(204, 251, 241);
  doc.text('OFFICIAL BOOKING COPY', pageWidth - margin - 6, margin + 17, { align: 'right' });

  // 2. Info Cards (Pharmacy & Order Metadata)
  const infoTop = margin + 28;
  const colWidth = (pageWidth - margin * 2 - 4) / 2;

  // Left card: Pharmacy details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, infoTop, colWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
  doc.text('PHARMACY (DELIVER TO):', margin + 4, infoTop + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(order.pharmacyName, margin + 4, infoTop + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  const areaText = order.pharmacyArea || 'Registered Pharmacy Counter';
  doc.text(doc.splitTextToSize(areaText, colWidth - 8), margin + 4, infoTop + 19);

  // Right card: Order metadata
  const rightX = margin + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, infoTop, colWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
  doc.text('ORDER DETAILS:', rightX + 4, infoTop + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  
  doc.text('Order Number:', rightX + 4, infoTop + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
  doc.text(order.orderNumber, rightX + 32, infoTop + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Date & Time:', rightX + 4, infoTop + 18);
  doc.text(formatDateTime(order.date), rightX + 32, infoTop + 18);

  doc.text('Booked By:', rightX + 4, infoTop + 24);
  doc.setFont('helvetica', 'bold');
  doc.text(order.receiverName || 'Order Booking Desk', rightX + 32, infoTop + 24);

  // 3. Medicines Items Table
  const tableData = order.items.map((item, index) => {
    let discountStr = '-';
    if (item.discountAmount > 0) {
      if (item.discountType === 'percent') {
        discountStr = `${item.discountValue}%`;
      } else {
        discountStr = `Rs. ${item.discountValue}`;
      }
    }

    return [
      String(index + 1),
      `${item.name} ${item.strength ? `(${item.strength})` : ''}`,
      `Rs. ${item.rate.toLocaleString()}`,
      `${item.quantity} box${item.quantity > 1 ? 'es' : ''}`,
      discountStr,
      `Rs. ${item.amount.toLocaleString()}`,
    ];
  });

  autoTable(doc, {
    startY: infoTop + 36,
    head: [['#', 'Medicine Name & Strength', 'Rate / Box', 'Quantity', 'Discount', 'Amount (PKR)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 3,
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 8,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 26 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 32, fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  // Calculate position after table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : 140;

  // 4. Totals & Notes Section
  const summaryBoxWidth = 84;
  const summaryX = pageWidth - margin - summaryBoxWidth;

  // Optional Notes on left
  if (order.notes) {
    const notesWidth = summaryX - margin - 6;
    doc.setFillColor(254, 252, 232); // soft yellow
    doc.setDrawColor(254, 240, 138);
    doc.roundedRect(margin, finalY, notesWidth, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(161, 98, 7);
    doc.text('DELIVERY INSTRUCTIONS / NOTES:', margin + 4, finalY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(order.notes, notesWidth - 8);
    doc.text(splitNotes, margin + 4, finalY + 11);
  }

  // Summary Box on right
  const hasDiscount = order.discountAmount > 0;
  const summaryBoxHeight = hasDiscount ? 34 : 26;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.roundedRect(summaryX, finalY, summaryBoxWidth, summaryBoxHeight, 2, 2, 'FD');

  let curY = finalY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Subtotal (Gross):', summaryX + 4, curY);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(formatCurrency(order.subtotal), summaryX + summaryBoxWidth - 4, curY, { align: 'right' });

  if (hasDiscount) {
    curY += 6;
    doc.setTextColor(220, 38, 38); // red discount
    doc.text('Total Discount:', summaryX + 4, curY);
    doc.text(`- ${formatCurrency(order.discountAmount)}`, summaryX + summaryBoxWidth - 4, curY, { align: 'right' });
  }

  // Grand Total highlight bar
  curY += 7;
  doc.setFillColor(15, 118, 110);
  doc.rect(summaryX, curY - 4.5, summaryBoxWidth, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', summaryX + 4, curY + 2);
  doc.setFontSize(10.5);
  doc.text(formatCurrency(order.grandTotal), summaryX + summaryBoxWidth - 4, curY + 2, { align: 'right' });

  // Total boxes & items note
  const totalBoxes = order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    `Total: ${order.items.length} item line${order.items.length > 1 ? 's' : ''} (${totalBoxes} boxes)`,
    summaryX + 4,
    curY + 11
  );

  // 5. Signatures Footer
  const signY = Math.min(pageHeight - 24, Math.max(finalY + 36, 235));

  doc.setDrawColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setLineWidth(0.4);

  // Left signature: Booking Officer
  const signColWidth = 64;
  doc.line(margin + 6, signY, margin + 6 + signColWidth, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Prepared By (Distributor Rep):', margin + 6, signY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(order.receiverName || 'Muhammad Ali', margin + 6, signY + 8);

  // Right signature: Pharmacy
  const signRightX = pageWidth - margin - signColWidth - 6;
  doc.line(signRightX, signY, signRightX + signColWidth, signY);
  doc.setFont('helvetica', 'bold');
  doc.text('Received & Verified By (Pharmacy):', signRightX, signY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text('Stamp & Signature with Date', signRightX, signY + 8);

  // 6. Absolute Bottom Bar
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'Generated offline by Order Desk PWA — All medicines subject to standard distributor return & storage terms.',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  return doc;
}

export function downloadOrderPdf(order: Order): void {
  const doc = createOrderPdf(order);
  const cleanName = (order.pharmacyName || 'Pharmacy').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${order.orderNumber}_${cleanName}.pdf`;
  doc.save(filename);
}

export function getOrderPdfBlob(order: Order): Blob {
  const doc = createOrderPdf(order);
  return doc.output('blob');
}
