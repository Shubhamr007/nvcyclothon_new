const ExcelJS = require("exceljs");

/**
 * Generates an official multi-sheet Excel (.xlsx) audit workbook for CA & Board presentation.
 */
async function generateFinanceAuditWorkbook(financeSummary) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rewa District Cycling Association";
  workbook.lastModifiedBy = "NV Cyclothon Finance Controller";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Style helpers
  const navyFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };
  const emeraldFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECFDF5" },
  };
  const greyFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8FAFC" },
  };
  const whiteBoldFont = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  const darkBoldFont = { name: "Arial", size: 11, bold: true, color: { argb: "FF0F172A" } };
  const borderThin = {
    top: { style: "thin", color: { argb: "FFE2E8F0" } },
    left: { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    right: { style: "thin", color: { argb: "FFE2E8F0" } },
  };

  // ==========================================
  // SHEET 1: EXECUTIVE AUDIT STATEMENT (P&L)
  // ==========================================
  const sheetSummary = workbook.addWorksheet("Audit Statement", {
    views: [{ showGridLines: true }],
  });

  sheetSummary.columns = [
    { key: "col1", width: 38 },
    { key: "col2", width: 22 },
    { key: "col3", width: 22 },
  ];

  // Header Banner
  sheetSummary.mergeCells("A1:C1");
  const titleCell = sheetSummary.getCell("A1");
  titleCell.value = "REWA DISTRICT CYCLING ASSOCIATION (RDCA)";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = navyFill;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheetSummary.getRow(1).height = 28;

  sheetSummary.mergeCells("A2:C2");
  const subCell = sheetSummary.getCell("A2");
  subCell.value = "3RD EDITION NV CYCLOTHON 2026 — STATEMENT OF INCOME & EXPENDITURE";
  subCell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF334155" } };
  subCell.alignment = { horizontal: "center" };
  sheetSummary.getRow(2).height = 22;

  sheetSummary.addRow([]);
  sheetSummary.addRow(["Reference: NVC/AUDIT/2026-01", "", `Date Generated: ${new Date().toLocaleDateString("en-IN")}`]);
  sheetSummary.addRow(["Auditing Standard: Event P&L Ledger", "", "Currency: INR (₹)"]);
  sheetSummary.addRow([]);

  // Section 1: Income
  const incHeader = sheetSummary.addRow(["PARTICULARS (INCOME SCHEDULE A)", "AMOUNT (₹)", "% OF TOTAL"]);
  incHeader.font = whiteBoldFont;
  incHeader.eachCell((c) => {
    c.fill = navyFill;
    c.border = borderThin;
  });

  const grossRev = financeSummary.grossRevenue || 1;
  const incRows = [
    ["1. Participant Ticket Registrations (Paid)", financeSummary.regRevenue, `${Math.round((financeSummary.regRevenue / grossRev) * 100)}%`],
    ["2. Corporate & Club Delegations", financeSummary.delegationRevenue, `${Math.round((financeSummary.delegationRevenue / grossRev) * 100)}%`],
    ["3. Brand Partnerships & Sponsorships", financeSummary.sponsorRevenue, `${Math.round((financeSummary.sponsorRevenue / grossRev) * 100)}%`],
    ["4. Expo & Vendor Booth Registrations", financeSummary.vendorRevenue, `${Math.round((financeSummary.vendorRevenue / grossRev) * 100)}%`],
  ];

  incRows.forEach((r) => {
    const row = sheetSummary.addRow(r);
    row.getCell(2).numFmt = "₹#,##,##0";
    row.eachCell((c) => { c.border = borderThin; });
  });

  const totalIncRow = sheetSummary.addRow(["TOTAL GROSS INFLOWS (A)", financeSummary.grossRevenue, "100%"]);
  totalIncRow.font = darkBoldFont;
  totalIncRow.getCell(2).numFmt = "₹#,##,##0";
  totalIncRow.eachCell((c) => {
    c.fill = emeraldFill;
    c.border = borderThin;
  });

  sheetSummary.addRow([]);

  // Section 2: Expenditure
  const expHeader = sheetSummary.addRow(["PARTICULARS (EXPENDITURE SCHEDULE B)", "AMOUNT (₹)", "% OF TOTAL"]);
  expHeader.font = whiteBoldFont;
  expHeader.eachCell((c) => {
    c.fill = navyFill;
    c.border = borderThin;
  });

  const grossExp = financeSummary.grossExpenses || 1;
  (financeSummary.expense_categories || []).forEach((cat) => {
    const catAmount = financeSummary.categoryExpenses[cat.id] || 0;
    const row = sheetSummary.addRow([
      cat.title,
      catAmount,
      `${Math.round((catAmount / grossExp) * 100)}%`,
    ]);
    row.getCell(2).numFmt = "₹#,##,##0";
    row.eachCell((c) => { c.border = borderThin; });
  });

  const totalExpRow = sheetSummary.addRow(["TOTAL GROSS DISBURSEMENTS (B)", financeSummary.grossExpenses, "100%"]);
  totalExpRow.font = darkBoldFont;
  totalExpRow.getCell(2).numFmt = "₹#,##,##0";
  totalExpRow.eachCell((c) => {
    c.fill = greyFill;
    c.border = borderThin;
  });

  sheetSummary.addRow([]);

  // Section 3: Net Surplus
  const netRow = sheetSummary.addRow([
    financeSummary.netProfit >= 0 ? "NET OPERATING SURPLUS (A - B)" : "NET OPERATING DEFICIT (A - B)",
    financeSummary.netProfit,
    `${financeSummary.profitMargin}% Margin`,
  ]);
  netRow.font = { name: "Arial", size: 12, bold: true, color: { argb: financeSummary.netProfit >= 0 ? "FF047857" : "FFB91C1C" } };
  netRow.getCell(2).numFmt = "₹#,##,##0";
  netRow.eachCell((c) => {
    c.fill = financeSummary.netProfit >= 0 ? emeraldFill : { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
    c.border = borderThin;
  });

  sheetSummary.addRow([]);
  sheetSummary.addRow([]);

  // Signoff Block for Board & CA
  const signRow1 = sheetSummary.addRow(["____________________________", "____________________________", "____________________________"]);
  signRow1.alignment = { horizontal: "center" };
  const signRow2 = sheetSummary.addRow(["Treasurer / Finance Officer", "Race Director / President", "Statutory Auditor / CA"]);
  signRow2.font = darkBoldFont;
  signRow2.alignment = { horizontal: "center" };

  // ==========================================
  // SHEET 2: DETAILED EXPENSES (SCHEDULE B)
  // ==========================================
  const sheetExp = workbook.addWorksheet("Schedule B - Expenses", {
    views: [{ showGridLines: true }],
  });

  sheetExp.columns = [
    { header: "Expense Category", key: "cat", width: 28 },
    { header: "Line Item Description", key: "item", width: 42 },
    { header: "Amount (₹)", key: "amount", width: 18 },
  ];

  const headerRowExp = sheetExp.getRow(1);
  headerRowExp.font = whiteBoldFont;
  headerRowExp.eachCell((c) => { c.fill = navyFill; });

  (financeSummary.expense_categories || []).forEach((cat) => {
    (cat.items || []).forEach((item) => {
      const row = sheetExp.addRow({
        cat: cat.title,
        item: item.label,
        amount: Number(item.amount) || 0,
      });
      row.getCell("amount").numFmt = "₹#,##,##0";
      row.eachCell((c) => { c.border = borderThin; });
    });
  });

  // ==========================================
  // SHEET 3: SPONSORSHIPS & REVENUE (SCHEDULE A)
  // ==========================================
  const sheetRev = workbook.addWorksheet("Schedule A - Revenues", {
    views: [{ showGridLines: true }],
  });

  sheetRev.columns = [
    { header: "Channel", key: "channel", width: 24 },
    { header: "Partner / Source Name", key: "name", width: 38 },
    { header: "Committed Amount (₹)", key: "amount", width: 22 },
    { header: "Status", key: "status", width: 16 },
  ];

  const headerRowRev = sheetRev.getRow(1);
  headerRowRev.font = whiteBoldFont;
  headerRowRev.eachCell((c) => { c.fill = navyFill; });

  (financeSummary.sponsorships || []).forEach((sp) => {
    const row = sheetRev.addRow({
      channel: "Sponsorship",
      name: sp.name,
      amount: Number(sp.amount) || 0,
      status: sp.confirmed ? "CONFIRMED" : "TENTATIVE",
    });
    row.getCell("amount").numFmt = "₹#,##,##0";
    row.eachCell((c) => { c.border = borderThin; });
  });

  (financeSummary.vendors || []).forEach((vn) => {
    const row = sheetRev.addRow({
      channel: "Vendor Expo",
      name: vn.name,
      amount: Number(vn.amount) || 0,
      status: vn.confirmed ? "CONFIRMED" : "PENDING",
    });
    row.getCell("amount").numFmt = "₹#,##,##0";
    row.eachCell((c) => { c.border = borderThin; });
  });

  (financeSummary.delegations || []).forEach((dl) => {
    const row = sheetRev.addRow({
      channel: "Corporate Delegation",
      name: dl.name,
      amount: Number(dl.amount) || 0,
      status: dl.confirmed ? "CONFIRMED" : "PENDING",
    });
    row.getCell("amount").numFmt = "₹#,##,##0";
    row.eachCell((c) => { c.border = borderThin; });
  });

  return workbook;
}

module.exports = {
  generateFinanceAuditWorkbook,
};
