"use strict";

const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const QRCode = require("qrcode");
const logger = require("./logger");

const ASSETS = path.join(__dirname, "..", "..", "assets");
const TEMPLATE_PATH = path.join(ASSETS, "rider-pass-original.png");

if (!fs.existsSync(TEMPLATE_PATH)) {
  throw new Error(`[rider-pass] Artwork template not found: ${TEMPLATE_PATH}`);
}

const IMG_W = 993;
const IMG_H = 1584;
const PAGE_W = 600;
const PAGE_H = Math.round(PAGE_W * IMG_H / IMG_W);

const px = (imgX) => (imgX / IMG_W) * PAGE_W;
const py = (imgY) => (1 - imgY / IMG_H) * PAGE_H;

const NAVY = rgb(0.051, 0.102, 0.267);
const SLATE = rgb(0.18, 0.22, 0.30);
const MGREY = rgb(0.42, 0.47, 0.55);
const WHITE = rgb(1, 1, 1);
const LGREY = rgb(0.86, 0.89, 0.93);

function drawFitted(page, text, font, startSize, minSize, cx, y, maxW, color) {
  if (!text) return;
  let size = startSize;
  let width = font.widthOfTextAtSize(text, size);
  while (width > maxW && size > minSize) {
    size -= 0.5;
    width = font.widthOfTextAtSize(text, size);
  }
  page.drawText(text, { x: cx - width / 2, y, size, font, color });
}

function drawRoundedRect(page, x, topY, w, h, r, fillColor, strokeColor, strokeWidth = 1.0) {
  const d =
    `M ${r} 0 L ${w - r} 0 ` +
    `A ${r} ${r} 0 0 1 ${w} ${r} ` +
    `L ${w} ${h - r} ` +
    `A ${r} ${r} 0 0 1 ${w - r} ${h} ` +
    `L ${r} ${h} ` +
    `A ${r} ${r} 0 0 1 0 ${h - r} ` +
    `L 0 ${r} ` +
    `A ${r} ${r} 0 0 1 ${r} 0 Z`;
  page.drawSvgPath(d, { x, y: topY, color: fillColor, borderColor: strokeColor, borderWidth: strokeWidth });
}

function glyphBike(page, cx, cy) {
  const wr = 2.8, dx = 3.8;
  page.drawEllipse({ x: cx - dx, y: cy - 1.8, xScale: wr, yScale: wr, borderColor: WHITE, borderWidth: 0.9 });
  page.drawEllipse({ x: cx + dx, y: cy - 1.8, xScale: wr, yScale: wr, borderColor: WHITE, borderWidth: 0.9 });
  page.drawLine({ start: { x: cx - dx, y: cy - 1.8 }, end: { x: cx, y: cy + 2.5 }, color: WHITE, thickness: 0.9 });
  page.drawLine({ start: { x: cx, y: cy + 2.5 }, end: { x: cx + dx, y: cy - 1.8 }, color: WHITE, thickness: 0.9 });
  page.drawLine({ start: { x: cx - dx, y: cy - 1.8 }, end: { x: cx, y: cy - 1.8 }, color: WHITE, thickness: 0.8 });
}

function glyphArrow(page, cx, cy) {
  page.drawLine({ start: { x: cx - 4.5, y: cy }, end: { x: cx + 4.5, y: cy }, color: WHITE, thickness: 1.1 });
  page.drawLine({ start: { x: cx + 1.8, y: cy + 2.5 }, end: { x: cx + 4.5, y: cy }, color: WHITE, thickness: 1.1 });
  page.drawLine({ start: { x: cx + 1.8, y: cy - 2.5 }, end: { x: cx + 4.5, y: cy }, color: WHITE, thickness: 1.1 });
}

function glyphFlag(page, cx, cy) {
  page.drawLine({ start: { x: cx - 2.5, y: cy - 4.5 }, end: { x: cx - 2.5, y: cy + 4.5 }, color: WHITE, thickness: 1.0 });
  page.drawRectangle({ x: cx - 2.5, y: cy + 0.2, width: 5.5, height: 3.5, color: WHITE });
}

function glyphClock(page, cx, cy) {
  page.drawEllipse({ x: cx, y: cy, xScale: 5, yScale: 5, borderColor: WHITE, borderWidth: 0.9 });
  page.drawLine({ start: { x: cx, y: cy }, end: { x: cx - 1.8, y: cy + 2.2 }, color: WHITE, thickness: 0.9 });
  page.drawLine({ start: { x: cx, y: cy }, end: { x: cx, y: cy + 3.5 }, color: WHITE, thickness: 0.9 });
}

function glyphCalendar(page, cx, cy) {
  const w = 8, h = 7;
  page.drawRectangle({ x: cx - w / 2, y: cy - h / 2, width: w, height: h, borderColor: WHITE, borderWidth: 0.8 });
  page.drawRectangle({ x: cx - w / 2, y: cy + h / 2 - 2, width: w, height: 2, color: WHITE });
}

function glyphPin(page, cx, cy) {
  page.drawEllipse({ x: cx, y: cy + 1.2, xScale: 2.5, yScale: 2.5, color: WHITE });
  page.drawLine({ start: { x: cx - 2.5, y: cy + 1.2 }, end: { x: cx, y: cy - 3.8 }, color: WHITE, thickness: 0.9 });
  page.drawLine({ start: { x: cx + 2.5, y: cy + 1.2 }, end: { x: cx, y: cy - 3.8 }, color: WHITE, thickness: 0.9 });
}

function drawIconBadge(page, cx, cy, iconR, drawGlyph) {
  page.drawEllipse({ x: cx, y: cy, xScale: iconR, yScale: iconR, color: NAVY });
  drawGlyph(page, cx, cy);
}

async function generateRiderPassPdf(participant, options = {}) {
  const {
    eventDate = new Date().toISOString(),
    assemblyPoint = "Main Venue, Rewa",
    qrCodeUrl = `https://nvcyclothon.event/rider/${participant.id || "unknown"}`
  } = options;

  logger.debug({ participantId: participant.id }, "Generating rider pass PDF");

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

  const fBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const templateImage = await pdfDoc.embedPng(templateBytes);
  page.drawImage(templateImage, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

  drawFitted(page, participant.name, fItalic, 22, 12, px(498), py(796) + 4, px(380), NAVY);

  const bibText = `Bib: ${participant.bib || "TBD"}`;
  drawFitted(page, bibText, fBold, 14, 8, px(496), py(857) + 4, px(200), SLATE);

  const QR_SIZE = 152;
  const qrX = px(497) - QR_SIZE / 2;
  const qrY = py(1067) - QR_SIZE / 2;

  try {
    const qrDataUrl = await QRCode.toDataURL(qrCodeUrl, {
      width: QR_SIZE * 4,
      margin: 1,
      color: { dark: "#0D1A44", light: "#FFFFFF" }
    });
    const qrImg = await pdfDoc.embedPng(Buffer.from(qrDataUrl.split(",")[1], "base64"));
    page.drawImage(qrImg, { x: qrX, y: qrY, width: QR_SIZE, height: QR_SIZE });
  } catch (err) {
    logger.warn({ err, participantId: participant.id }, "QR generation failed; skipping");
  }

  {
    const r1X = px(201);
    const r1Top = py(1240);
    const r1Bot = py(1339);
    const r1W = px(570);
    const r1H = r1Top - r1Bot;

    drawRoundedRect(page, r1X, r1Top, r1W, r1H, 8, WHITE, NAVY, 1.0);

    const colW = r1W / 4;
    for (let c = 1; c < 4; c++) {
      page.drawLine({ start: { x: r1X + colW * c, y: r1Bot + 5 }, end: { x: r1X + colW * c, y: r1Top - 5 }, color: LGREY, thickness: 0.8 });
    }

    const cx = [0, 1, 2, 3].map(i => r1X + colW * (i + 0.5));
    const ICON_R = 8.5;
    const iconCY = r1Top - 18;
    const valY = r1Bot + 20;
    const lblY = r1Bot + 8;

    const cols = [
      { glyph: glyphBike, value: participant.category || "-", label: "CATEGORY" },
      { glyph: glyphArrow, value: participant.distance || "-", label: "DISTANCE" },
      { glyph: glyphFlag, value: participant.startWave || "-", label: "START WAVE" },
      { glyph: glyphClock, value: participant.reportingTime || "-", label: "REPORTING TIME" },
    ];

    cols.forEach(({ glyph, value, label }, i) => {
      drawIconBadge(page, cx[i], iconCY, ICON_R, glyph);
      drawFitted(page, value, fBold, 9.5, 6, cx[i], valY, colW - 6, NAVY);
      drawFitted(page, label, fBold, 6.0, 4.0, cx[i], lblY, colW - 6, MGREY);
    });
  }

  {
    const r2X = px(250);
    const r2Top = py(1345);
    const r2Bot = py(1434);
    const r2W = px(499);
    const r2H = r2Top - r2Bot;

    drawRoundedRect(page, r2X, r2Top, r2W, r2H, 8, WHITE, NAVY, 1.0);

    const c2W = r2W / 2;
    page.drawLine({ start: { x: r2X + c2W, y: r2Bot + 4 }, end: { x: r2X + c2W, y: r2Top - 4 }, color: LGREY, thickness: 0.8 });

    const cx = [r2X + c2W * 0.5, r2X + c2W * 1.5];
    const ICON_R2 = 8.0;
    const iconCY2 = r2Top - 15;
    const valY2 = r2Bot + 18;
    const lblY2 = r2Bot + 7;

    const dateStr = (() => {
      try {
        return new Date(eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      } catch (_) {
        return eventDate;
      }
    })();

    const cols2 = [
      { glyph: glyphCalendar, value: dateStr, label: "EVENT DATE" },
      { glyph: glyphPin, value: assemblyPoint, label: "ASSEMBLY POINT" },
    ];

    cols2.forEach(({ glyph, value, label }, i) => {
      drawIconBadge(page, cx[i], iconCY2, ICON_R2, glyph);
      drawFitted(page, value, fBold, 9.0, 5.5, cx[i], valY2, c2W - 10, NAVY);
      drawFitted(page, label, fBold, 5.5, 3.8, cx[i], lblY2, c2W - 10, MGREY);
    });
  }

  const pdfBytes = await pdfDoc.save();
  logger.debug({ participantId: participant.id }, "Rider pass PDF generated successfully");
  return Buffer.from(pdfBytes);
}

module.exports = { generateRiderPassPdf };
