/**
 * Unified file & CSV export utility for the Admin dashboard.
 * Encapsulates UTF-8 BOM encoding, field escaping, DOM link trigger, and ObjectURL cleanup.
 */

export function downloadBlobFile(blob, filename) {
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}

export function downloadCsvFile(filename, headers, rows) {
  if (!rows || rows.length === 0) {
    return false;
  }

  const escapeField = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(escapeField).join(",");
  const dataRows = rows.map((row) => row.map(escapeField).join(","));
  const csvContent = [headerRow, ...dataRows].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const safeFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  return downloadBlobFile(blob, safeFilename);
}

export default downloadCsvFile;
