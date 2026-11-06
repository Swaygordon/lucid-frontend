import LucidLogo from '../../assets/brand/Lucid.webp';

const amountLabel = (amount, currency = 'GHS') => `${currency} ${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pretty = value => String(value || 'Unknown').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const dateLabel = value => value ? new Date(value).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' }) : 'Date unavailable';

async function loadReceiptLogo() {
  const image = new Image();
  image.src = LucidLogo;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext('2d').drawImage(image, 0, 0);
  return { data: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
}

// Shared A4 receipt output for Admin records and role-specific case pages.
export async function buildReceiptPdf(item) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const left = 16;
  const right = 194;
  const record = item.caseRecord || {};
  const currency = item.currency || 'GHS';
  const logo = await loadReceiptLogo();
  const write = (text, x, y, maxWidth = right - left) => {
    const lines = doc.splitTextToSize(String(text ?? ''), maxWidth);
    doc.text(lines, x, y);
    return y + Math.max(lines.length, 1) * 5;
  };
  const rule = y => { doc.setDrawColor(224, 229, 236); doc.line(left, y, right, y); };
  const logoWidth = Math.min(48, 13 * logo.width / logo.height);
  const logoHeight = logoWidth * logo.height / logo.width;
  doc.addImage(logo.data, 'PNG', left, 12, logoWidth, logoHeight);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(90, 101, 119); doc.text('SERVICE PAYMENT RECEIPT', left, 29);
  doc.text(dateLabel(item.issuedAt), right, 22, { align: 'right' });
  rule(35);
  doc.setFontSize(9); doc.setTextColor(90, 101, 119); doc.text('TOTAL PAID', left + 5, 45);
  doc.setFillColor(245, 248, 252); doc.roundedRect(left, 39, right - left, 28, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(16, 24, 40); doc.text(amountLabel(item.totalAmount, currency), left + 5, 56);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 101, 119); doc.text(`Paid by ${item.client || 'Client'}`, right - 5, 56, { align: 'right' });
  doc.setFontSize(9); doc.setTextColor(16, 24, 40);
  let y = 78;
  const details = [
    ['Receipt reference', item.paymentReference || item.id], ['Case', item.caseId],
    ['Payment status', pretty(record.paymentStatus || 'issued')], ['Service', record.service || 'Service request'],
    ['Category', record.category || 'Unavailable'], ['Client', item.client || 'Client'],
    ['Provider', item.provider || 'Provider'],
  ];
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(90, 101, 119); doc.text(`${label}:`, left, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(16, 24, 40);
    const lineHeight = write(value || 'Unavailable', left + 42, y, right - left - 42);
    y = Math.max(y + 7, lineHeight + 1);
  });
  y += 3; rule(y); y += 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(16, 24, 40); doc.text('Payment breakdown', left, y); y += 7;
  [['Provider work', item.providerAmount], ['Inspector service', item.inspectorAmount], ['LUCID platform charge', item.platformAmount]].forEach(([label, amount]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(52, 64, 84); doc.text(label, left, y);
    doc.text(amountLabel(amount, currency), right, y, { align: 'right' }); rule(y + 3); y += 10;
  });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(16, 24, 40); doc.text('Total paid', left, y); doc.text(amountLabel(item.totalAmount, currency), right, y, { align: 'right' });
  y += 16;
  doc.setFillColor(248, 250, 252); doc.roundedRect(left, y, right - left, 33, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(52, 64, 84); doc.text('CASE DETAILS', left + 5, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 101, 119);
  write(`Inspector: ${record.inspectorAssignment?.inspectorName || 'Not listed'}`, left + 5, y + 14, right - left - 10);
  write(`Payment reference: ${item.paymentReference || item.id}`, left + 5, y + 21, right - left - 10);
  doc.setDrawColor(224, 229, 236); doc.line(left, 278, right, 278);
  doc.setFontSize(8); doc.setTextColor(120, 130, 145); doc.text('LUCID service marketplace | Keep this receipt for your records', pageWidth / 2, 285, { align: 'center' });
  return doc;
}
