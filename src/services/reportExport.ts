import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Receiver, Pharmacy } from '../types';
import { StorageService } from './storage';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export interface ReportFilterState {
  dateRangePreset: 'today' | 'yesterday' | 'week' | 'month' | 'last-month' | 'custom';
  fromDate: string;
  toDate: string;
  selectedReceiverId: string; // 'all' or receiver id
  selectedPharmacyId: string; // 'all' or pharmacy id
}

export interface BookerSummary {
  receiverId: string;
  receiverName: string;
  orderCount: number;
  totalBoxes: number;
  grossSales: number;
  totalDiscount: number;
  netSales: number;
}

export interface PharmacySummary {
  pharmacyId: string;
  pharmacyName: string;
  orderCount: number;
  totalBoxes: number;
  netSales: number;
}

export interface ItemSummary {
  name: string;
  strength?: string;
  totalBoxes: number;
  netSales: number;
}

export interface ReportSummaryTotals {
  totalOrders: number;
  totalBoxes: number;
  grossSales: number;
  totalDiscount: number;
  netSales: number;
  avgOrderValue: number;
}

/**
 * Generates an offline professional PDF report
 */
export function generateReportPdf(
  totals: ReportSummaryTotals,
  bookerBreakdown: BookerSummary[],
  pharmacyBreakdown: PharmacySummary[],
  itemBreakdown: ItemSummary[],
  orders: Order[],
  filter: ReportFilterState,
  receivers: Receiver[],
  pharmacies: Pharmacy[]
): jsPDF {
  const profile = StorageService.getProfile();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  const tealPrimary = [15, 118, 110]; // #0f766e
  const slateDark = [15, 23, 42]; // #0f172a
  const slateMuted = [100, 116, 139]; // #64748b

  // 1. Header Banner
  doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.rect(margin, margin, pageWidth - margin * 2, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(profile.companyName || 'ORDER DESK PHARMA DISTRIBUTOR', margin + 6, margin + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(204, 251, 241);
  doc.text(profile.tagline || 'Authorized Wholesale Medicine Supply & Distribution', margin + 6, margin + 15);
  doc.text(`Helpline: ${profile.contactNumber || '+92 300 1234567'}`, margin + 6, margin + 19);

  // Right title in header banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('BOOKER & SALES REPORT', pageWidth - margin - 6, margin + 10, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setTextColor(204, 251, 241);
  doc.text('OFFICIAL DISTRIBUTION AUDIT', pageWidth - margin - 6, margin + 16, { align: 'right' });

  // 2. Filters & Range Meta Bar
  const bookerLabel =
    filter.selectedReceiverId === 'all'
      ? 'All Bookers'
      : receivers.find((r) => r.id === filter.selectedReceiverId)?.name || 'Selected Booker';
  const pharmaLabel =
    filter.selectedPharmacyId === 'all'
      ? 'All Pharmacies'
      : pharmacies.find((p) => p.id === filter.selectedPharmacyId)?.name || 'Selected Pharmacy';

  const metaTop = margin + 26;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, metaTop, pageWidth - margin * 2, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Period: ${filter.fromDate} to ${filter.toDate}`, margin + 5, metaTop + 6);
  doc.text(`Booker Filter: ${bookerLabel}`, margin + 5, metaTop + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Pharmacy: ${pharmaLabel}`, pageWidth - margin - 5, metaTop + 6, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin - 5, metaTop + 11.5, { align: 'right' });

  // 3. Summary KPI Cards
  const kpiTop = metaTop + 20;
  const kpiColW = (pageWidth - margin * 2 - 10) / 3;

  const kpis = [
    { label: 'TOTAL ORDERS', val: `${totals.totalOrders} Orders`, sub: `${totals.totalBoxes} Boxes` },
    { label: 'GROSS BOOKING', val: formatCurrency(totals.grossSales), sub: `Disc: -${formatCurrency(totals.totalDiscount)}` },
    { label: 'NET PAYABLE SALES', val: formatCurrency(totals.netSales), sub: `Avg Order: ${formatCurrency(totals.avgOrderValue)}` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (kpiColW + 5);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, kpiTop, kpiColW, 17, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
    doc.text(kpi.label, x + 4, kpiTop + 5);

    doc.setFontSize(10);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(kpi.val, x + 4, kpiTop + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(kpi.sub, x + 4, kpiTop + 14.5);
  });

  let currentY = kpiTop + 22;

  // 4. Booker-Wise Breakdown Table
  if (bookerBreakdown.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
    doc.text('1. BOOKER-WISE SALES BREAKDOWN', margin, currentY);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: margin, right: margin },
      head: [['Booker (Receiver)', 'Orders', 'Boxes', 'Gross Sales', 'Discount', 'Net Amount']],
      body: bookerBreakdown.map((b) => [
        b.receiverName,
        b.orderCount,
        b.totalBoxes,
        formatCurrency(b.grossSales),
        b.totalDiscount > 0 ? `-${formatCurrency(b.totalDiscount)}` : '-',
        formatCurrency(b.netSales),
      ]),
      headStyles: {
        fillColor: [15, 118, 110],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // 5. Pharmacy Breakdown Table
  if (pharmacyBreakdown.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
    doc.text('2. PHARMACY REVENUE BREAKDOWN', margin, currentY);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: margin, right: margin },
      head: [['Pharmacy Name', 'Orders', 'Boxes', 'Net Amount']],
      body: pharmacyBreakdown.slice(0, 15).map((p) => [
        p.pharmacyName,
        p.orderCount,
        p.totalBoxes,
        formatCurrency(p.netSales),
      ]),
      headStyles: {
        fillColor: [17, 94, 89],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right', fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // 6. Top Sold Medicines
  if (itemBreakdown.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
    doc.text('3. TOP SOLD MEDICINES IN PERIOD', margin, currentY);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: margin, right: margin },
      head: [['Medicine & Strength', 'Boxes Sold', 'Net Amount']],
      body: itemBreakdown.slice(0, 10).map((i) => [
        `${i.name} ${i.strength || ''}`,
        i.totalBoxes,
        formatCurrency(i.netSales),
      ]),
      headStyles: {
        fillColor: [15, 118, 110],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right', fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      `Order Desk Pharma — Confidential Booking Audit Sheet | Page ${i} of ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  return doc;
}

/**
 * Downloads report as PDF file
 */
export function downloadReportPdf(
  totals: ReportSummaryTotals,
  bookerBreakdown: BookerSummary[],
  pharmacyBreakdown: PharmacySummary[],
  itemBreakdown: ItemSummary[],
  orders: Order[],
  filter: ReportFilterState,
  receivers: Receiver[],
  pharmacies: Pharmacy[]
) {
  const doc = generateReportPdf(
    totals,
    bookerBreakdown,
    pharmacyBreakdown,
    itemBreakdown,
    orders,
    filter,
    receivers,
    pharmacies
  );
  const filename = `OrderDesk_Report_${filter.fromDate}_to_${filter.toDate}.pdf`;
  doc.save(filename);
}

/**
 * Exports report data as CSV file
 */
export function downloadReportCsv(
  totals: ReportSummaryTotals,
  bookerBreakdown: BookerSummary[],
  orders: Order[],
  filter: ReportFilterState
) {
  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows: string[] = [];

  // Metadata
  rows.push(['ORDER DESK PHARMA - SALES & BOOKER REPORT'].join(','));
  rows.push([`Period: ${filter.fromDate} to ${filter.toDate}`].join(','));
  rows.push([`Generated: ${new Date().toISOString()}`].join(','));
  rows.push('');

  // Summary KPI
  rows.push(['SUMMARY TOTALS'].join(','));
  rows.push(['Metric', 'Value'].map(escapeCsv).join(','));
  rows.push(['Total Orders', totals.totalOrders].map(escapeCsv).join(','));
  rows.push(['Total Boxes', totals.totalBoxes].map(escapeCsv).join(','));
  rows.push(['Gross Sales', totals.grossSales].map(escapeCsv).join(','));
  rows.push(['Total Discount', totals.totalDiscount].map(escapeCsv).join(','));
  rows.push(['Net Sales', totals.netSales].map(escapeCsv).join(','));
  rows.push(['Average Order Value', totals.avgOrderValue.toFixed(2)].map(escapeCsv).join(','));
  rows.push('');

  // Booker breakdown
  rows.push(['BOOKER BREAKDOWN'].join(','));
  rows.push(['Booker Name', 'Orders', 'Boxes', 'Gross Sales', 'Discount', 'Net Amount'].map(escapeCsv).join(','));
  bookerBreakdown.forEach((b) => {
    rows.push([
      escapeCsv(b.receiverName),
      escapeCsv(b.orderCount),
      escapeCsv(b.totalBoxes),
      escapeCsv(b.grossSales),
      escapeCsv(b.totalDiscount),
      escapeCsv(b.netSales),
    ].join(','));
  });
  rows.push('');

  // Detailed orders list
  rows.push(['DETAILED ORDERS'].join(','));
  rows.push(['Order Number', 'Date', 'Pharmacy', 'Booker', 'Boxes', 'Gross Amount', 'Discount Amount', 'Net Amount', 'Status'].map(escapeCsv).join(','));
  orders.forEach((o) => {
    const boxes = o.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    rows.push([
      escapeCsv(o.orderNumber),
      escapeCsv(o.date.slice(0, 10)),
      escapeCsv(o.pharmacyName),
      escapeCsv(o.receiverName || 'Unassigned'),
      escapeCsv(boxes),
      escapeCsv(o.subtotal || o.grandTotal),
      escapeCsv(o.discountAmount || 0),
      escapeCsv(o.grandTotal),
      escapeCsv(o.status),
    ].join(','));
  });

  const csvContent = rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `OrderDesk_Report_${filter.fromDate}_to_${filter.toDate}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Creates WhatsApp summary text for reports
 */
export function formatReportWhatsAppSummary(
  totals: ReportSummaryTotals,
  bookerBreakdown: BookerSummary[],
  filter: ReportFilterState
): string {
  const profile = StorageService.getProfile();
  let text = `📊 *${profile.companyName || 'ORDER DESK'} - SALES REPORT*\n`;
  text += `📅 Period: ${filter.fromDate} to ${filter.toDate}\n\n`;

  text += `*SUMMARY TOTALS*\n`;
  text += `• Total Orders: ${totals.totalOrders}\n`;
  text += `• Total Boxes: ${totals.totalBoxes}\n`;
  text += `• Gross Sales: ${formatCurrency(totals.grossSales)}\n`;
  if (totals.totalDiscount > 0) {
    text += `• Total Discount: -${formatCurrency(totals.totalDiscount)}\n`;
  }
  text += `• *Net Sales: ${formatCurrency(totals.netSales)}*\n`;
  text += `• Avg Order Value: ${formatCurrency(totals.avgOrderValue)}\n\n`;

  if (bookerBreakdown.length > 0) {
    text += `*BOOKER BREAKDOWN*\n`;
    bookerBreakdown.forEach((b, i) => {
      text += `${i + 1}. *${b.receiverName}*: ${b.orderCount} orders, ${b.totalBoxes} bxs → *${formatCurrency(b.netSales)}*\n`;
    });
  }

  text += `\n_Generated offline via Order Desk PWA_`;
  return text;
}
